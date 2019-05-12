//---------------------------------------------------------------
// Catmull-Rom fitting algorithm from 
// https://gist.github.com/nicholaswmin/c2661eb11cad5671d816
//---------------------------------------------------------------
// data is an array of { x: 0, y: 0 } objects 

var catmullRomFitting = function (points, alpha) {
    alpha = alpha ? alpha : 1;
    // points = polyline.array().value.map(p => { return { x: p[0], y: p[1] } });

    if (alpha == 0 || alpha === undefined) {
	return false;
    } else {
	var p0, p1, p2, p3, bp1, bp2, d1, d2, d3, A, B, N, M;
	var d3powA, d2powA, d3pow2A, d2pow2A, d1pow2A, d1powA;
	var d = Math.round(points[0].x) + ',' + Math.round(points[0].y) + ' ';
	var length = points.length;
	for (var i = 0; i < length - 1; i++) {
	    
	    p0 = i == 0 ? points[0] : points[i - 1];
	    p1 = points[i];
	    p2 = points[i + 1];
	    p3 = i + 2 < length ? points[i + 2] : p2;
	    
	    d1 = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
	    d2 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
	    d3 = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
	    
	    // Catmull-Rom to Cubic Bezier conversion matrix
	    
	    // A = 2d1^2a + 3d1^a * d2^a + d3^2a
	    // B = 2d3^2a + 3d3^a * d2^a + d2^2a
	    
	    // [   0             1            0          0          ]
	    // [   -d2^2a /N     A/N          d1^2a /N   0          ]
	    // [   0             d3^2a /M     B/M        -d2^2a /M  ]
	    // [   0             0            1          0          ]
	    
	    d3powA = Math.pow(d3, alpha);
	    d3pow2A = Math.pow(d3, 2 * alpha);
	    d2powA = Math.pow(d2, alpha);
	    d2pow2A = Math.pow(d2, 2 * alpha);
	    d1powA = Math.pow(d1, alpha);
	    d1pow2A = Math.pow(d1, 2 * alpha);
	    
	    A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A;
	    B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;
	    N = 3 * d1powA * (d1powA + d2powA);
	    if (N > 0) {
		N = 1 / N;
	    }
	    M = 3 * d3powA * (d3powA + d2powA);
	    if (M > 0) {
		M = 1 / M;
	    }
	    
	    bp1 = { x: (-d2pow2A * p0.x + A * p1.x + d1pow2A * p2.x) * N,
		    y: (-d2pow2A * p0.y + A * p1.y + d1pow2A * p2.y) * N };
	    
	    bp2 = { x: (d3pow2A * p1.x + B * p2.x - d2pow2A * p3.x) * M,
		    y: (d3pow2A * p1.y + B * p2.y - d2pow2A * p3.y) * M };
	    
	    if (bp1.x == 0 && bp1.y == 0) {
		bp1 = p1;
	    }
	    if (bp2.x == 0 && bp2.y == 0) {
		bp2 = p2;
	    }
	    
	    d += 'C' + bp1.x + ',' + bp1.y + ' ' + bp2.x + ',' + bp2.y + ' ' + p2.x + ',' + p2.y + ' ';
	}
	
	return ('M' + d).replace(/\s+$/, "");
    }
};

function drawHandleLines(group, b, seg, id) {
    var pts = b.curves[seg].points;
    var lines = [
	group.put(new SVG.Line).plot(pts[0].x, pts[0].y, pts[1].x, pts[1].y),
	group.put(new SVG.Line).plot(pts[3].x, pts[3].y, pts[2].x, pts[2].y)
    ];
    
    lines.forEach((l, i) => {
	l.stroke({ width: 1 });
	l.attr('data-segment', seg)
	l.attr('data-bezier', id)
	l.attr('data-line', i)
    })
}

// var onDragStart = function(e){}
// var onDragMove = function(e){}

function drawHandlePoints(group, b, seg, id) {
    var pts = b.curves[seg].points;

    var dots = pts.map((p, i) => {
	var c = group.circle(6);
	c.attr({ cx: p.x, cy: p.y }).style({ fill: "red" })
	if (true) {
	    c.draggable()
	    c.on('dragmove.namespace', onDragMove)
	    c.on('dragstart.namespace', onDragStart)
	}
	return c;
    });
    dots.forEach((d, i) => {
	d.attr('data-line', (i < 2 ? 0 : 1))
	d.attr('data-bezier', id)
	d.attr('data-segment', seg)
	d.attr('data-cp', i)
    })
}


function onDragStart(e){
    var bezier = SVG.get(e.target.getAttribute('data-bezier'));
    startX = e.detail.p.x; startY = e.detail.p.y;
    console.clear()
    console.log('drag start');
}

function onDragMove(e){
    var line_id   = e.target.getAttribute('data-line');
    var bezier_id = e.target.getAttribute('data-bezier');
    var seg = parseInt(e.target.getAttribute('data-segment'));
    var pt  = parseInt(e.target.getAttribute('data-cp'));

    var bezier = SVG.get(bezier_id);

    moveControlPoint(bezier, seg, pt, e.detail.p.x, e.detail.p.y);
    moveHandleLines(bezier, seg, pt, e.detail.p.x, e.detail.p.y);
    
    if (pt === 3) {
	moveControlPoint(bezier, seg + 1, 0, e.detail.p.x, e.detail.p.y)
	moveHandleLines(bezier, seg + 1, 0, e.detail.p.x, e.detail.p.y);
	moveControlDot(bezier, seg + 1, 0, e.detail.p.x, e.detail.p.y);
    }
    if (pt === 0) {
	moveControlPoint(bezier, seg - 1, 3, e.detail.p.x, e.detail.p.y)
	moveHandleLines(bezier, seg - 1, 3, e.detail.p.x, e.detail.p.y);
	moveControlDot(bezier, seg - 1, 3, e.detail.p.x, e.detail.p.y);
    }
}

function moveHandleLines(bezier, seg, pt, x, y) {
    var bez = Bezier.SVGtoBeziers(bezier.attr('d'));
    if (seg >= bez.curves.length || seg < 0) { return }

    var line_nr    = pt < 2 ? 0 : 1;
    var bezier_id = bezier.attr('id');
    var selector  = `line[data-line="${line_nr}"][data-bezier="${bezier_id}"][data-segment="${seg}"]`;

    var line = SVG.adopt(document.querySelector(selector));
    
    if (pt !== 0 && pt !== 3) {	     
	line.attr('x2', x); line.attr('y2', y)
    } else {
	line.attr('x1', x); line.attr('y1', y)
    }
}

function moveControlDot(bezier, seg, pt, x, y) {
    var line_nr    = pt < 2 ? 0 : 1;
    var bezier_id = bezier.attr('id');
    var selector  = `circle[data-cp="${pt}"][data-bezier="${bezier_id}"][data-segment="${seg}"]`;
    var circle = SVG.adopt(document.querySelector(selector));
    circle.attr('cx', x)
    circle.attr('cy', y)
}

function moveControlPoint(bezier, seg, pt, x, y) {
    var bez = Bezier.SVGtoBeziers(bezier.attr('d'));
    
    if (seg >= bez.curves.length || seg < 0) { return }
    
    bez.curves[seg].points[pt].x = x;
    bez.curves[seg].points[pt].y = y;
    
    var d = bez.curves.map(c => c.toSVG()).join(' ');
    bezier.attr('d', d)
}


(function (svg_js) {
    'use strict';
    
    svg_js.extend(svg_js.Polyline, {
	toCatmullRom: function(alpha){
	    var points = this.array().value.map(p => { return { x: p[0], y: p[1] } });
	    var d = catmullRomFitting(points, alpha)
	    var r = this.parent().put(new SVG.Path).plot(d);
	    return r
	},
	toBezier: function(){
	    
	},
	simplify: function(tolerance){
	    tolerance = tolerance ? tolerance : 10;
	    var path = simplify(this.array().value, tolerance)
	    this.plot(path);
	    return this;
	},
	smooth: function(){
	    var path = smooth(this.array().value)
	    this.plot(path);
	    return this;
	},
    });

    svg_js.extend(svg_js.Path, {
	toBezier: function(){
	    return Bezier.SVGtoBeziers(this.attr('d'))
	},
	drawHandles: function(){
	    var g = this.parent().put(new SVG.G());
	    var b = this.toBezier();
	    var t = this;
	    b.curves.forEach((c, i) => {
		drawHandleLines(g, b, i, t.attr('id'))
		drawHandlePoints(g, b, i, t.attr('id'))
	    })
	},
	fromPoints: function(points, alpha){
	    var d = catmullRomFitting(points, alpha)
	    return this.plot(d);
	}
    });
    svg_js.extend(svg_js.Path, {
	toPaper: function(){
	    if (!paper.project) { paper.setup() }
	    var p = new paper.Path(this.attr('d'))
	    // console.log(p);
	    return p;
	},
	simplify: function() {
	    var p = this.toPaper();
	    p['simplify']();
	    this.plot(p.exportSVG().getAttribute('d'))
	},
	smooth: function() {
	    var p = this.toPaper();
	    p.smooth();
	    this.plot(p.exportSVG().getAttribute('d'))
	}
    })
}(SVG));
