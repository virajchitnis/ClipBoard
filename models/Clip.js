var mongoose = require('mongoose');

var ClipSchema = new mongoose.Schema({
	title: String,
	owner: {
		type: String,
		required: true
	},
	time: {
		type: Date,
		required: true,
		default: Date.now
	},
	body: {
		type: String,
		required: true
	},
	board: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true
	},
	type: String
});

module.exports = mongoose.model('Clip', ClipSchema);