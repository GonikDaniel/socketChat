window.onload = function(){

    //имитация метода jquery, дабы сократить запись кода
    function $(id){
        return document.getElementById(id);
    }

    var socket = io.connect('http://localhost:1337/');

    socket.on('connect', function(msg) {
        if (typeof msg === 'undefined') {
            return;
        }
        $('messages').innerHTML += msg.time + ': Вы подлючились, ура!!!<br/>';
    });

    socket.on('userConnected', function(msg){
        $('messages').innerHTML += msg.time + ': К нам поключился' + msg.name + '<br/>';
    });

    socket.on('message', function(msg){
        $('messages').innerHTML += msg.time + ': ' + msg.name + ' ' + msg.text + '<br/>';
    });

    $('btnSend').onclick = function(){
        socket.json.emit('message', {'text': $('inpMsg').value});
    };
};