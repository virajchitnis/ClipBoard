var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var configJSON = require('./config.json');

// Connection to MongoDB
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ClipBoard', function(err) {
	if(err) {
		console.log('connection error', err);
	} else {
		console.log('connection successful');
	}
});

// Copy javascript files into their correct location
if (!fs.existsSync('./public/javascripts')) {
	fs.mkdirSync('./public/javascripts');
}
var jsFiles = fs.readdirSync('./src/javascripts');
for (var i = 0; i < jsFiles.length; i++) {
	var currjsFile = jsFiles[i];
	var fileContents = fs.readFileSync('./src/javascripts/' + currjsFile, 'utf8');
	var outputContents = fileContents.replace('[[% socket_port %]]', configJSON.socket_port);
	fs.writeFileSync('./public/javascripts/' + currjsFile, outputContents);
}

var routes = require('./routes/index');
var api = require('./routes/api');
var users = require('./routes/users');

var app = express();

// Morgan setup
app.enable('trust proxy');
var morgan = require('morgan');
app.use(morgan('combined'));

// Socket.io setup for web sockets
var http = require('http');
var socketio = require('socket.io');
var server = http.createServer(app);
var io = socketio.listen(server);
app.set('socketio', io);
app.set('server', server);
app.get('server').listen(configJSON.socket_port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/boards', api);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			title: 'ClipBoard',
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		title: 'ClipBoard',
		message: err.message,
		error: {}
	});
});


module.exports = app;
