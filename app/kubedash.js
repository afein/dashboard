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

(function(){
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

  app.controller('clusterUtil', 
      function($scope, $http, $interval, $q) {
        $scope.options = {
          chart: {
            type: 'lineWithFocusChart',
            height: 400,
            margin : {
              top: 20,
              right: 20,
              bottom: 60,
              left: 40
            },
            transitionDuration: 500,
            useInteractiveGuideline: true,
            lines: {
              forceY: [0, 1],
            },
            color: ['#31708f', '#a94442'],  // light blue, light red
            xAxis: {
              axisLabel: 'Time',
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              },
              staggerLabels:true
            },
            x2Axis: {
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              }
            },
            yAxis: {
              axisLabel: 'Utilization',
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            },
            y2Axis: {
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            }

          }
        };

        $scope.stamp = (new Date(0)).toISOString();
        $scope.data = [{key: 'Memory Utilization', area: true, values:[]}];
        $scope.data.push({key: 'CPU Utilization', area: true, values:[]});
        $scope.run = true;

        var memUsage = 'api/v1/model/metrics/memory-usage?start=';
        var memLimit = 'api/v1/model/metrics/memory-limit?start=';
        var cpuUsage = 'api/v1/model/metrics/cpu-usage?start=';
        var cpuLimit = 'api/v1/model/metrics/cpu-limit?start=';

        // scope.poll appends memory and cpu utilization to the chart
        $scope.poll = function() {
          pollUtilization(memUsage, memLimit, $scope, 0, $http, $q);
          pollUtilization(cpuUsage, cpuLimit, $scope, 1, $http, $q);
        };

        // Poll for new data every 5 seconds
        $scope.pollPromise = $interval($scope.poll, 10000);

        // Trigger the first poll as soon as content is loaded
        $scope.$watch('$viewContentLoaded', $scope.poll);

        $scope.$on('$destroy', function () {
          $interval.cancel($scope.pollPromise);
        });

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
  app.controller('nodeUtil', 
      function($scope, $http, $interval, $q, $routeParams) {
        $scope.hostname = $routeParams.name;
        $scope.options = {
          chart: {
            type: 'lineWithFocusChart',
            height: 400,
            margin : {
              top: 20,
              right: 20,
              bottom: 60,
              left: 40
            },
            transitionDuration: 500,
            useInteractiveGuideline: true,
            lines: {
              forceY: [0, 1],
            },
            color: ['#31708f', '#a94442'],  // light blue, light red
            xAxis: {
              axisLabel: 'Time',
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              },
              staggerLabels:true
            },
            x2Axis: {
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              }
            },
            yAxis: {
              axisLabel: 'Utilization',
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            },
            y2Axis: {
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            }

          }
        };

        $scope.stamp = (new Date(0)).toISOString();
        $scope.data = [{key: 'Memory Utilization', area: true, values:[]}];
        $scope.data.push({key: 'CPU Utilization', area: true, values:[]});
        $scope.run = true;

        var memUsage = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/memory-usage?start=';
        var memLimit = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/memory-limit?start=';
        var cpuUsage = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/cpu-usage?start=';
        var cpuLimit = 'api/v1/model/nodes/' + $scope.hostname + '/metrics/cpu-limit?start=';

        // scope.poll appends memory and cpu utilization to the chart
        $scope.poll = function() {
          pollUtilization(memUsage, memLimit, $scope, 0, $http, $q);
          pollUtilization(cpuUsage, cpuLimit, $scope, 1, $http, $q);
        };

        // Poll for new data every 5 seconds
        $scope.pollPromise = $interval($scope.poll, 10000);

        // Trigger the first poll as soon as content is loaded
        $scope.$watch('$viewContentLoaded', $scope.poll);

        $scope.$on('$destroy', function () {
          $interval.cancel($scope.pollPromise);
        });

      });


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

  app.controller('namespaceUtil', 
      function($scope, $http, $interval, $q, $routeParams) {
        $scope.namespace = $routeParams.name;
        $scope.options = {
          chart: {
            type: 'lineWithFocusChart',
            height: 400,
            margin : {
              top: 20,
              right: 20,
              bottom: 60,
              left: 40
            },
            transitionDuration: 500,
            useInteractiveGuideline: true,
            lines: {
              forceY: [0, 1],
            },
            color: ['#31708f', '#a94442'],  // light blue, light red
            xAxis: {
              axisLabel: 'Time',
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              },
              staggerLabels:true
            },
            x2Axis: {
              tickFormat: function(d) {
                return d3.time.format('%X')(new Date(d));
              }
            },
            yAxis: {
              axisLabel: 'Utilization',
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            },
            y2Axis: {
              tickFormat: function(d) {
                return d3.format('%')(d3.round(d, 3));
              }
            }

          }
        };

        $scope.stamp = (new Date(0)).toISOString();
        $scope.data = [{key: 'Memory Utilization', area: true, values:[]}];
        $scope.data.push({key: 'CPU Utilization', area: true, values:[]});
        $scope.run = true;

        var memUsage = 'api/v1/model/namespaces/' + $scope.namespace + '/metrics/memory-usage?start=';
        var memLimit = 'api/v1/model/namespaces/' + $scope.namespace + '/metrics/memory-limit?start=';
        var cpuUsage = 'api/v1/model/namespaces/' + $scope.namespace + '/metrics/cpu-usage?start=';
        var cpuLimit = 'api/v1/model/namespaces/' + $scope.namespace + '/metrics/cpu-limit?start=';

        // scope.poll appends memory and cpu utilization to the chart
        $scope.poll = function() {
          pollUtilization(memUsage, memLimit, $scope, 0, $http, $q);
          pollUtilization(cpuUsage, cpuLimit, $scope, 1, $http, $q);
        };

        // Poll for new data every 5 seconds
        $scope.pollPromise = $interval($scope.poll, 10000);

        // Trigger the first poll as soon as content is loaded
        $scope.$watch('$viewContentLoaded', $scope.poll);

        $scope.$on('$destroy', function () {
          $interval.cancel($scope.pollPromise);
        });

      });

  function pollUtilization(usageLink, limitLink, $scope, idx,  $http, $q){
    if (!$scope.run) return;
    var usage = [];
    var limit = [];
    var usage_stamp = $scope.stamp;
    var limit_stamp = $scope.stamp;
    console.log("poll");
    $q.all([
        // Get Metric Usage and store in the time-descending usage array .
        $http.get(usageLink + $scope.stamp)
        .success(function(data) {
          if ((data.metrics == undefined) || (data.metrics.length == 0)) {
            // No metrics are available, postpone
            return;
          }
          console.log("usage");
          console.log(data.metrics);
          for(var i in data.metrics){
            usage.unshift({x: Date.parse(data.metrics[i].timestamp), 
              y: data.metrics[i].value});
          }
          usage_stamp = data.latestTimestamp;

        }),
        // Get Metric Usage and store in the time-descending usage array .
        $http.get(limitLink + $scope.stamp)
        .success(function(data) {
          if ((data.metrics == undefined) || (data.metrics.length == 0)) {
            // No metrics are available, postpone
            return;
          }
          console.log("limit");
          console.log(data.metrics);
          for(var i in data.metrics){
            limit.unshift({x: Date.parse(data.metrics[i].timestamp), 
              y: data.metrics[i].value});
          }
          limit_stamp = data.latestTimestamp;
        }),
        ]).then(function() {
          // Use the usage and limit arrays to calculate utilization percentage.
          // Store in the appropriate time-ascending $scope.data array
          for (var i=0; i < usage.length; i++) {
            $scope.data[idx]["values"].push({x: usage[i].x, y: (usage[i].y / limit[i].y)});
          }
          var usage_time = Date.parse(usage_stamp);
          var limit_time = Date.parse(limit_stamp);
          if (usage_time > limit_time) {
            $scope.stamp = usage_stamp;
            console.log("usage stamp is greater than limit stamp");
          } else {
            $scope.stamp = limit_stamp;
          }
        })
  };


})();
