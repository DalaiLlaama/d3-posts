---
layout: post
title:  "Senate Voting, Federal Election 2013"
date:   2014-10-20 19:56:47
categories: dataviz election senate
---


<style>

div.example {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.node rect {
  cursor: move;
  fill-opacity: .9;
  shape-rendering: crispEdges;
}

.node text {
  pointer-events: none;
  text-shadow: 0 1px 0 #fff;
}

.link {
  fill: none;
  stroke: #000;
  stroke-opacity: .2;
}

.link:hover {
  stroke-opacity: .5;
}


{% include css/style.css %}

{% include css/menu.css %}

</style>

<div id="sse1">
  <div id="sses1">
    <ul>
      <li><a href="?state=nsw&min=1000">NSW</a></li>
      <li><a href="?state=vic&min=1000">VIC</a></li>
      <li><a href="?state=qld&min=1000">QLD</a></li>
      <li><a href="?state=sa&min=500">SA</a></li>
      <li><a href="?state=tas&min=500">TAS</a></li>
      <li><a href="?state=act&min=100">ACT</li>
      <li><a href="?state=nt&min=100">NT</a></li>
      <li><a href="?state=wa&min=500">WA Sep'13</a></li>
      <li><a href="?state=wa14&min=500">WA Apr'14</a></li>
    </ul>
  </div>
</div>

<div id="chart"></div>

<!--
<form id="params" action="?state=nsw&min=1000" method="get">
Remove transfers of less than <input type="text" name="minf">
<input type="button" onclick="getMin()" value="Apply">
</form>
-->

<p markdown="block">

#### How to interpret the diagram 

Nodes on the left represent primary votes. The 15 groups that either won seats or were eliminated latest are tracked individually, while the remaining parties
are aggregated into *Other groups* node. Intermediate nodes are positioned in the order in which they are excluded from the count (or fill a quota with insufficient excess 
to continue). Up to this point they collect primary votes and any lower preferences that have thus far been distributed. After this point, their votes will be distributed 
as preferences to others. Nodes on the right are individual elected senators, plus a _Balance_ node which simply acts as a placeholder for votes that were still in play when the
last seat is filled. First preference votes that contribute to a filled quota flow directly to the elected candidate. Intermediate nodes simply collect and distribute preferences in
these cases.

#### Some simplifications #

- Votes are counted, and preferences distributed, to individual candidates who are (usually) members of a group. I have aggregated votes and preference transfers
  to group level.

- Some preference transfers may result in a flow from members of the final 15 groups 'backwards' to members in *Other groups*. These have been ignored. They won't amount to much in the scheme of things.


#### Interaction

Drag nodes to move them up or down. The initial placement of nodes results from an algorithm that tries to find the flow with the least entanglement. 
Rearranging the nodes may help to find a more visually pleasing configuration.

#### Links

Data for these diagrams was obtained from the [AEC](http://www.aec.gov.au/Elections/Federal_Elections/2013/index.htm)

A detailed breakdown of the preference flows can be found at the [ABC election results site](http://www.abc.net.au/news/federal-election-2013/results/senate/)

An alternative visualisation of these results, with an animated step through the process, can be found [here](http://www.grwpub.info/senate/)

Thanks to Mike Bostock's example of the [Sankey plugin](http://bost.ocks.org/mike/sankey/) for D3.js.

</p>
<script src="http://d3js.org/d3.v2.min.js?2.9.1"></script>
<script src="/js/sankey.js"></script>
<script src="/js/menucool.js"></script>

<script>

var margin = {top: 1, right: 1, bottom: 6, left: 1},
    width = 1100 - margin.left - margin.right,
    height = 1200 - margin.top - margin.bottom;

var formatNumber = d3.format(","),
    format = function(d) { return formatNumber(d) + " votes"; },
    color = d3.scale.category20();

var svg = d3.select("div#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);

var path = sankey.link();

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

function getMin() {
	var minVal = document.getElementById("minf").value;
	document.getElementById("params").action = "?state=" + QueryString.state + "&min=" + minVal;
	document.getElementById("params").submit;
};

var state = (QueryString.state === null || (typeof QueryString.state === "undefined")) ? "nsw" : QueryString.state;
var fname = "/data/nodes_" + state + ".json";
var minSize = (QueryString.min === null || (typeof QueryString.min === "undefined")) ? 1000 : QueryString.min;
function filterMin(links, minSize) {
	return links.filter( function(l) {
		return l.value >= minSize;
	})
};

  d3.json(fname, function(json) {
	if (!json || json === '') return console.warn('error parsing json');	
	nodes = json.node;
	
	sankey.nodes(json.nodes)
		.links(filterMin(json.links, minSize))
		.layout(32);

  var link = svg.append("g").selectAll(".link")
      .data(filterMin(json.links, minSize))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

  link.append("title")
      .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

  var node = svg.append("g").selectAll(".node")
      .data(json.nodes)
	  .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	  .call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function() { this.parentNode.appendChild(this); })
      .on("drag", dragmove));

  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { return d.color = d3.rgb(d.colour); })
      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { return d.name + "\n" + format(d.value); });

  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

  function dragmove(d) {
    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
  }

  });



</script>


