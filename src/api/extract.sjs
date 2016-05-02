var Moses = require('/moses.sjs');
var Utils = require('lib/utils.sjs')
	//let's grab our request field variables so we can see what's being requested
var searchFunction = xdmp.getRequestField("function");
var body = xdmp.getRequestBody();
if (body && searchFunction === 'extractLocations') {
	var text = body.toObject().text;
	Moses.Extract.getNouns(text);
} else if (body && searchFunction === 'confirmLocations') {
	var text = body.toObject().text;
	var nouns = Moses.Extract.getNouns(text);
	Moses.Extract.getLocationsfromNouns(nouns);
} else if (body && searchFunction === 'resolveLocations') {
	var text = body.toObject().text;
	var enrichedText = Moses.Extract.getRaw(text);
	var nouns = Moses.Extract.getNouns(text);
	var locations = Moses.Extract.getLocationsfromNouns(nouns);
	var resolved = Moses.Extract.resolveLocations(locations);
	for(i=0;i<locations.length;i++){
		var highlight = '<span class="highlight" title="'+resolved[i].asciiname.replace("'", '')+'">'+locations[i]+'</span>';
		enrichedText = enrichedText.replace('<span class="NNP">'+locations[i]+'</span>', highlight);
	}
	var response = {'records': resolved, 'text': enrichedText};
	response;
}