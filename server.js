// imports
var webSocketServer = require('websocket').server;
var http = require('http');
var mongo = require('mongojs')
var utils = require('./utils');


// global variables
var _clients = [ ];
var _lots = [ ];
var _riseCounter = 0;
var _currentWinner = -1;
var _currentLot = -1;
var _isActive = false;
var _currentBet = 0;
var _timer = -1;


// изъятие лотов из Монги
var db = mongo.connect("46.146.231.100/Auction", ["goods"]);
db.goods.find({}, function(err, page) {
    _lots = page;
});


//создаём http-сервер
var _server = http.createServer();
_server.listen(2666, function() {
    console.log((new Date()) + " Server is listening on port " + 2666);
});


// создаём websocket-сервер и обрабатываем запросы подключения
new webSocketServer({httpServer: _server}).on('request', function(request) {

    // поступил новый клиент - назначаем ему имя и запихиваем в массив клиентов
    console.log((new Date()) + ' New client registered...');
    var connection = request.accept(null, request.origin);
    var index = -1;

    // клиент прислал сообщение
    connection.on('message', function(message) {
        if (message.type === 'utf8')
            try {
                console.log("> Message received: " + message.utf8Data);
                var json = JSON.parse(message.utf8Data);

                switch (json.type) {
                    case "auth":
                        index = _clients.push({connection: connection, name: json.data, money: 500}) - 1;
                        connection.sendUTF(JSON.stringify({type: "money", money: 500}));
                        broadcast({ type:'newClient', name: json.data });
                        break;
                    case "manager":
                        _currentLot++;
                        if (_currentLot < _lots.length) {
                            _currentBet = _lots[_currentLot].price;
                            _isActive = true;
                            broadcast(_lots[_currentLot]);
                        }
                        else console.log("There are no lots left");
                        break;
                    case "rise":
                        var bet = json.data >> 0;
                        if (_isActive && bet > _currentBet && _clients[index].money >= bet) {
                            _currentWinner = index;
                            // если мгновенный выкуп - засчитываем победу сразу (иначе пускам таймер)
                            if (bet > 3 * _currentBet) {
                                _currentBet = bet;
                                win(true);
                            }
                            else {
                                _currentBet = bet;
                                broadcast({ type: 'rise', name: _clients[index].name, price: json.data });
                                startTimer();
                            }
                        }
                        break;
                    default:
                        console.log("Unknown type: " + json.type);
                }
            } catch (e) {
                console.log("Error while handling a message ", message.utf8Data);
            }
    });

    // клиент отпал
    connection.on('close', function(conn) {
        console.log((new Date()) + " Peer " + conn.remoteAddress + " disconnected.");
    });

    // засекаем 14 секунд до победы (и каждые 2 сек. шлём время всем участникам)
    function startTimer() {
        var was = ++_riseCounter;
        var t = 7;
        clearInterval(_timer);
        _timer = setInterval(function() {
            broadcast({type: "timer", time : t});
            // если таймер прошёл все t циклов, а счётчик ставок так и не увеличился - засчитываем обычную победу
            if (t-- == 0 && was === _riseCounter) win(false);
        }, 2000);
    }


    // обработка выигрыша (immediately = мгновенный выкуп)
    function win(immideately) {
        var winner = _clients[_currentWinner];
        winner.money -= _currentBet;
        winner.connection.sendUTF(JSON.stringify({type: "money", money: winner.money}));
        broadcast({ type:'winner', name: winner.name, lot: _lots[_currentLot].name, immediately: immideately});
        _isActive = false;
        clearInterval(_timer);
    }


    // рассылает сообщение всем
    function broadcast(obj) {
        console.log(">  Broadcast sent : " + JSON.stringify(obj));
        for (var i = 0; i < _clients.length; i++)
            if (_clients[i].connection.connected)
                _clients[i].connection.sendUTF(JSON.stringify(obj));
    }
});