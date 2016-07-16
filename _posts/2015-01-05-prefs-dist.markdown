---
layout: post
title:  "Preference calculations"
date:   2015-01-11 19:56:47
categories: preferences
---


<style>
body {
	font - family : "Helvetica Neue",
	Helvetica,
	Arial,
	sans - serif;
	margin : auto;
	position : relative;
	width : 960px;
}
</style>

<style>

.axis path,
.axis line {
	fill : none;
	stroke :  # 000;
	shape - rendering : crispEdges;
}

.dot {
	stroke :  # 000;
}

 </style>
 <body>
 <script src = "http://d3js.org/d3.v3.min.js" ></script>
	<script src = "http://d3js.org/queue.v1.min.js"></script>

	 <div id="results">  </div>

 <script>

	var margin = {
	top : 20,
	right : 20,
	bottom : 30,
	left : 40
},
width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");


// Evaluate the outcome, given the preference matrix and a set of votes.
function evalVotes(matrix, votes) {

	// Set up initial vote allocation
	var unallocatedVotes = [];
	var party = 0;
	var partyIsAlive = new Array(votes.length);
	for (partyVote in votes) {
		unallocatedVotes.push({
			party : partyVote,
			receivedVotes : [{
					party : partyVote,
					votes : +votes[partyVote]
				}
			], // array of incoming prefs. initialise with primary vote
			totalVotes : +votes[partyVote]
		});
		partyIsAlive[partyVote] = true;
	}

	var filledQuotas = [];
	var quota = 1 / 7;

	// Loop: get any filled quotas, eliminate last place, allocate to prefs
	var allPlacesFilled = false;
	do {
		// sort
		var uv = unallocatedVotes.sort(function (a, b) {
				return a.totalVotes - b.totalVotes
			});

		// see if the top position has a full quotas
		var vtop = uv[unallocatedVotes.length - 1];
		if (vtop.totalVotes > quota) {
			// reduce the top vote by the quota
			filledQuotas.push(vtop.party);
			var reduce = quota,
			i = 0;
			do {
				var v = vtop.receivedVotes[i].votes;
				var reduceThisRound = (v > reduce) ? reduce : v;
				vtop.receivedVotes[i++].votes -= reduceThisRound;
				reduce -= reduceThisRound;
			} while ((reduce > 0) && (i < vtop.receivedVotes.length));
			vtop.totalVotes -= quota;

			allPlacesFilled = (filledQuotas.length >= 6);
			continue;
		}

		// remove and reallocate the lowest place
		var loser = unallocatedVotes.shift();
		//console.log('reallocating votes for ' + loser.party);
		// for each party whose votes are here:
		for (p in loser.receivedVotes) {
			// remove the losing party
			var prefparty = loser.receivedVotes[p];
			var pp = prefparty.party;
			// get that party's prefs list
			var prefs = matrix[pp];
			// find the first party that is still alive
			for (mp in prefs) {
				var pref = prefs[mp];
				if (partyIsAlive[pref] && pref != loser.party) {
					// find its entry
					for (u in unallocatedVotes) {
						if (unallocatedVotes[u].party == pref) {
							// reallocate the pref votes
							unallocatedVotes[u].receivedVotes.push({
								party : prefparty.party,
								votes : prefparty.votes
							});
							unallocatedVotes[u].totalVotes += prefparty.votes;
							break;
						}
					}
					break;
				}
			}
		}
		partyIsAlive[loser.party] = false;

	} while (!allPlacesFilled);

	return filledQuotas;
}


queue()
.defer(d3.text, '/data/prefs_nsw.txt')
.await(function (err, prefdata) {
	if (err)
		console.log(err);
	var n = 0;
	var matrix = new Array(n);
	var partiesMap = {};
	var partiesArr = [];

	d3.dsv(';', 'text/plain').parseRows(prefdata, function (row) {

		console.log(row);

		var partyVal = {
			partyName : row[0],
			partyPrefs : row[2],
			index : n
		};
		var key = row[1].trim();
		partiesMap[key] = partyVal;
		partiesArr[n++] = key;
	});

	//n -=1;
	console.log("no of parties:" + n);

	// Create matrix data
	for (var key in partiesMap) {
		var prefsStr = partiesMap[key].partyPrefs;
		var prefs = prefsStr ? prefsStr.split(',') : [];
		//console.log('>' + prefs);
		var pidx = partiesMap[key].index;
		matrix[pidx] = new Array(n);
		for (var i = 0; i < n; i++)
			matrix[pidx][i] = 0;
		var len = prefs.length;
		for (i in prefs) {
			var prefparty = prefs[i].trim();
			var pdata = partiesMap[prefparty];
			var targetIndex = pdata ? pdata.index : i;
			matrix[pidx][i] = targetIndex;
		};
	};

	var votesrange = [{min:0.021, max:0.09}, {min:0.001,max:0.005}, {min:0.001,max:0.005}, {min:0.002,max:0.004}, 
		{min:0.002,max:0.005}, {min:0.001,max:0.005}, {min:0.005,max:0.01}, {min:0.0001,max:0.003}, {min:0.007,max:0.01}, 
		{min:0.001,max:0.005}, {min:0.001,max:0.003}, {min:0.005,max:0.015}, {min:0.003,max:0.0095}, {min:0.007,max:0.015}, 
		{min:0.012,max:0.023}, {min:0.016,max:0.026}, {min:0.001,max:0.005}, {min:0.002,max:0.005}, {min:0.002,max:0.004}, 
		{min:0.002,max:0.005}, {min:0.011,max:0.019}, {min:0.004,max:0.008}, {min:0.001,max:0.005}, {min:0.000005,max:0.000009}, 
		{min:0.015,max:0.025}, {min:0.020,max:0.03}, {min:0.013,max:0.023}, {min:0.003,max:0.006}, {min:0.008,max:0.013}, 
		{min:.006,max:0.009}, {min:0.18,max:0.25}, {min:0.030,max:0.05}, {min:0.004,max:0.006}, {min:0.01,max:0.015}, 
		{min:0.012,max:0.025}, {min:0.045,max:0.066}, {min:0.002,max:0.004}, {min:0.0003,max:0.0007}, {min:0.004,max:0.005}, 
		{min:0.0014,max:0.003}, {min:0.003,max:0.005}, {min:0.006,max:0.008}, {min:0.27,max:0.33}, {min:0.0012,max:0.005}];
	
	var summin = 0, summax = 0, party=0;
	var rangetemp = [];
	var votes = [];
	for (var r in votesrange) {
		summin += votesrange[r].min;
		summax += votesrange[r].max;
		rangetemp.push({party: party++, min: votesrange[r].min, max:votesrange[r].max});
		votes.push[0];
	}
	console.log("range min: " + summin + " max: " + summax);
	
	var sumvotes = 1.0;
	do {
		var p = Math.floor(Math.random() * rangetemp.length);
		var range = rangetemp[p];
		rangetemp.splice(p,1);
		var min = Math.max(range.min, sumvotes - (summax - range.max));
		var max = Math.min(range.max, sumvotes - (summin - range.min));
		var v = min + Math.random() * (max - min);
		votes[range.party] = v;
		sumvotes -= v;
		summin -= range.min;
		summax -= range.max;
	} while(rangetemp.length > 0);
	
	//votes = [0.081, 0.001, 0.0011, 0.002, 0.004, 0.0032, 0.0085, 0.001, 0.008, 0.0062, 0.001, 0.0093, 0.007, 0.014, 0.018, 0.024, 0.005, 0.002, 0.0031, 0.004, 0.016, 0.007, 0.0019, 0.000005, 0.0177, 0.0221, 0.018, 0.00782, 0.0101, 0.00965, 0.21625, 0.034575, 0.0054, 0.0168, 0.017, 0.063, 0.0021, 0.0006, 0.004, 0.0014, 0.0047, 0.0073, 0.31, 0.0032];

	var filledQuotas = evalVotes(matrix, votes);

	var resultText = "Successful parties: ";
	for (f in filledQuotas) {
		resultText += (" : " + partiesArr[filledQuotas[f]]);
	}
	d3.select("#results")
	  .text(resultText);
});

 </script>
