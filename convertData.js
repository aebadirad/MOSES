//get our file handler so we can begin
var fs = require('graceful-fs');

//now let's build our initial directories

// first we check data
if (!fs.existsSync('data/')) {
  fs.mkdirSync('data/');
}

// then our admin, feature, and country ones
if (!fs.existsSync('data/admin-codes/')) {
  fs.mkdirSync('data/admin-codes/');
}

if (!fs.existsSync('data/feature-codes/')) {
  fs.mkdirSync('data/feature-codes/');
}

if (!fs.existsSync('data/country-info/')) {
  fs.mkdirSync('data/country-info/');
}

if (!fs.existsSync('data/locations/')) {
  fs.mkdirSync('data/locations/');
}

//let's create our functions here

function convertAdmin1() {
  var lineReader = require('readline').createInterface({
    input: require('graceful-fs').createReadStream(
      'resources/admin1CodesASCII.txt')
  });
  lineReader.on('line', function(line) {
    var tabs = line.split('\t');
    var keys = ['adminCode', 'name', 'asciiname', 'geonameid'];
    var record = {};
    record[keys[0]] = tabs[0];
    record[keys[1]] = tabs[1];
    record[keys[2]] = tabs[2];
    record[keys[3]] = tabs[3];
    var fs = require('graceful-fs');
    var splitName = tabs[0].split('.');
    var dir = 'data/admin-codes/' + splitName[0] + '/';
    var fileName = splitName[1];
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(dir + fileName +
      ".json", JSON.stringify(record),
      function(err) {
        if (err) {
          return console.log(err);
        }
        console.log(dir + fileName + ".json written");
      });
  });
};

function convertAdmin2() {
  var lineReader = require('readline').createInterface({
    input: require('graceful-fs').createReadStream(
      'resources/admin2Codes.txt')
  });
  lineReader.on('line', function(line) {
    var tabs = line.split('\t');
    var keys = ['adminCode', 'name', 'asciiname', 'geonameid'];
    var record = {};
    record[keys[0]] = tabs[0];
    record[keys[1]] = tabs[1];
    record[keys[2]] = tabs[2];
    record[keys[3]] = tabs[3];

    var splitName = tabs[0].split('.');
    var dir = 'data/admin-codes/' + splitName[0] + '/' + splitName[1] + '/';
    var fileName = splitName[2];
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(dir + fileName +
      ".json", JSON.stringify(record),
      function(err) {
        if (err) {
          return console.log(err);
        }
        console.log(dir + fileName + ".json written");
      });
  });
};

function convertFeature() {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(
      'resources/featureCodes_en.txt')
  });
  lineReader.on('line', function(line) {
    var tabs = line.split('\t');
    var keys = ['featureClass', 'featureCode', 'asciiname', 'description'];
    var splitName = tabs[0].split('.');
    var record = {};
    record[keys[0]] = splitName[0];
    record[keys[1]] = splitName[1];
    record[keys[2]] = tabs[1];
    record[keys[3]] = tabs[2];
    var fs = require('graceful-fs');

    var dir = 'data/feature-codes/' + splitName[0] + '/';
    var fileName = splitName[1];
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(dir + fileName +
      ".json", JSON.stringify(record),
      function(err) {
        if (err) {
          return console.log(err);
        }
        console.log(dir + fileName + ".json written");
      });
  });
};

function convertCountry() {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(
      'resources/countryInfo.txt')
  });
  lineReader.on('line', function(line) {
    var tabs = line.split('\t');

    var keys = ['iso', 'iso3', 'isoNumeric', 'fips', 'country', 'capital', 'area', 'population', 'continent', 'tld', 'currencyCode', 'currencyName', 'phone', 'postalCodeFormat', 'postalCodeRegex', 'languages', 'geonameid', 'neighbours', 'equivalentFipsCode'];
    var record = {};
    for (i = 0; i < keys.length; i++) {
      record[keys[i]] = tabs[i];
    }
    var fs = require('fs');

    fs.writeFile("data/country-info/" + tabs[0] +
      ".json", JSON.stringify(record),
      function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('data/country-info/' + tabs[0] + ".json written");
      });
  });
};

function convertLocations() {
  var lineReader = require('readline').createInterface({
    input: require('graceful-fs').createReadStream(
      'resources/allCountries.txt')
  });
  var count = 0;
  //current total, should make this countable somedays via a data on the lineread
  var total = 11004573;
  lineReader.on('line', function(line) {
    count++;
    var tabs = line.split('\t');
    var record = {
      geonameid: tabs[0],
      name: tabs[1],
      asciiname: tabs[2],
      alternatenames: tabs[3],
      geo: { latitude: parseFloat(tabs[4]), longitude: parseFloat(tabs[5]) },
      featureClass: tabs[6],
      featureCode: tabs[7],
      countryCode: tabs[8],
      cc2: tabs[9],
      admin1Code: tabs[10],
      admin2Code: tabs[11],
      admin3Code: tabs[12],
      admin4Code: tabs[13],
      population: parseInt(tabs[14]),
      elevation: parseInt(tabs[15]),
      dem: parseInt(tabs[16]),
      timezone: tabs[17],
      modificationDate: tabs[18]
    };
    var fs = require('fs');
    fs.writeFile("data/locations/" + tabs[0] +
      ".json", JSON.stringify(record),
      function(err) {
        if (err) {
          return console.log(err);
        }

      });
    var percentProgress = (count/total) * 100;
    console.log("data/locations/" + tabs[0] + ".json written. Progress: " + percentProgress.toFixed(2) + '%');
  });

};

// Since admin2 is reliant on admin1, let's do this in order
// todo, later wrap this in a promise. Maybe get bluebird to do it for me
convertCountry();
convertFeature();
convertAdmin1();
convertAdmin2();
convertLocations();
console.log('Success, all data has been converted!')
