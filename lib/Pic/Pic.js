var moment = require('moment');
var _ = require('underscore');
var User = require('../User');    
exports.Schema = mongoose.Schema(
	{
		user:{type: mongoose.Schema.Types.ObjectId, ref: 'users' },
		md5:'string',
		featured:{type:'boolean', default:false},
		pic:'string',
		likes:'number',
		dislikes:'number',
		favorites:'number',
		following:'boolean',
		private:'boolean',
		randomizer:'array',
		favorited:[{user:{type:mongoose.Schema.Types.ObjectId}, date:{type:'date'}, ip:{type:'string'}}],
		views:'number',
		approvals:[{user:{type:mongoose.Schema.Types.ObjectId}, type:{type:'string'}, date:{type:'date'}, ip:{type:'string'}}],
		date:'date',
		ip:'string',
		request_headers:{},
		text:'string',
		comments:{type:'number', default:0},
		me:'boolean'
	}
);

exports.Schema.statics = {
	latest : function(q, fn){
		this.fetch({
			find:q,
			fn:fn
		});
	},
	popular : function(fn){
		this
		.find({date:{$gte: moment().subtract('days', 6)._d}},{approvals:0, favorited:0, ip:0, request_headers:0})
		.lean()
		.sort({views:-1})
		.limit(3)
		.populate('user', "id screen_name username randomizer")
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
	},
	fetch:function(options){
		var fn = options.fn;
		if(!fn){
			throw Error("Callback not supplied");
		}
		var query = {};
		query.private = options.private || false;
		_.extend(query, options.find);
		this
		.find(query, {approvals:0, favorited:0, ip:0, request_headers:0})
		.lean()
		.sort({_id:-1})
		.limit(20)
		.populate('user', "id screen_name username")
		.exec(function(err, posts){
			if(err) throw err;
			//check if users of the posts are being followed by requested user
			if(options.user){
				//find unique users
				var unique = _.uniq(_.map(posts, function(p){return p.user._id}));
				//check if you are following them
				//get everyone you follow
				User.findOne({_id:options.user},{'following_l':1, following:1}, function(err, following){
					if(err) throw err;
					var following = following.following_l;
					following = _.pluck(following, 'user');
					following.push(options.user);
					following = following.toString();
					//match following
					var posts_following = {};
					unique.forEach(function(u){
						if(following.indexOf(u.toString()) == -1){
							posts_following[u] = false;
						}else{
							posts_following[u] = true;
						}
					});
					//add following key to posts
					for(var i=0; i<posts.length; i++){
						var p = posts[i];
						p.following = posts_following[p.user._id];
						if(options.user){
							p.me = p.user._id.toString() == options.user ? true:false;
						}
					}
					fn(null, posts);
				});
			}else{
				options.fn(err, posts);
			}
		});
	}
}
