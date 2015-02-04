var app = angular.module('app', ['socket.io']);
app.config(['$socketProvider', function ($socketProvider) {
	$socketProvider.setConnectionUrl('http://' + document.domain + ':3001');
	$socketProvider.setTryMultipleTransports(false);
}]);
app.controller('MainCtrl', ['$scope', '$http', '$sce', '$socket', function($scope, $http, $sce, $socket) {
	$scope.board_id = document.URL.split("/").pop();
	
	$http.get('/boards/' + $scope.board_id).success(function(data) {
		$scope.board = data;
	});
	
	$('#username-modal').modal('show');
}]);