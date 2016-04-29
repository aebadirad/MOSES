var Moses = require('/moses.sjs');
var Utils = require('lib/utils.sjs')
var adminFunction = xdmp.getRequestField("function");
var admin1Code = xdmp.getRequestField("admin1Code");
var admin2Code = xdmp.getRequestField("admin2Code");
if (adminFunction === 'getAdmin1Codes') {
1
} else if (adminFunction === 'getAdmin2Codes') {
2
} else if (adminFunction === 'getAdmin3Codes') {
3
}