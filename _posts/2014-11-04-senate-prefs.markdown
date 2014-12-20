---
layout: post
title:  "Senate Preferences, Federal Election 2013"
date:   2014-11-04 19:56:47
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

#circle circle {
    fill: none;
    pointer-events: all;
}



#tooltip {
        color: white;
        opacity: .9;
        background: #333;
        padding: 5px;
        border: 1px solid lightgrey;
        border-radius: 5px;
        position: absolute;
        z-index: 10;
        visibility: hidden;
        white-space: nowrap;
        pointer-events: none;
}

path.chord {
    //stroke: #000;
    stroke-width: 0px;
    transition: opacity 0.3s;
}

path.group {
	fill-opacity: .8;
    //opacity: 0;
}


#circle:hover path.fade {
        display: none;
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
      <li><a href="?state=act">ACT</li>
      <li><a href="?state=nt">NT</a></li>
      <li><a href="?state=wa">WA Sep-13</a></li>
      <li><a href="?state=wa14">WA Apr-14</a></li>
    </ul>
  </div>
</div>


<div id="chart">
</div>


<!--
<form id="params" action="?state=nsw&min=1000" method="get">
Remove transfers of less than <input type="text" name="minf">
<input type="button" onclick="getMin()" value="Apply">
</form>
-->

<p markdown="block">


#### Explanation

Each party's topmost preferences are depicted as a link from the originating party to the receiving party. The same link serves to indicate the 
preference allocation in the opposite direction. Preferences are sorted in order, descending in a clockwise direction. Topmost preferences are darker in shade. Width at the originating end also indicates preference. 

Hover over a party to see only the preferences of that party. Hover over a chord to display the details of the preference swap in both directions.

#### Links

Data for these diagrams was obtained from the [AEC](http://www.aec.gov.au/Elections/Federal_Elections/2013/index.htm)


</p>

<script src="http://d3js.org/d3.v3.min.js?3.4.13"></script>
<script src="http://d3js.org/queue.v1.min.js"></script>
<script src="/js/menucool.js"></script>

<div id="tooltip"></div>
<script>

var margin = {top: 1, right: 1, bottom: 6, left: 1},
    width = 1300 - margin.left - margin.right,
    height = 1200 - margin.top - margin.bottom;
	innerRadius = Math.min(width, height) * .41,
    outerRadius = innerRadius * 1.1;


var formatNumber = d3.format(",.3r"),
    format = function(d) { return formatNumber(d) + " votes"; },
    color = d3.scale.category20();

// The chord layout, for computing the angles of chords and groups.
var layout = d3.layout.chord()
    //.sortGroups(d3.descending)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)
    .padding(.01);



// The arc generator, for the groups.
var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

// The chord generator (quadratic Bézier), for the chords.
var chord = d3.svg.chord()
    .radius(innerRadius);

var states = [];

var maxPref = 10;
var partiesMap = {};
var partiesArr = [];




// Resolve state from query string
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString
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

var state = (QueryString.state === null || (typeof QueryString.state === "undefined")) ? "nsw" : QueryString.state;
var fname = "/data/prefs_" + state + ".txt";


queue()
 .defer(d3.text, fname)
 .await(function(err, partydata) { 
   if (err) console.log(err);

   var n = 0;
   
   d3.dsv(';','text/plain').parseRows(partydata, function(row){
        var partyVal = {
			partyName: row[0],
			partyPrefs: row[2],
			index: n
		};
		var key = row[1].trim();
        partiesMap[key] = partyVal;
		partiesArr[n++] = key;
	  });
	//n -=1;
	console.log("no of parties:" + n);

	// Create matrix data
	var matrix = new Array(n);
	for (var key in partiesMap)
	{ 
	   var prefsStr = partiesMap[key].partyPrefs;
	   var prefs = prefsStr ? prefsStr.split(',') : [];
	   //console.log('>' + prefs);
	   var pidx = partiesMap[key].index;
	   matrix[pidx] = new Array(n);
	   for (var i = 0; i < n; i++) matrix[pidx][i] = 0;
	   var len = prefs.length > maxPref ? maxPref : prefs.length;
	   for (var i = 0; i < len; i++)
	   {
	      var prefparty = prefs[i].trim();
	      var pdata = partiesMap[prefparty];
	      var targetIndex = pdata ? pdata.index : i;
	      var val = maxPref - i;
		  matrix[pidx][targetIndex] = val;
	   };
	};
   
  console.log(matrix);
  
  layout.matrix(matrix)
	.sortGroups();
  
  var g = d3.select("div#chart")
    .append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("id", "circle")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  g.append("circle")
    .attr("r", outerRadius);
	
  var groupPaths = g.selectAll("g.group")
	.data(layout.groups())
    .enter()
	.append("svg:g")
	.on("mouseover", mouseover)
    .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") });

  groupPaths.append("path")
	.attr("class", "group")
	.attr("fill", function(d) {return partyColour(d.index);})
	.attr("d", arc);
	
  groupPaths
	.append("svg:text")
    .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
	.attr("dy", ".35em")
	.style("font-family", "helvetica, arial, sans-serif")
	.style("font-size", "10px")
	.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
	.attr("transform", function(d) {
	  return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
		  + "translate(" + (outerRadius + 10) + ")"
		  + (d.angle > Math.PI ? "rotate(180)" : "");
	})
	.attr('xlink:href', function(d) {return '#' + d.index;})
   .text(function(d) { return partiesMap[partiesArr[d.index]].partyName; });

   //console.log("---" + states[state][0]);
  //console.log(layout.chords());
  
  var chordPaths = g.selectAll("path.chord")
    .data(layout.chords(), chordKey);

  chordPaths.enter()
    .append("svg:path")
	.attr("class", "chord")
	.attr("d", d3.svg.chord().radius(innerRadius))
	.style("fill", function(d) {
		return d3.hsl(130,0.5,(1.0-(d.source.value/(maxPref+1))));
	})
	.style("opacity", 1)
    .on("mouseover", function (d) {
		//console.log("mouseover" + chordTip(d));
		d3.select("#tooltip")
		  .style("visibility", "visible")
		  .html(chordTip(d))
		  .style("top", function () { return (d3.event.pageY - 200)+"px"})
		  .style("left", function () { return (d3.event.pageX - 200)+"px";})
		})
	.on("mouseout", function (d) { 
		d3.select("#tooltip").style("visibility", "hidden") 
	});
	
	//chordPaths.append("svg:linearGradient")
	//	.attr();
	
  
  function chordTip (d) {
	    //console.log("chordTip" + d.source.index);
		//var p = d3.format(".1%"), q = d3.format(",.2r")
		var pa = partiesArr[d.source.index];
		var pb = partiesArr[d.target.index]
		return pa + " → " + pb + 
		  ":<br/>" + ordinalString(maxPref - d.source.value + 1) + " preference<br/>" +
		  pb + " → " + pa + ":<br/> " + ordinalString(maxPref - d.target.value + 1) + " preference";
  }
  
  function mouseover(d, i) {
	d3.select("#tooltip")
	  .style("visibility", "visible")
	  .html(partiesMap[partiesArr[i]].partyName)
	  .style("top", function () { return (d3.event.pageY - 200)+"px"})
	  .style("left", function () { return (d3.event.pageX - 200)+"px";})

	chordPaths.classed("fade", function(p) {
	  return p.source.index != i
		  && p.target.index != i;
	});
}

});

function chordKey(data) {
  return data.source.index + "-" + data.target.index;
}

function partyColour(d) {
  var p = partiesMap[partiesArr[d]].partyName;
  var colours = d3.scale.category20c();
  colours.domain(partiesArr);
  //console.log("partyColor:" + d + " " + p + colours(p));
  
  if (p.lastIndexOf("Australian Labor",0) === 0) {return d3.rgb("#fa5858");}
  else if (p.lastIndexOf("Liberal Democrat",0) === 0) {return d3.rgb("#F3F781");}
  else if (p.lastIndexOf("Liberal",0) === 0) {return d3.rgb("#2e64fe");}
  else if (p.lastIndexOf("Green",0) >= 0) {return d3.rgb("#0B6121");}
  else if (p.lastIndexOf("Australian Greens",0) === 0) {return d3.rgb("#0B6121");}
  else if (p.lastIndexOf("Palmer",0) === 0) {return d3.rgb("#D7DF01");}
  else if (p.lastIndexOf("Sex",0) === 0) {return d3.rgb("#F781F3");}
  else {return colours(partiesArr[d]);}
}

function ordinalString(n) {
	if (n == 11 || n == 12 || n == 13) return n + "th"
	else if (n % 10 == 1) return n + "st"
	else if (n % 10 == 2) return n + "nd"
	else if (n % 10 == 3) return n + "rd"
	else return n + "th";
}

</script>


