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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET clipboard page. */
router.get('/clipboard/:board', function(req, res, next) {
  res.render('clipboard', { title: req.board.name + ' - ClipBoard' });
});

module.exports = router;
