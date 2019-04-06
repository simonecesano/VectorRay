// https://gist.github.com/nicholaswmin/c2661eb11cad5671d816

AppDraw.prototype.catmullRomFitting = function (data,alpha) {
    if (alpha == 0 || alpha === undefined) {
      return false;
    } else {
      var p0, p1, p2, p3, bp1, bp2, d1, d2, d3, A, B, N, M;
      var d3powA, d2powA, d3pow2A, d2pow2A, d1pow2A, d1powA;
      var d = Math.round(data[0].x) + ',' + Math.round(data[0].y) + ' ';
      var length = data.length;
      for (var i = 0; i < length - 1; i++) {

        p0 = i == 0 ? data[0] : data[i - 1];
        p1 = data[i];
        p2 = data[i + 1];
        p3 = i + 2 < length ? data[i + 2] : p2;

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

      return d;
    }
};

AppDraw.prototype.drawCatmullRom = function (data,alpha) {
    var draw = this;
    var app = this.app;
    var d = draw.catmullRomFitting(data, alpha);
    var element = app.canvas.path()
	.attr('stroke', 'DarkRed')
	.attr('fill', 'none')
	.attr('d', 'M' + d);

    return d;
}
