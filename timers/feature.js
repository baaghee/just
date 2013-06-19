var moment = require('moment');    
var _ = require('underscore');
function compute(){
	User
	.find({featured:true})
	.lean()
	.exec(function(err, users){
		if(err) throw err;
		var users = _.pluck(users, '_id');
		var u = {};
		users.forEach(function(usr){
			u[usr] = 0;
		});
		//20 posts from users
			Pic
			.find({user:{$in:users}})
			.sort({views:-1})
			.limit(20)
			.lean()
			.exec(function(err, posts){
				if(err) throw err;
				var posts_to_feature = [];
				posts.forEach(function(p){
					if(u[p.user.toString()] == 0){
						u[p.user.toString()] = 1;
						posts_to_feature.push(p._id);
					}
				});
				console.log(posts_to_feature);
				//unfeature all featured
				Pic.update({featured:true},{$set:{featured:false}}, { multi: true }, function(err, changed){
					//feature one posts for each user
					Pic.update({_id:{$in:posts_to_feature}},{$set:{featured:true}},{multi:true}, function(err, updated){
					
					});
				});
			});
	});
}

setInterval(compute, 1000 * 60 * 60 * .5);
compute();
