var express = require('express');
var router = express.Router();

// MongoDB setup
var mongoose = require('mongoose');
var Board = require('../models/Board.js');
var Clip = require('../models/Clip.js');

/* PARAM (method) for retrieving a board by its id */
router.param('board', function(req, res, next, id) {
	var query = Board.findById(id, function (err, board) {
		if(err){ return next(err); }
		if (!board) { return next(new Error("can't find board")); }
		
		req.board = board;
		return next();
	});
});

/* GET all boards. */
router.get('/', function(req, res, next) {
	Board.find(function (err, boards) {
		if (err) return next(err);
		
		res.json(boards);
	});
});

/* GET a particular board by its id */
router.get('/:board', function(req, res) {
	req.board.populate('clips', function(err, clip) {
		res.json(req.board);
	});
});

/* POST (add) a new board */
router.post('/', function(req, res, next) {
	var req_board = {
		name: req.body.name,
		members: req.body.members.split(',')
	}
	
	var board = new Board(req_board);

	board.save(function(err, board){
		if(err){ return next(err); }
		
		var socketio = req.app.get('socketio');
		socketio.sockets.emit('board.added', board);
		
		res.json(board);
	});
});

/* POST (add) a new clip */
router.post('/:board/clips', function(req, res, next) {
	var clip = new Clip(req.body);
	clip.board = req.board;
	
	if (req.board.members.indexOf(clip.owner) >= 0) {
		clip.save(function(err, clip){
			if(err){ return next(err); }

			req.board.clips.push(clip);
			req.board.save(function(err, board) {
				if(err){ return next(err); }
				
				var socketio = req.app.get('socketio');
				socketio.sockets.emit('clip.added.' + req.board._id, clip);

				res.json(clip);
			});
		});
	}
	else {
		res.json({ error: "Invalid owner (error code 001)." });
	}
});

/* POST (add) a new git clip */
router.post('/:board/git', function(req, res, next) {
	console.log(req.body);
	var received = {
		owner: req.body.pull_request.user.login,
		body: "<h5>" + req.body.action + " pull request <a href=\"" + req.body.pull_request.html_url + "\">#" + req.body.number + "</a></h5><p>" + req.body.pull_request.title + "</p>",
		type: "git"
	};
	
	var clip = new Clip(received);
	clip.board = req.board;
	
	clip.save(function(err, clip){
		if(err){ return next(err); }

		req.board.clips.push(clip);
		req.board.save(function(err, board) {
			if(err){ return next(err); }
			
			var socketio = req.app.get('socketio');
			socketio.sockets.emit('clip.added.' + req.board._id, clip);

			res.json(clip);
		});
	});
});

/* POST (add) a new random clip */
router.post('/:board/random', function(req, res, next) {
	var clip = new Clip(req.body);
	clip.board = req.board;
	
	clip.save(function(err, clip){
		if(err){ return next(err); }

		req.board.clips.push(clip);
		req.board.save(function(err, board) {
			if(err){ return next(err); }
			
			var socketio = req.app.get('socketio');
			socketio.sockets.emit('clip.added.' + req.board._id, clip);

			res.json(clip);
		});
	});
});

module.exports = router;
