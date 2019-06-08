// mouse              control
// move up down click zoom rotate pan 

var setMode = function(app, settings) {
    console.log(app);
    ['mousedown', 'mousemove', 'mouseup', 'click']
	.forEach((m, i) => {
	    app.two.surface.off(m);
	    if (settings[i] && app.two[app.mode][m]) {
		app.two.surface.on(m, app.two[app.mode][m]);
	    }
	})

    console.log(app.three.controls);
    ['enableZoom', 'enableRotate', 'enablePan']
	.forEach((e, i) => {
	    console.log(app.three.controls[e]);
	    app.three.controls[e] = settings[i+4];
	})
}

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
	app.three.camera.updateProjectionMatrix();
    },
    'bottom' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.rotation.z = 90 * Math.PI / 180
	app.three.camera.position.set(c.x, -100, c.z)
	app.three.camera.updateProjectionMatrix();
    },
    'front' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.position.set(c.x, c.y, -100)
	app.three.camera.updateProjectionMatrix();
    },
    'back' : function(){
	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.position.set(c.x, c.y, 100)
	app.three.camera.updateProjectionMatrix();
    },
    'zoom to fit' : function(){
	app.three.zoomToFit(0.9)
	app.three.camera.updateProjectionMatrix();
    },
    'freehand' : function(){
        app.mode = 'freehand';
	setMode(app, [true, true, true, false, false, false, false])
    },
    'splines' : function(){
        app.mode = 'splines';
	setMode(app, [true, true, true, false, false, false, false])
    },
    'straight lines' : function(){
        app.mode = 'polylines';
	setMode(app, [true, true, true, false, false, false, false])
    },
    '3d view' : function(){
	app.mode = '3d';
	setMode(app, [false, false, false, false, true, true, true])

	app.two.clearCanvas();
    },
    'select' : function(){
	app.mode = 'none';

	var c = app.three.meshCenter()
	app.three.camera.lookAt(c)
	app.three.camera.lookAt(0, 0, 0)
	app.three.camera.position.set(-100, 0, 0)
	app.three.camera.updateProjectionMatrix();

	setMode(app, [true, true, true, true, true, false, true])
    },

    'polylines' : function(){
	app.mode = 'polylines';
	setMode(app, [true, true, true, false, false, false, false])
    },
    'edit splines' : function(){
	app.mode = 'svg';
	setMode(app, [true, true, true, true, true, false, true])
    },
    'edit splines zoom' : function(){
	app.mode = 'svgzoom';
	setMode(app, [true, true, true, true, true, false, true])
    },
    'distort geometry' : function(){
	app.mode = 'svgzoom';
	setMode(app, [true, true, true, true, true, false, false])
    },
    'get handles' : function(){
	app.mode = 'morph';
	setMode(app, [true, true, true, true, true, false, false])
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

    'camera setup' : function(){
	app.mode = 'camera';

	app.two.clearCanvas();
        app.two.surface.off('mousedown');
        app.two.surface.off('mousemove');
        app.two.surface.off('mouseup');
	
	app.three.controls.enableZoom = false;
	app.three.controls.enableRotate = false;
	app.three.controls.enablePan = false;		
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
	    console.log( `item ${v} is not connected to an action` )
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
		$(d.destination).append(d.component)
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
	console.log(v);
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
