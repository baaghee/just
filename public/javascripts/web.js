$(function(){
	//text
	var text_properties = {
		text:"type something...",
		textColor:"black",
		bgcolor:"orange",
		size:"14px",
		font: "Arial"
	}
    var text;
    var textColor;
    var bgcolor;
    var size;
    var type = 'text';

    //pic    
	var img;
	
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
		bgcolor = color;
		render();
		
	});
	$("body").on('change', "#file", function(){
		var reader = new FileReader();
		var file = $("#file").get(0).files[0];
		reader.readAsDataURL(file);
		reader.onload = function(){
			img = reader.result;
			render();
		}
	});
    $("#submit").click(function(e){
        e.preventDefault();
        var image = $("canvas");
        var img = image.getCanvasImage('png');
        
        $.post('/pic', {pic:img}, function(res){
        	if(res.error){
        		alert(res.error);
        		return;
        	}
        	var dom = jade.render('post',{post:res});
        	$("#post-listing").prepend(dom);
        	$("#input").val("").html("");
        	$("canvas").slideUp();
        });
    });

    $("#input").keyup(function(e){
        e.preventDefault();
        text = $("#input").val();
        render();
    });
	function render(){
		$("canvas").slideDown();
		$("canvas").clearCanvas();
		console.log(type);
		if(type == 'text'){
			$("canvas").drawRect({
			  fillStyle: text_properties.bgcolor,
			  x: 0, y: 0,
			  width: 4000,
			  height: 4000,
			  fromCenter: false
			});
			$("canvas").drawText({
			  fillStyle: text_properties.textColor,
			  strokeWidth: 2,
			  x: 290, y: 220,
			  align: "center",
			  font: text_properties.size + " '"+text_properties.font+"', sans-serif",
			  maxWidth: 580,
			  text: text
			});
		}else if(type=='image'){
			$("canvas").drawImage({
			  source: img,
			  x: 0, y: 0,
			 // width: 100,
			  fromCenter: false
			});
			
	        $("canvas").drawText({
	          fillStyle: "#000",
	          strokeStyle: "#fff",
	          strokeWidth: 1,
	          x: 290, y: 400,
	          align: "center",
	          font: "bold 40px Verdana, sans-serif",
	          maxWidth: 580,
	          text: $("#bot-input").val()
	        });
	        $("canvas").drawText({
	          fillStyle: "#000",
	          strokeStyle: "#fff",
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
            $("#upload-menu").hide();
            $(this).removeClass('active');
        } else {
        	type = "image";
            $("#any-textarea").hide();
            $("#text-menu").hide();
            $("#meme-textarea").fadeIn();
            $("#upload-menu").fadeIn();
            $(this).addClass('active');
        }
    });

    $('.tool').tooltip();

    $("#sort-header .nav li").click(function(e){
        e.preventDefault();
        $("#sort-header .nav li").not().removeClass("active");
        $(this).addClass("active");
    });
});










