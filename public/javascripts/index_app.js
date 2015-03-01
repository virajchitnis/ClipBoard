var app = angular.module('app', ['socket.io']);
app.config(['$socketProvider', function ($socketProvider) {
	$socketProvider.setConnectionUrl('http://' + document.domain + ':3001');
	$socketProvider.setTryMultipleTransports(false);
}]);
app.controller('MainCtrl', ['$scope', '$http', '$sce', '$socket', function($scope, $http, $sce, $socket) {
	$http.get('/users/' + $.cookie('token')).success(function(data) {
		var tempBoards = [];
		tempBoards.push(data.primary_board);
		for (var i = 0; i < data.secondary_boards.length; i++) {
			tempBoards.push(data.secondary_boards[i]);
		}
		$scope.boards = tempBoards;
		console.log(tempBoards);
	});
	
	$socket.on('board.added', function (data) {
		var boards = $scope.boards;
		boards.push(data);
		$scope.boards = boards;
	});
	
	$scope.openBoard = function(id) {
		window.location = "/clipboard/" + id;
	};
	
	$scope.logout = function() {
		$http.post('/users/logout', {}).
		success(function(data, status, headers, config) {
			var response = data;
			if (response.success) {
				$.removeCookie("token");
				$.removeCookie("username");
				window.location = "/login";
			}
			else {
				alert("Error, please try again.");
			}
		});
	};
}]);