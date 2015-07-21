// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var app = angular.module('kubedash', ['nvd3', 'ngRoute']);
app.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
      // route for the Cluster page
      .when('/', {
        templateUrl : 'pages/cluster.html',
        controller : 'clusterUtil',
      })
      // route for the Nodes page
      .when('/nodes/', {
        templateUrl : 'pages/nodes.html',
        controller : 'allNodes',
      })
      // route for each individual Node page
      .when('/node/:name', {
        templateUrl : 'pages/node.html',
        controller : 'nodeUtil',
      })
      // route for the Namespaces page
      .when('/namespaces/', {
        templateUrl : 'pages/namespaces.html',
        controller : 'allNamespaces',
      })
      // route for each individual Namespace Page
      .when('/namespace/:name', {
        templateUrl : 'pages/namespace.html',
        controller : 'namespaceUtil',
      })
      .otherwise({
        redirectTo: '/'
      });
}]);

app.controller('clusterUtil', function($scope, $controller) {
  $scope.memUsage = 'api/v1/model/metrics/memory-usage?start=';
  $scope.memLimit = 'api/v1/model/metrics/memory-limit?start=';
  $scope.cpuUsage = 'api/v1/model/metrics/cpu-usage?start=';
  $scope.cpuLimit = 'api/v1/model/metrics/cpu-limit?start=';
  $controller('UtilizationViewController', {$scope: $scope});
});

app.controller('nodeUtil', function($scope, $controller, $routeParams) {
  $scope.hostname = $routeParams.name;
  $scope.memUsage = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/memory-usage?start=';
  $scope.memLimit = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/memory-limit?start=';
  $scope.cpuUsage = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/cpu-usage?start=';
  $scope.cpuLimit = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/cpu-limit?start=';
  $controller('UtilizationViewController', {$scope: $scope});
});

app.controller('namespaceUtil',  function($scope, $controller, $routeParams) {
  $scope.ns = $routeParams.name;
  $scope.memUsage = 'api/v1/model/namespaces/' + $scope.ns + '/metrics/memory-usage?start=';
  $scope.memLimit = 'api/v1/model/namespaces/' + $scope.ns + '/metrics/memory-limit?start=';
  $scope.cpuUsage = 'api/v1/model/namespaces/' + $scope.ns + '/metrics/cpu-usage?start=';
  $scope.cpuLimit = 'api/v1/model/namespaces/' + $scope.ns + '/metrics/cpu-limit?start=';
  $controller('UtilizationViewController', {$scope: $scope});
});

app.controller('allNodes', ['$scope', '$http', function($scope, $http) {
  $scope.items = [];
  var allNodes = "api/v1/model/nodes/";
  $http.get(allNodes).success(function(data) {
    if (data.length == 0) {
      // No Nodes are available, postpone
      return;
    }
    $scope.items = data;
    console.log(data);
  });
}]);

app.controller('allNamespaces', function($scope, $http) {
  $scope.items = [];
  var allNamespaces = "api/v1/model/namespaces/";
  $http.get(allNamespaces).success(function(data) {
    if (data.length == 0) {
      // No Nodes are available, postpone
      return;
    }
    $scope.items = data;
    console.log(data);
  });
});
