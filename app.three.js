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
    constructor(app, webGLElement){
	this.app = app;

	const canvasEl = (('OffscreenCanvas' in window) && false) ?
	      webGLElement.querySelector('canvas').transferControlToOffscreen()
	      : webGLElement.querySelector('canvas');

	// const worker = new Worker('worker.js');
	// worker.postMessage({ canvas: canvasEl }, [canvasEl]);

	console.log(canvasEl);
	// console.log(('OffscreenCanvas' in window))

	canvasEl.style = { width: webGLElement.clientWidth, height: webGLElement.clientHeight }

	// const renderer = new THREE.WebGLRenderer({ canvas: canvas });

	this.scene    = new THREE.Scene();

	this.renderer = new THREE.WebGLRenderer( { canvas: canvasEl, antialias: true, alpha: true, preserveDrawingBuffer: true } );

	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setClearColor( 0x000000, 0 )
	this.renderer.setSize( webGLElement.clientWidth, webGLElement.clientHeight );

	
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
    	var f = function animate() { requestAnimationFrame( animate ); app.controls.update(); app.render() }
    	return f
    }
}

App.Three.prototype.load = function(file){
    console.log('loading');
    console.log(file);

    var three = this;

    console.log(this);
    
    var material = three.defaultMaterial;
    var reader = new FileReader();
    
    reader.onload = function(e, clearmeshes, callback) {
	var geometry, face;

	console.log(e);
	var obj = e.target.result;

	console.log(obj.length);

	var geometry = three.loader.parse(obj)
	geometry.traverse(function(child) {
	    if (child instanceof THREE.Mesh) {
		child.geometry.computeBoundingBox();
		child.geometry.computeBoundingSphere();
		child.material = material.clone()
	    } });
	
	geometry.scale.set( 100, 100, 100 );

	three.mesh = geometry;
	var t = three.meshCenter();
	
	
	geometry.translateX(-t.x);
	geometry.translateY(-t.y);
	geometry.translateZ(-t.z);

	
	three.scene.add( three.mesh );

	three.zoomToFit();
	
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
    var three = this;
    var v = vector.clone();
    v.project( camera );

    // map to 2D screen space
    v.x = Math.round( (   v.x + 1 ) * three.element.offsetWidth  / 2 );
    v.y = Math.round( ( - v.y + 1 ) * three.element.offsetHeight / 2 );
    v.z = 0;
    return v;
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

App.Three.prototype.extrusionFromPath = function(shape){
    var draw = this;
    var app = this.app;
    var camera = app.three.camera;

    var matrix = shape.node.getCTM()
    
    var totLen = shape.node.getTotalLength();
    var segsPerSec = 0.2;
    var duration = totLen * (1 / segsPerSec);

    var startTime = new Date();
    
    console.log('start ' + (new Date()));
    console.log('line length ' + shape.node.getTotalLength());

    var p = [];
    for ( let i = 0; i < shape.node.getTotalLength(); i += 2) {
	var k = shape.node
	    .getPointAtLength(i)
	    .matrixTransform(matrix)
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
	var pencil = this.pencil;
	var curve = new THREE.CatmullRomCurve3(intersections);

	var extrudeSettings = {
	    steps: shape.node.getTotalLength() * 2,
	    bevelEnabled: false,
	    extrudePath: curve
	};
	
	var geometry = new THREE.ExtrudeGeometry( pencil, extrudeSettings );
	geometry.computeFaceNormals();
	geometry.computeBoundingSphere();
	
	var color = new THREE.Color("rgb(0, 0, 0)");
	var material = new THREE.MeshBasicMaterial( { color: color } );
	var mesh = new THREE.Mesh( geometry, material ) ;

	mesh.name = 'VectorRayLine_' + Math.floor(Math.random() * 100)
	mesh.userData.svg    = shape.node.outerHTML;
	mesh.userData.camera = JSON.stringify(camera);
	app.three.scene.add( mesh );
	
	shape.remove()
	return mesh
    }).then(e => {
	// console.log(e);
	var endTime = new Date();

	console.log('drawn ' + (new Date()));
	console.log("total time " + (endTime.getTime() - startTime.getTime()));
	console.log("segments per sec " + (totLen / (endTime.getTime() - startTime.getTime())));
    }).catch(e => {
	console.log(e)
    })
}


App.Three.prototype.getIntersectingFace = function(p1, all) {
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

App.Three.prototype.vectorize = function(distanceTolerance, catmullRomFactor) {
    var app = this.app;
    var draw = app.two;
    var c = this.meshLines();


    
    distanceTolerance = distanceTolerance || 0.7;
    
    c.forEach(e => {
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
	    	app.two.canvas.circle(10).fill('#8B0000').attr({ cx: v2.x, cy: v2.y, 'data-distance': d, class: 'vectorize' })
	    } else {
	    	app.two.canvas.circle(10).fill('#FF8C00').attr({ cx: v2.x, cy: v2.y, 'data-distance': d, class: 'vectorize' })
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
