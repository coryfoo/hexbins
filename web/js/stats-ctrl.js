function StatsCtrl($scope, $rootScope) {
  $scope.data = {};
  $scope.revenueKeys =
      ['Less Than $500,000', '$500,000 to $1 Million', '$1 to 2.5 Million', '$2.5 to 5 Million',
       '$5 to 10 Million', '$10 to 20 Million', '$20 to 50 Million', '$50 to 100 Million',
       '$100 to 500 Million', 'Over $1 Billion'];

  $scope.headcountKeys =
      ['1 to 4', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100 to 249', '250 to 499', '500 to 999', 'Over 1,000' ];

  $scope.filters = {};

  $scope.$on('StatsReceived', function(evt, data) {
    $scope.$apply(function() {
      angular.extend($scope.data, data);

      var revenue = {};
      $scope.data.revenue.forEach(function(rev) {
        revenue[rev.key] = rev.doc_count;
      });

      $scope.data.revenue = revenue;

      var headcount = {};
      $scope.data.headcount.forEach(function(hc) {
        headcount[hc.key] = hc.doc_count;
      });

      $scope.data.headcount = headcount;
    });
  });

  $scope.$on('AccountStatsRecevied', function(evt, data) {
    $scope.$apply(function() {
      $rootScope.totalAccountStats = data;
    });
  });

  $scope.setMode = function(mode) {
    if ( $scope.data.mode === mode ) return;

    $scope.data.mode = mode;
    window.hexbins.setMode(mode);
  };

  $scope.toggleFilter = function(filterName) {
    if ( filterName in $scope.filters ) {
      delete $scope.filters[filterName];
    } else {
      $scope.filters[filterName] = true;
    }

    window.hexbins.setFilters(Object.keys($scope.filters));
  };
}
