var Moses = require('/moses.sjs');
var Utils = require('lib/utils.sjs')

var countryFunction = xdmp.getRequestField("function");


if(countryFunction === 'getAllCountries'){
	Moses.Country.getAllCountries();
}