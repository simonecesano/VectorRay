AppDraw.prototype.getImageData = function(x, y, width, height) {
    var gl = this.app.renderer.domElement.getContext("webgl", { preserveDrawingBuffer: true })

    var s = 4.2;
    
    x = x ? (x * s) | 0 : 0;
    y = y ? (y * s) | 0 : 0;

    width =  width  ? (width * s)  | 0 : gl.drawingBufferWidth;
    height = height ? (height * s) | 0 : gl.drawingBufferHeight;

    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    var imageData = new ImageData(Uint8ClampedArray.from(pixels), width, height);
    return imageData;
}



AppDraw.prototype.toImage = function(){
    var gl = this.app.renderer.domElement; 
    console.log(gl);

    var win = window.open(gl.toDataURL(), '_blank');
    win.focus();
}

AppDraw.prototype.toSVG = function(){
    var gl = this.app.renderer.domElement; 
    var svg = this.app.$2D.element.firstElementChild.cloneNode(true);

    console.log(gl.width);
    
    var image = document.createElement('image');

    image.setAttribute('width', gl.width / 2)
    image.setAttribute('height', gl.height / 2)
    image.setAttribute('xlink:href', gl.toDataURL())

    svg.setAttribute('viewBox', [0, 0, gl.width / 2, gl.height / 2].join(' '));
    svg.prepend(image);

    const blob = new Blob([svg.outerHTML], {type: 'image/svg+xml'});
    saveAs(blob, 'vector.svg');
}

var event = new Event('paste');

AppDraw.prototype.pasteSVG = function(){
    console.log('here');
    var e = jQuery.Event("keydown");
    var fake = $.extend({}, e, {which: 86, ctrlKey: true});
    $("#webGL").trigger(fake);
    e.clipboardData.getData('text/plain')
}

window.addEventListener("paste", function(e){
    console.log(e.clipboardData.getData('text/plain'));
});

$('*').on('pasteText', function (ev, data){
  console.log("text: " + data.text);
});
