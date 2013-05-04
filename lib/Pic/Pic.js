exports.Schema = mongoose.Schema(
	{
		user:{type: mongoose.Schema.Types.ObjectId, ref: 'users' },
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
	latest : function(q, fn){
		this
		.find(q)
		.sort({_id:-1})
		.limit(10)
		.populate('user', "id screen_name username")
		.exec(fn);
	}
}
