function StatsCtrl($scope, $rootScope) {
  $scope.data = {};

  $scope.$on('StatsReceived', function(evt, data) {
    $scope.$apply(function() {
      angular.extend($scope.data, data);
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
}
