// imports
var webSocketServer = require('websocket').server;
var http = require('http');

// global variables
var history = [ ];
var clients = [ ];
var j = 1;

// доп. функции
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

//создаём websocket-сервер на базе http-сервера
var _server = http.createServer(function(request, response) {});
_server.listen(1337, function() {
    console.log((new Date()) + " Server is listening on port " + 1337);
});
var wsServer = new webSocketServer({
    httpServer: _server
});

//обработка запросов websocket-сервера
wsServer.on('request', function(request) {

    // поступил новый клиент - назначаем ему имя и запихиваем в массив клиентов
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var userName = "user" + j++;

    // после регистрации нового клиента высылаем ему всю историю
    if (history.length > 0)
        connection.sendUTF(JSON.stringify({ type: 'history', data: history}));

    // клиент прислал сообщение
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // сохраним сообщение в историю
            console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
            var obj = {
                time: (new Date()).getTime(),
                text: htmlEntities(message.utf8Data),
                author: userName
            };
            history.push(obj);
            history = history.slice(-100);

            //разошлём сообщение всем клиентам
            for (var i = 0; i < clients.length; i++)
                clients[i].sendUTF(JSON.stringify({ type:'message', data: obj }));
        }
    });

    //клиент отпал
    connection.on('close', function(connection) {
        if (userName !== false) {
            // изымаем клиента из массива клиентов
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            clients.splice(index, 1);
        }
    });
});