var Moses = require('/moses.sjs');
var adminFunction = xdmp.getRequestField("function");
var admin1Code = xdmp.getRequestField("admin1Code");
var admin2Code = xdmp.getRequestField("admin2Code");
if (adminFunction === 'getAdmin1Codes') {
//do we reaLLy need admin1codes? it's ISO codes for countries without names, kinda pointless
} else if (adminFunction === 'getAdmin2Codes') {
Moses.AdminCode.getAdmin2CodesByCode(admin1Code);
} else if (adminFunction === 'getAdmin3Codes') {
Moses.AdminCode.getAdmin3CodesByCode(admin1Code, admin2Code);
}