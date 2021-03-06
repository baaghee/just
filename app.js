
/**
 * Module dependencies.
 */

var express = require('express')
  , _ = require('underscore')
  , http = require('http')
  , jade_browser = require('jade-browser')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , argv = require("optimist").argv
  , MongoStore = require('connect-mongo')(express)
  , fb = require('fb')
  , async = require('async')
  , gm = require('gm')
  , im = require('imagemagick')
  , md5 = require('MD5')
  , racker = require('racker')
moment = require('moment');
cdn_url = 'http://e7026f8f16c0bcf6d100-23fa34ac10b738921d65a145768427b6.r66.cf1.rackcdn.com';
racker
.set('user', 'maldivianist')
.set('key', '453bfb34869c3340d621d82b9a9e278c');

var db_path = argv.localdb ? "mongodb://127.0.0.1:27017/anymeme" : 'mongodb://nodejitsu:6a086953e5a5c3f5a1b729472bd019e2@alex.mongohq.com:10036/nodejitsudb8170725307';
//db_path = 'mongodb://iulogy.com/anymeme';

//create path if not exist
if(!fs.existsSync("./public/files/")){
	fs.mkdirSync("./public/files");
}

//DB
mongoose = require('mongoose');
db = mongoose.createConnection(db_path);

User = require('./lib/User');    
Pic = require('./lib/Pic');    
Reserve = require('./lib/Reserve');    

//
require('./timers/feature');

var sessionStore = new MongoStore({url:db_path}); 

var reserved = {
	"following":1,
	"followers":1,
	"featured":1,
	"popular":1,
	"edit":1,
	"i":1,
	"about":1,
	"latest":1,
	"user":1,
	"logout":1,
	"register":1,
	"auth":1,
	"pic":1,
	"post":1,
	"posts":1,
	"favorites":1,
	"random":1,
	"contact":1,
	"support":1,
	"admin":1,
	"administrator":1,
	"moderator":1
};
 
passport.use(new FacebookStrategy({
		clientID: "565414836813596",
		clientSecret: "d62327c41e6eb2c98dae219258e20caf",
		callbackURL: "http://anyme.me/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		User.findOne({fbid:profile.id}, function(err, user){
			if(!user){
				new User({
					fbid:profile.id
				  , username: profile.username
				  , date:new date()
				  , displayName: profile.displayName
				  , raw : profile._raw
				  , accessToken: accessToken
				  , refreshToken: refreshToken
				})
				.save(function(err, user){
					if(err) throw err;
					done(null, user);

				});
			}else{
				// update user
				user.username =  profile.username;
				user.displayName = profile.displayName;
				user.raw = profile._raw;
				user.accessToken = accessToken;
				user.refreshToken = refreshToken;
				user.save(function(err, user){
					if(err) throw err;
					done(null, user);
				});
			}
		});
	}
));

function ScreenNameExists(name, fn){
	User.findOne({screen_name:name},{_id:1}, function(err, exists){
		if(err) throw err;
		if(exists != null){
			return fn(true);
		}
		//check reserve list
		Reserve.count({name:name}, function(err, count){
			if(err) throw err;
			fn(count != 0)
		});
	});
};
function validName(name){
	return name.match(/^[A-z]+$/) != null;
}
function Authenticate(req,res,next){
  if (req.isAuthenticated()) { return next(); }
 	 return res.redirect('/');
}
function Authenticate_admin(req,res,next){
  if (req.isAuthenticated() && req.user.type=='administrator') { return next(); }
 	 return res.redirect('/');
}

passport.serializeUser(function(user, done) {
  done(null, user.fbid);
});

passport.deserializeUser(function(id, done) {
  User.findOne({fbid:id}, function(err, user){
  	done(err, user);
  });
});

var app = express();

app.configure(function(){
	app.set('port', argv.p || 3050);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.compress());
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.logger('dev'));
	app.use(express.cookieParser("a"));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(jade_browser('/templates.js', '**', {root: __dirname + '/views/components', cache:false}));	
	app.use(express.session({ secret: "a", store: sessionStore, cookie: { maxAge: 1000 * 60 * 60 * 7 * 1000 ,httpOnly: false, secure: false}}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(function(req, res, next){
	  	res.locals._user = req.user;
	  	res.header('Vary', 'Accept');
  		next();
	});	
	app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});
app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/register', Authenticate, function(req,res){
	if(req.user.screen_name){
		return res.redirect('/');
	}
	res.render('register', {username:req.user.username});
});
app.post('/register',  function(req, res){
	var screen_name = req.body.screen_name;
	//check if reserved
	if(screen_name in reserved){
		return res.json({error:"Invalid username!"});	
	}
	//check validity
	if(!validName){
		return res.json({error:"Invalid username!"});
	}
	ScreenNameExists(screen_name, function(exists){
		if(exists){
			return res.redirect('/');
		}
		User.update({_id:req.user._id}, {$set:{screen_name:screen_name}}, function(err, user){
			if(err) throw err;
			User.findOne({_id:req.user._id}, function(err, user){
				if(err) throw err;
				res.redirect('/');
			});
			
		});
	});
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['publish_stream', 'publish_actions'] }));
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

app.get('*', function(req, res, next){
	//show signup page if user is not registered after authentication
	if(typeof req.user == 'undefined'){
		return next();
	}

	if(!req.user.screen_name){
		res.redirect('/register');
	}else{
		return next();
	}
});
app.get('/', function(req,res){
	if(!req.xhr){
		async.auto({
			latest:function(fn){
				Pic.fetch({
					find:{},
					user:(req.user? req.user._id:void 0), 
					fn:fn
				});
			},
			popular:function(fn){
				Pic.popular(fn);
			}
		}, function(err, docs){
			docs.display_type = 'latest';
			res.render('index',docs);
		});
	}else{
		Pic.fetch({
			find:{},
			user:(req.user? req.user._id:void 0), 
			fn:function(err, posts){
				if(err) throw err;
				res.json(posts);
			}
		});
	}
});
app.get('/admin', Authenticate_admin, function(req, res){
	async.auto({
		total_users:function(fn){
			User.count({},fn);
		},
		total_posts:function(fn){
			Pic.count({},fn);
		},
		reserve:function(fn){
			Reserve
			.find()
			.lean()
			.exec(fn);
		},
		users:function(fn){
			User
			.find()
			.sort({_id:-1})
			.lean()
			.exec(fn)	
		}
	}, function(err, admin){
		res.render('admin', admin);
	});
});
app.post('/admin/reserve', Authenticate_admin, function(req, res){
	if(!req.body.list){
		return res.json({error: 'no list'});
	}
	var list = req.body.list.split(",");
	list = _.map(list, function(name){
		if(validName(name) == false){
			return null;
		}
		return {
			date:new Date(),
			name:name,
			user:req.user._id
		}
	});
	list = _.compact(list);
	Reserve.create(list, function(err){
		if(err) throw err;
		return res.json({message:'created'});
	});
});
app.post('/admin/reserve/release', Authenticate_admin, function(req, res){
	if(!req.body.id){
		return res.json({error: 'no id'});
	}
	var id = req.body.id;
	Reserve.remove({_id:id}, function(err, changed){
		if(err) throw err;
		res.json({message:'removed'});
	});
});
app.post('/admin/feature', Authenticate_admin, function(req, res){
	if(!req.body.cmd){
		return res.json({error:'incomplete request'});
	}
	var update;
	if(req.body.cmd == 'set'){
		update = {$set:{featured:true}};
	}else{
		update = {$set:{featured:false}};
	}
	User.update({_id:req.body.id}, update, function(err, changed){
		if(err) throw err;
		if(changed == 0){
			return res.json({error:"unable to change"});
		}
		res.json({message:"changed"});
	})
});
app.get('/edit', Authenticate, function(req,res){
	res.render('edit-profile');
});
app.post('/pic', Authenticate, function(req, res){
	Pic.count({user:req.user._id, date:{$gt:moment().subtract('hours',1)}}, function(err, count){
		if(err) throw err;
		if(count == 20){
			return res.json({error: "You have exceeded your limit for the hour."});
		}

		var pic = req.body.pic.replace(/^data:image\/png;base64,/,"");
		var hash = md5(pic);
		Pic.count({md5:hash}, function(err, count){
			if(err) throw err;
			if(count > 0){
				return res.json({error:"Already posted"});
			}
			/*var c = new canvas(580,480);
			ctx = c.getContext('2d');
			ctx.font = '30px "Baroque Script"';
			ctx.fillText("Awesome!", 50, 100);
			var pic = c.toDataURL().replace(/^data:image\/png;base64,/,"");
			fs.writeFile('./test.png', pic, 'base64', function(err) {

			});*/
			var watermark = "anyme.me/" + req.user.screen_name; 
			var file_name_seed = ((Math.random()*10000000 +100000 + new Date().getTime()) << .1).toString(16)
			var f_name = file_name_seed + '.png';
			var jpg_name = file_name_seed + '.jpg';
			var tempfolder = "./public/files/" ;
			var temppath = tempfolder + f_name;
			var jpgtemppath = tempfolder + file_name_seed + ".jpg";
			fs.writeFile(temppath, pic, 'base64', function(err) {
				//convert to jpg
				im
				.convert([
					'-composite',
					'-gravity', 'SouthWest', 
					temppath,
					__dirname + "/public/watermarks/morph.png",				
					jpgtemppath
					
				],function(err){
					async.parallel([
						function(fn){
							racker
							.upload(jpgtemppath)
							.to('anymeme')
							.as(jpg_name)
							.on('progress', console.log)
							.end(fn);
						},
						function(fn){
							gm(temppath)
							.resize(260,215)
							.toBuffer(function(err, buffer){
								racker
								.upload(buffer)
								.to('anymeme')
								.as("medium_" + jpg_name)
								.on('progress', console.log)
								.end(fn);
							});
				
						}
					],function(err, done){
						if(err) throw err;
						new Pic({
							user:req.user._id,
							pic: jpg_name,
							likes:0,
							dislikes:0,
							date:new Date(),
							ip:req.ip,
							md5:hash,
							private:req.body.private,
							randomizer:[Math.random(), 0],
							text:req.body.text
							//request_headers:{}

						}).save(function(err, doc){
							if(err) throw err;
							//delete temp files
							fs.unlink(jpgtemppath, function(){});
							fs.unlink(temppath, function(){});
							
							Pic
							.findOne({_id:doc._id})
							.populate('user', "id screen_name username")
							.exec(function(err, pic){
								if(err) throw err;
								res.json(pic);
							});
							//post to fb album
							req.body.post_fb = req.body.post_fb == "true" ? true : false;
							if(argv.skipfb || req.body.post_fb == false){
								return;
							}
							if(req.body.post_fb == true){
								fb.api(
									req.user.fbid + '/photos', 
									'post', 
									{
										access_token:req.user.accessToken,	
										url: cdn_url + '/' + jpg_name, 
										message:''
									}, function(res){
										console.log(res);
									}
								);
							}
			
						});        
					});
				});
			});
		});
	});
});

app.get('/posts/new', function(req,res){
	Pic.latest({}, function(err, latest){
		if(err) throw err;
		res.json(latest);
	});
});
app.get('/channel.html', function(req, res){
	res.setHeader("Pragma: public");
	res.setHeader("Cache-Control", "max-age=" + (60*60*24*3655));
	res.setHeader('Expires', 'Fri, 10 May 2020 15:33:44 GMT');
	res.end('<script src="//connect.facebook.net/en_US/all.js"></script>');
});
app.get('/posts/before/:id', function(req, res){
	var id = req.params.id;
	Pic
	.find({_id:{$lt:id}},{approvals:0, favorited:0, ip:0, request_headers:0})
	.sort({_id:-1})
	.limit(20)
	.populate('user', "id screen_name username")
	.exec(function(err, posts){
		if(err) throw err;
		//TODO: remove ip
		res.json(posts);
	});
});
app.get('/following', Authenticate, function(req, res){
	var id = req.user._id;
	//find following
	User.findOne({_id:id},{following_l:1, 'following_l.user':1}, function(err, following){
		if(err) throw err;

		var following = following.following_l;
		if(!following){
			return res.json([]);
		}
		//find latest posts by following
		var follow = _.map(following,function(u){return u.user});
		if(!req.xhr){
			async.auto({
				latest:function(fn){
					Pic.fetch({
						find:{'user':{$in:follow}},
						user:req.user._id, 
						fn:fn
					});
				},
				popular:function(fn){
					Pic.popular(fn);
				}
			}, function(err, docs){
				docs.display_type = 'following';
				res.render('index',docs);
			});
		}else{
			Pic.fetch({
				find:{'user':{$in:follow}},
				user:req.user._id, 
				fn:function(err, posts){
					if(err) throw err;
					res.json(posts);
				}
			});
		}

	});
});
app.get('/featured', function(req,res){
	if(!req.xhr){
		async.auto({
			latest:function(fn){
				Pic.fetch({
					find:{featured:true},
					fn:fn
				});
			},
			popular:function(fn){
				Pic.popular(fn);
			}
		}, function(err, docs){
			docs.display_type = 'featured';
			res.render('index',docs);
		});
	}else{
		Pic.fetch({
			find:{featured:true},
			fn:function(err, posts){
				if(err) throw err;
				res.json(posts);
			}
		});
	}
});
app.post('/fbcomment', function(req, res){
	if(!req.body.data && !req.body.data.href){
		return res.end();
	}
	var id = req.body.data.href.split("/").pop();
	var val = req.body.type == 'add' ? 1 : -1;
	Pic.update({_id:id}, {$inc:{comments:val}}, function(err, changed){
	});
	res.end();
});
app.post('/post/:id/approve', function(req, res){
	var id = req.params.id;
	var type = req.body.type;
	if(!type){
		return res.json({error: 'There was an error!'});
	}
	if(type != "like" && type != "dislike"){
		return res.json({error:"Invalid request!"});
	}
	//check if casted
	var q = {_id:id};
	if(req.isAuthenticated()){
		q['approvals.user'] = req.user._id;	
	}else{
		q['approvals.ip'] = req.ip;
	}
	Pic.findOne(q,{_id:1}, function(err, pic){
		if(err) throw err;
		if(pic){
			return res.json({error: 'Already casted'});
		}
		var update = {
			$push:{
				approvals:{
					//user:req.user._id, 
					type:type, 
					date:new Date(), 
					ip:req.ip
				}
			},
			$inc:{} 
		};
		if(req.isAuthenticated()){
			update.$push.approvals.user = req.user._id;
		}
		update.$inc[type + "s"] = 1;
		Pic.update({_id:id}, update, function(err){
			if(err) throw err;
			Pic.findOne({_id:id}, {likes:1, dislikes:1, _id:0}, function(err, likes){
				if(err) throw err;
				res.json(likes);
			});
		});
		
	});
});
app.get('/random', function(req, res){
	Pic
	.count(function(err, count){
		if(err) throw err;
		var rand = Math.floor( Math.random() * count );
		Pic
		.findOne()
		.lean()
		.populate('user', "id screen_name username")
		.skip(rand)
		.exec(function(err, doc){
			if(err) throw err;
			res.redirect('/' + doc.user.screen_name + '/' + doc._id);
		});
	});
});
app.get('/:user', function(req,res){
	User.findOne({screen_name:req.params.user}, function(err, user){
		if(err) throw err;
		if(!user){
			return res.end('TODO: 404 page');
		}
		async.auto({
			latest:function(fn){
				Pic.latest({user:user._id}, fn);
			},
			popular:function(fn){
				Pic.popular(fn);
			},
			posts:function(fn){
				Pic.count({user:user._id},fn);
			},
			favorites:function(fn){
				Pic.count({'favorited.user':user._id}, fn);
			},
			following:function(fn){
				if(req.user){
					User.count({_id:req.user._id, "following_l.user":user._id}, fn);
				}else{
					fn(null, null);
				}
			}
		}, function(err, docs){
			if (err) throw err;
			docs.title = user.screen_name + " on Anyme.me!";
			docs.user = user;
			res.render('user',docs);
		});
	});
});
app.post('/user/set-website', Authenticate, function(req, res){
	User.update({_id:req.user._id}, {$set:{website:req.body.website}}, function(err, changed){
		if(err) throw err;
		if(changed == 0){
			res.json({error: "Unable to set the website"});
		}else{
			res.json({message:"Successfully changed website"});
		}
	});
});
app.get('/:user/favorites', function(req,res){
	User.findOne({screen_name:req.params.user}, function(err, user){
		if(err) throw err;
		if(!user){
			return res.end('TODO: 404 page');
		}
		async.auto({
			popular:function(fn){
				Pic.popular(fn);
			},
			favorites:function(fn){
				Pic
				.find({'favorited.user':user._id}, {approvals:0, favorited:0, ip:0, request_headers:0})
				.sort({_id:-1})
				.limit(20)
				.populate('user', "id screen_name username")
				.exec(fn);
			}
		}, function(err, docs){
			if (err) throw err;
			docs.title = user.screen_name + " favorite posts on Anyme.me!";
			docs.user = user;
			res.render('user-favorite',docs);
		});
	});
});
app.get('/:user/:pic', function(req,res){
	//find latest posts
	var id = req.params.pic;
	Pic
	.findOne({_id:id})
	.populate('user', "id screen_name username")
	.exec(function(err, pic){
		if(err) throw err;
		if(pic){
			//increment views
			Pic.update({_id:id},{$inc:{views:1}}, function(err){});
			res.render('display', {pic:pic, title:pic.user.screen_name + " on Anyme.me"});
		}
	});
	
});
app.post('/favorite', Authenticate, function(req, res){
	var id = req.body.id;
	var uid = req.user._id;
	if(!id){
		return res.json({error:'Incomplete request'});
	}
	//check if user had already favorited
	Pic.findOne({_id:id, 'favorited.user':uid}, {_id:1}, function(err, post){
		if(err) throw err;
		if(post){
			//unfavorite if favorited
			return Pic.update({_id:id},{$inc:{favorites:-1}, $pull:{favorited:{user:uid}}}, function(err, changed){
				if(err) throw err;
				res.json({favorite:0});
			});
		}
		//favorite it
		Pic.update({_id:id},{$inc:{favorites:1}, $push:{favorited:{user:uid, date:new Date(), ip:req.ip}}}, function(err, changed){
			if(err) throw err;
			res.json({favorite:1});
		});
	});
});
app.post('/remove-post', Authenticate, function(req, res){
	var id = req.body.id;
	if(!id){
		return res.json({error:'id not sent'});
	}
	//remove if post belongs to user
	Pic.remove({_id:id, user:req.user._id}, function(err, num){
		if(err) throw err;
		if(num == 1){
			return res.json({message:"removed pic", user:req.user.screen_name});
		}
		return res.json({error:"You're not authorized to do this!"});
		
	});
});
app.post('/follow', Authenticate, function(req, res){
	var user = req.body.user;
	if(user == req.user._id){
		return res.json({error:"You can't follow yourself!"});
	}
	if(user.length != 24){
		return res.json({error:"Incorrect user id supplied!"});
	}
	//check if user exists
	User.count({_id:user}, function(err, count){
		if(err) throw err;
		var exists = count == 1;
		if(exists == true){
			//check if i'm following this user
			User.count({_id:req.user._id, "following_l.user":user}, function(err, count){
				if(err) throw err;
				var following = count == 1;
				if(following == false){
					//follow!
					User.update({_id:req.user._id},{$push:{following_l:{user:user}}, $inc:{following:1}}, function(err, updated){
						if(err) throw err;
						//increment the users followers
						User.update({_id:user},{$inc:{followers:1}}, function(err, update){});
						res.json({message:"followed"});
					});
				}else{
					res.json({error:"You're already following this user"});
				}
			});
		}else{
			return res.json({error:"User doens't exists to follow!"});
		}
	});
});
app.post('/unfollow', Authenticate, function(req, res){
	var user = req.body.user;
	if(user == req.user._id){
		return res.json({error:"You can't follow yourself!"});
	}
	if(user.length != 24){
		return res.json({error:"Incorrect user id supplied!"});
	}
	//check if user exists
	User.count({_id:user}, function(err, count){
		if(err) throw err;
		var exists = count == 1;
		if(exists == true){
			//check if i'm following this user
			User.count({_id:req.user._id, "following_l.user":user}, function(err, count){
				if(err) throw err;
				var following = count == 1;
				if(following == true){
					//unfollow!
					User.update({_id:req.user._id},{$pull:{following_l:{user:user}}, $inc:{following:-1}}, function(err, updated){
						if(err) throw err;
						//increment the users followers
						User.update({_id:user},{$inc:{followers:-1}}, function(err, update){});
						res.json({message:"unfollowed"});
					});
				}else{
					res.json({error:"You're not following this user"});
				}
			});
		}else{
			return res.json({error:"User doens't exists to follow!"});
		}
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});





