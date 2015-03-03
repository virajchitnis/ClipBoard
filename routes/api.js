var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');

// MongoDB setup
var mongoose = require('mongoose');
var Board = require('../models/Board.js');
var Clip = require('../models/Clip.js');
var Login = require('../models/Login.js');
var User = require('../models/User.js');

/* GET all boards. */
router.get('/', function(req, res, next) {
	Board.find(function (err, boards) {
		if (err) return next(err);
		
		res.json(boards);
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

/* PARAM (method) for retrieving a board by its id */
router.param('board', function(req, res, next, id) {
	var query = Board.findById(id, function (err, board) {
		if(err){ return next(err); }
		
		if (board) {
			req.board = board;
			return next();
		}
		else {
			return next();
		}
	});
});

/* GET a particular board by its id */
router.get('/:board', function(req, res) {
	if (req.board) {
		if (req.cookies.token) {
			Login.findById(req.cookies.token, function (err, login) {
				if (err) return next(err);
			
				if (login && !login.logout_date) {
					User.findOne({ 'email': login.email }, function(err, user) {
						if (err) return next(err);
				
						if (user) {
							user.populate('primary_board', function(err, board) {
								user.populate('secondary_boards', function(err, board) {
									Board.find({ users: user.email }, function(err, boards) {
										if(err) { return next(err); }
									
										if (req.board._id.equals(user.primary_board._id)) {
											returnBoardData();
										}
										else {
											if (boards && boards.length > 0) {
												for (var i = 0; i < boards.length; i++) {
													user.secondary_boards.push(boards[i]);
												}
											}
										
											var authorizedOrNot = false;
											for (var i = 0; i < user.secondary_boards.length; i++) {
												if (req.board._id.equals(user.secondary_boards[i]._id)) {
													authorizedOrNot = true;
												}
											}
										
											if (authorizedOrNot) {
												returnBoardData();
											}
											else {
												returnError("Error 006: Unauthorized access.");
											}
										}
									});
								});
							});
						}
						else {
							returnError("Error 006: Unauthorized access.");
						}
					});
				}
				else {
					returnError("Error 006: Unauthorized access.");
				}
			});
		}
		else {
			returnError("Error 006: Unauthorized access.");
		}
	}
	else {
		returnError("Error 005: Invalid board ID.");
	}
	
	function returnBoardData() {
		req.board.populate('clips', function(err, clip) {
			res.json(req.board);
		});
	}
	
	function returnError(msg) {
		res.json({
			success: false,
			message: msg
		});
	}
});

/* POST (add) a new clip */
router.post('/:board/clips', function(req, res, next) {
	if (req.board) {
		if (req.cookies.token) {
			Login.findById(req.cookies.token, function (err, login) {
				if (err) return next(err);
			
				if (login && !login.logout_date) {
					User.findOne({ 'email': login.email }, function(err, user) {
						if (err) return next(err);
				
						if (user) {
							user.populate('primary_board', function(err, board) {
								user.populate('secondary_boards', function(err, board) {
									Board.find({ users: user.email }, function(err, boards) {
										if(err) { return next(err); }
									
										if (req.board._id.equals(user.primary_board._id)) {
											addClip();
										}
										else {
											if (boards && boards.length > 0) {
												for (var i = 0; i < boards.length; i++) {
													user.secondary_boards.push(boards[i]);
												}
											}
										
											var authorizedOrNot = false;
											for (var i = 0; i < user.secondary_boards.length; i++) {
												if (req.board._id.equals(user.secondary_boards[i]._id)) {
													authorizedOrNot = true;
												}
											}
										
											if (authorizedOrNot) {
												addClip();
											}
											else {
												returnError("Error 006: Unauthorized access.");
											}
										}
									});
								});
							});
						}
						else {
							returnError("Error 006: Unauthorized access.");
						}
					});
				}
				else {
					returnError("Error 006: Unauthorized access.");
				}
			});
		}
		else {
			returnError("Error 006: Unauthorized access.");
		}
	}
	else {
		returnError("Error 005: Invalid board ID.");
	}
	
	function addClip() {
		var clip = new Clip(req.body);
		clip.board = req.board;
		
		req.board.populate('clips', function(err, pop_clip) {
			var clipsWithSameBody = req.board.clips.filter(function(curr_clip) {
				return curr_clip.body == clip.body;
			});
			
			if (clipsWithSameBody.length > 0) {
				if (clip.type == "webclip") {
					sendSocketError("Duplicate URL", "The URL you entered is already on this clipboard, please search for it using the search bar.");
				}
				else {
					sendSocketError("Duplicate clip", "The clip you entered is already on this clipboard, please search for it using the search bar.");
				}
			}
			else {
				if (clip.type == "webclip") {
					request(clip.body, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							$ = cheerio.load(body);
							clip.title = $('title').text();
							saveClip(clip);
						}
					});
				}
				else {
					saveClip(clip);
				}
			}
		});
	}
	
	function saveClip(clip) {
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
	
	function sendSocketError(title, message) {
		var ret = {
			title: title,
			message: message
		};
		
		var socketio = req.app.get('socketio');
		socketio.sockets.emit('clip.exists.' + req.board._id, ret);
		
		res.json(ret);
	}
	
	function returnError(msg) {
		res.json({ error: msg });
	}
});

/* POST (add) a new git clip */
router.post('/:board/git', function(req, res, next) {
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
