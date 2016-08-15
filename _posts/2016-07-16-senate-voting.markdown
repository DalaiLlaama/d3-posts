---
layout: post
title:  "Senate Voting, Federal Election 2016"
date:   2016-07-16 11:11:00
categories: dataviz election senate australia votes
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
      <li><a href="?state=nsw">NSW</a></li>
      <li><a href="?state=vic">VIC</a></li>
      <li><a href="?state=qld">QLD</a></li>
      <li><a href="?state=sa">SA</a></li>
      <li><a href="?state=tas">TAS</a></li>
      <li><a href="?state=wa">WA</a></li>
      <li><a href="?state=act">ACT</li>
      <li><a href="?state=nt">NT</a></li>
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

Nodes on the left represent primary votes, sized in proportion to the votes received. Groups with more than about 0.3% of the vote are tracked individually, while the remaining parties
and individuals are aggregated into *Other groups* node. Intermediate nodes are positioned in the order in which they are excluded from the count (or fill a quota with insufficient excess 
to continue). Up to this point they collect primary votes and any lower preferences that have thus far been distributed. After this point, their votes will be distributed 
as preferences to others. Nodes on the right are individual elected senators, plus nodes for unsuccessful and exhausted votes. First preference votes that contribute to a filled quota flow directly to the elected candidate. Intermediate nodes simply collect and distribute preferences in
these cases.



#### Some simplifications

- Votes are counted, and preferences distributed, to individual candidates who are (usually) members of a group. I have aggregated votes and preference transfers to group level.
  Small transfers of preferences have been removed from the diagram, just to avoid making it more confusing than it already is. That will lead to an occasional discrepancy in the counts.


#### Interaction

Drag nodes to move them up or down. The initial placement of nodes results from an algorithm that tries to find the flow with the least entanglement. 
Rearranging the nodes may help to find a more visually pleasing configuration.

#### Links

Data for these diagrams was obtained from the [AEC](http://vtr.aec.gov.au/SenateDownloadsMenu-20499-Csv.htm)

Thanks to Mike Bostock's example of the [Sankey plugin](http://bost.ocks.org/mike/sankey/) for D3.js.

</p>
<script src="https://d3js.org/d3.v2.min.js?2.9.1"></script>
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
var fname = "/data/2016/nodes_" + state + ".json";
var minSize = (QueryString.min === null || (typeof QueryString.min === "undefined")) ? 1000 : QueryString.min;
function filterMin(links, minSize) {
	return links.filter( function(l) {
		return l.value >= minSize;
	})
};

  d3.json(fname, function(json) {
	if (!json || json === '') return console.warn('error parsing json');	
	nodes = json.node;
	
	console.log(json.links[0].source + "-" + json.links[0].target);
	
	sankey.nodes(json.nodes)
		.links(json.links) // filterMin(json.links, minSize))
		.layout(32);

  var link = svg.append("g").selectAll(".link")
      .data(json.links) // filterMin(json.links, minSize))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
	  .style("stroke", function(d) { return d.color = d3.rgb(d.source.colour).brighter(1).darker(1); }) // force white to be darker
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


