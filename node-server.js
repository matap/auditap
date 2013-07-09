
var app = (express = require('express'))()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server, { log: false })
  , url = require('url')
  , path = require("path")
  , upload = require('jquery-file-upload-middleware')
  , fs = require('fs')
  , projectHandler = require('./js/server/project-data-handler')
  , pcmHandler = require('./js/server/pcm-data-handler');

console.log("creating a connection");

upload.configure({
    uploadDir: path.join(__dirname, '/public/uploads/'),
    uploadUrl: '/uploads',
    tmpDir: path.join(__dirname, '/tmp/')
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type"); //X-Requested-With

    if (req.method == 'OPTIONS') {          // set response for OPTIONS
        res.send(200);
    }
    else {
        next();
    }
});

app.configure(function () {
    app.use('/uploads', upload.fileHandler());
    app.use(express.bodyParser());
});

app.get('/project/:id', projectHandler.findById);
app.put('/project/:id', projectHandler.update);
app.post('/project', projectHandler.add);
app.delete('/project/:id', projectHandler.delete);

var allClients = [];

io.sockets.on('connection', function (socket) {
    console.log(socket.toString());
    console.log("runing time");
    allClients[socket.id] = [];

    socket.on('getPCM', function (resultParams) {
        console.log(resultParams);
       
        if (typeof allClients[socket.id][resultParams.path] == "undefined") {
            console.log('vkladam novy prvek' + socket.id + ', ' + resultParams.path);
            allClients[socket.id][resultParams.path] = resultParams.path;
        }

        pcmHandler.getPCM(socket, resultParams, __dirname);
    });

    socket.on('disconnect', function () {
        console.log('Connection aborted ' + allClients[socket.id].length);
        for (tmp in allClients[socket.id]) {
            console.log("nechavam uvolnit pamet" + tmp);
            pcmHandler.releaseMem(tmp);
        } 
        delete allClients[socket.id];
    });
});

server.listen(8090);
