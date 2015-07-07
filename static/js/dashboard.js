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
var app = angular.module('dashboard', ['nvd3']);
  app.controller('cluster', function($scope, $http, $interval) {
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
        xAxis: {
          axisLabel: 'Time',
          tickFormat: function(d) {
            return d3.time.format('%X')(new Date(d));
          }
        },
        x2Axis: {
          tickFormat: function(d) {
            return d3.time.format('%X')(new Date(d));
          }
        },
        yAxis: {
          axisLabel: 'MB',
          tickFormat: function(d) {
            return d3.format(',d')(d);
          }
        },
        y2Axis: {
          tickFormat: function(d) {
            return d3.format(',d')(d);
          }
        }

      }
    };

    
    $scope.stamp = (new Date(0)).toISOString();
    $scope.data = [{key: 'Cluster Memory Usage', area: true, values:[]}];
    $scope.run = true;

    $scope.poll = function(){
      if (!$scope.run) return;
      var usage = $scope.data;
      $http.get(window.location + 'api/v1/model/cluster/memory-usage?start=' + $scope.stamp)
        .success(function(data) {
          console.log(data);
          if ((data.metrics == undefined) || (data.metrics.length == 0)) {
            // No metrics are available, postpone
            return;
          }
          for(var i in data.metrics){
            usage[0]["values"].push({x: Date.parse(data.metrics[i].timestamp), y: data.metrics[i].value/1048576});
          }
          $scope.data = usage;
          $scope.stamp = data.latestTimestamp;
      });
      console.log("called");
    };

    // Poll for new data every 5 seconds
    $interval($scope.poll, 5000);

    // Trigger the first poll as soon as content is loaded
    $scope.$watch('$viewContentLoaded', function(){
      $scope.poll()
    });

  });
})();
