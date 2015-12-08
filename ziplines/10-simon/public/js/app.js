'use strict';

angular
    .module('simonApp', [])
    .controller('GameCtrl', ['$scope', GameCtrl])
    .directive('jwHelloWorld', [function() {
        return {
            restrict: 'E',
            template: '<p>Hello to the world! This is HTML5 Boilerplate...</p>'
        };
    }]);


function GameCtrl($scope) {
    var vm = $scope;

    vm.activeButton = null;
    vm.buttonClick = function(which) {
        vm.activeButton = which;
    };
}
