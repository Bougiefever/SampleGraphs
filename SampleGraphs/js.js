

var data;
var random = d3.randomNormal(0, .4);
var n = 40;
var count = 30;
var lineCount = 6;
var colors = ["red", "blue", "green", "yellow", "aqua", "black"]

var svgWidth = 300;
var svgHeight = 200;
var margin = { top: 20, right: 20, bottom: 20, left: 20 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var x = d3.scaleLinear().domain([1, n - 2]).range([0, width]);
var y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

var matrix = Array.apply(null, { length: count }).map(Number.call, Number)

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function (d, i) { return x(i) })
    .y(function (d, i) { return y(d) });

var params = {
    lineCount: 1,
    graphCount: 1,
    width: 1800,
    height: 720
};

var hold = [];

(function () {
    var gui = new dat.GUI();
    gui.add(params, 'lineCount').min(1).max(6).step(1).name("Number of Lines");
    gui.add(params, 'graphCount').min(1).max(30).step(1).name("Number of Graphs");
    gui.add(params, 'width').min(300).max(1800).step(25).name("Width").listen().onFinishChange(function () {
        params.height = params.width * .4;
    });
    gui.add(params, 'height').min(120).max(720).step(10).name("Height").listen().onFinishChange(function () {
        params.width = params.height * 2.5;
    });

})();

function drawGraphs() {

    appInsights.trackEvent("DrawGraphs", {"LineCount": params.lineCount, "GraphCount": params.graphCount});
    appInsights.trackMetric("LineCount", params.lineCount);
    appInsights.trackMetric("GraphCount", params.graphCount);

    lineCount = params.lineCount;
    count = params.graphCount;
    svgWidth = params.width;
    svgHeight = params.height;

    // remove event handler
    for (var i = 0; i < hold.length; i++) {
        var path = hold[i]._groups[0][0];
        path.__transition = null;
    }

    data = new Array(lineCount);
    for (var j = 0; j < lineCount; j++) {
        data[j] = new Array(count);
        for (var i = 0; i < count; i++) {
            data[j][i] = d3.range(n).map(function (d) { return 0 });
        }
    }

    var body = d3.select("#graphs");
    d3.selectAll("svg").data([]).exit().remove();

    matrix = Array.apply(null, { length: count }).map(Number.call, Number)

    var svg = d3.selectAll("svg")
        .data(matrix)
        .enter()
        .append("svg")
            .attr("data-idx", function (d) { return d; })
            .attr("width", svgWidth)
            .attr("height", svgHeight);

    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    width = svgWidth - margin.left - margin.right;
    height = svgHeight - margin.top - margin.bottom;
    x = d3.scaleLinear().domain([1, n - 2]).range([0, width]);
    y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

    line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d, i) { return x(i) })
        .y(function (d, i) { return y(d) });

    // create area
    g.append("defs").append("clipPath")
            .attr("id", "clip")
        .append("rect")
            .attr("width", width)
            .attr("height", height);

    // add x axis
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom(x));

    // add y axis
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));


    for (var j = 0; j < lineCount; j++) {

        for (i = 0; i < count; i++) {
            var myg = d3.selectAll("svg").filter("[data-idx='" + i + "']").select("g");
            var myData = data[j][i];
            var it = myg.append("g")
                    .attr("clip-path", "url(#clip)")
                .append("path")
                    .datum(myData)
                    .attr("class", "line " + colors[j] + "-line")
                    .attr("data-color-idx", j)
                .transition()
                    .duration(2500)
                    .ease(d3.easeLinear)
                    .on("start", tick);
            hold.push(it); // save so I can remove handler later
        }
    }

}

function tick() {
    console.log("tick");
    var selectedActive = d3.active(this);
    if (selectedActive == null) {
        console.log("not active");
        return;
    }

    var selectedg = d3.select(this);
    var idx = parseInt(d3.select(this.parentNode).node().parentNode.parentNode.getAttribute("data-idx"));
    var colorIdx = parseInt(selectedg.attr("data-color-idx"));

    var myData = data[colorIdx][idx];
    if (myData === undefined) return;

    myData.push(random());

    selectedg.attr("d", line).attr("transform", null);
    selectedActive.attr("transform", "translate(" + x(0) + ",0)")
        .transition().on("start", tick);

    myData.shift();
}