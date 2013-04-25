exports.Schema = mongoose.Schema(
	{
		user:{type: 'number', ref: 'users' },
		pic:'string',
		likes:'number',
		dislikes:'number',
		approvals:[{user:{type:'string'}, type:{type:'string'}, date:{type:'date'}, ip:{type:'string'}}],
		date:'date',
		ip:'string',
		request_headers:{}
	}
);

exports.Schema.statics = {
	latest : function(fn){
		this
		.find()
		.sort({_id:-1})
		.limit(10)
		.populate('user', "id screen_name username")
		.exec(fn);
	}
}
