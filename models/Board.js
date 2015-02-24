var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	],
	clips: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Clip'
		}
	],
	creation_date: {
		type: Date,
		default: Date.now
	},
	version: Number
});

module.exports = mongoose.model('Board', BoardSchema);