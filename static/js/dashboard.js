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
