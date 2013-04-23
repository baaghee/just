
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , jade_browser = require('jade-browser')
  , path = require('path')
  , fs = require('fs')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , argv = require("optimist").argv
  , MongoStore = require('connect-mongo')(express)

//DB
mongoose = require('mongoose');
db = mongoose.createConnection('localhost', 'anymeme');

var User = require('./lib/User');    

var sessionStore = new MongoStore({db:'anymeme'}); 
 
passport.use(new FacebookStrategy({
		clientID: "565414836813596",
		clientSecret: "d62327c41e6eb2c98dae219258e20caf",
		callbackURL: "http://anyme.me/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		User.findOne({_id:profile.id}, function(err, user){
			if(!user){
				new User({
					_id:profile.id
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
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user){
  	done(err, user);
  });
});

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 80);
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
		if(!app.locals.session){
	  		app.locals.session = req.session;
	  	}
  		next();
	});	
	app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/register', Authenticate, function(req,res){
	console.log(req.session);
	if(req.session.user.screen_name){
		return res.redirect('/');
	}
	res.render('register', {username:req.session.user.username});
});
app.post('/register',  function(req, res){
	var screen_name = req.body.screen_name;
	ScreenNameExists(screen_name, function(exists){
		if(exists){
			return res.redirect('/');
		}
		User.update({_id:req.session.passport.user}, {$set:{screen_name:screen_name}}, function(err, user){
			if(err) throw err;
			User.findOne({_id:req.session.passport.user}, function(err, user){
				if(err) throw err;
				req.session.user = user;
				res.redirect('/');
			});
			
		});
	});
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

app.get('*', function(req, res, next){
	//show signup page if user is not registered after authentication
	if(typeof req.session.passport.user == 'undefined'){
		return next();
	}
	if(typeof req.session.user == 'undefined'){
		User.findOne({_id:req.session.passport.user}, function(err, user){
			if(err) throw err;
			req.session.user = user;
			if(!user.screen_name){
				res.redirect('/register');
			}
			return next();
		});
	}else{
		return next();
	}
});

app.get('/', function(req,res){
	res.render('index');
});
app.post('/pic', function(req, res){
	var pic = req.body.pic.replace(/^data:image\/png;base64,/,"");
	var file_name_seed = ((Math.random()*10000000 +100000 + new Date().getTime()) << .1).toString(16)
	var file_name = __dirname + "/public/files/" + file_name_seed + '.png';
	fs.writeFile(file_name, pic, 'base64', function(err) {
		if(err) throw err;
		res.json({file:file_name});
	});
})

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
