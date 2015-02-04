var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	members: [
		String
	],
	clips: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Clip'
		}
	]
});

module.exports = mongoose.model('Board', BoardSchema);