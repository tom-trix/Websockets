$(function () {

    var status = $('#status');
    var money = $('#money');
    var moneyValue = $('#moneyValue');
    var lot = $('#lot');
    var bet = $('#bet');
    var owner = $('#owner');
    var time = $('#time');
    var timeValue = $('#timeValue');
    var inputHere = $('#inputHere');
    var textbox = $('#textbox');
    var numberbox = $('#numberbox');

    var started = $('.started');
    var registered = $('.registered');
    var suggested = $('div.suggested');
    var rised = $('div.rised');
    var planned = $('div.planned');
    var win = $('div.win');

    var myName = false;


    // check whether websockets are available
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        alert("Your browser is a piece of shit");
        return;
    }


    // open websocket
    var connection = new WebSocket('ws://127.0.0.1:2666');


    // open-handler
    connection.onopen = function () {
        status.text("Connected to Websocket server succesfully");
        started.removeAttr("style");
        textbox.val("").focus();
    };


    // error-handler
    connection.onerror = function (e) {
        status.text("Error while trying to connect to Websocket server: " + e.utf8Data);
    };


    // message-handler
    connection.onmessage = function (message) {
        // пробуем распарсить json
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            alert("It's not a valid JSON: ", message.data);
            return;
        }

        //обработка в зависимости от типа сообщения
        switch (json.type) {
            case "money":
                if (!myName)
                    myName = textbox.val();
                numberbox.val("5").focus();
                inputHere.text("# " + myName);
                moneyValue.text(json.money);
                textbox.attr("style", "visibility: hidden");
                registered.removeAttr("style");
                break;
            case "newClient":
                status.text("New peer connected: " + json.name);
                break;
            case "newLot":
                status.text("There is a new lot: " + json.name + ". Price: " + json.price);
                lot.text(json.name);
                bet.text(json.price);
                suggested.removeAttr("style");
                break;
            case "rise":
                status.text(json.name + " has rised the price up to: " + json.price);
                bet.text(json.price);
                owner.text(json.name !== myName ? json.name : "YOU").css('background-color', json.name !== myName ? "red" : "green");
                rised.removeAttr("style");
                break;
            case "winner":
                status.text((json.name !== myName ? json.name : "You") + " won " + json.lot + (json.immediately ? " before one could say knife!!!" : "!"));
                bet.text("0");
                win.attr("style", "visibility: hidden");
                numberbox.val("5").focus();
                break;
            case "timer":
                timeValue.text(json.time);
                planned.removeAttr("style");
                break;
            default:
                status.text("Unknown type: " + json.type);
        }
    };


    // обработка нажатия <Enter> в поле имени
    textbox.keydown(function(e) {
        if (e.keyCode !== 13) return;
        var msg = $(this).val();
        if (!msg) return;
        if (msg.length > 10) {
            msg = msg.substr(0, 10);
            textbox.val(msg);
            console.log("Name was reduced to 10 symbols");
        }
        connection.send(JSON.stringify({type: "auth", data: msg}));
    });


    // обработка нажатия <Enter> в числовом поле
    numberbox.keydown(function(e) {
        if (e.keyCode !== 13) return;
        var msg = $(this).val();
        if (!msg) return;
        if (!jQuery.isNumeric(msg)) {
            $(this).val("5");
            return;
        }
        if ((msg >> 0) <= (bet.text() >> 0)) {
            status.text('You number is too small');
            return;
        }
        if ((msg >> 0) > (moneyValue.text() >> 0)) {
            status.text("You haven't got enough money");
            return;
        }
        connection.send(JSON.stringify({type: "rise", data: msg}));
    });


    // ставим задержку в 4 секунды - если косяк с сервером - выдаём ошибку
    setInterval(function() {
        if (connection.readyState === 1) return;
        status.text('Unable to comminucate with the WebSocket server.');
    }, 4000);
});