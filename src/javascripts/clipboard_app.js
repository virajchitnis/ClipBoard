var app = angular.module('app', ['socket.io']);
app.directive('ngShiftEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13 && event.shiftKey) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngShiftEnter);
                });

                event.preventDefault();
            }
        });
    };
});
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});
app.directive('ngEsc', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 27) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEsc);
                });

                event.preventDefault();
            }
        });
    };
});
app.filter('toLocale', function () {
	return function (item) {
		return new Date(item).toLocaleString()
	};
});
app.config(['$socketProvider', function ($socketProvider) {
	$socketProvider.setConnectionUrl('http://' + document.domain + ':[[% socket_port %]]');
	$socketProvider.setTryMultipleTransports(false);
}]);
app.controller('MainCtrl', ['$scope', '$http', '$sce', '$socket', function($scope, $http, $sce, $socket) {
	$scope.board_id = document.URL.split("/").pop();
	
	var localStorageBoard = $.jStorage.get('board' + $scope.board_id);
	if (localStorageBoard) {
		$scope.board = localStorageBoard;
		
		setTimeout(function() {
			$('pre code').each(function(i, block) {
				hljs.highlightBlock(block);
			});
			$('html, body').animate({scrollTop: $(document).height()}, 1000, function() {
				setTimeout(function() {
					$http.get('/boards/' + $scope.board_id).success(function(data) {
						var localStorageBoard = $.jStorage.get('board' + $scope.board_id);
						if (localStorageBoard) {
							if (localStorageBoard.clips.length != data.clips.length) {
								$.jStorage.set('board' + $scope.board_id, data);
								$scope.board.clips = data.clips;
		
								setTimeout(function() {
									$('pre code').each(function(i, block) {
										hljs.highlightBlock(block);
									});
									$('html, body').animate({scrollTop: $(document).height()}, 1000);
								}, 150);
							}
						}
					});
				}, 2000);
			});
		}, 150);
	}
	else {
		$http.get('/boards/' + $scope.board_id).success(function(data) {
			$.jStorage.set('board' + $scope.board_id, data);
			$scope.board = data;
		
			setTimeout(function() {
				$('pre code').each(function(i, block) {
					hljs.highlightBlock(block);
				});
				$('html, body').animate({scrollTop: $(document).height()}, 1000);
			}, 150);
		});
	}
	
	if (getCookie("username") == "") {
		setTimeout( function() {
			$('#username-modal').modal('show');
		}, 150);
	}
	else {
		$scope.username = getCookie("username");
	}
	
	$socket.on('clip.exists.' + $scope.board_id, function (data) {
		$scope.alertTitle = data.title;
		$scope.alertMessage = data.message;
		
		$('#alert-modal').modal('show');
	});
	
	$socket.on('clip.added.' + $scope.board_id, function (data) {
		var scrollPosition = $(document).scrollTop();
		var pageHeight = $(document).height() - $(window).height();
		var scrollOrNot = ((scrollPosition >= pageHeight) ? true : false);
		
		var clips = $scope.board.clips;
		clips.push(data);
		$scope.board.clips = clips;
		
		setTimeout(function() {
			$('pre code').each(function(i, block) {
				hljs.highlightBlock(block);
			});
		}, 150);
		
		if (scrollOrNot || (data.owner == getCookie("username"))) {
			setTimeout(function() {
				$('html, body').animate({scrollTop: $(document).height()}, 1000);
			}, 150);
		}
	});
	
	$scope.onSearchChange = function() {
		setTimeout( function() {
			$('pre code').each(function(i, block) {
				hljs.highlightBlock(block);
			});
		}, 150);
	};
	
	$scope.saveUsername = function() {
		if ($scope.username.length >= 2) {
			setCookie("username", $scope.username, 365);
			$('#username-modal').modal('hide');
		}
	};
	
	$scope.saveEnteredText = function() {
		var textarea = $scope.textentry.split(";;;;;");
		
		var clip;
		if (textarea.length > 1) {
			if ((textarea[0] == "[URL]") || (textarea[0] == "[url]")) {
				clip = {
					owner: getCookie("username"),
					body: textarea[1],
					type: "webclip"
				}
			}
			else {
				clip = {
					title: textarea[0],
					owner: getCookie("username"),
					body: textarea[1],
					type: "textclip"
				}
			}
		}
		else {
			clip = {
				owner: getCookie("username"),
				body: textarea[0],
				type: "textclip"
			}
		}
		
		$http.post('/boards/' + $scope.board_id + '/clips', clip).
		success(function(data, status, headers, config) {
			var response = data;
			if (response.error) {
				alert(response.error);
			}
		});
		
		$('#textAreaPaste').blur();
		$scope.textentry = "";
	};
	
	$scope.leaveTextArea = function() {
		$('#textAreaPaste').blur();
	};
	
	$scope.getAsHTML = function(html) {
		return $sce.trustAsHtml(html);
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