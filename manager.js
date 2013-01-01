$(function() {
    // check whether websockets are available
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        alert("Your browser is shit!");
        return;
    }


    // open websocket
    var connection = new WebSocket('ws://127.0.0.1:2666');
    connection.onopen = function () {
        console.log("open");
    };
    connection.onerror = function (e) {
        console.log("error " + e);
    };
    connection.onmessage = function (message) {
        console.log("message " + message.utf8Data);
    };


    // onClick handler
    $('#lot').click(function(e) {
        connection.send(JSON.stringify({type: "manager"}));
    })
})