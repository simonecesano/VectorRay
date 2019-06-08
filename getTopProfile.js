function getPointsAtCoords (curve, matrix, grid) {
    var grid = grid ? grid : 10;
    var len = curve.getTotalLength()

    var a = {};

    for (var p = 0; p < len; p += 0.1) {
	var c = curve.getPointAtLength(p).matrixTransform(matrix)
	var x = Math.floor(c.x / grid);
	a[x] = !a[x] ? [] : a[x];
	a[x].push(c.y);
    }
    
    var points = {};

    Object.keys(a).map( e => {
	const sum = a[e].reduce((p, a) => p + a,0); 
	points[e] = { x: grid * parseFloat(e), y: sum / a[e].length };
    });
    
    return points;
}

function getProfile(geometry, samplingAxis, pAxis, samples, boundaries){
    samples = samples ? samples : 100;

    geometry.computeBoundingBox();

    var b = geometry.boundingBox;
    
    var len = b.max[samplingAxis] - b.min[samplingAxis];
    var min = b.min[samplingAxis];

    var profile = Array.apply(null, {length: 1 + samples})
	.map(e => { return {
	    min: +Infinity,     // b.max[pAxis],
	    max: -Infinity,     // b.min[pAxis],
	    vertices: []
	} })


    var vertices = boundaries ?
	geometry.vertices.filter(v => {
	    var p = v[pAxis];
	    return p >= boundaries[0] && p <= boundaries[1]
	})
	:
	geometry.vertices;

    vertices.forEach(v => {
	var d = Math.floor((v[samplingAxis] - min) / len * samples);
	var p = v[pAxis];
	profile[d].min = profile[d].min > p ? p : profile[d].min;
	profile[d].max = profile[d].max < p ? p : profile[d].max;
	profile[d].vertices.push(v);
    })

    profile = profile.filter(e => { return e.min < Infinity && e.max > -Infinity })

    return profile.map((e, i) => {
	var vMin = new THREE.Vector3, vMax = new THREE.Vector3;
	
	vMin[samplingAxis] = len * i / samples + min;
	vMin[pAxis] = e.min;

	vMax[samplingAxis] = len * i / samples + min;
	vMax[pAxis] = e.max;

	e.min = vMin;
	e.max = vMax
	return e;
    });
}

var createSphere = function(r, col, center) {
    var geometry = new THREE.SphereGeometry( r, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: col} );
    var h = new THREE.Mesh( geometry, material );
    h.position.set(center.x, center.y, center.z);
    return h;
}

var facesAbsolute = function(geometry, matrix) {
    var faces = geometry.faces;
    var vertices = geometry.vertices;

    console.log(geometry);
    
    return faces.map(f => {
	return [
	    new THREE.Line3(vertices[f.a], vertices[f.b]),
	    new THREE.Line3(vertices[f.a], vertices[f.c]),
	    new THREE.Line3(vertices[f.b], vertices[f.c])
	]
    })
}

$.get('./convex_hull.html', function(card){
    console.log($('#cards').append(card));

    $('#section').on('click', e => {
	app.three.mesh.children.forEach((e, i) => {
	    var geometry = new THREE.Geometry().fromBufferGeometry( e.geometry );
	    geometry.computeBoundingBox()
	    var bbox = geometry.boundingBox;
	    var bbox = new THREE.Box3().setFromObject(e)

	    var len = bbox.max.z - bbox.min.z
	    console.log(bbox);

	    // var bbox = new THREE.Box3().setFromObject(e)
	    console.log(len);
	    var step = len / 50;

	    var material = new THREE.MeshBasicMaterial( { color: 0xaa7700, side: THREE.DoubleSide, visible: true, opacity: 1} );
	    var plane = new THREE.Mesh( new THREE.PlaneGeometry( 10, 15, 32 ), material );

	    console.log(geometry);
	    console.log(geometry.vertices.length)
	    
	    // app.three.scene.add(plane);

	    var faces = facesAbsolute(geometry);

	    var vertices = geometry.vertices.map(v => { return v.clone().applyMatrix4(e.matrixWorld) });
	    
	    var matrix = (new THREE.Matrix4()).getInverse(e.matrixWorld);
	    var output = new THREE.Geometry();

	    var preCloud = [];
	    
	    for (var z = bbox.min.z; z <= bbox.max.z; z += step) {
		var sectPlane = (new THREE.Plane( new THREE.Vector3(0, 0, 1), z)).applyMatrix4(matrix)

		var cloud = []; // vertices.filter(e => { return e.z >= z && e.z <= z + step })
		// var cloud = vertices.filter(e => { return e.z >= z && e.z <= z + step })

		// console.log(cloud.length);

		faces.forEach(f => {
		    f.forEach(l => {
			var t = new THREE.Vector3()
			var i = sectPlane.intersectLine(l, t);
			if (i) { cloud.push(i.applyMatrix4(e.matrixWorld)) }
		    });
		})
		
		console.log(cloud.length);

		
		try {
		    var hull = new THREE.ConvexGeometry( [ prevCloud, cloud ].flat() );

		    var curve = new THREE.CatmullRomCurve3( cloud );
		    curve.closed = true; 
		    console.log(curve);
		    output.merge(hull)

		    // var points = curve.getPoints( 200 );
		    // var geometry = new THREE.BufferGeometry().setFromPoints( points );
		    // var material = new THREE.LineBasicMaterial( { color : 0x333333 } );
		    // var curveObject = new THREE.Line( geometry, material );
		    // app.three.scene.add(curveObject);
		} catch(e){
		    console.log(e);
		    console.log(cloud);
		};
		prevCloud = cloud;
		// 
	    }
	    output.applyMatrix(matrix)


	    var modifier = new THREE.SubdivisionModifier( 2 );


	    // var smooth = modifier.modify( output );

	    e.geometry = output;
	    e.geometry.verticesNeedUpdate = true;
	    console.log(e.geometry.vertices.length)
	    e.material = app.three.defaultMaterial.clone()
	})
    })
    
    $('#slice').on('click', e => {
	app.three.mesh.children.forEach((e, i) => {
	    var geometry = new THREE.Geometry().fromBufferGeometry( e.geometry );
	    geometry.computeBoundingBox()
	    var bbox = geometry.boundingBox;
	    var len = bbox.max.z - bbox.min.z

	    var detail = 400;
	    var startZ = bbox.min.z;
	    var step = len / detail;
	    var output = new THREE.Geometry();
	    
	    for (var l = 0; l < detail; l++) {
		var cloud = geometry.vertices.filter(e => {
		    return e.z >= startZ && e.z <= startZ + step;
		})
		var hull = new THREE.ConvexGeometry( cloud );
		output.merge(hull)
		startZ = startZ + step;
	    }

	    var simplifyModifier = new THREE.SimplifyModifier();

	    console.log(output.vertices.length);
	    console.log(output);
	    
	    // 


	    
	    output = (new THREE.BufferGeometry()).fromGeometry(output);
	    output = simplifyModifier.modify( output, 400);

	    output.computeVertexNormals();
	    output.computeFaceNormals();
	    // e.geometry.fromGeometry(output)
	    // var f = new THREE.Geometry()
	    // f.fromBufferGeometry(output)

	    console.log(output);
	    // output.mergeVertices()

	    // console.log(f);
	    
	    // e.geometry.fromBufferGeometry(output)
	    e.geometry = output;
	    e.material = app.three.defaultMaterial.clone()
	})
    })

    
    $('#melt').on('click', e => {
	app.three.mesh.children.forEach((e, i) => {
	    var geometry = new THREE.Geometry().fromBufferGeometry( e.geometry );
	    geometry.vertices.forEach(v => { v.y = v.y * (0.95 + 0.05 * Math.random()) });
	    
	    e.geometry.fromGeometry(geometry)
	})
    })

    
    $('#csg').on('click', e => {

	console.log(app.three.mesh.children.map( c => c.geometry ));

	if (true) {
	    var geometry = new THREE.BoxGeometry( 0.1, 1, 0.1 );
	    var material = app.three.defaultMaterial.clone();
	    material.color.setHex( 0x004400 );
	    var cube = new THREE.Mesh( geometry, material );

	    var union = cube.intersect(app.three.mesh.children[0]);

	    app.three.mesh.children[0].geometry = union.geometry;
	    app.three.mesh.children[0].geometry.verticesNeedUpdate = true;
	    app.three.mesh.children[0].geometry.elementsNeedUpdate = true
	    // app.three.scene.add( cube );
	}
	
	if (false) {
	    var geometry = new THREE.BoxGeometry( 0.01, 0.1, 0.01 );
	    var material = app.three.defaultMaterial.clone();
	    material.color.setHex( 0x004400 );

	    console.log((new THREE.Matrix4()).getInverse(app.three.mesh.children[0].matrixWorld));
	    
	    var cube = new THREE.Mesh( geometry, material );
	    app.three.mesh.add(cube);
	    
	    var m = (new THREE.Matrix4()).getInverse(app.three.mesh.children[0].matrixWorld);
	    console.log(m);
	    
	    // cube.geometry.applyMatrix(m);
	    
	    var shoeBSP = new ThreeBSP(new THREE.Geometry().fromBufferGeometry( app.three.mesh.children[0].geometry) );
	    console.log(shoeBSP);
	    var cubeBSP = new ThreeBSP(cube.geometry);
	    console.log(cubeBSP);

	    var subtractBSP = shoeBSP.subtract(cubeBSP);
	    console.log(subtractBSP);
	    console.log(subtractBSP.toGeometry());

	    app.three.mesh.children[0].geometry = subtractBSP.toGeometry();
	    app.three.mesh.children[0].geometry.verticesNeedUpdate = true;
	}
	
	if (false) {
	    var material = new THREE.MeshStandardMaterial({color:  0x00ff00, roughness: 1 });
	    var geometry = new THREE.BoxGeometry( 10, 10, 10 );
	    var cube = new THREE.Mesh( geometry, material );
	    
	    cube.position.set(-20, 0, 0);
	    app.three.scene.add(cube);
	    
	    var geometry = new THREE.SphereGeometry( 6, 32, 32 );
	    var sphere = new THREE.Mesh( geometry, material );
	    app.three.scene.add(sphere);
	    
	    sphere.position.set(-15, 0, 0);
	    console.log(sphere.scale);
	    sphere.scale.set(1.2, 1.2, 1.2);
	    
	    var union = cube.intersect(sphere);
	    union.position.set(-20, 0, 0);
	    app.three.scene.add(union);
	    
	    var union = cube.subtract(sphere);
	    union.position.set(+20, 0, 0);
	    app.three.scene.add(union);
	}
    })
    
    $('#simplify').on('click', e => {
	var simplifyModifier = new THREE.SimplifyModifier();
	var subDivModifier = new THREE.SubdivisionModifier( 2 );
	
	app.three.mesh.children.forEach((e, i) => {
	    e.geometry.computeBoundingBox()
	    e.updateMatrixWorld();
	    
	    var geometry = e.geometry.isBufferGeometry ?
		new THREE.Geometry().fromBufferGeometry( e.geometry ) :
		e.geometry
	    ;
	    var simplified = e.clone()
	    // var material = new THREE.MeshBasicMaterial( { color: 0x000088 } );
	    simplified.material = app.three.defaultMaterial;

	    var v = geometry.vertices.length;
	    simplified.geometry = simplifyModifier.modify( e.geometry, Math.floor(v / 100) );

	    console.log(e.geometry)

	    // e.geometry.computeBoundingBox()

	    
	    // simplified.geometry = subDivModifier.modify(simplified.geometry)

	    // console.log(new THREE.Geometry().fromBufferGeometry( simplified.geometry).vertices.length);
	    console.log(simplified.geometry)
	    console.time('Beginning to subdivide')
	    simplified.geometry = subDivModifier.modify(simplified.geometry)
	    console.timeEnd('Beginning to subdivide')
	    // console.log(new THREE.Geometry().fromBufferGeometry( simplified.geometry).vertices.length);
	    
	    // app.three.mesh.add(simplified)
	    // app.three.scene.remove(e)
	    app.three.mesh.remove(e)
	    app.three.mesh.add(simplified)
	    
	    console.log(simplified.geometry)
	    console.log('done');
	})
    })
				
    $('#create_convex_hull').on('click', e => {
	app.three.mesh.children.forEach(e => {
	    e.geometry.computeBoundingBox()
	    e.updateMatrixWorld();
	    
	    var geometry = e.geometry.isBufferGeometry ?
		new THREE.Geometry().fromBufferGeometry( e.geometry ) :
		e.geometry;
	    
	    geometry.computeBoundingBox()
	    var bbox = geometry.boundingBox
	    // console.log(bbox);

	    geometry.vertices.forEach(v => {
		// v.applyMatrix4 (e.matrixWorld);
	    });
	    
	    var mesh = new THREE.ConvexGeometry( geometry.vertices );

	    var material = new THREE.MeshBasicMaterial( { color: 'skyblue' } );
	    var h = new THREE.Mesh( mesh, material );
	    // app.three.scene.remove(app.three.mesh.children[0]);
	    console.log(app.three.scene.children);
	    h.geometry.computeBoundingBox()
	    app.three.mesh.add(h)
	})
    })
    
    $('#change_profile').on('click', e => {
	app.three.mesh.children.forEach(e => {
	    e.geometry.computeBoundingBox()
	    console.log(e.geometry.type);
	    var bGeometry =
		e.geometry.type === 'Geometry' ?
		e.geometry.clone() : 
		new THREE.Geometry().fromBufferGeometry( e.geometry );
	    
	    bGeometry.computeBoundingBox()
	    
	    var profile = getProfile(bGeometry, 'z', 'y', 40)

	    var hullCurve = app.two.canvas.node.getRootNode().getElementById('hullcurve');
	    var worldInverse = new THREE.Matrix4();
	    var worldMatrix  = e.matrixWorld;

	    worldInverse.getInverse(e.matrixWorld);
	    
	    if (hullCurve) {
		var geometry = new THREE.PlaneGeometry( 100, 100, 32 );
		var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide, visible: true, opacity: 0.5} );
		var plane = new THREE.Mesh( geometry, material );

		var axis = new THREE.Vector3(); axis['y'] = 1;
		plane.rotateOnAxis(axis, Math.PI / 2);
		
		app.three.scene.add(plane);
		app.three.render();

		var refPoints = getPointsAtCoords(hullCurve, app.two.canvas.node.getCTM(), 1);

		var m = app.two.canvas.node.getCTM()

		profile.map(i => i).forEach((p, i, a) => {
		    var c = p.max.clone()
		    c.applyMatrix4( worldMatrix );

		    var s = app.three.project3DtoSVG(c);
		    var r = refPoints[Math.floor(s.x)];

		    if (r) {
			var svgPoint = app.two.createSVGPoint(r);
	    		var i = app.three.getIntersectingFace(app.two.createSVGPoint(r).matrixTransform(m), [ plane ], false);
			if (i) {
			    var s = i.point;

			    c.applyMatrix4( worldInverse );
			    s.applyMatrix4( worldInverse );
			    var ratio = (s.y / c.y);

			    p.vertices.forEach(v => { v.y = v.y * ratio });
			}
		    }
		});

		if (e.geometry.type === "Geometry") {
		    e.geometry = bGeometry;
		} else {
		    e.geometry.fromGeometry(bGeometry)
		}
		
		e.geometry.verticesNeedUpdate = true;
		app.three.scene.remove(plane);
		
		app.three.render();

		hullCurve.remove()
	    }
	})
    })
})

