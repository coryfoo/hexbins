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
  text.innerText = 'Loading top metro areas';

  var accountId = getAccountIdFromQueryParam();
  d3.json('/metros?account='+ accountId, function(err, data) {
    angular.element(document.getElementById('metros')).scope().$emit('MetrosReceived', data);

    if (accountId) {
      loadStatusCountsForAccount(accountId);
    } else {
      verificationSuccess();
    }
  });
}

function loadStatusCountsForAccount(accountId) {
  text.innerText = 'Loading status counts';

  d3.json('/status-counts?account='+accountId, function(err, data) {
    angular.element(document.getElementsByTagName('body')[0]).scope().$broadcast('AccountStatsRecevied', {
      'open': data['total_open_count'],
      'won': data['total_won_count'],
      'lost': data['total_lost_count'],
      'winRatio': data['total_won_count'] / (data['total_won_count'] + data['total_lost_count'])
    });

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

  window.hexbins = new HexBinOverlay(url, !!(accountId));
  window.hexbins.setMap(map);
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
