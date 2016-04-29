var Moses = require('/moses.sjs');
var Utils = require('lib/utils.sjs')

var featureFunction = xdmp.getRequestField("function");
var featureCode = xdmp.getRequestField("featureCode");
var featureClass = xdmp.getRequestField("featureClass");
var featureFullCode = xdmp.getRequestField("fullCode");

if(featureFunction === 'allClasses'){
	Moses.Feature.getAllFeatureClassesIndex();
}else if(featureClass && featureFunction === 'getFeatureByClass'){
	Moses.Feature.getFeatureByClass(featureClass);
}