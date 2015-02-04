var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET clipboard page. */
router.get('/boardid', function(req, res, next) {
  res.render('clipboard', { title: 'Express' });
});

module.exports = router;
