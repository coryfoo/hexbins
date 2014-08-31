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
        .replace(/\)/g, ']'))
  };

  var args = [];
  for (k in params) {
    args.push(k + '=' + JSON.stringify(params[k]));
  }

  args.push('signals=[]');

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

  var hexClass = 'PuBuGn';
  var winRatio;
  var keys = Object.keys(data.bins);
  if ( overlay.mode === 'won' ) {
    hexClass = 'Greens';

    keys = keys.filter(function(key) {
      return data.bins[key].won > 0;
    });
  } else if ( overlay.mode === 'lost' ) {
    hexClass = 'Reds';

    keys = keys.filter(function(key) {
      return data.bins[key].lost > 0;
    });
  } else if ( overlay.mode === 'ratio' ) {
    winRatio = angular.element(document.getElementById('stats')).scope().$root.totalAccountStats.winRatio;

    hexClass = 'RdYlGn';

    keys = keys.filter(function(key) {
      return data.bins[key].lost > 0 || data.bins[key].won > 0;
    });
  }

  var panes = overlay.getPanes();
  var projection = overlay.getProjection();
  var quantile = calculateQuantile(data.bins, overlay.useStatusData, overlay.mode, winRatio);

  var samplePoint = getPoint(keys[0]);
  var projectionCoordinates = calculateProjectionCoordinates(data.binSize, projection, samplePoint);
  var hexLineString = pointLineStringWithPointTranslation(projectionCoordinates);

  overlay.svg = d3.select(panes.overlayImage).selectAll('svg')
      .data(keys);

  var delayer = d3.scale.linear()
      .range([0, 700])
      .domain([map.getBounds().getSouthWest().lng(), map.getBounds().getNorthEast().lng()]);

  overlay.svg
      .enter()
        .append('svg')
        .style('width', projectionCoordinates.x * 2 + 'px')
        .style('height', projectionCoordinates.y * projectionCoordinates.ratio * 2 + 'px')
        .style("left", function (d) {
          return projection.fromLatLngToDivPixel(getPoint(d)).x - projectionCoordinates.x + 'px';
        })
        .style("top", function (d) {
          return projection.fromLatLngToDivPixel(getPoint(d)).y - projectionCoordinates.y + 'px';
        })
        .style('transform', 'rotateY(-90deg)')
        .attr("class", hexClass)
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
      .attr("transform", "translate(" + projectionCoordinates.x + ")")
      .attr("points", hexLineString)
      .attr("class", function (d) {
        var bin = data.bins[d];

        var quantileScale;
        if ( !overlay.useStatusData ) {
          quantileScale = quantile(bin);
        } else if ( overlay.mode === 'won' ) {
          quantileScale = quantile(bin.won);
        } else if ( overlay.mode === 'lost' ) {
          quantileScale = quantile(bin.lost);
        } else if ( overlay.mode === 'ratio' ) {
          quantileScale = quantile((bin.won / ( bin.won + bin.lost )) - winRatio);
        } else {
          quantileScale = quantile(bin.count);
        }

        return "q" + quantileScale + "-9";
      })
      .transition()
      .duration(1000)
      .style('opacity', .7);
}

function calculateQuantile(bins, useStatusData, mode, winRatio) {
  var min = Infinity,
      max = -Infinity;

  Array.prototype.forEach.call(
      Object.keys(bins),
      function (key) {
        var value = null;

        var bin = bins[key];
        if ( !useStatusData ) {
          value = bin;
        } else if ( mode === 'won' ) {
          value = bin.won;
        } else if ( mode === 'lost' ) {
          value = bin.lost;
        } else if ( mode === 'ratio') {
          value = (bin.won / ( bin.won + bin.lost )) - winRatio;
        } else {
          value = bin.count;
        }

        if ( value === 0 ) return;

        if (min > value) min = value;
        if (max < value) max = value;
      });

  return d3.scale.quantile()
      .domain([min, max])
      .range(d3.range(9));
}

function calculateProjectionCoordinates(binSize, projection, point) {
  var centerPixel = projection.fromLatLngToDivPixel(point);

  var xDiffPixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(point.lat(), point.lng() - binSize)).x;
  var yDiffPixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(point.lat() - binSize, point.lng())).y;
  var xDiff = Math.abs(centerPixel.x - xDiffPixel) / 2;
  var yDiff = Math.abs(centerPixel.y - yDiffPixel) / 2;

  return {
    x: xDiff,
    y: yDiff,
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
