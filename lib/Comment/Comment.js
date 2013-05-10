var moment = require('moment');
exports.Schema = mongoose.Schema(
	{
		comment:'string',
		user:{type: mongoose.Schema.Types.ObjectId, ref: 'users' },
		likes:'number',
		dislikes:'number',
		liked:[{user:{type:mongoose.Schema.Types.ObjectId}, type:{type:'string'}, date:{type:'date'}, ip:{type:'string'}}],
		date:'date',
		ip:'string'
	}
);

exports.Schema.statics = {

}
