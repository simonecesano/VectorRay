const color = "#000000"
const option = {
    stroke: "#000000",
    'stroke-width': 2,
    'fill-opacity': 0,
};

class AppDraw {
    constructor(app){
	this.shapes = []
	this.index = 0;
	this.app = app;
	this.editIndex = 0;
	
	var draw = this;

	document.addEventListener('keydown', function(e){
	    if(e.keyCode == 13){
		draw.shapes[draw.index].draw('done');
		draw.shapes[draw.index].off('drawstart');
		
		if (app.mode === 'splines') {
		    var points = Array.from(draw.shapes[draw.index].node.points).map(e => { return [e.x, e.y ] });
		    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		    var attribute = SVGCatmullRomSpline.toPath(points);
		    path.setAttributeNS(null, 'd', attribute);
		    draw.shapes[draw.index].node.remove()
		    draw.shapeToCatmullFreehand(path);
		} 
		else if (app.mode === 'polylines') {
		    draw.shapeToCatmullFreehand(draw.shapes[draw.index].node);
		} 
		draw.index++;
	    }
	});
    }

    get freehand(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;
	return {
	    mousedown: event => {
    		if (app.mode !== 'freehand') return;
    		event.stopPropagation();
    		const shape = app.canvas.polyline().attr(option);
		console.log(shape);
		
		shape.on('drawstart', function(e){ });
		
    		shapes[draw.index] = shape;
    		shape.draw(event);
	    },
	    mousemove: event => {
    		if (app.mode !== 'freehand') return;
    		// if (!p.ctrlKey) return
    		if (!shapes[draw.index]) return;
    		shapes[draw.index].draw('point', event);
	    },
	    mouseup: event => {
    		if (app.mode !== 'freehand') return;
    		try {
    		    shapes[draw.index].draw('stop', event);
    		    draw.shapeToCatmullFreehand(shapes[draw.index].node, 2);
    		    draw.index++;
    		} catch(e) {
    		    console.log(e);
    		}
	    }
	};
    }
    

    get splines(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;
	
	return {
	    mousedown: event => {
    		if (app.mode !== 'splines') return;
    		// if (!event.ctrlKey) return
    		event.stopPropagation();
		if (shapes[draw.index]) {
		    shapes[draw.index].draw('point', event);
		} else {
    		    const shape = app.canvas.polyline().attr(option);
    		    shapes[draw.index] = shape;
    		    shape.draw(event);
		}
	    },
	    mouseup: event => {},
	    mousemove: event => {},
	}
    }	
    get polylines(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;

	return {
	    mousedown: event => {
    		if (app.mode !== 'polylines') return;
    		// if (!event.ctrlKey) return
    		event.stopPropagation();
		if (shapes[draw.index]) {
		    shapes[draw.index].draw('point', event);
		} else {
    		    const shape = app.canvas.polyline().attr(option);
    		    shapes[draw.index] = shape;
    		    shape.draw(event);
		}
	    },
	    mouseup: event => {},
	    mousemove: event => {},
	}
    }

    
}


AppDraw.prototype.makePencil = function() {
    var shape = new THREE.Shape();

    var thickness = 0.1;
    var t = thickness / 2;

    // shape.moveTo( -t,-t );
    // shape.lineTo( t, -t );
    // shape.lineTo( t, t );
    // shape.lineTo( -t, t );
    // shape.lineTo( -t, -t );
    
    var shape = new THREE.Shape();
    shape.moveTo( 0, thickness );
    shape.quadraticCurveTo( thickness, thickness, thickness, 0 );
    shape.quadraticCurveTo( thickness, -thickness, 0, -thickness );
    shape.quadraticCurveTo( -thickness, -thickness, -thickness, 0 );
    shape.quadraticCurveTo( -thickness, thickness, 0, thickness );
    
    return shape;
}

AppDraw.prototype.shapeToCatmullFreehand = function(shape, density){
    var draw = this;
    var app = this.app;
    var camera = app.camera;

    // var id = makeId(32);
    // shape.setAttribute('id', id);

    var totLen = shape.getTotalLength();
    var segsPerSec = 0.2;
    var duration = totLen * (1 / segsPerSec);

    console.log(duration);
    
    var startTime = new Date();
    
    console.log('start ' + (new Date()));
    console.log('line length ' + shape.getTotalLength());
    
    var p = [];
    for ( i = 0; i < shape.getTotalLength(); i += 2) {
	var k = shape.getPointAtLength(i);
	p.push(k);
    }
    
    console.log('start ' + (new Date()));
    Promise.all(p.map(e => {
	return (new Promise(function(resolve, reject){
	    resolve(draw.getIntersectingFace(e))
	}))
    })).then( e => {
	return e.filter(e => {
	    return e.faceIndex
	}).map(e => {
	    return e.point;
	})
    }).then( intersections => {
	var pencil = draw.makePencil()
	var curve = new THREE.CatmullRomCurve3(intersections);
	var extrudeSettings = {
	    steps: shape.getTotalLength() * 2,
	    bevelEnabled: false,
	    extrudePath: curve
	};


	
	var geometry = new THREE.ExtrudeGeometry( pencil, extrudeSettings );
	
	var color = new THREE.Color("rgb(0, 0, 0)");
	var material = new THREE.MeshBasicMaterial( { color: color } );
	var mesh = new THREE.Mesh( geometry, material ) ;

	// console.log(geometry.parameters);
	
	mesh.userData.svg = shape.outerHTML;
	mesh.userData.camera = JSON.stringify(camera);
	// mesh.userData.curve  = JSON.stringify(curve);

	app.scene.add( mesh );
	
	shape.remove()
	return mesh
    }).then(e => {
	console.log(e);
	var endTime = new Date();

	console.log('drawn ' + (new Date()));
	console.log("total time " + (endTime.getTime() - startTime.getTime()));
	console.log("segments per sec " + (totLen / (endTime.getTime() - startTime.getTime())));
    }).catch(e => {
	console.log(e)
    })
}

AppDraw.prototype.getIntersectingFace = function(p1, all) {
    var m1 = {};
    var p = {};

    var app = this.app;
    
    var webGLelement = app.$3D.element;
    var raycaster = app.$3D.raycaster;

    if (typeof p1.clientX !== 'undefined') {
	var r = webGLelement.getBoundingClientRect()
	p.x = p1.clientX - r.x
	p.y = p1.clientY - r.y
    } else {
	p.x = p1.x
	p.y = p1.y
    }
    
    m1.x =     (p.x) / $(webGLelement).width()  * 2 - 1;
    m1.y = 1 - (p.y) / $(webGLelement).height() * 2;

    // console.log('webGLelement width' + $(webGLelement).width());
    
    raycaster.setFromCamera( m1, app.camera );

    // console.log(app.scene.children);
    
    var intersects = raycaster.intersectObjects( app.scene.children, true );

    if (intersects.length) {
	if (all) {
	    return intersects;
	} else {
	    return intersects[0];
	}
    } else {
	return false
    }
}

AppDraw.prototype.meshLines = function(){
    var draw = this;
    var app  = this.app;

    console.log(this.editIndex);
    
    var c = app.scene
	.children
	.filter(e => {
	    return e.type == 'Mesh'
		&& e.userData.svg
		&& e.userData.camera
	});

    return c;
}

AppDraw.prototype.editLine = function(){
    var draw = this;
    var app  = this.app;

    console.log(this.editIndex);
    var c = app.scene
	.children
	.filter(e => {
	    return e.type == 'Mesh'
		&& e.userData.svg
		&& e.userData.camera
	});

    if (c.length) {
	if (draw.editIndex >= c.length) {
	    draw.editIndex = 0;
	}
	var i = draw.editIndex;
	var camera = JSON.parse(c[i].userData.camera)
	var svg = c[i].userData.svg.replace(/<path /, '<path stroke="DarkRed" fill="none" ');

	var loader = new THREE.ObjectLoader();

	loader.parse(camera, function(d){
	    draw.clearCanvas()
	    app.camera.copy(d);
	    app.camera.updateProjectionMatrix();
	    var s = app.canvas.svg(svg);
	    draw.editIndex++;
	})
    }
}

AppDraw.prototype.clearCanvas = function(){
    var n = this.app.canvas.node;
    while (n.firstChild) { n.removeChild(n.firstChild) }
}


AppDraw.prototype.unproject = function(vector3d) {
    var app = this.app;

    var v = vector3d.clone();

    v.project( app.camera );

    // map to 2D screen space
    v.x = Math.round( (   v.x + 1 ) * app.$3D.element.offsetWidth  / 2 );
    v.y = Math.round( ( - v.y + 1 ) * app.$3D.element.offsetHeight / 2 );
    v.z = 0;
    return v;
}
