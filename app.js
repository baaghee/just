
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

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3050);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(jade_browser('/templates.js', '**', {root: __dirname + '/views/components', cache:false}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
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
