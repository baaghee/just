cdn_url = 'http://e7026f8f16c0bcf6d100-23fa34ac10b738921d65a145768427b6.r66.cf1.rackcdn.com';
$(function(){

	//text
	var text_properties = {
		text:"type something...",
		textColor:"white",
		bgColor:"red",
		size:"38px",
		font: 'Oswald'
	}
	var shadow = false;
    var text;
    var textColor;
    var bgColor;
    var size;
    var type = 'text';
    var alpha = false;
    //pic    
	var img;
	$("#clear").click(function(){
		shadow = false;
		alpha = false;
		text_properties = {
			text:"type something...",
			textColor:"white",
			bgColor:"red",
			size:"38px",
			font: 'Oswald'
		}
		render();
	});
    $("body").on("click", ".change-canvas-attribute li", function(){
    	var self = $(this);
    	var role = self.parent().attr("data-role"); 
    	var key = self.attr("data-attribute");
    	text_properties[role] = key;
    	render();
    });
	$("body").on("click", ".approve", function(){
		var self = $(this);
		var id = self.attr("data-id").replace(/\"/gi, "");
		var type = self.attr("data-data");
		$.post('/post/' + id + '/approve', {type:type}, function(res){
			$(".like_" + id).text(res.likes);
			$(".dislike_" + id).text(res.dislikes);
		});
	});
	$('#colorpicker').colorpicker().on('changeColor', function(e){
		var color = e.color.toHex();
		bgColor = color;
		render();
		
	});
	$("body").on('change', "#file", function(){
		var reader = new FileReader();
		var file = $("#file").get(0).files[0];
		reader.readAsDataURL(file);
		reader.onload = function(){
			img = reader.result;
			text_properties.bgColor = void 0;
			render();
		}
	});
    $("#submit").click(function(e){
        e.preventDefault();
        var self = $(this);
        var image = $("canvas");
        var img = image.getCanvasImage('png');
        var post_fb = $("#post-to-fb").is(":checked");
        var private = $("#post-private").is(":checked");
        var block = self.hasClass("block-btn");
        if(block) return;
        self.text("Posting").addClass("block-btn");
        $.post('/pic', {pic:img, post_fb:post_fb, private:private}, function(res){
        	self.text("Post").removeClass("block-btn");
        	if(res.error){
        		alert(res.error);
        		return;
        	}
        	var dom = jade.render('post',{post:res});
        	$("#post-listing").prepend(dom);
        	$("#input").val("").html("");
        	$("#top-input").val("").html("");
        	$("#bot-input").val("").html("");
        	$("canvas").slideUp();
        });
    });

    $("#input").keyup(function(e){
        e.preventDefault();
        text = $("#input").val();
        if(text == ''){
        	$("canvas").slideUp();
        }else{
	        render();
	    }
    });
	function render(){
		$("canvas").slideDown();
		$("canvas").clearCanvas();
		if(img && !text_properties.bgColor){
			$("canvas").drawImage({
			  source: img,
			  x: 0, y: 0,
			  width: 580,
			  height: 480,
			  fromCenter: false
			});

		}

		if(type == 'text'){
			if(!img || text_properties.bgColor){
				$("canvas").drawRect({
				  fillStyle: text_properties.bgColor,
				  x: 0, y: 0,
				  width: 4000,
				  height: 4000,
				  fromCenter: false
				});
			}
			if(alpha == true){
				$("canvas").drawRect({
				  fillStyle: "rgba(0,0,0,.5)",
				  x: 0, y: 0,
				  width: 4000,
				  height: 4000,
				  fromCenter: false
				});			

			}
			$("canvas").drawText({
				fillStyle: text_properties.textColor,
				strokeWidth: 2,
				x: 290, y: 220,
				align: "center",
				font: text_properties.size + " '"+text_properties.font+"', sans-serif",
				maxWidth: 580,
				shadowColor: (shadow == true ? "#000" : ""),
				shadowBlur: 10,
				shadowX: 0,
				shadowY: 0,			  
				maxWidth: 580,
				text: text
			});
			$("canvas").drawText({
				fillStyle: text_properties.textColor,
				strokeWidth: 2,
				x: 290, y: 220,
				align: "center",
				font: text_properties.size + " '"+text_properties.font+"', sans-serif",
				maxWidth: 580,
				shadowColor: (shadow == true ? "#000" : ""),
				shadowBlur: 20,
				shadowX: 0,
				shadowY: 0,			  
				maxWidth: 580,
				text: text
			});
			$("canvas").drawText({
				fillStyle: text_properties.textColor,
				strokeWidth: 2,
				x: 290, y: 220,
				align: "center",
				font: text_properties.size + " '"+text_properties.font+"', sans-serif",
				maxWidth: 580,
				shadowColor: (shadow == true ? "#000" : ""),
				shadowBlur: 50,
				shadowX: 0,
				shadowY: 0,			  
				maxWidth: 580,
				text: text
			});
			$("canvas").drawText({
				fillStyle: text_properties.textColor,
				strokeWidth: 2,
				x: 290, y: 220,
				align: "center",
				font: text_properties.size + " '"+text_properties.font+"', sans-serif",
				maxWidth: 580,
				shadowColor: (shadow == true ? "#000" : ""),
				shadowBlur: 50,
				shadowX: 0,
				shadowY: 0,			  
				maxWidth: 580,
				text: text
			});
		}else if(type=='image'){
			if(alpha == true){
				$("canvas").drawRect({
				  fillStyle: "rgba(0,0,0,.5)",
				  x: 0, y: 0,
				  width: 4000,
				  height: 4000,
				  fromCenter: false
				});			

			}
	        $("canvas").drawText({
	          fillStyle: "#fff",
	          strokeStyle: "#000",
	          strokeWidth: 1,
	          x: 290, y: 400,
	          align: "center",
	          font: "bold 40px Verdana, sans-serif",
	          maxWidth: 580,
	          text: $("#bot-input").val()
	        });
	        $("canvas").drawText({
	          fillStyle: "#fff",
	          strokeStyle: "#000",
	          strokeWidth: 1,
	          x: 290, y: 70,
	          align: "center",
	          font: "bold 40px Verdana, sans-serif",
	          maxWidth: 580,
	          text: $("#top-input").val()
	        });
	       
		}
	}
    $("#top-input").keyup(function(e){
        render();
    });

    $("#bot-input").keyup(function(e){
		render();
    });

    $("#photo").click(function(){
        type = type == 'text' ? 'image' : 'text';
        if ($(this).hasClass('active')) {
            $("#main-input").fadeIn();
            $("#image-input").hide();
            $(this).removeClass('active');
        } else {
            $("#main-input").hide();
            $("#image-input").fadeIn();
            $(this).addClass('active');
        }
    });
	$("#upload-image").click(function(){
            
        if ($(this).hasClass('active')) {
        	type = "text";
            $("#any-textarea").fadeIn();
            $("#text-menu").fadeIn();
            $("#meme-textarea").hide();
            $(this).removeClass('active');
        } else {
        	type = "image";
            $("#any-textarea").hide();
            $("#text-menu").hide();
            $("#meme-textarea").fadeIn();
            $(this).addClass('active');
        }
        render();
    });

    $('.tool').tooltip();

    $("#sort-header .nav li").click(function(e){
        e.preventDefault();
        $("#sort-header .nav li").not().removeClass("active");
        $(this).addClass("active");
    });
    $("#load-more-post").click(function(){
    	var last_post = $("#post-listing .post:last").data().id.replace(/\"/g, '');
    	$.getJSON('/posts/before/' + last_post, function(posts){
    		if(posts.length){
    			var html = '';
    			posts.forEach(function(e){
    				html += jade.render('post', {post:e});
    			});
    			$("#post-listing").append(html);
    		}
    		if(posts.length < 20){
    			$("#load-more-post").hide();
    		}
    	});
    });
    $("body").on("click", ".make-favorite", function(){
    	var self = $(this);
    	var id = self.data().id.replace(/\"/g, '');;
    	$.post('/favorite', {id:id}, function(res){
    		if(res.error){
    			//TODO err
    		}
    		//TODO success
    	});
    });
    $("#change-canvas-alpha").click(function(){
    	if($(this).hasClass("active")){
    		alpha = false;
    	}else{
    		alpha = true;
    	}
    	render();
    });
    $("#change-canvas-textshadow").click(function(){
    	if($(this).hasClass("active")){
    		shadow = false;
    	}else{
    		shadow = true;
    	}
    	render();
    });
    $("body").on('click', ".remove-post", function(){
    	var id = $(this).data().id.replace(/\"/g, '');
    	var self = $(this);
    	if(!confirm("Are you sure you want to remove this post?")){
    		return;
    	}
    	$.post('/remove-post', {id:id}, function(res){
    		if(res.error){
    			return alert(res.error);
    		}
    		var pagename = typeof pagename != 'undefined' ? pagename : "";
    		if(pagename == 'display'){
    			window.location = window.location.origin + "/" + res.user;
    			return;
    		}
    		self.parent().parent().parent().slideUp();
    	});
    });
    $("body").on('click',".follow-btn", function(){
    	var id = $(this).data().id.replace(/\"/g,'');
    	var self = $(this);
    	$.post("/follow",{user:id}, function(res){
    		if(!res.error){
    			$(".follow-btn[data-id='"+id+"']").removeClass("follow-btn").addClass("unfollow-btn").text("Unfollow");
    		}
    	});
    });
    $("body").on('click',".unfollow-btn", function(){
    	var id = $(this).data().id.replace(/\"/g,'');
    	var self = $(this);
    	$.post("/unfollow",{user:id}, function(res){
    		if(!res.error){
    			$(".follow-btn[data-id='"+id+"']").removeClass("unfollow-btn").addClass("follow-btn").text("Follow");
    		}
    	});
    });
	window.fbAsyncInit = function() {
		FB.init({
			appId      : '565414836813596',                        // App ID from the app dashboard
			channelUrl : '//anyme.me/channel.html', // Channel file for x-domain comms
			status     : true,                                 // Check Facebook Login status
			xfbml      : true                                  // Look for social plugins on the page
		});
		FB.Event.subscribe('comment.create', function(res){
			$.post('/fbcomment', {type:'add', data:res});
		});   
		FB.Event.subscribe('comment.remove', function(res){
			$.post('/fbcomment', {type:'remove', data:res});
		});   
	}
});









