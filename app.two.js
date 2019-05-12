const color = "#000000"
const option = {
    stroke: "#000000",
    'stroke-width': 2,
    'fill-opacity': 0,
};

App.Two = class {
    constructor(app, svgElement){
	this.app = app;
	// console.log(svgElement);

	this.surface = SVG(svgElement.getAttribute('id'))

	
	this.surface.attr('viewBox', [0, 0, svgElement.clientWidth, svgElement.clientHeight].join(' '))
	// console.log(this.canvas.node.outerHTML);
	// console.log(svgElement.clientWidth, svgElement.clientHeight);
	// this.canvas.size(svgElement.clientWidth, svgElement.clientHeight);
	
	// console.log(this.canvas.node);

	this.element = svgElement
	this.canvas = this.surface.group()

	this.canvas.rect(40, 40).move(600, 180)
	this.panZoom = svgPanZoom(this.surface.node,
				  {
				      viewportSelector: this.canvas,
				      haltEventListeners: [],
				      zoomEnabled: false,
				      panEnabled: false,
				      minZoom: 0.001,
				      maxZoom: 1000
				  });
	
	// console.log(this.panZoom);
	// console.log(this.surface.node);
	
	this.shapes = []
	this.index = 0;
	this.app = app;
	this.editIndex = 0;
	this.currentLine;
	this.parser = new DOMParser();
	
	var draw = this;
	
	document.addEventListener('keydown', function(e){
	    if(e.keyCode == 13){
		
		if (app.mode === 'splines') {
		    draw.shapes[draw.index].draw('done');
		    draw.shapes[draw.index].off('drawstart');

		    console.log(draw.shapes[draw.index]);
		    var path = draw.shapes[draw.index].toCatmullRom().attr('fill', 'none');
		    draw.shapes[draw.index].node.remove()
		    app.three.extrusionFromPath(path);
		} 
		else if (app.mode === 'polylines') {
		    draw.shapes[draw.index].draw('done');
		    draw.shapes[draw.index].off('drawstart');
		    app.three.extrusionFromPath(draw.shapes[draw.index]);
		} 
		else if (app.mode === 'svg') {
		    console.log('svg mode enter');
		    console.log(draw.currentLine);
		    app.three.extrusionFromPath(draw.currentLine);
		    draw.currentLine.remove()
		} 
		draw.index++;
	    }
	});
    }

    get splines(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;
	
	return {
	    mousedown: event => {
    		if (app.mode !== 'splines') return;
    		event.stopPropagation();
		if (shapes[draw.index]) {
		    shapes[draw.index].draw('point', event);
		} else {
    		    const shape = draw.canvas.polyline().attr(option);
    		    shapes[draw.index] = shape;
    		    shape.draw(event);
		}
	    },
	    mouseup: event => {},
	    mousemove: event => {},
	}
    }	

    get freehand(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;
	
	return {
	    mousedown: event => {
    		if (app.mode !== 'freehand') return;
    		event.stopPropagation();
    		const shape = draw.canvas.polyline().attr(option);
		// console.log(shape);
		
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
		    // console.log(shapes[draw.index]);
		    var reduced = shapes[draw.index].toCatmullRom();
		    reduced.simplify()
		    reduced.attr('stroke', 'black').attr('stroke-width', 2).attr('fill', 'none')
		    app.three.extrusionFromPath(reduced);
		    shapes[draw.index].remove();
    		    draw.index++;
    		} catch(e) {
    		    console.log(e);
    		}
	    }
	};
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
    		    const shape = draw.canvas.polyline().attr(option);
    		    shapes[draw.index] = shape;
    		    shape.draw(event);
		}
	    },
	    mouseup: event => {},
	    mousemove: event => {},
	}
    }

    get svg(){
	var draw = this;
	var app = this.app;
	var shapes = this.shapes;

	return {
	    mousedown: event => {
    		if (app.mode !== 'svg') return;
    		// if (!event.ctrlKey) return
		console.log('svg click');
		var svg = SVG.adopt($(event.target).get(0));
		console.log(svg);
	    },
	    mouseup: event => {},
	    mousemove: event => {},
	}
    }

}

App.Two.prototype.addNode = function(svg) {
    console.log(svg);
    console.log(this.canvas);
}

App.Two.prototype.makePencil = function() {
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

App.Two.prototype._getIntersectingFace = function(p1, all) {
    var m1 = {};
    var p = {};

    var app = this.app;
    
    var webGLelement = app.three.element;
    var raycaster = app.three.raycaster;

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
    raycaster.setFromCamera( m1, app.three.camera );
    var intersects = raycaster.intersectObjects( [ app.three.mesh ], true );

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


App.Two.prototype.editLine = function(){
    var draw = this;
    var app  = this.app;

    console.log(this.editIndex);
    console.log(app.three.scene.children);
    
    var c = app.three.scene
	.children
	.filter(e => {
	    return e.type == 'Mesh'
		&& e.userData.svg
		&& e.userData.camera
	});

    console.log(c);

    if (c.length) {
	if (draw.editIndex >= c.length) { draw.editIndex = 0 }
	var i = draw.editIndex;
	var camera = JSON.parse(c[i].userData.camera)

	
	var svg = c[i].userData.svg;

	console.log(draw.parser.parseFromString(svg, "image/svg+xml"));
	console.log(draw.canvas);
	
	// svg = svg.replace(/<path /, '<path stroke="DarkRed" fill="none" ');
	
	var loader = new THREE.ObjectLoader();

	app.three.scene.remove(c[i])
	// app.three.animate()

	loader.parse(camera, function(d){
	    draw.clearCanvas()
	    app.three.camera.copy(d);
	    app.three.camera.updateProjectionMatrix();

	    var s = draw.canvas.svg(svg);
	    draw.addNode(svg);
	    
	    console.log(svg);
	    console.log(s);
	    // console.log(app.three.camera);

	    draw.editIndex++;
	})
    }
}

App.Two.prototype.clearCanvas = function(){
    var n = this.canvas.node;
    while (n.firstChild) { n.removeChild(n.firstChild) }
}


App.Two.prototype.unproject = function(vector3d) {
    var app = this.app;

    var v = vector3d.clone();

    v.project( app.three.camera );

    // map to 2D screen space
    v.x = Math.round( (   v.x + 1 ) * app.three.element.offsetWidth  / 2 );
    v.y = Math.round( ( - v.y + 1 ) * app.three.element.offsetHeight / 2 );
    v.z = 0;
    return v;
}


App.Two.prototype.drawCatmullRom = function (data,alpha) {
    var draw = this;
    var app = this.app;

    console.log(data);
    
    var element = this.canvas.path()
	.fromPoints(data)
	.attr('stroke', 'DarkRed')
	.attr('fill', 'none')
    return element;
}

App.Two.prototype.zoom = function(z){
    z = z ? z : this.app.three.camera.zoom / this.app.three.zoomBase;
    // console.log(this.app.three.zoomBase);
    // console.log(this.app.three.camera.zoom);
    this.panZoom.zoom(this.app.three.camera.zoom / this.app.three.zoomBase);
}

App.Two.prototype.pan = function(d){
    // console.log('this.app.three.panBase');
    // console.log(this.app.three.panBase);
    // console.log('this.app.three.camera.position');
    // var p = this.app.three.camera.position.clone();
    // var d = p.sub(this.app.three.panBase);
    // console.log(d);
    this.panZoom.panBy(d);
}
