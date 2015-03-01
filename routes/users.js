var express = require('express');
var router = express.Router();

// MongoDB setup
var mongoose = require('mongoose');
var User = require('../models/User.js');
var Login = require('../models/Login.js');
var Board = require('../models/Board.js');

/* POST add a new user. */
router.post('/', function(req, res, next) {
	if (validateEmail(req.body.email) && validatePassword(req.body.password) && (req.body.first_name.length >= 2) && (req.body.last_name.length >= 2)) {
		User.findOne({ 'email': req.body.email }, function(err, existing_user) {
			if(err){ return next(err); }
		
			if (!existing_user) {
				var user = new User(req.body);
				var board = new Board({
					name: user.first_name + "'s private clipboard"
				});
				user.primary_board = board;
				
				board.save(function(err, board) {
					if(err){ return next(err); }
					
					if (board) {
						user.save(function(err, user) {
							if(err){ return next(err); }
					
							if (user) {
								var ret = {
									email: user.email,
									success: true
								};
	
								res.json(ret);
							}
							else {
								returnFailure("Error 004: User could not be created.");
							}
						});
					}
					else {
						returnFailure("Error 003: User's primary board could not be created.");
					}
				});
			}
			else {
				returnFailure("Error 002: Account with selected email exists.");
			}
		});
	}
	else {
		returnFailure("Error 001: Please fill out all the fields in the form and make sure they are check marked.");
	}
	
	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}
	
	function validatePassword(str) {
		// at least one number, one lowercase and one uppercase letter
		// at least six characters
		var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
		return re.test(str);
	}
	
	function returnFailure(msg) {
		var ret = {
			success: false,
			message: msg
		};
		res.json(ret);
	}
});

/* PARAM (method) for retrieving a board by its id */
router.param('token', function(req, res, next, token) {
	Login.findById(token, function(err, login) {
		if(err){ return next(err); }
		
		if (login && !login.logout_date) {
			User.findOne({ 'email': login.email }, function (err, user) {
				if(err){ return next(err); }
				
				if (user) {
					req.user = user;
					return next();
				}
				else {
					return next();
				}
			});
		}
		else {
			return next();
		}
	});
});

/* GET a particular user by email */
router.get('/:token', function(req, res) {
	if (req.cookies.token) {
		Login.findById(req.cookies.token, function (err, login) {
			if (err) return next(err);
			
			if (login && !login.logout_date) {
				if (login._id == req.params.token) {
					if (req.user) {
						req.user.populate('primary_board', function(err, board) {
							req.user.populate('secondary_boards', function(err, board) {
								Board.find({ users: req.user.email }, function(err, boards) {
									if(err) { return next(err); }
					
									if (boards && boards.length > 0) {
										for (var i = 0; i < boards.length; i++) {
											req.user.secondary_boards.push(boards[i]);
										}
									}
					
									res.json({
										email: req.user.email,
										first_name: req.user.first_name,
										last_name: req.user.last_name,
										primary_board: req.user.primary_board,
										secondary_boards: req.user.secondary_boards
									});
								});
							});
						});
					}
					else {
						returnError();
					}
				}
				else {
					returnError();
				}
			}
			else {
				returnError();
			}
		});
	}
	else {
		returnError();
	}
	
	function returnError() {
		res.json({
			success: false,
			message: "Error 005: Invalid token."
		});
	}
});

/* POST check if email is already taken. */
router.post('/email', function(req, res, next) {
	User.findOne({ 'email': req.body.email }, function(err, existing_user) {
		if(err){ return next(err); }
		
		if (!existing_user) {
			returnJSON(true);
		}
		else {
			returnJSON(false);
		}
	});
	
	function returnJSON(status) {
		var ret = {
			available: status
		};
		res.json(ret);
	}
});

/* POST check if email and password are correct and allow (or prevent) user login. */
router.post('/login', function(req, res, next) {
	User.findOne({ 'email': req.body.email }, function(err, user) {
		if(err){ return next(err); }
	
		if (user) {
			user.comparePassword(req.body.password, function(err, isMatch) {
				if(err){ return next(err); }
				
				if (isMatch) {
					var received_data = {
						email: req.body.email,
						user_agent: req.headers['user-agent']
					};
	
					var login = new Login(received_data);
					login.save(function(err, login) {
						if(err){ return next(err); }
					
						var ret = {
							success: true,
							token: login._id,
							username: user.first_name + " " + user.last_name
						}

						res.json(ret);
					});
				}
				else {
					returnFailure("Invalid email or password, please try again.");
				}
			});
		}
		else {
			returnFailure("Invalid email or password, please try again.");
		}
	});
	
	function returnFailure(msg) {
		var ret = {
			success: false,
			message: msg
		};
		res.json(ret);
	}
});

/* POST mark the provided token as logged out. */
router.post('/logout', function(req, res, next) {
	var currDateTime = Date.now();
	Login.findByIdAndUpdate(req.cookies.token, { logout_date: currDateTime }, function(err, login) {
		if(err){ return next(err); }
		
		if (login) {
			res.json({
				success: true
			});
		}
		else {
			res.json({
				success: false
			});
		}
	});
});

module.exports = router;
