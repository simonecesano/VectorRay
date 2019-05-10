const App = class {
    constructor(webGLElement, svgElement){
	this.three = new App.Three(this, webGLElement);
	this.two = new App.Two(this, svgElement);
	this.ui  = new App.UI(this, webGLElement, svgElement);
	var db = new Dexie("vectorray");

	db.version(1).stores({
		    	objects: 'name,obj',
		    	colors:  'name,rgba',
		    	textures: 'name,base64'
		    });
	this.db = db;
    }
}

App.UI = class {
    constructor(app, webGLElement, svgElement){
	this.app = app;

	;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
	    app.three.element.addEventListener(n, this.preventDefault, false);
	    app.two.element.addEventListener(n, this.preventDefault, false);
	    document.body.addEventListener(n, this.preventDefault, false)
	})
	
	app.three.element.addEventListener('drop', this.handleDrop3D, false)
	app.two.element.addEventListener('drop', this.handleDrop3D, false)
    }

    preventDefault(e){ e.preventDefault(); e.stopPropagation() }

    get handleDrop3D(){
	var app = this.app;
	return function(e){
	    let dt = e.dataTransfer
	    let files = dt.files
	    let file = files[0];
	    // console.log(e.target);
	    app.three.load(file)
	}
    }
}
