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
	
	if (getCookie("username") == "") {
		setTimeout( function() {
			$('#username-modal').modal('show');
		}, 150);
	}
	else {
		$scope.username = getCookie("username");
	}
	
	$scope.saveUsername = function() {
		if ($scope.username >= 2) {
			setCookie("username", $scope.username, 365);
			$('#username-modal').modal('hide');
		}
	};
	
	$scope.saveEnteredText = function() {
		var textarea = $scope.textentry.split(";;;;;");
		
		var clip;
		if (textarea.length > 1) {
			clip = {
				title: textarea[0],
				owner: getCookie("username"),
				body: textarea[1]
			}
		}
		else {
			clip = {
				owner: getCookie("username"),
				body: textarea[0]
			}
		}
		
		$http.post('/boards/' + $scope.board_id + '/clips', clip).
		success(function(data, status, headers, config) {
			var response = data;
			if (response.error) {
				alert(response.error);
			}
			
			$http.get('/boards/' + $scope.board_id).success(function(data) {
				$scope.board = data;
			});
		});
	};
	
	$('#TextBoxId').keypress(function(e){
		if(e.keyCode==13)
			$('#linkadd').click();
	});
	
	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}
	
	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
		}
		return "";
	}
}]);