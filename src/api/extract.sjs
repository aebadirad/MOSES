var Moses = require('/moses.sjs');
//let's grab our request field variables so we can see what's being requested
var engine = xdmp.getRequestField("engine");
var searchFunction = xdmp.getRequestField("function");
var body = xdmp.getRequestBody();
if (body && searchFunction === 'extractLocations' && !engine) {
	var text = body.toObject().text;
	Moses.Extract.getNouns(text, engine);
} else if (body && searchFunction === 'confirmLocations' && !engine) {
	var text = body.toObject().text;
	var nouns = Moses.Extract.getNouns(text);
	Moses.Extract.findPlaceNouns(nouns);
} else if (body && searchFunction === 'resolveLocations' && !engine) {
	var text = body.toObject().text;
	var response = Moses.Extract.enrichText(text);
	var p = []
	for (var i in response.records) {
		p.push(Moses.QueryFilter.translateFullResult(response.records[i]))
	}
	response.records = p;
	response;
} else if (body && searchFunction === 'extractLocations' && engine === 'nlp') {
	var text = body.toObject().text;
	Moses.Extract.getNounsNLP(text);
} else if (body && searchFunction === 'confirmLocations' && engine === 'nlp') {
	var text = body.toObject().text;
	var nouns = Moses.Extract.getNounsNLP(text);
	Moses.Extract.findPlaceNounsNLP(nouns);
} else if (body && searchFunction === 'resolveLocations' && engine === 'nlp') {
	var text = body.toObject().text;
	var response = Moses.Extract.enrichTextNLP(text);
	var p = []
	for (var i in response.records) {
		p.push(Moses.QueryFilter.translateFullResult(response.records[i]))
	}
	response.records = p;
	response;
}