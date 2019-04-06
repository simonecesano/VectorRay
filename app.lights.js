App.prototype.addShadowedLight = function ( x, y, z, color, intensity ) {
	
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
