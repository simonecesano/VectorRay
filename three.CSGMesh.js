import CSG from "./CSGMesh.js";

THREE.Mesh.prototype.csg = function(op, mesh){
    this.updateMatrix()                                     
    mesh.updateMatrix()
    this.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingBox();
    
    console.log(this.geometry)
    console.log(mesh.geometry)
    
    var bspA = CSG.fromMesh( this );
    var bspB = CSG.fromMesh( mesh );
    var bspC = bspA[op]( bspB );

    console.log(bspA);
    console.log(bspB);
    console.log(bspC);
    
    var result = CSG.toMesh( bspC, this.matrix );

    var geometry = result.geometry;

    console.log(geometry);
    
    result = this.clone()
    // result.geometry.fromGeometry(geometry)
    result.geometry = geometry
    result.geometry.verticesNeedUpdate;
    
    // console.log(JSON.stringify(result.geometry.boundingBox));
    // console.log(result);
    return result;
}

THREE.Mesh.prototype.union = function(mesh){ return this.csg('union', mesh) }

THREE.Mesh.prototype.subtract = function(mesh){ return this.csg('subtract', mesh) }

THREE.Mesh.prototype.intersect = function(mesh){ return this.csg('intersect', mesh) }
