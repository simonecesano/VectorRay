class App {
    constructor(webGLElement, svgElement){	
	this.router   = new Navigo(null, true, '#');
	this.scene    = new THREE.Scene();

	this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setClearColor( 0x000000, 0 )
	this.renderer.setSize( webGLElement.clientWidth, webGLElement.clientHeight );
	webGLElement.appendChild( this.renderer.domElement );
	
	this.canvas   = SVG(svgElement.getAttribute('id'));

	this.defaultMaterial = new THREE.MeshPhongMaterial( {
	    color: 0xcccccc,
	    specular: 0x111111,
	    shininess: 20,
	    polygonOffset: true,
	    polygonOffsetFactor: 0, // positive value pushes polygon further away
	    polygonOffsetUnits: 1
	} );

	this.draw = new AppDraw(this);
	
	var manager = new THREE.LoadingManager();
	manager.onLoad  = function () { console.log( 'Loading complete!') };
	manager.onError = function () { console.log( 'There was an error loading') };
	
	this.loader   = new THREE.OBJLoader(manager);

	this.camera = undefined;
	this.controls;
	
	this.$3D = {
	    raycaster: new THREE.Raycaster(),
	    element:   webGLElement,
	    aspect:    (webGLElement.clientWidth / webGLElement.clientHeight)
	};

	this.$2D = { element: svgElement }

	var app = this;

	function preventDefault (e){ e.preventDefault(); e.stopPropagation() };

	;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
	    this.$3D.element.addEventListener(n, preventDefault, false);
	    this.$2D.element.addEventListener(n, preventDefault, false);
	    document.body.addEventListener(n, preventDefault, false)
	})
	
	this.$3D.element.addEventListener('drop', app.handleDrop, false)
	this.$2D.element.addEventListener('drop', app.handleDrop, false)

	var db = new Dexie("vectorbeam");
	db.version(1).stores({
		    	objects: 'name,obj',
		    	colors:  'name,rgba',
		    	textures: 'name,base64'
		    });
	this.db = db;
	
	return this;
    };

    render() { this.renderer.render( this.scene, this.camera ) }

    load(obj, material, add){
	var geometry = app.loader.parse(obj)

	geometry.traverse(function(child) {
	    if (child instanceof THREE.Mesh) {
		child.geometry.computeBoundingBox();
		child.geometry.computeBoundingSphere();
		child.material = material.clone()
	    } });
	
	geometry.scale.set( 100, 100, 100 );
	
	app.mesh = geometry;
	var t = app.meshCenter();
	
	geometry.translateX(-t.x);
	geometry.translateY(-t.y);
	geometry.translateZ(-t.z);
	
	var box = new THREE.Box3();
	box.setFromCenterAndSize( app.meshCenter(), app.meshSize() );
	
	var helper = new THREE.Box3Helper( box, 0xff0000 );

	if (!add) {
	    app.scene.children.filter(e => {
		return e.type.match(/group|mesh/i)
	    }).forEach(e => {
		console.log(e.type, e.id);
		app.scene.remove(e);
	    });
	}
	
	app.scene.add( app.mesh );
    }
    
    get bbox(){
	return new THREE.Box3().setFromObject(this.mesh);
    }

    get bsphere(){
	this.mesh.geometry.computeBoundingSphere()
	return this.mesh.geometry.boundingSphere
    }

    
    get animate() {
    	var app = this;
    	var f = function animate() { requestAnimationFrame( animate ); app.controls.update(); app.render() }
    	return f
    }
    
    get handleDrop(){
	var app = this;
	return function(e){
	    let dt = e.dataTransfer
	    let files = dt.files
	    var reader = new FileReader();
	    
	    var material = app.defaultMaterial;


	    reader.onload = function(e, clearmeshes, callback) {
		var geometry, face;
		try {
		    var obj = e.target.result;

		    app.load(obj, material);
		    
		    console.log(app.mesh);
		    console.log(app.bbox);

		    console.log(app.camera.near);
		    console.log(app.camera.far);
		    console.log(app.camera.position);
		    var r = app.getBoundingSphere().radius;

		    console.log(r);
		    
		    app.camera.position.set( 4000, 4000, 4000 );
		    app.camera.updateProjectionMatrix();

		    console.log(app.camera.position);

		    // console.log(app.getBoundingSphere());

		    app.db.objects
			.put({name: 'test', obj: obj })
			.then(e => {
			    return app.db.objects.get('test')
			})
			.then(e => {
			    console.log(e.obj.length);
			}).catch(function(error) {
			    alert ("Ooops: " + error);
			});
		    
		} catch(e) {
		    console.log(e);
		};
	    }
	    reader.readAsBinaryString(files[0]);
	};
    }
};

App.prototype.zoomToFit = function(f){
    if (true) {
	// this only works for orthographic cameras
	if (f) {
	    
	} else {
	    f = 1;
	}
	
	var b = app.bbox2D();
	var z = app.camera.zoom * Math.min(app.$3D.element.offsetWidth / (b.max.x - b.min.x),
					   app.$3D.element.offsetHeight / (b.max.y - b.min.y)) - 1;

	app.camera.zoom = z * f;
	app.camera.updateProjectionMatrix();
    } else {
    }
}

App.prototype.meshCenter = function(){
    var app = this;
    
    var x = app.bbox.min.x + (app.bbox.max.x - app.bbox.min.x) / 2
    var y = app.bbox.min.y + (app.bbox.max.y - app.bbox.min.y) / 2
    var z = app.bbox.min.z + (app.bbox.max.z - app.bbox.min.z) / 2
    return new THREE.Vector3( x, y, z );
}

App.prototype.meshSize = function(){
    var app = this;

    var x = (app.bbox.max.x - app.bbox.min.x)
    var y = (app.bbox.max.y - app.bbox.min.y)
    var z = (app.bbox.max.z - app.bbox.min.z)
    return new THREE.Vector3( x, y, z );
}

App.prototype.getCorners = function() {
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

App.prototype.getBoundingSphere = function() {
    var points = this.getCorners();
    return (new THREE.Sphere()).setFromPoints(points)
}


App.prototype.bbox2D = function(){
    var app = this;
    var p = app.getCorners()
	.map(e => {
	    return app.project3Dto2D(e, app.camera);
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

// newZoom = canvasSize / (objectScreenSize / oldZoom)

App.prototype.fitsInWindow = function(margin){
    var app = this;
    margin = margin ? margin : 0;
    var canvas = {
	    x: app.$3D.element.offsetWidth,
	    y: app.$3D.element.offsetHeight
    }
    var box = app.bbox2D()

    return box.min.x > margin
	&& box.min.y > margin
	&& box.max.x < (canvas.x - margin)
	&& box.max.y < (canvas.y - margin)
}

App.prototype.project3Dto2D = function(vector, camera){
    var app = this;
    var v = vector.clone();
    v.project( camera );

    // map to 2D screen space
    v.x = Math.round( (   v.x + 1 ) * app.$3D.element.offsetWidth  / 2 );
    v.y = Math.round( ( - v.y + 1 ) * app.$3D.element.offsetHeight / 2 );
    v.z = 0;
    return v;
}

App.prototype.getRenderedImage = function(x, y, width, height){
    var gl = this.renderer.domElement.getContext("webgl")

    var s = 4.2;
    
    x = x ? (x * s) | 0 : 0;
    y = y ? (y * s) | 0 : 0;

    width =  width  ? (width * s)  | 0 : gl.drawingBufferWidth;
    height = height ? (height * s) | 0 : gl.drawingBufferHeight;

    // console.log(x, y, width, height);
    
    // gl.viewport(x, y, width, height);
    // gl.scissor(x, y, width, height);

    // var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    var pixels = new Uint8Array(width * height * 4);
    // console.log(pixels.length);
    
    // gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // pixels = pixels.reverse();

    // var imageData = new ImageData(Uint8ClampedArray.from(pixels), gl.drawingBufferWidth, gl.drawingBufferHeight);
    var imageData = new ImageData(Uint8ClampedArray.from(pixels), width, height);
    return imageData;
}



class App3D {}
