// imports
var webSocketServer = require('websocket').server;
var http = require('http');
var utils = require('./utils');


// global variables
var _clients = [ ];
var _riseCounter = 0;
var _currentWinner = -1;
var _currentLot = "";
var _currentBet = 0;


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
                console.log("Message received: " + message.utf8Data);
                var json = JSON.parse(message.utf8Data);

                switch (json.type) {
                    case "auth":
                        index = _clients.push({connection: connection, name: json.data, money: 500}) - 1;
                        connection.sendUTF(JSON.stringify({type: "money", money: 500}));
                        broadcast({ type:'newClient', name: json.data });
                        break;
                    case "manager":
                        _currentBet = json.price >> 0;
                        _currentLot = json.data;
                        broadcast({ type:'newLot', name: json.data, price: json.price });
                        break;
                    case "rise":
                        var bet = json.data >> 0;
                        if (bet > _currentBet) {
                            _currentWinner = index;
                            _currentBet = bet;
                            go();
                            broadcast({ type: 'rise', name: _clients[index].name, price: json.data });
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

    // засекаем 8 секунд до победы
    function go() {
        var was = ++_riseCounter;
        setTimeout(function() {
            if (was === _riseCounter) {
                var winner = _clients[_currentWinner];
                winner.money -= _currentBet;
                winner.connection.sendUTF(JSON.stringify({type: "money", money: winner.money}));
                broadcast({ type:'winner', name: winner.name, lot: _currentLot});
            }
        }, 8000);
    }

    // рассылает сообщение всем
    function broadcast(obj) {
        for (var i = 0; i < _clients.length; i++)
            if (_clients[i].connection.connected)
                _clients[i].connection.sendUTF(JSON.stringify(obj));
    }
});