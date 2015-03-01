var express = require('express');
var router = express.Router();

// MongoDB setup
var mongoose = require('mongoose');
var Board = require('../models/Board.js');
var Clip = require('../models/Clip.js');
var Login = require('../models/Login.js');
var User = require('../models/User.js');

/* PARAM (method) for retrieving a board by its id */
router.param('board', function(req, res, next, id) {
	var query = Board.findById(id, function (err, board) {
		if(err){ return next(err); }
		if (!board) { return next(new Error("can't find board")); }
		
		req.board = board;
		return next();
	});
});

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.cookies.token) {
		Login.findById(req.cookies.token, function (err, login) {
			if (err) return next(err);
			
			if (login && !login.logout_date) {
				User.findOne({ 'email': login.email }, function(err, user) {
					if (err) return next(err);
				
					if (user) {
						returnIndexPage();
					}
					else {
						returnLoginPage();
					}
				});
			}
			else {
				returnLoginPage();
			}
		});
	}
	else {
		returnLoginPage();
	}
	
	function returnIndexPage() {
		res.render('index', { title: 'ClipBoard' });
	}
	
	function returnLoginPage() {
		res.status(401);
		res.send("<script type='text/javascript'>window.location.replace('/login');</script>");
	}
});

/* GET login page. */
router.get('/login', function(req, res, next) {
	if (req.cookies.token) {
		Login.findById(req.cookies.token, function (err, login) {
			if (err) return next(err);
			
			if (login) {
				User.findOne({ 'email': login.email }, function(err, user) {
					if (err) return next(err);
				
					if (user) {
						returnIndexPage();
					}
					else {
						returnLoginPage();
					}
				});
			}
			else {
				returnLoginPage();
			}
		});
	}
	else {
		returnLoginPage();
	}
	
	function returnIndexPage() {
		res.send("<script type='text/javascript'>window.location.replace('/');</script>");
	}
	
	function returnLoginPage() {
		res.render('login', { title: 'ClipBoard' });
	}
});

/* GET clipboard page. */
router.get('/clipboard/:board', function(req, res, next) {
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
										returnClipBoardPage();
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
											returnClipBoardPage();
										}
										else {
											returnIndexPage();
										}
									}
								});
							});
						});
					}
					else {
						returnIndexPage();
					}
				});
			}
			else {
				returnIndexPage();
			}
		});
	}
	else {
		returnIndexPage();
	}
	
	function returnClipBoardPage() {
		res.render('clipboard', { title: req.board.name + ' - ClipBoard' });
	}
	
	function returnIndexPage() {
		res.status(401);
		res.send("<script type='text/javascript'>window.location.replace('/');</script>");
	}
});

module.exports = router;
