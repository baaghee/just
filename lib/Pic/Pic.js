var moment = require('moment');
exports.Schema = mongoose.Schema(
	{
		user:{type: mongoose.Schema.Types.ObjectId, ref: 'users' },
		pic:'string',
		likes:'number',
		dislikes:'number',
		favorites:'number',
		favorited:[{user:{type:mongoose.Schema.Types.ObjectId}, date:{type:'date'}, ip:{type:'string'}}],
		views:'number',
		approvals:[{user:{type:mongoose.Schema.Types.ObjectId}, type:{type:'string'}, date:{type:'date'}, ip:{type:'string'}}],
		date:'date',
		ip:'string',
		request_headers:{},
		text:'string'
	}
);

exports.Schema.statics = {
	latest : function(q, fn){
		this
		.find(q,{approvals:0, favorited:0, ip:0, request_headers:0})
		.sort({_id:-1})
		.limit(20)
		.populate('user', "id screen_name username")
		.exec(fn);
	},
	popular : function(fn){
		this
		.find({date:{$gte: moment().subtract('days', 6)._d}},{approvals:0, favorited:0, ip:0, request_headers:0})
		.sort({views:-1})
		.limit(3)
		.populate('user', "id screen_name username")
		.exec(fn);
	},
	exists: function(id, fn){
		this.findOne({_id:id}, {_id:1}, function(err, doc){
			if(err) throw err;
			if(doc){
				fn(true);
			}else{
				fn(false);
			}
		});
	}
}
