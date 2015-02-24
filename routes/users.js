var express = require('express');
var router = express.Router();

// MongoDB setup
var mongoose = require('mongoose');
var User = require('../models/User.js');
var Login = require('../models/Login.js');

/* POST add a new user. */
router.post('/', function(req, res, next) {
	if (validateEmail(req.body.email) && validatePassword(req.body.password) && (req.body.first_name.length >= 2) && (req.body.last_name.length >= 2)) {
		User.findOne({ 'email': req.body.email }, function(err, existing_user) {
			if(err){ return next(err); }
		
			if (!existing_user) {
				var user = new User(req.body);

				user.save(function(err, user) {
					if(err){ return next(err); }
					
					if (user) {
						// IMP: Create a new primary board for this user.
						
						var ret = {
							email: user.email,
							success: true
						};
	
						res.json(ret);
					}
					else {
						returnFailure("Error 003: User could not be created.");
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
						user_agent: req.body.user_agent
					};
	
					var login = new Login(received_data);
					login.save(function(err, login) {
						if(err){ return next(err); }
					
						var ret = {
							success: true,
							token: login._id
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

module.exports = router;
