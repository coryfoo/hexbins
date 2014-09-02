var HexBinOverlay = function (url, useStatusData) {
  this.url = url;
  this.mode = 'count';
  this.useStatusData = useStatusData;
  this.appendQueryStart = url.indexOf('?') < 0;
};

HexBinOverlay.prototype = new google.maps.OverlayView();

HexBinOverlay.prototype.onAdd = function () {
  google.maps.event.addListener(map, 'dragend', this.draw.bind(this));
  google.maps.event.addListener(map, 'zoom_changed', clearBins.bind(null, this));

  NProgress.configure({ parent: '#map' });
};

HexBinOverlay.prototype.onRemove = function () {
  clearBins(this);
};

HexBinOverlay.prototype.draw = function () {
  if (this.drawDelay) {
    console.debug('cancelling timer');
    clearTimeout(this.drawDelay);
  }

  this.drawDelay = setTimeout(loadDataForBounds.bind(null, this), 600);
};

HexBinOverlay.prototype.setMode = function(mode) {
  this.mode = mode;
  handleHexbinData(this, this.data);
};

HexBinOverlay.prototype.setFilters = function(filters) {
  this.filters = filters;
  this.draw();
};

HexBinOverlay.prototype.setExcludeFilters = function(filters) {
  this.excludeFilters = filters;
  this.draw();
};

function clearBins(overlay) {
  overlay.svg && overlay.svg.remove();
}

function loadDataForBounds(overlay) {
  clearBins(overlay);
  var params = {
    zoom: overlay.getMap().getZoom(),
    bounds: JSON.parse(overlay.getMap().getBounds()
        .toString()
        .replace(/"/g, '')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']')),
    filters: overlay.filters || [],
    exclude: overlay.excludeFilters || {}
  };

  var args = [];
  for (var k in params) {
    args.push(k + '=' + JSON.stringify(params[k]));
  }

  NProgress.start();

  var url = overlay.url +
      (overlay.appendQueryStart ? '?' : '&') +
      args.join('&');

  d3.json(url, function(error, data) {
    NProgress.done();
    if (error) {
      console.error("Failed to load data", error);
      return;
    }

    angular.element(document.getElementById('stats')).scope().$emit('StatsReceived', data.stats);

    overlay.data = data;
    handleHexbinData(overlay, data);
  });
}

function handleHexbinData(overlay, data) {
  clearBins(overlay);

  var winRatio,
      opacityScale,
      binDataFn,
      hexClass,
      keys = Object.keys(data.bins);

  if ( overlay.mode === 'won' ) {
    hexClass = 'Greens';
    binDataFn = function(bin) {
      return bin.won;
    };

    keys = keys.filter(function(key) {
      return data.bins[key].won > 0;
    });
  } else if ( overlay.mode === 'lost' ) {
    hexClass = 'Reds';
    binDataFn = function(bin) {
      return bin.lost;
    };

    keys = keys.filter(function(key) {
      return data.bins[key].lost > 0;
    });
  } else if ( overlay.mode === 'ratio' ) {
    winRatio = angular.element(document.getElementById('stats')).scope().$root.totalAccountStats.winRatio;

    hexClass = 'RdYlGn';
    binDataFn = function(bin) {
      return (bin.won / ( bin.won + bin.lost )) - winRatio;
    };

    keys = keys.filter(function(key) {
      return data.bins[key].lost > 0 || data.bins[key].won > 0;
    });

    opacityScale = d3.scale.log()
        .domain(calculateExtent(data.bins, function(bin) { return bin.won + bin.lost; }))
        .range([0.1, 0.9]);

  } else {
    hexClass = 'PuBu';
    binDataFn = function(bin) {
      return overlay.useStatusData ? bin.count : bin;
    }
  }

  var panes = overlay.getPanes();
  var projection = overlay.getProjection();
  var quantile = d3.scale.quantile()
      .domain(calculateExtent(data.bins, binDataFn))
      .range(d3.range(9));

  overlay.svg = d3.select(panes.overlayImage).selectAll('svg')
      .data(keys);

  var delayer = d3.scale.linear()
      .range([0, 700])
      .domain([map.getBounds().getSouthWest().lng(), map.getBounds().getNorthEast().lng()]);

  overlay.svg
      .enter()
        .append('svg')
        .style('transform', 'rotateY(-90deg)')
        .attr("class", hexClass)
        .each(function(d) {
          var point = getPoint(d);
          var coords = calculateProjectionCoordinates(data.binSize, projection, point);

          var width = coords.x * 2;
          var height = coords.y * coords.ratio * 2;
          var left = projection.fromLatLngToDivPixel(point).x - coords.x;
          var top = projection.fromLatLngToDivPixel(point).y - coords.y;

          this.style.width = width + 'px';
          this.style.height = height + 'px';
          this.style.left = left + 'px';
          this.style.top = top + 'px';
        })
        .transition()
          .duration(500)
          .delay(function(d) {
            return delayer(JSON.parse(d)[0]);
          })
          .styleTween("transform", function() {
            return function(t) {
              return "rotateY(" + d3.interpolate(-90, 0)(t) + "deg)";
            }
          });

  overlay.svg
      .append("polygon")
      .style('opacity', 0)
      .each(function(d) {
        var point = getPoint(d);
        var coords = calculateProjectionCoordinates(data.binSize, projection, point);

        this.setAttribute("points", pointLineStringWithPointTranslation(coords));
        this.setAttribute("transform", "translate(" + coords.x + ")");
      })
      .attr("class", function (d) {
        var quantileScale = quantile(binDataFn(data.bins[d]));
        return "q" + quantileScale + "-9";
      })
      .transition()
        .duration(1000)
        .style('opacity', function(d) {
          return  opacityScale ? opacityScale(data.bins[d].won + data.bins[d].lost) : 0.7;
        });
}

function calculateExtent(bins, binDataFn) {
  var min = Infinity,
      max = -Infinity;

  Array.prototype.forEach.call(
      Object.keys(bins),
      function (key) {
        var value = binDataFn(bins[key]);

        if ( value === 0 ) return;

        if (min > value) min = value;
        if (max < value) max = value;
      });

  return [min, max];
}

function calculateProjectionCoordinates(binSize, projection, point) {
  var centerPixel = projection.fromLatLngToDivPixel(point);

  var xDiffPixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(point.lat(), point.lng() - binSize)).x;
  var yDiffPixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(point.lat() - binSize, point.lng())).y;
  var xDiff = Math.abs(centerPixel.x - xDiffPixel) / 2;
  var yDiff = Math.abs(centerPixel.y - yDiffPixel) / 2;

  return {
    x: xDiff,
    y: 17.40,  // this seems to be the best for all latitudes, meh
    ratio: yDiff / xDiff
  }
}

function pointLineStringWithPointTranslation(projectionCoords) {
  var rad30Deg = 3.141592 / 6;
  var yLengthFromCenter = projectionCoords.y * Math.tan(rad30Deg);

  var points = [];
  points.push(0, 0);
  points.push(projectionCoords.x, yLengthFromCenter * projectionCoords.ratio);
  points.push(projectionCoords.x, (2 * projectionCoords.y - yLengthFromCenter) * projectionCoords.ratio);
  points.push(0, (2 * projectionCoords.y) * projectionCoords.ratio);
  points.push(-1 * projectionCoords.x, (2 * projectionCoords.y - yLengthFromCenter) * projectionCoords.ratio);
  points.push(-1 * projectionCoords.x, yLengthFromCenter * projectionCoords.ratio);

  return points.join(' ');
}

function getPoint(d) {
  var x = JSON.parse(d);
  return new google.maps.LatLng(x[1], x[0]);
}
