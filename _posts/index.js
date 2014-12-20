var express = require('express')
var d3 = require('d3');
var app = express();
var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    index;
var url = require('url');

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

fs.readFile('./index.html', function (err, data) {
if (err) {
    throw err;
}
index = data;
});
http.createServer(function(request, response) {
    var pathname = url.parse(request.url).pathname;
	console.log("Request for " + pathname + " received");
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(index);
    response.end();
}).listen(app.get('port'));


//app.get('/', function(request, response) {
//  response.send('Hello World!')
//})

//app.listen(app.get('port'), function() {
//  console.log("Node app is running at localhost:" + app.get('port'))
//})

 
