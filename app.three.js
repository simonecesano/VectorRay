var intersectionWorker = new Worker( './intersectionWorker.js' )


var getNormalizedPoint = function(e) {
    var r = e.target.getBoundingClientRect();
    
    var p = {}, m = {};
    
    p.x = e.clientX - r.x;
    p.y = e.clientY - r.y;
    
    m.x =     (p.x) / e.target.clientWidth  * 2 - 1;
    m.y = 1 - (p.y) / e.target.clientHeight * 2;

    return m;
}

var getNormalizedSVGPoint = function(p, svg) {
    var m = {};
    
    m.x =     (p.x) / svg.clientWidth  * 2 - 1;
    m.y = 1 - (p.y) / svg.clientHeight * 2;
    
    return m;
}

var makePencil = function(t) {
    var shape = new THREE.Shape();
    shape.moveTo( 0, t );
    shape.quadraticCurveTo(  t,  t,  t,  0 );
    shape.quadraticCurveTo(  t, -t, 0,  -t );
    shape.quadraticCurveTo( -t, -t, -t,  0 );
    shape.quadraticCurveTo( -t,  t,  0,  t );
    return shape;
}


App.Three = class {
    constructor(app, webGLElement, opts){
	this.app = app;

	// console.log(Object.getPrototypeOf(webGLElement));
	// console.log(webGLElement.constructor.name === "HTMLCanvasElement");

	var size;
	if (webGLElement.constructor.name === "HTMLCanvasElement") {
	    size = {
		width: webGLElement.parentNode.clientWidth,
		height: webGLElement.parentNode.clientHeight
	    }
	    webGLElement.style = {
		width: webGLElement.parentNode.clientWidth,
		height: webGLElement.parentNode.clientHeight
	    }
	} else {
	    size = {
		width: opts.width,
		height: opts.width
	    }
	    webGLElement.style = { width: opts.width, height: opts.height }
	}

	this.scene    = new THREE.Scene();

	this.renderer = new THREE.WebGLRenderer( { canvas: webGLElement, antialias: true, alpha: true, preserveDrawingBuffer: true } );

	// console.log(this.renderer.constructor.name);
	
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setClearColor( 0x000000, 0 )
	this.renderer.setSize( size.width, size.height );
	
	// webGLElement.appendChild( this.renderer.domElement );

	this.defaultMaterial = new THREE.MeshPhongMaterial( {
	    color: 0xcccccc,
	    specular: 0x111111,
	    shininess: 20,
	    polygonOffset: true,
	    polygonOffsetFactor: 0, // positive value pushes polygon further away
	    polygonOffsetUnits: 1
	} );

	this.element = webGLElement;
	this.aspect  = (webGLElement.clientWidth / webGLElement.clientHeight);

	this.raycaster = new THREE.Raycaster();
	this.loader = new THREE.OBJLoader();

	this.pencil = makePencil(0.1);

    }


    
    render() { this.renderer.render( this.scene, this.camera ) }
    
    get bbox(){ return new THREE.Box3().setFromObject(this.mesh) }
    
    get bsphere(){
	this.mesh.geometry.computeBoundingSphere()
	return this.mesh.geometry.boundingSphere
    }
    
    get animate() {
    	var app = this;
	
    	var f = function animate() {
	    if ( self.requestAnimationFrame ) {
		self.requestAnimationFrame( animate );
	    }
	    app.controls.update();
	    app.render()
	}
    	return f
    }
}

App.Three.prototype.loadObj = function(obj) {
    var three = this;
    var geometry = three.loader.parse(obj)
    var material = three.defaultMaterial;

    geometry.traverse(function(child) {
	if (child instanceof THREE.Mesh) {
	    child.geometry.computeBoundingBox();
	    // child.geometry.computeBoundingSphere();
	    child.material = material.clone()
	} });
    
    geometry.scale.set( 100, 100, 100 );
    
    three.mesh = geometry;
    var t = three.meshCenter();
    
    console.log(t);
    geometry.translateX(-t.x)
    geometry.translateY(-t.y)
    geometry.translateZ(-t.z);
    
    three.scene.add( three.mesh );
    
    three.zoomToFit();
    return three.mesh;
}

App.Three.prototype.getObjfromCache = function() {

}

App.Three.prototype.putObjinCache = function(obj, name) {

}


App.Three.prototype.load = function(file){
    console.log('loading');
    // console.log(file);

    var three = this;

    // console.log(this);
    
    var material = three.defaultMaterial;
    var reader = new FileReader();
    
    reader.onload = function(e, clearmeshes, callback) {
	var geometry, face;
	var obj = e.target.result;

	three.loadObj(obj);

	three.app.db.objects
	    .put({name: 'obj', obj: three.mesh.toJSON() })
	    .then(e => {
		return three.app.db.objects.get('obj')
	    })
	    .then(e => {
		console.log('done');
	    }).catch(function(error) {
		alert ("Ooops: " + error);
	    });
	
	intersectionWorker.postMessage({
	    type: 'init',
	    scene: three.scene.toJSON(),
	})
    }
    reader.readAsBinaryString(file);
};

App.Three.prototype.addShadowedLight = function ( x, y, z, color, intensity ) {
	
    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    
    directionalLight.castShadow = true;
    
    var d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;
    
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    
    directionalLight.shadow.bias = -0.002;
    
    this.scene.add(directionalLight)
}

App.Three.prototype.project3Dto2D = function(vector, camera){
    camera = camera ? camera : this.camera;

    var three = this;
    var v = vector.clone();
    v.project( camera );

    // map to 2D screen space

    v.x = Math.round( (   v.x + 1 ) * three.element.offsetWidth  / 2 );
    v.y = Math.round( ( - v.y + 1 ) * three.element.offsetHeight / 2 );
    v.z = 0;
    return v;
}

App.Three.prototype.project3DtoSVG = function(vector, camera){
    camera = camera ? camera : this.camera;
    
    const p = this.project3Dto2D(vector, camera);
    var m = this.app.two.canvas.node.getCTM()
    var s = this.app.two.surface.node.createSVGPoint()
    s.x = p.x; s.y = p.y;
    s = s.matrixTransform(m.inverse())
    return s;
}

App.Three.prototype.getCorners = function() {
    var bbox = this.bbox;
    return [
	new THREE.Vector3( bbox.min.x, bbox.min.y, bbox.min.z ), // 000
	new THREE.Vector3( bbox.min.x, bbox.min.y, bbox.max.z ), // 001
	new THREE.Vector3( bbox.min.x, bbox.max.y, bbox.min.z ), // 010
	new THREE.Vector3( bbox.min.x, bbox.max.y, bbox.max.z ), // 011
	new THREE.Vector3( bbox.max.x, bbox.min.y, bbox.min.z ), // 100
	new THREE.Vector3( bbox.max.x, bbox.min.y, bbox.max.z ), // 101
	new THREE.Vector3( bbox.max.x, bbox.max.y, bbox.min.z ), // 110
	new THREE.Vector3( bbox.max.x, bbox.max.y, bbox.max.z )  // 111
    ];
}

App.Three.prototype.getBoundingSphere = function() {
    var points = this.getCorners();
    return (new THREE.Sphere()).setFromPoints(points)
}


App.Three.prototype.bbox2D = function(){
    var three = this;
    if (!three.camera) { throw("camera is not defined") }
    
    var p = three.getCorners()
	.map(e => {
	    return three.project3Dto2D(e, three.camera);
	})
    return {
	min: {
	    x: Math.min.apply(null, p.map(e => { return e.x })),
	    y: Math.min.apply(null, p.map(e => { return e.y }))
	},
	max: {
	    x: Math.max.apply(null, p.map(e => { return e.x })),
	    y: Math.max.apply(null, p.map(e => { return e.y }))
	}
    }
}

App.Three.prototype.zoomToFit = function(f){
    if (true) {
	// this only works for orthographic cameras
	if (f) {
	    
	} else {
	    f = 1;
	}
	
	var b = this.bbox2D();
	var z = this.camera.zoom * Math.min(this.element.offsetWidth / (b.max.x - b.min.x),
					    this.element.offsetHeight / (b.max.y - b.min.y)) - 1;

	this.camera.zoom = z * f;
	this.zoomBase = this.camera.zoom;
	this.panBase = this.camera.position.clone();
	// this.app.two.panZoom.zoom(this.camera.zoom);
	
	this.camera.updateProjectionMatrix();
    } else {
    }
}

App.Three.prototype.meshCenter = function(){
    var app = this;
    
    var x = app.bbox.min.x + (app.bbox.max.x - app.bbox.min.x) / 2
    var y = app.bbox.min.y + (app.bbox.max.y - app.bbox.min.y) / 2
    var z = app.bbox.min.z + (app.bbox.max.z - app.bbox.min.z) / 2
    return new THREE.Vector3( x, y, z );
}

App.Three.prototype.centerObject = function(){
    three = this;
    var t = three.meshCenter();
    
    
    three.mesh.translateX(-t.x);
    three.mesh.translateY(-t.y);
    three.mesh.translateZ(-t.z);
}

App.Three.prototype.makeExtrusionFromPoints = function(intersections, length, svg, camera) {
    var pencil = this.pencil;
    
    var curve = new THREE.CatmullRomCurve3(intersections);
    
    var extrudeSettings = {
	steps: Math.floor(length / 2),
	bevelEnabled: false,
	extrudePath: curve
    };
    
    var geometry = new THREE.ExtrudeGeometry( pencil, extrudeSettings );
    
    var color = new THREE.Color("rgb(0, 0, 0)");
    var material = new THREE.MeshBasicMaterial( { color: color } );
    var mesh = new THREE.Mesh( geometry, material ) ;

    mesh.name = 'VectorRayLine_' + Math.floor(Math.random() * 100)
    mesh.userData.svg    = svg;
    mesh.userData.camera = JSON.stringify(camera);
    
    this.scene.add( mesh );

    return mesh
}

App.Three.prototype.makeExtrusionFromPointsPromise = function(intersections, length, svg, camera) {
    var three = this
    return (new Promise(function(resolve, reject) {
	resolve(three.makeExtrusionFromPoints(intersections, length, svg, camera))
    }))
}

App.Three.prototype.extrusionFromPath = function(shape){
    var draw = this;
    var app = this.app;
    var camera = app.three.camera;

    var matrix = shape.node.getCTM()
    
    var totLen = shape.node.getTotalLength();
    var segsPerSec = 0.2;
    var duration = totLen * (1 / segsPerSec);

    var startTime = new Date();
    
    var p = [];
    for ( let i = 0; i < shape.node.getTotalLength(); i += 2) {
	var k = shape.node
	    .getPointAtLength(i)
	    .matrixTransform(matrix)
	p.push(k);
    }

    var rays = p.map(e => {
	var n = draw.getNormalizedCoords(e);
	draw.raycaster.setFromCamera( n, app.three.camera );
	return draw.raycaster.ray.clone();
    })

    intersectionWorker.postMessage({
    	action:     'intersect',
    	svg:        shape.node.outerHTML,
	id:         shape.attr('id'),
    	length:     shape.node.getTotalLength(),
    	camera:     camera.toJSON(),
    	origins:    rays.map(r => r.origin.toArray() ),
    	directions: rays.map(r => r.direction.toArray())
    })
    console.log('start ' + (new Date()));
}

App.Three.prototype.getNormalizedCoords = function(p1) {
    var m1 = {};
    var p = {};

    // console.log(p1.constructor == SVGPoint);
    // console.log(p1.hasOwnProperty('originalEvent'))

    var app = this.app;
    
    var webGLelement = app.three.element;

    if (typeof p1.clientX !== 'undefined') {
	var r = webGLelement.getBoundingClientRect()
	p.x = p1.clientX - r.x
	p.y = p1.clientY - r.y
    } else {
	p.x = p1.x
	p.y = p1.y
    }
    
    m1.x =     (p.x) / webGLelement.clientWidth  * 2 - 1;
    m1.y = 1 - (p.y) / webGLelement.clientHeight * 2;
    return m1;
}

App.Three.prototype.getIntersectingFaceGPU = function(p1, list, all) {
    p1 = arguments[0];

    this.gpuPicker.setScene(this.scene);
    this.gpuPicker.setCamera(this.camera);

    
    all = Array.isArray(list) ? arguments[2] : arguments[1];
    list = Array.isArray(list) ? arguments[1] : this.scene.children;
    
    var m1 = this.getNormalizedCoords(p1);
    // console.log(p1, m1, all, list)
    var raycaster = this.raycaster;

    raycaster.setFromCamera( m1, this.camera );

    var intersect = this.gpuPicker.pick(m1, raycaster);

    console.log(intersect);
    
}

App.Three.prototype.getIntersectingFace = function(p1, list, all) {
    p1 = arguments[0];

    all = Array.isArray(list) ? arguments[2] : arguments[1];
    list = Array.isArray(list) ? arguments[1] : this.scene.children;
    
    var m1 = this.getNormalizedCoords(p1);
    // console.log(p1, m1, all, list)
    var raycaster = this.raycaster;

    raycaster.setFromCamera( m1, this.camera );
    
    var intersects = raycaster.intersectObjects( list, true );
    
    if (intersects.length) {
	return all ? intersects : intersects[0] 
    } else {
	return all ? [] : undefined;
    }
}


// this is probably causing a mess now
App.Three.prototype.vectorizeAll = function(distanceTolerance, catmullRomFactor){

}

App.Three.prototype.vectorize = function(lines, distanceTolerance, catmullRomFactor) {
    var app = this.app;
    var draw = app.two;

    // console.log(lines);
    
    distanceTolerance = distanceTolerance || 0.7;
    
    lines.forEach(e => {

	var p = e.geometry.parameters.options.extrudePath;
	var l = p.getLength();
	var s = 0.5 * 1 / l;
	var points = []; for (i = 0; i <= 1; i += s) { points.push(i) }; points.push(1)

	const raycaster = new THREE.Raycaster();
	const camera = app.three.camera
	var v = new THREE.Vector3();

	
	points = points
	    .map(e => {
		var r = { point3D: p.getPointAt(e) }
		r.pointDistance = camera.position.distanceTo(r.point3D);
		var v3 = r.point3D.clone();
		
		v3.sub(camera.position).normalize();
		raycaster.set(camera.position, v3);

		const intersections = raycaster.intersectObjects(app.three.scene.children, true);
		r.intersectionDistance = intersections[0].distance;
		return r;
	    })
	    .map(r => {
		var v3 = r.point3D
		r.point2D = draw.unproject(v3, true);
		return r
	    })

	
	
	points.forEach(r => {
	    var v2 = r.point2D
	    var d = Math.abs(r.pointDistance - r.intersectionDistance);
	    if (d <= distanceTolerance) {
	    	// app.two.canvas.circle(10).fill('#8B0000').attr({ cx: v2.x, cy: v2.y, 'data-distance': d, class: 'vectorize' })
	    } else {
	    	// app.two.canvas.circle(10).fill('#FF8C00').attr({ cx: v2.x, cy: v2.y, 'data-distance': d, class: 'vectorize' })
	    }
	})

	if (points.length) {
	    draw.drawCatmullRom(points.map(e => { return e.point2D }), 0.5)
		.simplify()
	}
    });
}

App.Three.prototype.meshLines = function(){
    var draw = this;
    var app  = this.app;

    // console.log(this.editIndex);
    
    var c = app.three.scene
	.children
	.filter(e => {
	    return e.type == 'Mesh'
		&& e.userData.svg
		&& e.userData.camera
	});

    return c;
}
