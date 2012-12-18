$(function() {
    var lot = $('#lot');
    var price = $('#price');


    // check whether websockets are available
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        alert("Ваш браузер говно");
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


    // define Enter-press handlers
    var f = function(e) {
        if (e.keyCode !== 13) return;
        if (!lot.val() || !price.val()) return;
        connection.send(JSON.stringify({type: "manager", data: lot.val(), price: price.val()}));
    }
    lot.keydown(f);
    price.keydown(f);
})