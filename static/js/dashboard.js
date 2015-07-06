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

var usage = [{key: 'Cluster Memory Usage', values:[]}];

d3.json(window.location + '/api/v1/schema/cluster/memory-usage', function(error,data){
  console.log(data);
  for(var i in data.metrics){
      usage[0]["values"].push({x: Date.parse(data.metrics[i].timestamp), y: data.metrics[i].value/1048576});
  }
  console.log(usage);
  nv.addGraph(function() {
    var chart = nv.models.lineWithFocusChart();
    chart.xAxis
        .axisLabel('Time')
        .tickFormat(function(d) {return d3.time.format('%X')(new Date(d));});

    chart.x2Axis
        .axisLabel('Time')
        .tickFormat(function(d) {return d3.time.format('%X')(new Date(d));});

    chart.yAxis
        .axisLabel('MBytes')
        .tickFormat(d3.format('d'));

    chart.y2Axis
        .tickFormat(d3.format('d'));

    d3.select('#chart svg')
        .datum(usage)
        .transition().duration(500)
        .call(chart)
        ;
    nv.utils.windowResize(chart.update);

    return chart;
  });
});
