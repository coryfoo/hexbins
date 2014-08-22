function StatsCtrl($scope) {
  $scope.data = {};

  $scope.$on('StatsReceived', function(evt, data) {
    $scope.$apply(function() {
      angular.extend($scope.data, data);
    });
  });
}
