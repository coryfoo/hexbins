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
    window.hexbins.setMode(mode);
  };
}
