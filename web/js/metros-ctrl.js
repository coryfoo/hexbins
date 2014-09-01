function MetrosCtrl($scope) {
  $scope.data = {
    expanded:true
  };

  var metroMap = {
    'New York-Northern New Jersey-Long Island, NY-NJ-PA': bounds(40.3213,-74.5685,41.1320,-73.3352),
    'Los Angeles-Long Beach-Santa Ana, CA': bounds(33.5352,-118.7678,34.4223,-117.5345),
    'Chicago-Naperville-Joliet, IL-IN-WI': bounds(41.4418,-88.3028, 42.2388,-87.0696),
    'Miami-Fort Lauderdale-Pompano Beach, FL': bounds(25.4628,-80.7850,26.4248,-79.5518),
    'Dallas-Fort Worth-Arlington, TX': bounds(32.3640,-97.5844,33.2631,-96.3512),
    'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD': bounds(39.7656,-75.4317,40.1755,-74.8151),
    'Atlanta-Sandy Springs-Marietta, GA': bounds(33.5580,-84.6727,34.0026,-84.0561),
    'Washington-Arlington-Alexandria, DC-VA-MD-WV': bounds(38.7639,-77.1946,38.9721,-76.8863),
    'Houston-Sugar Land-Baytown, TX': bounds(29.4807,-95.5815,29.9453,-94.9649),
    'Boston-Cambridge-Quincy, MA-NH':bounds(42.1597,-71.3587,42.5550,-70.7421),
    'San Francisco-Oakland-Fremont, CA':bounds(37.6512,-122.5901,37.8626,-122.2818),
    'San Diego-Carlsbad-San Marcos, CA':bounds(32.4670,-117.7808,33.3650,-116.5476),
    'Anchorage, AK':bounds(61.10377,-150.0340,61.2327,-149.7256),
    'San Jose-Sunnyvale-Santa Clara, CA':bounds(37.2367,-122.0942,37.4493,-121.7859),
    'Seattle-Tacoma-Bellevue, WA':bounds(47.1152,-122.8704,47.8382,-121.6372),
    'Phoenix-Mesa-Scottsdale, AZ':bounds(33.2371,-112.2938,33.6834,-111.6772),
    'Nashville-Davidson--Murfreesboro--Franklin, TN':bounds(36.1029,-86.8486,36.2108,-86.6944),
    'Cincinnati-Middletown, OH-KY-IN':bounds(39.0017,-84.8185,39.4161,-84.2018),
    'Detroit-Warren-Livonia, MI':bounds(42.2103,-83.4533,42.6053,-82.8367),
    'Denver-Aurora, CO': bounds(39.5537,-105.2821,39.9649,-104.6655),
    'St. Louis, MO-IL': bounds(38.5264,-90.3909,38.7353,-90.0826),
    'Indianapolis-Carmel, IN': bounds(39.6334,-86.4336,40.0441,-85.8170),
    'Austin-Round Rock, TX':bounds(30.1375,-97.9655,30.5990,-97.3489),
    'Omaha-Council Bluffs, NE-IA':bounds(41.1524,-96.0970,41.3534,-95.7887),
    'Raleigh-Cary, NC':bounds(35.6887,-78.8505,35.9056,-78.5422)
  };

  $scope.$on('MetrosReceived', function(evt, data) {
    $scope.$apply(function() {
      $scope.data.metros = data;
    });
  });

  $scope.navigateToMetro = function(metro) {
    window.map.fitBounds(metroMap[metro.name]);
  };

  function bounds(sLat, wLon, nLat, eLon) {
    return new google.maps.LatLngBounds(new google.maps.LatLng(sLat, wLon), new google.maps.LatLng(nLat, eLon));
  }
}
