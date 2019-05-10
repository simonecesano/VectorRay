var menuActions = {
    'left' : function(){
	var c = app.three.meshCenter()
	app.three.camera.position.set(-100, 0, -c.z)
	app.three.camera.lookAt(c)
	app.three.camera.lookAt(0, 0, 0)
	app.three.camera.updateProjectionMatrix();
    },
    'right' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.lookAt(0, 0, 0)
	app.three.camera.position.set(100, 0, 0)
	app.three.camera.updateProjectionMatrix();
    },
    'top' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.position.set(c.x, 100, c.z)
    },
    'bottom' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.rotation.z = 90 * Math.PI / 180
	app.three.camera.position.set(c.x, -100, c.z)
    },
    'front' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.position.set(c.x, c.y, -100)
    },
    'back' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.position.set(c.x, c.y, 100)
    },
    'zoom to fit' : function(){
	app.three.zoomToFit(0.9)
    },
    'freehand' : function(){
        app.mode = 'freehand';
        var mode = 'freehand'
	
        app.two.canvas.off('mousedown');
        app.two.canvas.on('mousedown', app.two[mode].mousedown);
        app.two.canvas.off('mousemove');
        app.two.canvas.on('mousemove', app.two[mode].mousemove);
        app.two.canvas.off('mouseup');
        app.two.canvas.on('mouseup', app.two[mode].mouseup);
        
        app.three.controls.enableZoom = false;
        app.three.controls.enableRotate = false;
        app.three.controls.enablePan = false;             
    },
    'splines' : function(){
        app.mode = 'splines';
        var mode = 'splines'
	
        app.two.canvas.off('mousedown');
        app.two.canvas.on('mousedown', app.two[mode].mousedown);
        app.two.canvas.off('mousemove');
        app.two.canvas.on('mousemove', app.two[mode].mousemove);
        app.two.canvas.off('mouseup');
        app.two.canvas.on('mouseup', app.two[mode].mouseup);
        
        app.three.controls.enableZoom = false;
        app.three.controls.enableRotate = false;
        app.three.controls.enablePan = false;             
    },
    'straight lines' : function(){
        app.mode = 'polylines';
        var mode = 'polylines'
	
        app.two.canvas.off('mousedown');
        app.two.canvas.on('mousedown', app.two[mode].mousedown);
        app.two.canvas.off('mousemove');
        app.two.canvas.on('mousemove', app.two[mode].mousemove);
        app.two.canvas.off('mouseup');
        app.two.canvas.on('mouseup', app.two[mode].mouseup);
        
        app.three.controls.enableZoom = false;
        app.three.controls.enableRotate = false;
        app.three.controls.enablePan = false;             
    },
    '3d view' : function(){
	app.mode = '3d';

	app.two.clearCanvas();
        app.two.canvas.off('mousedown');
        app.two.canvas.off('mousemove');
        app.two.canvas.off('mouseup');

        app.mode = 'threed';
        var mode = 'threed'
	
        // app.two.canvas.on('mousedown', app.two[mode].mousedown);
	
	console.log(app.scene);
	app.three.controls.enableZoom = true;
	app.three.controls.enableRotate = true;
	app.three.controls.enablePan = true;		
	
    },
    'camera setup' : function(){
	app.mode = 'camera';

	app.two.clearCanvas();
        app.two.canvas.off('mousedown');
        app.two.canvas.off('mousemove');
        app.two.canvas.off('mouseup');

        app.mode = 'camera';
        var mode = 'camera'
	
        app.two.canvas.on('mousedown', app.two[mode].mousedown);
	
	app.three.controls.enableZoom = false;
	app.three.controls.enableRotate = false;
	app.three.controls.enablePan = false;		
	
    },
    'polylines' : function(){
	app.mode = 'polylines';
	var mode = 'polylines'

	app.two.canvas.off('mousedown');
	app.two.canvas.on('mousedown', app.two[mode].mousedown);
	app.two.canvas.off('mousemove');
	app.two.canvas.on('mousemove', app.two[mode].mousemove);
	app.two.canvas.off('mouseup');
	app.two.canvas.on('mouseup', app.two[mode].mouseup);
	
	app.three.controls.enableZoom = false;
	app.three.controls.enableRotate = false;
	app.three.controls.enablePan = false;		
    },
    'edit lines' : function(){
	app.two.editLine()
	app.mode = 'svg';
	var mode = 'svg'

	app.two.canvas.off('mousedown');
	app.two.canvas.on('mousedown', app.two[mode].mousedown);
	app.two.canvas.off('mousemove');
	app.two.canvas.on('mousemove', app.two[mode].mousemove);
	app.two.canvas.off('mouseup');
	app.two.canvas.on('mouseup', app.two[mode].mouseup);

	app.three.controls.enableZoom = false;
	app.three.controls.enableRotate = false;
	app.three.controls.enablePan = false;		
    },
    'vectorize' : function(){
	app.two.vectorize()
    },
    'get image' : function(){
	console.log(app.two.toCanvas())
    },
    'get vector' : function(){
	console.log(app.two.toSVG())
    },
    'paste vector' : function(){
	console.log(app.two.pasteSVG())
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

var setUpDocumentKeyListener = function(){
    document.addEventListener("keydown", e => {
	if (e.key.match(/^[a-z0-9]{1,1}$/i)) {
	    var k = e.key + [ e.ctrlKey, e.metaKey, e.shiftKey ].map(e => { return e ? 1 : 0 }).join('')
	    if(keyBindings[k] && menuActions[keyBindings[k]]) {
		try {
		    menuActions[keyBindings[k]]();
		} catch(e) {
		    console.log('key : ' + k);
		    console.log('binding: ' + keyBindings[k]);
		    console.log(e)
		}
	    } else {
		
	    }
	}
    });
}

var setUpDocumentMenuListener = function(){
    $('a').on('click', function(e){
	console.log('click');
	var v = $(e.target).html().toLowerCase();
	console.log('executing command ' + v);
	if (menuActions[v]) {
	    try {
		console.log('found command ' + v);
		menuActions[v]();
	    } catch(e) {
		console.log(`command  ${v} failed`);
		console.log(e)
	    }
	} else {
	    console.log(`item ${v} is not connected to an action`)
	}
    })
}

$(function(){
    var components = [
	{ component: './navbar.html', destination: '#topmenu' },
	{ component: './cards.html',  destination: '#cards' }
    ];

    Promise
	.all(components.map(e => {
	    return $.get(e.component)
		.then(function(d){
		    return { component: d, destination: e.destination }
		})
	}))
	.then(a => {
	    return a.map(d => {
		// console.log(d.destination);
		$(d.destination).html(d.component)
		return d.destination
	    })
	})
	.then(function(){
	    setUpDocumentKeyListener();
	    setUpDocumentMenuListener();

	    $(document).on('click', 'svg path', function(e){
		e.stopPropagation();
		var svg = SVG.adopt($(e.target).get(0));
		app.two.currentLine = svg;
		console.log(svg);
		svg.drawHandles()
	    })
	    
	})
    

    $('#sidemenu img').on('click', function(e) {
	var v  = $(e.target).data('command')
	if (menuActions[v]) {
	    try {
		menuActions[v]();
		if ($(e.target).hasClass('mode')) {
		    $('#sidemenu img').removeClass('active')
		    $(e.target).toggleClass('active')
		}
	    } catch(e) {
		console.log(e)
	    }
	} else {
	    console.log("item ${v} is not connected to an action")
	}
    })


    $('#cameraSet').click(e => {
	var v = new THREE.Vector3;
	['x', 'y', 'z'].forEach(k => {
	    $('#camera' + k).val()
	    v[k] = parseInt($('#camera' + k.toUpperCase()).val())
	});
	app.three.camera.up = v;
    })
})
