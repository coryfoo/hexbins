var mapOptions = {
  minZoom: 8,
  maxZoom: 16,
  zoom: 12,
  center: new google.maps.LatLng(37.757, -122.436),
  overviewMapControl: false,
  panControl: false,
  rotateControl: false,
  scaleControl: false,
  streetViewControl: false,
  mapTypeControl: false
};

window.map = new google.maps.Map(document.getElementById('map'), mapOptions);

var icon = document.querySelector('#loading i');
var text = document.querySelector('#loading span');

function verifySetup() {
  d3.json('/verify', function(err, response) {
    if ( response.valid ) {
      text.innerText = 'Loading top metro areas';
      loadMetrosForAccount();

    } else {
      icon.classList.remove('fa-cloud');
      icon.classList.remove('grey');
      icon.classList.add('fa-minus-circle');
      icon.classList.add('red');
      text.innerText = 'Elasticsearch not setup properly.';
    }
  });
}

function loadMetrosForAccount() {
  d3.json('/metros?account='+getAccountIdFromQueryParam(), function(err, data) {
    angular.element(document.getElementById('metros')).scope().$emit('MetrosReceived', data);
    verificationSuccess();
  });
}

function verificationSuccess() {
  icon.classList.remove('fa-cloud');
  icon.classList.remove('grey');
  icon.classList.add('fa-check');
  icon.classList.add('green');
  text.innerText = 'Success!';

  setTimeout(function() {
    document.querySelector('#loading').remove();
    document.querySelector('#container').classList.remove('blur');

    loadHexbinsOverlay();
  }, 1000);
}

function loadHexbinsOverlay() {
  var url = '/bins';
  var accountId = getAccountIdFromQueryParam();
  if ( accountId ) {
    url = '/account-bins?account='+accountId;
  }

  new HexBinOverlay(url, !!(accountId)).setMap(map);
}

window.getAccountIdFromQueryParam = function() {
  var idx = location.search.indexOf('account=');
  if ( idx < 0 ) return null;

  var nextParam = location.search.indexOf('&', idx);
  if ( nextParam < 0 ) nextParam = location.search.length;

  return +(location.search.substring(idx+'account='.length, nextParam));
};

document.querySelector('#map').style.height = window.innerHeight + 'px';
setTimeout(verifySetup, 250);
