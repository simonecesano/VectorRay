self.importScripts( './three.min.js' );
// self.importScripts( './cube.js' );

var loader = new THREE.ObjectLoader();
var scene;

function loadObject(json) {
    return new Promise((resolve) => {
	const loader = new THREE.ObjectLoader();
	loader.parse(json, resolve);
    });
} 

async function scene_init(e) {
    scene = await loadObject(e.data.scene);
}

var intersect = function(e) {
    var raycaster = new THREE.Raycaster();
    scene.updateMatrixWorld();

    console.log(scene.children);
    
    scene.children
	.filter(e => e.geometry )    
	.forEach(e => {
	    console.log(e.geometry.uuid);
	    e.geometry.computeBoundingBox()
	    e.geometry.computeBoundingSphere()
	})

    // console.log(e.data.origins);
    // console.log(e.data.directions);
    
    var intersects = e.data.origins.map((o, j) => {
	raycaster.set(
	    new THREE.Vector3(...e.data.origins[j]), 
	    new THREE.Vector3(...e.data.directions[j])
	);
	
	return raycaster.intersectObjects(scene.children, true)
	    .map(function(p){ return {
		distance: p.distance,
		point: p.point,
		faceIndex: p.faceIndex,
		face: p.face
	    } })
    })

    console.log(intersects);
    
    postMessage({
	points: intersects,
	camera: e.data.camera,
	svg: e.data.svg,
	id: e.data.id,
	length: e.data.length
    });
}

var intersect_other = function(e) {
    (new Promise(function(resolve, reject) {
	loader.parse(
	    e.data.scene,
	    function ( obj ) {
		resolve( obj );
	    })
    })).then(scene => {
	console.log(scene);
	var raycaster = new THREE.Raycaster();
	
	var intersects = e.data.origins.map((o, j) => {
	    raycaster.set(
		new THREE.Vector3(...e.data.origins[j]), 
		new THREE.Vector3(...e.data.directions[j])
	    );
	    
	    var i = raycaster.intersectObjects(scene.children, true); // .map(e => e.point );
	    console.log('intersects in worker');
	    console.log(i);
	    return i.length ? i[0] : null;
	})
	console.log(intersects);
    })
    
}

const handlers = {
    init: scene_init,
    intersect: intersect
}

self.onmessage = function(e) {
    // console.log(e.data.action);
    const fn = handlers[e.data.action];
    console.log(e.data.action);
    fn(e);
}
