var menuActions = {
    'right' : function(){
	var c = app.meshCenter()
	console.log(c);
	app.camera.position.set(-100, 0, -c.z)
	app.camera.lookAt(c)
	app.camera.lookAt(0, 0, 0)
	app.camera.updateProjectionMatrix();
    },
    'left' : function(){
	var c = app.meshCenter()
	app.camera.lookAt(c)
	app.camera.lookAt(0, 0, 0)
	app.camera.position.set(100, 0, 0)
	app.camera.updateProjectionMatrix();
    },
    'top' : function(){
	var c = app.meshCenter()
	app.camera.lookAt(c)
	app.camera.position.set(c.x, 100, c.z)
    },
    'bottom' : function(){
	var c = app.meshCenter()
	app.camera.lookAt(c)
	app.camera.rotation.z = 90 * Math.PI / 180
	app.camera.position.set(c.x, -100, c.z)
    },
    'front' : function(){
	var c = app.meshCenter()
	app.camera.lookAt(c)
	app.camera.position.set(c.x, c.y, -100)
    },
    'back' : function(){
	var c = app.meshCenter()
	app.camera.lookAt(c)
	app.camera.position.set(c.x, c.y, 100)
    },
    'zoom to fit' : function(){
	app.zoomToFit(0.9)
    },
    'freehand' : function(){
        app.mode = 'freehand';
        var mode = 'freehand'
        console.log(mode);
	
        app.canvas.off('mousedown');
        app.canvas.on('mousedown', app.draw[mode].mousedown);
        app.canvas.off('mousemove');
        app.canvas.on('mousemove', app.draw[mode].mousemove);
        app.canvas.off('mouseup');
        app.canvas.on('mouseup', app.draw[mode].mouseup);
        
        app.controls.enableZoom = false;
        app.controls.enableRotate = false;
        app.controls.enablePan = false;             
    },
    'splines' : function(){
        app.mode = 'splines';
        var mode = 'splines'
	
        app.canvas.off('mousedown');
        app.canvas.on('mousedown', app.draw[mode].mousedown);
        app.canvas.off('mousemove');
        app.canvas.on('mousemove', app.draw[mode].mousemove);
        app.canvas.off('mouseup');
        app.canvas.on('mouseup', app.draw[mode].mouseup);
        
        app.controls.enableZoom = false;
        app.controls.enableRotate = false;
        app.controls.enablePan = false;             
    },
    'straight lines' : function(){
        app.mode = 'polylines';
        var mode = 'polylines'
	
        app.canvas.off('mousedown');
        app.canvas.on('mousedown', app.draw[mode].mousedown);
        app.canvas.off('mousemove');
        app.canvas.on('mousemove', app.draw[mode].mousemove);
        app.canvas.off('mouseup');
        app.canvas.on('mouseup', app.draw[mode].mouseup);
        
        app.controls.enableZoom = false;
        app.controls.enableRotate = false;
        app.controls.enablePan = false;             
    },
    '3d view' : function(){
	app.mode = '3d';
	app.draw.clearCanvas();
	
	console.log('3d');
	app.controls.enableZoom = true;
	app.controls.enableRotate = true;
	app.controls.enablePan = true;		
	
    },
    'polylines' : function(){
	app.mode = 'polylines';
	var mode = 'polylines'
	console.log(mode);

	app.draw.canvas.off('mousedown');
	app.draw.canvas.on('mousedown', app.draw[mode].mousedown);
	app.draw.canvas.off('mousemove');
	app.draw.canvas.on('mousemove', app.draw[mode].mousemove);
	app.draw.canvas.off('mouseup');
	app.draw.canvas.on('mouseup', app.draw[mode].mouseup);
	
	
	app.controls.enableZoom = false;
	app.controls.enableRotate = false;
	app.controls.enablePan = false;		
    },
    'edit lines' : function(){
	app.draw.editLine()
	app.controls.enableZoom = false;
	app.controls.enableRotate = false;
	app.controls.enablePan = false;		
    },
    'vectorize' : function(){
	app.draw.vectorize()
    },
    'get image' : function(){
	console.log(app.draw.toCanvas())
    },
    'get vector' : function(){
	console.log(app.draw.toSVG())
    },
};

// ctrlKey, metaKey, shiftKey

var keyBindings = {
    'z000' : 'zoom to fit',
    'f000' : 'front',
    'b000' : 'back',
    't000' : 'top',
    'm000' : 'bottom',
    'l000' : 'left',
    'r000' : 'right',
    '3000' : '3d view',
    
    'f100' : 'freehand',
    'p100' : 'polylines',
    's100' : 'splines',

    'e101' : 'edit lines',
}; 

$(function(){
    $.get('./navbar.html', function(d) {
	console.log('loaded navbar');
	$('#topmenu').html(d);
	document.addEventListener("keydown", e => {
	    if (e.key.match(/^[a-z0-9]{1,1}$/i)) {
		var k = e.key + [ e.ctrlKey, e.metaKey, e.shiftKey ].map(e => { return e ? 1 : 0 }).join('')
		if(keyBindings[k] && menuActions[keyBindings[k]]) {
		    try {
			menuActions[keyBindings[k]]();
		    } catch(e) {
			console.log(e)
		    }
		} else {

		}
	    }
	});
	$('#view button, a').on('click', function(e){
	    console.log('click');
	    var v = $(e.target).html().toLowerCase();
	    console.log(v);
	    if (menuActions[v]) {
		try {
		    menuActions[v]();
		} catch(e) {
		    console.log(e)
		}
	    } else {
		console.log("item ${v} is not connected to an action")
	    }
	})
    })

    $('#sidemenu img').on('click', function(e) {
	var v  = $(e.target).data('command')
	console.log(v);
	if (menuActions[v]) {
	    try {
		menuActions[v]();
	    } catch(e) {
		console.log(e)
	    }
	} else {
	    console.log("item ${v} is not connected to an action")
	}
    })
    
    $('#canvas').on('click', function(e){
	console.log(e);
    })
})
