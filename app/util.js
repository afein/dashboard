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

angular.module('kubedash').controller('ChartViewController', 
    function($scope, $interval) {
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
      $scope.run = true;

      // Poll for new data every 10 seconds
      $scope.pollPromise = $interval($scope.poll, 10000);

      // Trigger the first poll as soon as content is loaded
      $scope.$watch('$viewContentLoaded', $scope.poll);

      $scope.$on('$destroy', function () {
        $interval.cancel($scope.pollPromise);

        // Destroy all d3 entites
        d3.select('#utilchart').remove();
        $scope.options = null;
        $scope.data = [];
        $scope.chart = null;
      });

    });

angular.module('kubedash').controller('UtilizationViewController', 
    function($scope, $controller, $http, $q, $rootScope) {

      $scope.data = [{key: 'Memory Utilization', area: true, values:[]}];
      $scope.data.push({key: 'CPU Utilization', area: true, values:[]});

      // Populate scope.poll only if the limit is sane, compared to the usage.
      // Otherwise, use the fallback limit

      var memLimit = $scope.memLimit;
      var cpuLimit = $scope.cpuLimit;

      var define_poll = function () {
        $scope.poll = function() {
          pollUtilization($scope.memUsage, memLimit, $scope, 0, $http, $q);
          pollUtilization($scope.cpuUsage, cpuLimit, $scope, 1, $http, $q);
        };
      }

      if ((!$scope.memLimitFallback) && (!$scope.cpuLimitFallback)) {
        console.log("no fallbacks, defaulting");
        define_poll();
        $controller('ChartViewController', {$scope: $scope});
        return
      } 
      console.log("fallbacks, checking");
      testLimitToUsageRatio($scope.memUsage, $scope.memLimit, $http, function() {
        memLimit = $scope.memLimitFallback;
        $rootScope.addAlert("memory limit");
      }, function() {
        testLimitToUsageRatio($scope.cpuUsage, $scope.cpuLimit, $http, function() {
          cpuLimit = $scope.cpuLimitFallback;
          $rootScope.addAlert("cpu limit");
        }, function() {
          define_poll();
          $controller('ChartViewController', {$scope: $scope});
        });
      });

    });

function testLimitToUsageRatio(usageLink, limitLink, $http, change_callback, next_callback) {
  var stamp = (new Date(0)).toISOString();
  var usage = 0
      var limit = 0
      $http.get(usageLink + stamp)
      .success(function(data) {
        if ((data.metrics == undefined) || (data.metrics.length < 1)) {
          // No metrics are available, postpone
          setTimeout(function() {
            testLimitToUsageRatio(usageLink, limitLink, $http, change_callback, next_callback);
          }, 5000);
          return;
        }

        usage = data.metrics[data.metrics.length - 1].value;

        $http.get(limitLink + stamp)
            .success(function(data) {
              if ((data.metrics == undefined) || (data.metrics.length < 1)) {
                // No metrics are available, postpone
                setTimeout(function() {
                  testLimitToUsageRatio(usageLink, limitLink, $http, change_callback, next_callback);
                }, 5000);       
                return;
              }

              limit = data.metrics[data.metrics.length - 1].value;

              if (usage < limit/200) {
                change_callback();
              }
              next_callback();
            });
      });
}

function pollUtilization(usageLink, limitLink, $scope, idx,  $http, $q){
  if (!$scope.run) return;
  var usage = [];
  var limit = [];
  var usage_stamp = $scope.stamp;
  var limit_stamp = $scope.stamp;
  // Get Metric Usage and store in the time-descending usage array .
  $http.get(usageLink + $scope.stamp)
      .success(function(data) {
        if ((data.metrics == undefined) || (data.metrics.length == 0)) {
          // No metrics are available, postpone
          return;
        }
        for(var i in data.metrics){
          usage.unshift({x: Date.parse(data.metrics[i].timestamp), 
            y: data.metrics[i].value});
        }
        usage_stamp = data.latestTimestamp;

        // Get Metric Limit and store in the time-descending limit array .
        $http.get(limitLink + $scope.stamp)
            .success(function(data) {
              if ((data.metrics == undefined) || (data.metrics.length == 0)) {
                // No metrics are available, postpone
                return;
              }
              for(var i in data.metrics){
                limit.unshift({x: Date.parse(data.metrics[i].timestamp), 
                  y: data.metrics[i].value});
              }
              limit_stamp = data.latestTimestamp;
              // Use the usage and limit arrays to calculate utilization percentage.
              // Store in the appropriate time-ascending $scope.data array
              for (var i=0; i < limit.length; i++) {
                if ((!!usage[i]) && (!!limit[i])) {
                  $scope.data[idx]["values"].push({x: usage[i].x, y: (usage[i].y / limit[i].y)});
                }
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
      });
};
