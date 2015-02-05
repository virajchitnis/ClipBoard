var app = angular.module('app', ['socket.io']);
app.config(['$socketProvider', function ($socketProvider) {
	$socketProvider.setConnectionUrl('http://' + document.domain + ':3001');
	$socketProvider.setTryMultipleTransports(false);
}]);
app.controller('MainCtrl', ['$scope', '$http', '$sce', '$socket', function($scope, $http, $sce, $socket) {
	$http.get('/boards').success(function(data) {
		$scope.boards = data;
	});
	
	$socket.on('board.added', function (data) {
		var boards = $scope.boards;
		boards.push(data);
		$scope.boards = boards;
	});
	
	$scope.openBoard = function(id) {
		window.location = "/clipboard/" + id;
	};
}]);