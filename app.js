
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , jade_browser = require('jade-browser')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , argv = require("optimist").argv
  , MongoStore = require('connect-mongo')(express);

//DB
mongoose = require('mongoose');
db = mongoose.createConnection('localhost', 'anymeme');

var User = require('./lib/User');    
var Pic = require('./lib/Pic');    

var sessionStore = new MongoStore({db:'anymeme'}); 
 
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
		fn(exists != null);
	});
};

function Authenticate(req,res,next){
  if (req.isAuthenticated()) { return next(); }
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
	  	app.locals.user = req.user;
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
	//find latest posts
	Pic.latest({}, function(err, latest){
		res.render('index',{latest:latest});
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
		res.render('display', {pic:pic});
	});
});
app.post('/pic', Authenticate, function(req, res){
	var pic = req.body.pic.replace(/^data:image\/png;base64,/,"");
	var file_name_seed = ((Math.random()*10000000 +100000 + new Date().getTime()) << .1).toString(16)
	var f_name = file_name_seed + '.png';
	var file_name = __dirname + "/public/files/" + f_name;
	fs.writeFile(file_name, pic, 'base64', function(err) {
		if(err) throw err;
		new Pic({
			user:req.user._id,
			pic: f_name,
			likes:0,
			dislikes:0,
			date:new Date(),
			//ip:'string',
			//request_headers:{}

		}).save(function(err, doc){
			if(err) throw err;
			Pic
			.findOne({_id:doc._id})
			.populate('user', "id screen_name username")
			.exec(function(err, pic){
				if(err) throw err;
				res.json(pic);
			});
			//
           var fb = require('fb');
           //fb.setAccessToken();
           fb.api(
                  'me/feed', 
                   'post',
                   {
                   		   link: 'http://anyme.me/' + req.user.screen_name + '/' + doc._id,
                           picture: 'http://anyme.me/files/' + f_name, 
                           message:'testing',
                           access_token:req.user.accessToken
                   }, function(res){
                           console.log(res);
                   }
           );
			
		});        
	});
});

app.get('/posts/new', function(req,res){
	Pic.latest({}, function(err, latest){
		if(err) throw err;
		res.json(latest);
	});
});
app.post('/post/:id/approve', Authenticate, function(req, res){
	var id = req.params.id;
	var type = req.body.type;
	if(!type){
		return res.json({error: 'There was an error!'});
	}
	if(type != "like" && type != "dislike"){
		return res.json({error:"Invalid request!"});
	}
	//check if casted
	Pic.findOne({_id:id, 'approvals.user':req.user._id},{_id:1}, function(err, pic){
		if(err) throw err;
		if(pic){
			return res.json({error: 'Already casted'});
		}
		var update = {
			$push:{
				approvals:{
					user:req.user._id, 
					type:type, 
					date:new Date(), 
					ip:'string'
				}
			},
			$inc:{} 
		};
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
app.get('/:user', function(req,res){
	User.findOne({username:req.params.user}, function(err, user){
		if(err) throw err;
		if(!user){
			return res.end('TODO: 404 page');
		}
		Pic.latest({user:user._id}, function(err, pics){
			if(err) throw err;
			res.render('user', {latest:pics});
		});
		
	});
});
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
