var Moses = require('/moses.sjs');

var countryFunction = xdmp.getRequestField("function");
var code = xdmp.getRequestField("code");

if (countryFunction === 'getAllCountriesDetails') {
	Moses.Country.getAllCountriesDetails();
} else if (countryFunction === 'getAllCountries') {
	Moses.Country.getAllCountries();
} else if (countryFunction === 'getCountryByCode') {
	Moses.Country.getCountryByCode(code);
}