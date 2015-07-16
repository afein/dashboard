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

app.controller('clusterUtil', function($scope, $http, $interval, $q) {
    $scope.options = {
      chart: {
        type: 'lineWithFocusChart',
        height: 450,
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

    var memUsage = 'api/v1/model/cluster/memory-usage?start='
    var memLimit = 'api/v1/model/cluster/memory-limit?start='
    var cpuUsage = 'api/v1/model/cluster/cpu-usage?start='
    var cpuLimit = 'api/v1/model/cluster/cpu-limit?start='
    // scope.poll appends memory utilization to the chart
    $scope.poll = function() {
      pollUtilization(memUsage, memLimit, $scope, 0, $http, $q);
      pollUtilization(cpuUsage, cpuLimit, $scope, 1, $http, $q);
    };

    // Poll for new data every 5 seconds
    $interval($scope.poll, 5000);

    // Trigger the first poll as soon as content is loaded
    $scope.$watch('$viewContentLoaded', $scope.poll);

  });
