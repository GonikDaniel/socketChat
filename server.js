var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    _ = require('underscore')._;

//задаем порт и сервер, а также устанавливаем middleware для express
app.configure(function() {
    app.set('port', 1337);
    app.set('ipaddr', "127.0.0.1");
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use('/components', express.static(__dirname + '/components'));
    app.use('/js', express.static(__dirname + '/js'));
    app.use('/icons', express.static(__dirname + '/icons'));
    app.use('views', express.static(__dirname + '/views'));
    // app.use('html', require('ejs').renderFile);
});

app.get('/', function(req, res) {
    res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function() {
    console.log('Server listening on IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

io.set("log level", 1);

var people = {},
    chatHistory = {};

io.sockets.on("connection", function(socket) {
    socket.on("joinserver", function(name, device) {
        var exists = false;

        _.find(people, function(key, value) {
            if (key.name.toLowerCase() === name.toLowerCase()) {
                 exits = true;
                 return;
             }
        });

        if (exists) {
            var randonNumber = Math.floor(Math.random() * 10001);
            do {
               proposedName = name + randomNumber;
               _.find(people, function(key, value) {
                   if (key.name.toLowerCase() === name.toLowerCase()) {
                        exits = true;
                        return;
                    }
               });
            } while (!exists);
            socket.emit("exists", {msg: "This username already exists, please choose another one.", proposedName: proposedName});
        } else {
            people[socket.id] = {"name": name, "device": device};
            socket.emit("update", "You have connected to the server.");
            io.sockets.emit("update", people[socket.id].name + " is online.");
            sizePeople = _.size(people);
            io.sockets.emit("update-people", {people: people, count: sizePeople});
            socket.emit("joined"); //for geolocation
        }
    });
});








