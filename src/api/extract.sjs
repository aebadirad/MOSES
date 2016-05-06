var Moses = require('/moses.sjs');
	//let's grab our request field variables so we can see what's being requested
var searchFunction = xdmp.getRequestField("function");
var body = xdmp.getRequestBody();
if (body && searchFunction === 'extractLocations') {
	var text = body.toObject().text;
	Moses.Extract.getNouns(text);
} else if (body && searchFunction === 'confirmLocations') {
	var text = body.toObject().text;
	var nouns = Moses.Extract.getNouns(text);
	Moses.Extract.findPlaceNouns(nouns);
} else if (body && searchFunction === 'resolveLocations') {
	var text = body.toObject().text;
	var response = Moses.Extract.enrichText(text);
	var p = []
	for (var i in response.records) {
		p.push(Moses.QueryFilter.translateFullResult(response.records[i]))
	}
	response.records = p;
	response;
}