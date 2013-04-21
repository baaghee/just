   $(document).ready(function(){

        var text;
        var bgcolor;
        var size;
        var img;
        var type = 'text';
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
            		//TODO
            		return;
            	}
            	var dom = jade.render('post',{image:img});
            	//dom = $(dom);
            	$("#posts").prepend(dom);
            	//dom.slideDown();
            });
        });

        $("#input").keyup(function(e){
            e.preventDefault();
            text = $("#input").val();
            render();
        });
		function render(){
			$("canvas").clearCanvas();
			if(type == 'text'){
				$("canvas").drawRect({
				  fillStyle: bgcolor,
				  x: 0, y: 0,
				  width: 4000,
				  height: 4000,
				  fromCenter: false
				});
				$("canvas").drawText({
				  fillStyle: "#000",
				  strokeWidth: 2,
				  x: 220, y: 150,
				  align: "center",
				  font: "30px 'Merriweather Sans', sans-serif",
				  maxWidth: 500,
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
		          x: 220, y: 300,
		          align: "center",
		          font: "bold 40px Verdana, sans-serif",
		          maxWidth: 500,
		          text: $("#bot-input").val()
		        });
		        $("canvas").drawText({
		          fillStyle: "#000",
		          strokeStyle: "#fff",
		          strokeWidth: 1,
		          x: 220, y: 50,
		          align: "center",
		          font: "bold 40px Verdana, sans-serif",
		          maxWidth: 500,
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
    });
