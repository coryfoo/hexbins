var HexBinOverlay = function(url) {
  this.url = url; 
};

HexBinOverlay.prototype = new google.maps.OverlayView();

HexBinOverlay.prototype.onAdd = function() { };

HexBinOverlay.prototype.onRemove = function() {
  this.svg && this.svg.remove();
};

HexBinOverlay.prototype.draw = function() {
    if ( this.drawDelay ) {
        console.debug('cancelling timer');
        clearTimeout(this.drawDelay);
    }

    this.drawDelay = setTimeout(loadDataForBounds.bind(null, this), 600);
};

function loadDataForBounds(overlay) {
  var params = {
    zoom:overlay.getMap().getZoom(),
    bounds:JSON.parse(overlay.getMap().getBounds()
        .toString()
        .replace(/"/g, '')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']'))
  };

  var args = [];
  for (k in params) {
    args.push(k+'='+JSON.stringify(params[k]));
  }

  args.push('signals=[]');

  d3.json(overlay.url+'?'+args.join('&'), handleHexbinData.bind(null, overlay));
}

function handleHexbinData(overlay, error, data) {
    if ( error ) {
        console.error("Failed to load data", error);
        return;
    }

    var panes = overlay.getPanes();
    var projection = overlay.getProjection();
    var quantile = calculateQuantile(data.bins);

    if ( overlay.svg ) {
        overlay.svg.remove();
    }

    var samplePoint = getPoint(Object.keys(data.bins)[0]);
    var projectionCoordinates = calculateProjectionCoordinates(data.binSize, projection, samplePoint);
    var hexLineString = pointLineStringWithPointTranslation(projectionCoordinates);

    overlay.svg = d3.select(panes.overlayImage).selectAll('svg')
        .data(Object.keys(data.bins));

    overlay.svg
        .enter()
        .append('svg')
        .style('width', projectionCoordinates.x * 2 + 'px')
        .style('height', projectionCoordinates.y * projectionCoordinates.ratio * 2 + 'px')
        .style("left", function(d) {
            return projection.fromLatLngToDivPixel(getPoint(d)).x-projectionCoordinates.x + 'px';
        })
        .style("top", function(d) {
            return projection.fromLatLngToDivPixel(getPoint(d)).y-projectionCoordinates.y + 'px';
        })
        .attr("class", "Blues");

    overlay.svg
        .append("polygon")
        .style('opacity', 0)
        .attr("transform", "translate("+projectionCoordinates.x+")")
        .attr("points", hexLineString)
        .attr("class", function(d) { return "q" + quantile(data.bins[d]) + "-9"; })
        .transition()
            .duration(1000)
            .style('opacity',.8);
}

function calculateQuantile(bins) {
    var min = Infinity,
        max = -Infinity;

    Array.prototype.forEach.call(
      Object.keys(bins), 
      function(key) { 
        var value = bins[key];
        if ( min > value ) min = value;
        if ( max < value ) max = value;
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
  points.push(projectionCoords.x,yLengthFromCenter*projectionCoords.ratio);
  points.push(projectionCoords.x,(2*projectionCoords.y-yLengthFromCenter)*projectionCoords.ratio);
  points.push(0, (2*projectionCoords.y)*projectionCoords.ratio);
  points.push(-1*projectionCoords.x,(2*projectionCoords.y-yLengthFromCenter)*projectionCoords.ratio);
  points.push(-1*projectionCoords.x,yLengthFromCenter*projectionCoords.ratio);

  return points.join(' ');
}

function getPoint(d) {
  var x = JSON.parse(d);
  return new google.maps.LatLng(x[1], x[0]);
}
