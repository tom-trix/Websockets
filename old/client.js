$(function () {

    // get DOM-controls with jQuery
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');


    // check whether websockets are available
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        content.html($('<p>', { text: "Sorry, but your browser doesn't support WebSockets..."}));
        input.hide();
        $('span').hide();
        return;
    }


    // open websocket
    var connection = new WebSocket('ws://127.0.0.1:1337');


    // open-handler
    connection.onopen = function () {
        input.removeAttr('disabled');
        status.text('Input here:');
    };


    // error-handler
    connection.onerror = function (error) {
        content.html($('<li>', { text: "Sorry, but there's some problem with your connection or the server is down" }));
    };


    // message-handler
    connection.onmessage = function (message) {
        // пробуем распарсить json
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log("This doesn't look like a valid JSON: ", message.data);
            return;
        }

        // обработка в зависимости от типа сообщения
        if (json.type === 'history')
            for (var i = 0; i < json.data.length; i++)
                addMessage(json.data[i].author, json.data[i].text, new Date(json.data[i].time));
        else if (json.type === 'message') {
            input.removeAttr('disabled');
            addMessage(json.data.author, json.data.text, new Date(json.data.time));
        } else
            console.log("Hmm..., I've never seen JSON like this: ", json);
    };


    // обработка нажатия <Enter>
    input.keydown(function(e) {
        if (e.keyCode !== 13) return;
        var msg = $(this).val();
        if (!msg) return;
        connection.send(msg);
        $(this).val('');

        // disable element until server sends a response
        input.attr('disabled', 'disabled');
    });


    // ставим задержку в 3 секунды - если косяк с сервером - выдаём ошибку
    setInterval(function() {
        if (connection.readyState === 1) return;
        status.text('Error');
        input.attr('disabled', 'disabled').val('Unable to comminucate with the WebSocket server.');
    }, 3000);


    // заполнение контента
    function addMessage(author, message, dt) {
        var hours = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
        var minutes = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
        content.append('<p><span>' + author + '</span> : ' + hours + ':' + minutes  + ': ' + message + '</p>');
    }
});