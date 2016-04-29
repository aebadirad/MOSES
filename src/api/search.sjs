//let's include our utils file, this holds some utils and we need to include
// the main moses module, please note the utils is just to handle the web
//service that is written, it doesn't have anything to do with the underlying
//core of MOSES. In fact, you could just include moses.sjs into your project
//if you want it to run server-side in your own service.
var Moses = require('/moses.sjs');
var Utils = require('lib/utils.sjs')
	//let's grab our request field variables so we can see what's being requested
var searchFunction = xdmp.getRequestField("function");
var geonameid = xdmp.getRequestField("id");
var options = xdmp.getRequestBody().toObject();
var lat = xdmp.getRequestField("lat");
var lon = xdmp.getRequestField("lon");

if (geonameid && searchFunction === 'getLocationById') {
	Moses.Location.getLocationById(geonameid);
} else if (geonameid && searchFunction === 'getLocationByIdDetails') {
	Moses.Location.getLocationByIdDetails(geonameid);
} else if (options && searchFunction === 'findLocations') {
	Moses.Location.findLocations(options);
} else if (options && lat && lon && searchFunction === 'findLocationByPoint') {
	Moses.Location.findLocationByPoint(lat, lon, options);
}