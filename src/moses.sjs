var Moses = {
  name: "Moses",
  //note, marklogic requires this to do the backend calculations for certain geo functions
  geo: require('/MarkLogic/geospatial/geospatial'),
  pos: require('/lib/pos/index.sjs'),
  array_intersect: function(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function(e) {
      if (b.indexOf(e) !== -1) return true;
    });
  },
  closest_number: function(num, arr) {
    var curr = arr[0];
    var diff = Math.abs(num - curr);
    for (var val = 0; val < arr.length; val++) {
      var newdiff = Math.abs(num - arr[val]);
      if (newdiff < diff) {
        diff = newdiff;
        curr = arr[val];
      }
    }
    return curr;
  },
  methods: function(obj) {
    return Object.getOwnPropertyNames(obj).filter(function(p) {
      return typeof obj[p] === 'function';
    });
  },
  post: function(url, parameters, body) {
    var builtUrl = url;
    var i = 0;
    var joiner = '?';
    for (i in parameters) {
      if (i > 0) {
        joiner = '&'
      }
      builtUrl += joiner + parameters[i].key + '=' + parameters[i].value;
      i++;
    }
    var nodeBody = new NodeBuilder();
    nodeBody.addText(body);
    var records;
    var response = xdmp.httpPost(builtUrl, [], nodeBody.toNode()).toArray();
    if (response[0].code !== 200) {
      records = response[0];
    } else {
      records = response[1];
    }
    return records;
  },
  blackList: ['west', 'north', 'east', 'south'],
  config: {
    nlpServer: "http://localhost:9000/",
    nlpParams: [{
      key: 'properties',
      value: '%7B%22annotators%22%3A+%22pos%2C,ner%22%2C+%22outputFormat%22%3A+%22json%22%7D'
    }]
  }
};
Moses.Feature = {
  className: 'Feature',
  getFeatureByCode: function(code) {
    return cts.search(cts.andQuery([cts.collectionQuery('feature-code'),
      cts.jsonPropertyRangeQuery('featureCode', '=', code)
    ])).toArray()[0].root;
  },
  getFeatureByClass: function(featureClass) {
    return cts.search(cts.andQuery([cts.collectionQuery('feature-code'),
      cts.jsonPropertyRangeQuery('featureClass', '=', featureClass)
    ]), cts.indexOrder(cts.jsonPropertyReference('asciiname', []),
      'ascending')).toArray();
  },
  getFeatureByFullCode: function(fullCode) {
    fullCode = fullCode.split('.');
    return this.getFeatureByPair(fullCode[0], fullCode[1]);
  },
  getFeatureNameByFullCode: function(fullCode) {
    fullCode = fullCode.split('.');
    return this.getFeatureNameByPair(fullCode[0], fullCode[1]);
  },
  getFeatureDescriptionByFullCode: function(fullCode) {
    fullCode = fullCode.split('.');
    return this.getFeatureDescriptionByPair(fullCode[0], fullCode[1]);
  },
  getFeatureByPair: function(featureClass, featureCode) {
    return fn.doc('/feature-codes/' + featureClass + '/' + featureCode +
      '.json');
  },
  getFeatureDescriptionByPair: function(featureClass, featureCode) {
    return cts.doc('/feature-codes/' + featureClass + '/' + featureCode +
      '.json').root.description;
  },
  getFeatureNameByPair: function(featureClass, featureCode) {
    return cts.doc('/feature-codes/' + featureClass + '/' + featureCode +
      '.json').root.asciiname;
  },
  getAllFeatureCodesFromClass: function(featureClass) {
    return cts.elementValues(xs.QName('featureCode'), '', ['ascending'],
      cts.andQuery([cts.elementValueQuery(xs.QName('featureClass'),
        featureClass), cts.collectionQuery('feature-code')]));
  },
  getAllFeatureClasses: function() {
    return cts.elementValues(xs.QName('featureClass'), '', [], cts.collectionQuery(
      'feature-code')).toArray();
  },
  getFeatureClassNameByCode: function(featureClass) {
    var result = Moses.Feature.getAllFeatureClassesIndex().filter(function(
      obj) {
      return obj.featureClass === featureClass;
    });
    return result;
  },
  getAllFeatureClassesIndex: function() {
    var staticClasses = [{
      featureClass: 'A',
      name: 'Administrative Boundary Features'
    }, {
      featureClass: 'H',
      name: 'Hydrographic Features'
    }, {
      featureClass: 'L',
      name: 'Area Features'
    }, {
      featureClass: 'P',
      name: 'Populated Place Features'
    }, {
      featureClass: 'R',
      name: 'Road / Railroad Features'
    }, {
      featureClass: 'S',
      name: 'Spot Features'
    }, {
      featureClass: 'T',
      name: 'Hypsographic Features'
    }, {
      featureClass: 'U',
      name: 'Undersea Features'
    }, {
      featureClass: 'V',
      name: 'Vegetation Features'
    }];
    return staticClasses;
  },
  getAllFeatureCodes: function() {
    var features = {};
    var featureClasses = this.getAllFeatureClasses();
    for (i = 0; i < featureClasses.length; i++) {
      var featureClass = featureClasses[i];
      features[featureClass] = this.getAllFeatureCodesFromClass(
        featureClass);
    }
    return features;
  },
  getAllFeatureCodesFull: function() {
    var features = {};
    var featureClasses = this.getAllFeatureClasses();
    for (i = 0; i < featureClasses.length; i++) {
      var featureClass = featureClasses[i];
      var uris = cts.uriMatch('/feature-codes/' + featureClass + '/*');
      features[featureClass] = {};
      for (var uri of uris) {
        var doc = cts.doc(uri);
        var featureCode = doc.root.featureCode;
        features[featureClass][featureCode] = doc.root;
      }
    }
    return features;
  }
};
Moses.Country = {
  className: 'Country',
  getAllCountriesDetails: function() {
    return cts.search(cts.collectionQuery('country'), cts.indexOrder(cts.jsonPropertyReference(
      'country', []), 'ascending')).toArray();
  },
  getAllCountries: function() {
    var countriesList = [];
    var countries = cts.search(cts.collectionQuery('country'), cts.indexOrder(
      cts.jsonPropertyReference('country', []), 'ascending')).toArray();
    for (i = 0; i < countries.length; i++) {
      countriesList.push({
        name: countries[i].root.country,
        iso: countries[i].root.iso
      });
    }
    return countriesList;
  },
  getCountryByCode: function(code) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', code)
    ])).toArray()[0].root;
  },
  getCountryNameByCode: function(code) {
    var result = null;
    var country = cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', code)
    ])).toArray();
    if (country.length > 0) {
      result = country[0].root.country;
    }
    return result;
  },
  getCountryByName: function(name) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.elementValueMatch('country', name.toLowerCase(),
        'case-insensitive')
    ])).toArray()[0].root;
  },
  getCountryById: function(id) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root;
  },
  getCountryNameById: function(id) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root.country;
  },
  getCountriesByContinent: function(continent) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('continent', '=', continent)
    ])).toArray();
  },
  getCountryNamesByContinent: function(continent) {
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('continent', '=', continent)
    ])).toArray().map(function(country) {
      return country.root.country;
    }).sort();
  },
  getCountryNeighborsById: function(id) {
    return String(cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root.neighbours).split(',');
  },
  getCountryNeighborsByName: function(name) {
    return String(cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.elementValueMatch('country', name.toLowerCase(),
        'case-insensitive')
    ])).toArray()[0].root.neighbours).split(',');
  },
  getCountryNeighborsByCode: function(code) {
    return String(cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', code)
    ])).toArray()[0].root.neighbours).split(',');
  },
  getFullCountryNeighborsByCode: function(code) {
    var codes = String(cts.search(cts.andQuery([cts.collectionQuery(
        'country'),
      cts.jsonPropertyRangeQuery('iso', '=', code)
    ])).toArray()[0].root.neighbours).split(',');
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', codes)
    ])).toArray();
  },
  getFullCountryNeighborsById: function(id) {
    var codes = String(cts.search(cts.andQuery([cts.collectionQuery(
        'country'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root.neighbours).split(',');
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', codes)
    ])).toArray();
  }
};
Moses.AdminCode = {
  className: 'AdminCode',
  getFullCodeById: function(id) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root;
  },
  getNameById: function(id) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root.asciiname;
  },
  getCodeById: function(id) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('geonameid', '=', id)
    ])).toArray()[0].root.adminCode;
  },
  getIdByCode: function(code) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('adminCode', '=', code)
    ])).toArray()[0].root.geonameid;
  },
  getFullCodeByCode: function(code) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('adminCode', '=', code)
    ])).toArray()[0].root;
  },
  getNameByCode: function(code) {
    var results = fn.subsequence(cts.search(cts.andQuery([cts.collectionQuery(
        'admin-code'),
      cts.jsonPropertyValueQuery('adminCode', code)
    ])), 1, 1);
    if (results.count > 0) {
      return results.next().value.root.name;
    }
  },
  getAdmin2CodesByCode: function(code) {
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.directoryQuery(["/admin-codes/" + code + '/'])
    ]), cts.indexOrder(cts.jsonPropertyReference('asciiname', []),
      "ascending")).toArray();
  },
  getAdmin3CodesByCode: function(admin1Code, admin2Code) {
      return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
        cts.directoryQuery(["/admin-codes/" + admin1Code + '/' +
          admin2Code + '/'
        ])
      ]), cts.indexOrder(cts.jsonPropertyReference('asciiname', []),
        "ascending")).toArray();
    }
    //todo
    //child admin codes
    //child admin names
    //sibling admin names
    //all admin names
    //all admin codes
    //all admin full
};
//this will build the options query for all types of lookups in the location
Moses.QueryFilter = {
  parseFilterOptions: function(options) {
    var comboQuery = [cts.directoryQuery('/locations/')];
    if ('featureClass' in options && options.featureClass) {
      comboQuery.push(cts.jsonPropertyValueQuery('featureClass', options.featureClass,
        'exact'));
    }
    if ('featureCode' in options && options.featureCode) {
      comboQuery.push(cts.jsonPropertyValueQuery('featureCode', options.featureCode,
        'exact'));
    }
    if ('countryCode' in options && options.countryCode) {
      comboQuery.push(cts.jsonPropertyValueQuery('countryCode', options.countryCode,
        'exact'));
    }
    if ('admin1Code' in options && options.admin1Code) {
      comboQuery.push(cts.jsonPropertyValueQuery('admin1Code', options.admin1Code,
        'exact'));
    }
    if ('admin2Code' in options && options.admin2Code) {
      comboQuery.push(cts.jsonPropertyValueQuery('admin2Code', options.admin2Code,
        'exact'));
    }
    if ('population' in options && options.population) {
      comboQuery.push(cts.jsonPropertyRangeQuery('population', options.population
        .inequality, options.population.amount));
    }
    if ('name' in options && 'fuzzy' in options && !options.fuzzy &&
      options.name) {
      comboQuery.push(cts.jsonPropertyValueQuery(['asciiname', 'name'],
        options.name, ['case-insensitive', 'diacritic-insensitive',
          'punctuation-insensitive', 'whitespace-sensitive',
          'unwildcarded'
        ]));
    }
    if ('name' in options && 'fuzzy' in options && options.name && options.fuzzy) {
      comboQuery.push(cts.jsonPropertyWordQuery(['asciiname', 'name',
        'alternatenames'
      ], options.name, ['case-insensitive', 'diacritic-insensitive',
        'punctuation-insensitive', 'whitespace-sensitive',
        'wildcarded'
      ]));
    }
    if ('geo' in options && options.geo) {
      var geoShape;
      if (options.geo.type === 'circle') {
        geoShape = cts.circle(options.geo.radius, cts.point(options.geo.points[
          0], options.geo.points[1]))
      }
      if (options.geo.type === 'polygon') {
        var polygonPoints = [];
        for (i = 0; i < options.geo.points.length; i++) {
          polygonPoints.push(cts.point(options.geo.points[i][0]), options.geo
            .points[i][1]);
        }
        geoShape = cts.polygon(polygonPoints);
      }
      comboQuery.push(cts.jsonPropertyPairGeospatialQuery('geo', 'latitude',
        'longitude', geoShape));
    }
    return comboQuery;
  },
  parseSearchOptions: function(options) {
    var comboOptions = [];
    var sortOrder = '';
    if (!('sortOrder' in options)) {
      sortOrder = 'ascending';
    } else {
      sortOrder = options.sortOrder;
    }
    if ('sortType' in options && options.sortType) {
      comboOptions.push(cts.indexOrder(cts.jsonPropertyReference(options.sortType, []),
        sortOrder));
    }
    return comboOptions;
  },
  parseLimit: function(options) {
    var limit = 1;
    if ('limit' in options && options.limit) {
      limit = options.limit;
    }
    return limit;
  },
  translateAdminCodes: function(results) {
    var docs = results;
    var translatedDocs = [];
    for (i = 0; i < docs.length; i++) {
      var fullDoc = docs[i].toObject();
      fullDoc.country = Moses.Country.getCountryNameByCode(docs[i].root.countryCode);
      if (fullDoc.admin1Code) {
        fullDoc.province = Moses.AdminCode.getNameByCode(docs[i].root.countryCode +
          '.' + docs[i].root.admin1Code);
      }
      if (fullDoc.admin2Code) {
        fullDoc.district = Moses.AdminCode.getNameByCode(docs[i].root.countryCode +
          '.' + docs[i].root.admin1Code + '.' + docs[i].root.admin2Code);
      }
      if (fullDoc.featureCode) {
        fullDoc.featureName = Moses.Feature.getFeatureNameByPair(fullDoc.featureClass,
          fullDoc.featureCode);
      }
      translatedDocs.push(fullDoc);
    }
    if (translatedDocs.length === 1) {
      translatedDocs = translatedDocs[0];
    }
    return translatedDocs;
  },
  translateFullResult: function(results) {
    var docs;
    if ((Object.prototype.toString.call(results) ===
        '[object ValueIterator]')) {
      docs = results.toArray();
    } else {
      docs = [results];
    }
    var translatedDocs = [];
    for (i = 0; i < docs.length; i++) {
      var fullDoc = docs[i];
      if (typeof docs[i].toObject === 'function') {
        var fullDoc = docs[i].toObject();
      }
      fullDoc.country = Moses.Country.getCountryNameByCode(fullDoc.countryCode);
      if (fullDoc.admin1Code) {
        fullDoc.province = Moses.AdminCode.getNameByCode(fullDoc.countryCode +
          '.' + fullDoc.admin1Code);
      }
      if (fullDoc.admin2Code) {
        fullDoc.district = Moses.AdminCode.getNameByCode(fullDoc.countryCode +
          '.' + fullDoc.admin1Code + '.' + fullDoc.admin2Code);
      }
      if (fullDoc.featureCode) {
        fullDoc.featureName = Moses.Feature.getFeatureNameByPair(fullDoc.featureClass,
          fullDoc.featureCode);
      }
      translatedDocs.push(fullDoc);
    }
    if (translatedDocs.length === 1) {
      translatedDocs = translatedDocs[0];
    }
    return translatedDocs;
  }
};
Moses.Location = {
  getLocationById: function(id) {
    var doc = cts.doc('/locations/' + id + '.json');
    if (doc) {
      doc = doc.root.toObject();
    }
    return doc;
  },
  getLocationByIdDetails: function(id) {
    var doc = cts.doc('/locations/' + id + '.json');
    var fullDoc;
    if (doc) {
      fullDoc = Moses.QueryFilter.translateAdminCodes([doc]);
    }
    return fullDoc;
  },
  //In this, we grow and shrink by percentage rather than fixed mile radius because
  //in the event we have 2 points close to each other and we grow the circle and then
  //find none, we can shrink it by a smaller amount than previous (90% of 110 is more
  //than 90% of 100, if we did it by fixed, we'd search at 100 then 110 then back to
  //100 which would not resolve, so we fluctuate back and forth within .9, 
  //then .91, then .92 etc of the 110 value where we found nothing).
  //We cap it at 300 because we don't want to search forever, estimate is fast and
  //starting at 1 mile, after 300 resizes we should hit something reasonably, falling
  //back to the 'not found' or shortest distance method then to reduce strain on the
  //server
  findLocationByPoint: function(lat, lon, options) {
    var count = 0;
    var tries = 0;
    var radius = 1;
    var result;
    var andQuery = Moses.QueryFilter.parseFilterOptions(options);
    while ((count > 1 || count < 1) && tries < 50 && radius < 25000) {
      tries++;
      count = cts.estimate(cts.andQuery([cts.jsonPropertyPairGeospatialQuery(
        'geo', 'latitude', 'longitude', cts.circle(radius, cts.point(
          lat, lon))), cts.andQuery(andQuery)]));
      if (count < 1) {
        //grow the value by 100% if we can't find anything
        radius = radius * 2;
      } else if (count > 1) {
        //subtract the radius by 10% if we find more than 1
        radius = radius * .9;
      }
    }
    var results = cts.search(cts.andQuery([cts.jsonPropertyPairGeospatialQuery(
      'geo', 'latitude', 'longitude', cts.circle(radius, cts.point(
        lat, lon))), cts.andQuery(andQuery)]));
    if (results.count > 1) {
      results = results.toArray();
      var distances = [];
      for (var i = 0; i < results.length; i++) {
        var longlat = results[i].toObject().geo;
        var point = cts.point(longlat.latitude, longlat.longitude);
        var distance = Moses.geo.distance(cts.point(lat, lon), point)
        distances[i] = distance;
      }
      result = Moses.QueryFilter.translateFullResult(results[distances.indexOf(
        Math.min.apply(null, distances))]);
    } else if (results.count < 1) {
      result = [];
    } else {
      result = Moses.QueryFilter.translateFullResult(fn.subsequence(results,
        1, 1));
    }
    return result;
  },
  findLocationsByCircle: function(lat, lon, size) {
    return cts.search(cts.jsonPropertyPairGeospatialQuery('geo', 'latitude',
      'longitude', cts.circle(size, cts.point(lat, lon)))).toArray();
  },
  findLocationByPolygon: function(points) {
    if (points.constructor === Array) {
      points = points.join(' ');
    }
    return cts.search(cts.jsonPropertyPairGeospatialQuery('geo', 'latitude',
      'longitude', cts.polygon(points))).toArray();
  },
  findLocations: function(options) {
    var andQuery = Moses.QueryFilter.parseFilterOptions(options);
    var searchOptions = Moses.QueryFilter.parseSearchOptions(options);
    var limit = Moses.QueryFilter.parseLimit(options);
    return fn.subsequence(cts.search(cts.andQuery(andQuery), searchOptions),
      1, limit);
  }
};
Moses.Extract = {
  name: 'Extract',
  phraseCategories: {
    PCLI: {
      forward: [],
      back: ['the nation of', 'the country of', 'the state of', 'capitol of', 'the government of']
    },
    ADM1: {
      forward: ['state', 'province'],
      back: ['the state of', 'province of', 'the capitol of', 'state government of',
        'provincial government of', 'a city in'
      ]
    },
    PPL: {
      forward: ['city', 'is the capitol'],
      back: ['city of']
    },
    ADM2: {
      forward: ['district', 'county'],
      back: ['country of', 'district of']
    }
  },
  tagWords: function(text) {
    var result = new Array();
    var words = new Moses.pos.Lexer().lex(text);
    var tagger = new Moses.pos.Tagger();
    var taggedWords = tagger.tag(words);
    var lastWord = '';
    var lastTag = '';
    var lastType = '';
    for (i = 0; i < taggedWords.length; i++) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      var count = result.length - 1;
      var oneBehind = 0;
      oneBehind = i;
      oneBehind--;
      var backpeek = taggedWords[oneBehind] ? taggedWords[oneBehind] : [];
      var oneAhead = 0;
      oneAhead = i;
      oneAhead++;
      twoAhead = oneAhead + 1;
      var peek = taggedWords[oneAhead] ? taggedWords[oneAhead] : [];
      var peek2 = taggedWords[twoAhead] ? taggedWords[oneAhead] : [];
      //all junk responses go here
      //yeaaah this is gonna need to be its own regex or array kept elsewhere. This is silly.
      if (word === '£' || word === "$" || word === "@" || word === '^' || word === '--' || word ===
        '\\' ||
        ((word === 'A' || word === 'I') && peek !== '.') || word === '/' || word === "%" ||
        word === "*") {
        tag = 'JUNK';
      }
      if ((tag === 'JJ' && (peek[1] !== 'NN' && peek2[1] === 'NNP' && peek[1] !== 'CC') || (tag ===
          'NNS' && peek[1] === 'NNP') || (tag === 'VB' && word[0] === word[0].toUpperCase() &&
          lastTag === 'NNP') || (tag ===
          'NNS' && peek[1] === 'VB' && peek[0][0] === peek[0][0].toUpperCase()) || (tag ===
          'JJ' && peek[1] === 'NNP')) && word[0] ===
        word[0].toUpperCase()) {
        tag = 'NNP';
      }
      if ((tag === 'VBN' && peek[1] === 'NNP' && word[0] === word[0].toUpperCase()) ||
        (lastTag === 'NNP' && tag === 'NNPS' && word[0] === word[0].toUpperCase())
      ) {
        tag = 'NNP';
      }
      if (tag === 'NN') {
        var matches = cts.estimate(cts.jsonPropertyValueQuery('word', word, [
          'exact'
        ]));
        if (matches == 0) {
          tag = 'NNP';
        }
      }
      if (tag === 'PRP' && word.length > 1 && word === word.toUpperCase()) {
        result.push({
          word: word,
          tag: 'NNP'
        });
      } else if (lastTag === "." && tag === 'NNP') {
        var commonMatches = cts.estimate(cts.jsonPropertyValueQuery('word', word, [
          'exact'
        ]));
        if (commonMatches > 0) {
          tag = 'NN';
        }
        result.push({
          word: word,
          tag: tag
        });
      } else if (tag === 'NNP') {
        var NNPCount = 1;
        var nextWord = taggedWords[i + 1];
        var combinedWords = word;
        while ((nextWord && i < taggedWords.length) && (nextWord[0] === "." ||
            nextWord[0] === "'" || nextWord[1] === 'PRP' || nextWord[1] ===
            'NNP' || (nextWord[1] === 'NN' && nextWord[0][0] === nextWord[0]
              [0].toUpperCase()))) {
          var commonMatches = 0;
          if (nextWord[0].length > 1) {
            commonMatches = cts.estimate(cts.jsonPropertyValueQuery('word', nextWord[0].toLowerCase(), [
              'exact'
            ]));
            combinedWords += ' ';
          }
          var totalDots = combinedWords.match(RegExp('\\.', 'g')) ? combinedWords.match(RegExp(
            '\\.', 'g')).length : 0;
          if (((nextWord[1] === 'PRP' || commonMatches > 0 || (nextWord[1] === 'NNP' &&
              nextWord[
                0].length > 1)) && taggedWords[i][0] === "." && totalDots < 2) || nextWord[0] ===
            "." && taggedWords[i][0].length > 2 && totalDots <= 1) {
            break;
          }
          combinedWords += nextWord[0];
          i++;
          nextWord = taggedWords[i + 1];
        }
        result.push({
          word: combinedWords,
          tag: 'NNP'
        });
      } else {
        result.push({
          word: word,
          tag: tag
        });
      }
      lastWord = word;
      lastTag = tag;
      if (word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
        lastType = 'word';
      } else {
        lastType = 'punc';
      }
    }
    return result;
  },
  getNouns: function(text) {
    var result = [];
    var taggedWords = Moses.Extract.tagWords(text);
    var lastTag = '';
    var lastType = '';
    var lWord = '';
    for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord.word.trim();
      var tag = taggedWord.tag;
      var count = result.length - 1;
      if (tag === 'NNP' || tag === 'IN') {
        if ((lastTag === 'NNP' && tag === 'NNP' && lWord.slice(-1) !== ".") || (tag === 'IN' &&
            word.toLowerCase() ===
            'of' && lastTag === 'NNP') || (lastTag === 'IN' && tag ===
            'NNP' && lWord.toLowerCase() === 'of' && result[result.length -
              1].word.indexOf(' ') >= 0)) {
          var lastWord = result[count].word;
          var joiner = '';
          if (lastType === 'word') {
            joiner = ' ';
          }
          result[count] = {
            tag: tag,
            word: lastWord + joiner + word
          };
        } else {
          result.push({
            tag: tag,
            word: word
          });
        }
      } else if (tag === 'NN' && lastTag === 'NN') {
        var lastWord = result[count].word + ' ' + word;
        var matches = cts.estimate(cts.andQuery([cts.directoryQuery(
            '/locations/'),
          cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
            lastWord, ['whitespace-sensitive', 'case-insensitive',
              'unwildcarded'
            ])
        ]));
        if (matches > 0) {
          tag = 'NNP';
        }
        result[count] = {
          tag: tag,
          word: lastWord
        };
      } else if (tag === 'NN' && (word[0] === word[0].toUpperCase()) && (
          cts.estimate(cts.jsonPropertyValueQuery('word', word.toLowerCase(), [
            'exact'
          ])) === 0) && lastTag !== ".") {
        var matches = cts.estimate(cts.andQuery([cts.directoryQuery(
            '/locations/'),
          cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
            word, ['whitespace-sensitive', 'case-insensitive',
              'unwildcarded'
            ])
        ]));
        if (matches > 0) {
          tag = 'NNP';
        }
        result.push({
          tag: tag,
          word: word
        });
      } else {
        result.push({
          tag: tag,
          word: word
        });
      }
      if (word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
        lastTag = tag;
        lastType = "word";
      } else {
        lastType = "punctuation";
        lastTag = tag;
      }
      lWord = word;
    }
    return result;
  },
  getRaw: function(text) {
    var words = new Moses.pos.Lexer().lex(text);
    result = [];
    var tagger = new Moses.pos.Tagger();
    var taggedWords = tagger.tag(words);
    var lastTag = '';
    var lastType = '';
    for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (tag === 'NNP') {
        if (lastTag === 'NNP') {
          var count = result.length - 1;
          var lastWord = result[count];
          var joiner = '';
          if (lastType === 'word') {
            joiner = ' ';
          }
          result[count] = ' <span class="NNP">' + lastWord.replace(
              '<span class="NNP">', '').replace('</span>', '').trim() +
            joiner + word + '</span>';
        } else {
          result.push(' <span class="NNP">' + word + '</span>');
        }
      } else {
        if (word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
          word = ' ' + word;
        }
        result.push(word);
      }
      if (word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
        lastTag = tag;
        lastType = "word";
      } else {
        lastType = "punctuation";
      }
    }
    return result.join('');
  },
  findPlaceNouns: function(nouns) {
    var foundNouns = [];
    var failed = '';
    for (i = 0; i < nouns.length; i++) {
      var word = nouns[i].word;
      var tag = nouns[i].tag;
      var allCaps = word.toUpperCase() === word ? true : false;
      if (tag === 'NNP') {
        var caseSense = 'case-insensitive';
        if (word[0] === word[0].toUpperCase() || word === word.toUpperCase()) {
          caseSense = 'case-sensitive';
        }
        word = word.trim();
        var clipped = '';
        if (word.substr(word.length - 2, 2) === "'s") {
          clipped = word.substr(word.length - 2, 2);
          word = word.substr(0, word.length - 2);
        }
        if ((word.substr(word.length - 1, 1) === "'" || word.substr(word.length -
            1, 1) === ".") && !allCaps) {
          clipped = word.substr(word.length - 1, 1);
          word = word.substr(0, word.length - 1);
        }
        var found = 0;
        var failedArray = failed.split(" ");
        if (failedArray.indexOf(word) === -1) {
          found = cts.estimate(cts.andQuery([cts.directoryQuery(
              '/locations/'),
            cts.jsonPropertyValueQuery(['asciiname'],
              word, ['exact'])
          ]));
          if (found == 0 && allCaps) {
            found = cts.estimate(cts.andQuery([cts.directoryQuery(
                '/locations/'),
              cts.jsonPropertyValueQuery(['alternatenames'],
                word, ['exact'])
            ]));

          }
        }
        if (found > 0) {
          foundNouns.push({
            word: word + clipped,
            tag: 'NNPL'
          });
        } else {
          failed += ' ' + word;
          foundNouns.push({
            word: word + clipped,
            tag: tag
          });
        }
      } else {
        foundNouns.push({
          word: word,
          tag: tag
        });
      }
    }
    return foundNouns;
  },
  resolveLocation: function(word) {
    //this needs to be made into a common function with the one above
    if (word.substr(word.length - 2, 2) === "'s") {
      word = word.substr(0, word.length - 2);
    }
    if (word.substr(word.length - 1, 1) === "'" || word.substr(word.length -
        1, 1) === ".") {
      word = word.substr(0, word.length - 1);
    }
    var result = fn.subsequence(cts.search(cts.andQuery([cts.directoryQuery(
      '/locations/'), cts.jsonPropertyWordQuery(['asciiname',
      'alternatenames'
    ], word, ['case-insensitive', 'whitespace-sensitive',
      'unwildcarded', 'punctuation-insensitive'
    ])]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
      'descending'), cts.indexOrder(cts.jsonPropertyReference(
      'geonameid', []), 'ascending')]), 1, 1);
    return result;
  },
  resolveLocations: function(wordList, text) {
    var response = {
      records: [],
      text: text
    };
    var nonNNPL = wordList.filter(function(word) {
      return word.tag !== "NNPL";
    });
    for (i = 0; i < nonNNPL.length; i++) {
      var word = nonNNPL[i].word;
      var tag = nonNNPL[i].tag;
      var replaceText = '';
      if (tag === 'NNP' || tag === 'NN' || tag === 'NNS') {
        replaceText += ' <span class="' + tag + '">' + word + '</span>';
        var re = new RegExp('(\\b' + ' ' + word.replace(
            /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +
          ')(?![^<]*>|[^<>]*<\\/|[]*-)');
        response.text = response.text.replace(re, replaceText);
      }
    }
    var idList = [];
    for (i = 0; i < wordList.length; i++) {
      var word = wordList[i].word;
      var tag = wordList[i].tag;
      var replaceText = '';
      var id = '';
      if (tag === 'NNPL') {
        var loc = Moses.Extract.resolveLocation(word);
        if (loc.count > 0) {
          id = loc.clone().next().value.root.geonameid;
        }
        if (id) {
          replaceText += '<span class="highlight" geoid="' + id + '">' +
            word + '</span>';
          var re = new RegExp('(\\b' + word.replace(
              /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +
            ')(?![^<]*>|[^<>]*<\\/|[]*-)');
          response.text = response.text.replace(re, replaceText);
          if (idList.indexOf(word) === -1) {
            idList.push(word);
            response.records.push(loc);
          }
        }
      }
    }
    return response;
  },
  rebuildFromTags: function(places) {
    var string = '';
    var quoted = false;
    for (i in places) {
      var joiner = '';
      var b = 0;
      b = b + i;
      b--;
      if (places[i].word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")) {
        if (places[i].word === '"') {
          if (quoted === false) {
            quoted = true;
            joiner = ' ';
          } else {
            quoted = false;
          }
          string += joiner + places[i].word;

        } else {
          if (!(quoted === true && places[b].word === "\"")) {
            joiner = ' ';
          }
          string += joiner + places[i].word;
        }
      } else {

        string += places[i].word;
      }
    }
    return string.trim()

  },
  resolveEnrichedText: function(places) {
    var response = {
      records: [],
      text: ''
    }

    var text = '';
    var quoted = false;
    var idList = [];
    for (i in places) {
      var place = places[i].word;
      var tag = places[i].tag;
      var id;
      if (tag === 'NNPL') {
        var loc = Moses.Extract.resolveLocation(place);
        if (loc.count > 0) {
          id = loc.clone().next().value.root.geonameid;
        }
        if (id) {
          if (idList.indexOf(place) === -1) {
            idList.push(place);
            response.records.push(loc);
          }
          place = '<span class="' + tag + ' highlight" geoid="' + id + '">' + places[i].word +
            '</span>';
        }
      }
      if (tag === 'NNP') {
        place = '<span class="' + tag + '">' + places[i].word + '</span>';
      }
      var joiner = '';
      var b = 0;
      b = b + i;
      b--;
      var lastPlace = places[b];
      if (places[i].word.replace(/[.,\/#!$%\^&\*;:{}\)=\-_`'~]/g, "")) {
        if (places[i].word === '"') {
          if (quoted === false) {
            quoted = true;
            joiner = ' ';
          } else {
            quoted = false;
          }
          text += joiner + place;

        } else {
          if ((!(quoted === true && text.slice(-1) === '"'))) {
            joiner = ' ';
          }
          if (text.slice(-1) === '(' || text.slice(-1) === '-' || (text.slice(-1) === "'" &&
              place.length === 1)) {
            joiner = '';
          }
          text += joiner + place;
        }
      } else {

        text += place;
      }
    }
    response.text = text.trim();
    return response;
  },
  enrichText: function(text) {
    var locs = Moses.Extract.getNouns(text)
    var places = Moses.Extract.findPlaceNouns(locs);
    return Moses.Extract.resolveEnrichedText(places);
  },
  //below here are NLP 'overrides' of the versions of the above
  getNounsNLP: function(text) {
    var nlpRes = Moses.post(Moses.config.nlpServer, Moses.config.nlpParams, text).toObject();
    var sentences = nlpRes.sentences;
    var sentenceList = [];
    for (var s in sentences) {
      var sentence = sentences[s];
      var taggedWords = sentence.tokens;
      var wordList = [];
      var wordCount = 0;
      var lastWord = "";
      var lastTag = "";
      for (var i in taggedWords) {
        var wordObject = taggedWords[i];
        var tag = wordObject.pos;
        var word = wordObject.word;
        var ner = wordObject.ner;
        var f = wordCount;
        f++;
        var b = wordCount
        if (wordCount > 0) {
          b--;
        }
        var nextObject = taggedWords[f];
        var prevObject = taggedWords[b];
        //we probably want to break these out in the future so they don't get like the tagger code above

        //3 letter code check: is it a word? If so
        if (word.length === 3 && (wordObject.pos === 'NNPS' || wordObject.pos === 'NNP')) {
          var matches = cts.estimate(cts.jsonPropertyValueQuery('word', word.toLowerCase(), [
            'exact'
          ]));
          if (matches == 0) {
            wordObject.pos = 'NNP';
          }
        }

        if (ner === 'LOCATION') {
          wordObject.pos = 'NNP'
        }

        if (ner === 'O' && (wordObject.pos === 'VB' || wordObject.pos === 'JJ') && word[0] ===
          word[0].toUpperCase() && wordObject.index !== 1 && nextObject.pos === 'NNP') {
          wordObject.pos = 'NNP';
        }

        if ((wordObject.pos === 'NN' || wordObject.pos === 'NNS') && ner === 'O') {
          var matches = cts.estimate(cts.jsonPropertyValueQuery('word', word.toLowerCase(), [
            'exact'
          ]));
          if (matches == 0) {
            wordObject.pos = 'NNP';
          }
        }

        //this thing looking back
        if (((wordObject.pos === 'NNP' || wordObject.pos === 'NNPS') && (lastTag === 'NNP')) &&
          wordObject.ner !==
          'DATE') {
          var prevWordList = wordList[wordList.length - 1];
          wordObject.word = prevWordList.word + prevWordList.after + wordObject.word;
          wordObject.originalText = prevWordList.originalText + prevWordList.after + wordObject
            .originalText;
          wordObject.characterOffsetBegin = prevWordList.characterOffsetBegin;
          wordObject.before = prevWordList.before;
          wordObject.pos = prevWordList.pos;
          wordList[wordList.length - 1] = wordObject;
        } else {
          wordList.push(wordObject);
        }
        lastTag = wordObject.pos;
        lastWord = wordObject.word;
        wordCount++;
      }
      sentenceList.push(wordList);
    }
    return sentenceList;
  },
  findPlaceNounsNLP: function(sentences) {
    var sentenceList = [];
    for (var s in sentences) {
      var taggedWords = sentences[s];
      var wordList = [];
      var wordCount = 0;
      var lastWord = "";
      var lastTag = "";
      //first pass, let's grab the confirmeds and weed out the false positives
      for (var i in taggedWords) {
        var wordObject = taggedWords[i];
        var matchFound = 0;
        var tag = wordObject.pos;
        var word = wordObject.word;
        var ner = wordObject.ner;
        var f = wordCount;
        f++;
        var b = wordCount
        if (wordCount > 0) {
          b--;
        }
        var nextObject = taggedWords[f];
        var prevObject = taggedWords[b];
        if ((wordObject.ner === 'LOCATION' || (lastWord.toLowerCase() !== 'the' && wordObject.ner ===
            'ORGANIZATION')) && Moses.blackList
          .indexOf(wordObject.word.toLowerCase()) === -1) {
          matchFound = cts.estimate(cts.andQuery([cts.directoryQuery(
              '/locations/'),
            cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
              word, ['exact'])
          ]));
        }
        if (wordObject.ner === 'O' && (wordObject.pos === 'NN' || wordObject.pos === 'NNP') &&
          (word.length === 2 || word.length === 3) && word === word.toUpperCase() && lastTag ===
          ",") {
          wordObject.pos = 'NNPL';
          matchFound = 1;
        }

        if (ner === 'O' && (wordObject.pos === 'NNPS' || wordObject.pos === 'NNP')) {
          var matches = cts.estimate(cts.jsonPropertyValueQuery('word', word.toLowerCase(), [
            'exact'
          ]));
          if (matches > 0) {
            wordObject.pos = 'NNPD';
          }
        }

        if (wordObject.ner === 'O' && (wordObject.pos ===
            'NNP' || wordObject.pos === 'NN') && parseInt(cts.estimate(cts.jsonPropertyValueQuery(
            'word', word.toLowerCase(), [
              'exact'
            ]))) === 0) {
          matchFound = cts.estimate(cts.andQuery([cts.directoryQuery(
              '/locations/'),
            cts.jsonPropertyRangeQuery(['asciiname', 'alternatenames'],
              '=', word)
          ]));
        }
        // is it an acronym? just a word? capitolized? what?
        wordObject = Moses.Extract.setPlaceStats(wordObject);

        if (matchFound > 0) {
          var exactType = Moses.Extract.isOnlyPlace(wordObject);
          if (exactType) {
            sentences[s][i] = Moses.Extract.getOnlyPlace(wordObject, exactType);
          } else {
            sentences[s][i].confirmed = false;
          }
          sentences[s][i].pos = 'NNPL';
          sentences[s][i].locations = [];
        }

        lastTag = wordObject.pos;
        lastWord = wordObject.word;
        wordCount++;
      }
      //sentenceList.push(wordList);
      //Now, we're at the end of the sentence. We can go back and evaluate the things
      //that didn't make an insta-confirmation.
      var updatedWords = sentences[s];
      var confirmedLocations = Moses.Extract.scanConfirmedLocations(sentences[s]);
      var countLocations = Moses.Extract.countLocations(sentences[s]);
      if (countLocations === confirmedLocations.length) {
        //if there's no locations, no point in looping through, or if all are confirmed
        continue;
      }
      if (confirmedLocations.length === 0 && countLocations === 1 && parseInt(s) === 0) {
        for (var i in updatedWords) {
          if (updatedWords[i].pos === 'NNPL') {
            sentences[s][i].location = Moses.Extract.getDefault(updatedWords[i]);
            //save processing by breaking the loop
            break;
          }
        }
        // we don't want to continue going through the same dead end sentence.
        continue;
      }
      for (var i in updatedWords) {
        if (updatedWords[i].pos === 'NNPL') {
          var index = updatedWords[i].index;

          //check to see if this is a  place,place pair.
          if (Moses.Extract.isPlacePair(updatedWords, i)) {
            var f = parseInt(i) + 2;
            var resolvedPlaces = Moses.Extract.resolvePlacePair(updatedWords, i);
            if (resolvedPlaces.first.length > 0 || resolvedPlaces.second.length > 0) {
              if (resolvedPlaces.first.length === 1 && !updatedWords[i].confirmed) {
                updatedWords[i].location = resolvedPlaces.first[0];
                updatedWords[i].confirmed = true;
                sentences[s][i] = updatedWords[i];
              }
              if (resolvedPlaces.second.length === 1 && !updatedWords[f].confirmed) {
                updatedWords[f].location = resolvedPlaces.second[0];
                updatedWords[f].confirmed = true;
                sentences[s][f] = updatedWords[f];
              }
              if (resolvedPlaces.second.length > 1 && !updatedWords[f].confirmed) {
                sentences[s][f].locations = resolvedPlaces.second;
              }
              if (resolvedPlaces.first.length > 1 && !updatedWords[i].confirmed) {
                sentences[s][i].locations = resolvedPlaces.first;
              }
            }
            //if we don't match anything on the pass, that's okay, we'll catch it in the final
            //go around.
          }
        }
      }
      // end of first pass

      // now we do a second pass to resolve the unconfirmed possibles
      for (s in sentences) {
        var sentence = sentences[s];
        var confirmedLocations = Moses.Extract.scanConfirmedLocations(sentences[s]);
        var countLocations = Moses.Extract.countLocations(sentences[s]);
        if (countLocations === confirmedLocations.length) {
          //if there's no locations, no point in looping through, or if all are confirmed
          continue;
        }
        //now let's go through the words and find the unconfirmed locations with multiple possible locs
        for (i in sentence) {
          var wordObject = sentence[i];
          if (wordObject.pos === 'NNPL' && (wordObject.locations.length > 1) && !wordObject.confirmed) {
            // let's see how close the other confirmed locations are
            if (confirmedLocations.length > 0) {
              var confirmedLocs = [];
              for (loc in confirmedLocations) {
                confirmedLocs.push(confirmedLocations[loc].index);
              }
              var closest = Moses.closest_number(i, confirmedLocs);
              var closestConf = confirmedLocations.filter(function(el) {
                return el.index === closest;
              })[0];
              var countryCode = closestConf.location.countryCode;
              var admin1Code = closestConf.location.admin1Code;
              var matches = wordObject.locations.filter(function(el) {
                return (el.countryCode === countryCode && el.admin1Code === admin1Code);
              });

              if (matches.length === 1) {
                wordObject.location = matches[0];
                wordObject.confirmed = true;
                wordObject.locations = null;
                sentences[s][i] = wordObject;
              } else if (matches.length > 1) {
                //well crap, there's two things named exactly at this level now. Or more. Time to get the most popular.
                //now lets see if there's exact names
                var exactMatches = matches.filter(function(el) {
                  return (el.name.toLowerCase() === wordObject.word.toLowerCase() || el.asciiname
                    .toLowerCase() === wordObject.word.toLowerCase());
                });
                if (exactMatches.length > 0) {
                  matches = exactMatches;
                }
                var mostPopulation = Math.max.apply(Math, matches.map(function(o) {
                  return o.population;
                }));
                var mostPopulated = matches.filter(function(o) {
                  return o.population === mostPopulation;
                })[0];
                wordObject.location = mostPopulated;
                wordObject.confirmed = true;
                wordObject.locations = null;
                sentences[s][i] = wordObject;
              }
            }
          }
        }

        //one more time we loop, now we have no confirmation help.
        for (i in sentence) {
          var wordObject = sentence[i];
          if (wordObject.pos === 'NNPL' && (!wordObject.locations.length || wordObject.locations
              .length === 0) && !wordObject.confirmed) {
            if (confirmedLocations.length > 0) {
              var confirmedLocs = [];
              for (loc in confirmedLocations) {
                confirmedLocs.push(confirmedLocations[loc].index);
              }
              var closest = Moses.closest_number(i, confirmedLocs);
              var closestConf = confirmedLocations.filter(function(el) {
                return el.index === closest;
              })[0];
              var countryCode = closestConf.location.countryCode;
              var admin1Code = closestConf.location.admin1Code;
              var estimate = parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
                  '/locations/'),
                cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
                  wordObject.word, ['case-insensitive', 'whitespace-sensitive',
                    'diacritic-insensitive',
                    'unwildcarded'
                  ]), cts.jsonPropertyValueQuery('admin1Code', admin1Code, [
                  'exact'
                ]), cts.jsonPropertyRangeQuery('countryCode', '=', countryCode)
              ])));
              var location;
              if (estimate > 0) {
                location = cts.search(cts.andQuery([cts.directoryQuery(
                    '/locations/'),
                  cts.jsonPropertyValueQuery(['asciiname', 'name'],
                    wordObject.word, ['case-insensitive', 'whitespace-sensitive',
                      'diacritic-insensitive',
                      'unwildcarded'
                    ]), cts.jsonPropertyValueQuery('admin1Code', admin1Code, [
                    'exact'
                  ]), cts.jsonPropertyRangeQuery('countryCode', '=', countryCode)
                ]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
                  'descending'), cts.indexOrder(cts.jsonPropertyReference(
                  'geonameid', []), 'ascending')]).toArray()[0];
                if (!location) {
                  location = cts.search(cts.andQuery([cts.directoryQuery(
                      '/locations/'),
                    cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
                      wordObject.word, ['case-insensitive', 'whitespace-sensitive',
                        'diacritic-insensitive',
                        'unwildcarded'
                      ]), cts.jsonPropertyValueQuery('admin1Code', admin1Code, [
                      'exact'
                    ]), cts.jsonPropertyRangeQuery('countryCode', '=', countryCode)
                  ]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
                    'descending'), cts.indexOrder(cts.jsonPropertyReference(
                    'geonameid', []), 'ascending')]).toArray()[0];
                }
              } else {
                location = cts.search(cts.andQuery([cts.directoryQuery(
                    '/locations/'),
                  cts.jsonPropertyValueQuery(['asciiname', 'name'],
                    wordObject.word, ['case-insensitive', 'whitespace-sensitive',
                      'diacritic-insensitive',
                      'unwildcarded'
                    ])
                ]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
                  'descending'), cts.indexOrder(cts.jsonPropertyReference(
                  'geonameid', []), 'ascending')]).toArray()[0];
                if (!location) {
                  location = cts.search(cts.andQuery([cts.directoryQuery(
                      '/locations/'),
                    cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
                      wordObject.word, ['case-insensitive', 'whitespace-sensitive',
                        'diacritic-insensitive',
                        'unwildcarded'
                      ])
                  ]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
                    'descending'), cts.indexOrder(cts.jsonPropertyReference(
                    'geonameid', []), 'ascending')]).toArray()[0];
                }
              }
              if (location) {
                wordObject.location = location.toObject();
                wordObject.confirmed = true;
                sentences[s][i] = wordObject;
              }
            }
          }
        }
      }
    }
    return sentences;
  },
  isPlacePair: function(updatedWords, i) {
    var f = parseInt(i) + 1;
    var f2 = parseInt(i) + 2;
    if (updatedWords[f] && updatedWords[f2] && updatedWords[f].word === ',' && updatedWords[f2]
      .pos === 'NNPL') {
      return true;
    } else {
      return false;
    }
  },
  resolvePlacePair: function(updatedWords, i) {
    var f = parseInt(i) + 2;
    var thisWord = updatedWords[i];
    var nextWord = updatedWords[f];
    var locations = {
      first: [],
      second: []
    };
    //check if any of these are confirmed locations
    if (!nextWord.confirmed && thisWord.confirmed) {
      //the 'lower' is confirmed here
      var thisWordConfirmed = Moses.Extract.getByConfirmedLower(thisWord, nextWord);
      if (thisWordConfirmed) {
        locations.second = thisWordConfirmed;
      }
    } else if (nextWord.confirmed && !thisWord.confirmed) {
      //the 'higher' is confirmed here

      var nextWordConfirmed = Moses.Extract.getByConfirmedHigher(nextWord, thisWord);
      if (nextWordConfirmed) {
        locations.first = nextWordConfirmed;
      }
    } else if (!nextWord.confirmed && !thisWord.confirmed) {
      //doh, neither is confirmed, more processing required!
      var unconfirmedPair = Moses.Extract.getUnconfirmedPair(thisWord, nextWord);
      if (unconfirmedPair) {
        locations.first = unconfirmedPair.first;
        locations.second = unconfirmedPair.second;
      }
    }
    return locations;
  },
  getPhraseCategories: function(updatedWords, i) {
    var categories = [];
    var oneForward = updatedWords[i == updatedWords.length - 1 ? 0 : i + 1] ? updatedWords[i ==
      updatedWords.length - 1 ? 0 : i + 1] : {
      word: '',
      after: ''
    };
    var twoForward = updatedWords[i == updatedWords.length - 2 ? 0 : i + 2] ? updatedWords[i ==
      updatedWords.length - 2 ? 0 : i + 2] : {
      word: '',
      after: ''
    };
    var threeForward = updatedWords[i == updatedWords.length - 3 ? 0 : i + 3] ? updatedWords[i ==
      updatedWords.length - 3 ? 0 : i + 3] : {
      word: '',
      after: ''
    };
    var oneBack = updatedWords[i == 0 ? updatedWords.length - 1 : i - 1] ? updatedWords[i == 0 ?
      updatedWords.length - 1 : i - 1] : {
      word: '',
      after: ''
    };
    var twoBack = updatedWords[i == 1 ? updatedWords.length - 2 : i - 2] ? updatedWords[i == 1 ?
      updatedWords.length - 2 : i - 2] : {
      word: '',
      after: ''
    };
    var threeBack = updatedWords[i == 2 ? updatedWords.length - 3 : i - 3] ? updatedWords[i ==
      2 ? updatedWords.length - 3 : i - 3] : {
      word: '',
      after: ''
    };
    var beforeText = threeBack.word + threeBack.after + twoBack.word + twoBack.after + oneBack.word;
    var afterText = oneForward.word + oneForward.after + twoForward.word + twoForward.after +
      threeForward.word;

    for (i in Moses.Extract.phraseCategories) {
      //check forwards
      var category = i;
      for (f in Moses.Extract.phraseCategories[i].forward) {
        if (afterText.indexOf(Moses.Extract.phraseCategories[i].forward[f]) > -1) {
          categories.push(category)
        }
      }
      for (b in Moses.Extract.phraseCategories[i].back) {
        //check backwards
        if (beforeText.indexOf(Moses.Extract.phraseCategories[i].back[b]) > -1) {
          categories.push(category)
        }
      }
    }

    return categories;
  },
  scanConfirmedLocations: function(sentence) {
    var confirmed = [];
    for (i in sentence) {
      if (sentence[i].pos === 'NNPL' && sentence[i].confirmed) {
        confirmed.push({
          index: i,
          location: sentence[i].location
        });
      }
    }
    return confirmed;
  },
  countLocations: function(sentence) {
    var count = 0;
    for (i in sentence) {
      if (sentence[i].pos === 'NNPL') {
        count++;
      }
    }
    return count;
  },
  setPlaceStats: function(place) {
    var charCount = place.word.length;
    var capital;
    if (place.word[0] === place.word[0].toUpperCase()) {
      capital = 'first';
    }
    if (place.word === place.word.toUpperCase()) {
      capital = 'all';
    }
    if (place.word === place.word.toLowerCase()) {
      capital = 'none';
    }

    place.capital = capital;
    place.charCount = charCount;
    place.dots = (place.word.match(/\./g) || []).length ? (place.word.match(/\./g) || []).length :
      0;
    place.isAcronym = false;
    if (place.dots > 1 || place.capital === 'all') {
      place.isAcronym = true;
    }

    return place;
  },
  getPlaceCategories: function(place) {
    var response = {
      country: 0,
      province: 0,
      airport: 0,
      city: 0,
      district: 0,
      individual: 0,
      natural: 0
    }
    if (place.isAcronym && place.charCount === 2) {
      response.country = Moses.Extract.countCountryCode(place);
      response.province = Moses.Extract.countProvinceCode(place);
    } else if (place.isAcronym && place.charCount === 3) {
      response.country = Moses.Extract.countCountryCode(place);
      response.airport = Moses.Extract.countAirportCode(place);
    } else {
      response.country = Moses.Extract.countCountry(place);
      response.province = Moses.Extract.countProvince(place);
      response.airport = Moses.Extract.countAirportCode(place);
      response.city = Moses.Extract.countCity(place);
      response.district = Moses.Extract.countDistrict(place);
      response.individual = Moses.Extract.countIndividual(place);
      response.natural = Moses.Extract.countNatural(place);
    }
    return response;
  },
  isOnlyPlace: function(place) {
    var results = 0;
    var countryCount = 0;
    var provinceCount = 0;
    var airportCount = 0;
    var genericCount = 0;
    if (place.isAcronym && place.charCount === 2) {
      countryCount = Moses.Extract.countCountryCode(place);
      provinceCount = Moses.Extract.countProvinceCode(place);
    } else if (place.isAcronym && place.charCount === 3) {
      countryCount = Moses.Extract.countCountryCode(place);
      airportCount = Moses.Extract.countAirportCode(place);
    } else {
      genericCount = Moses.Extract.countGeneric(place);
    }
    results = provinceCount + airportCount + countryCount + genericCount;
    if (results === 1) {
      if (provinceCount === 1) {
        results = 'province';
      } else if (airportCount === 1) {
        results = 'airport';
      } else if (countryCount === 1) {
        results = 'country';
      } else if (genericCount === 1) {
        results = 'generic';
      }
    } else {
      results = false;
    }

    return results;
  },
  getUnconfirmedPair: function(firstPlace, secondPlace) {
    var confirmedLocations = {};
    var firstPlaceCountry = Moses.Extract.getCountryCodesOnly(firstPlace.word);
    var secondPlaceCountry = Moses.Extract.getCountryCodesOnly(secondPlace.word);
    var intersectCountry = Moses.array_intersect(firstPlaceCountry, secondPlaceCountry);
    var possibleSecondLocations = [];
    for (i in intersectCountry) {
      var countryCode = intersectCountry[i];
      var tempResults = cts.search(cts.andQuery([cts.directoryQuery('/locations/'), cts.jsonPropertyRangeQuery(
        ['countryCode'], '=', countryCode), cts.jsonPropertyRangeQuery(['featureClass'],
        '=', 'A'), cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        secondPlace.word, ['whitespace-sensitive', 'case-insensitive', 'unwildcarded'])])).toArray();
      for (m in tempResults) {
        possibleSecondLocations.push(tempResults[m].toObject());
      }
    }
    var possibleFirstLocations = [];
    for (i in possibleSecondLocations) {
      var secondLoc = possibleSecondLocations[i];
      var andQuery = [cts.directoryQuery('/locations/'), cts.jsonPropertyRangeQuery([
        'countryCode'
      ], '=', secondLoc.countryCode), cts.jsonPropertyRangeQuery(['featureCode'], '!=',
        'PCLI'), cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'], firstPlace.word, [
        'whitespace-sensitive', 'case-insensitive', 'unwildcarded'
      ])];

      if (secondLoc.admin1Code) {
        andQuery.push(cts.jsonPropertyValueQuery(
          'admin1Code', secondLoc.admin1Code));
      }

      if (secondLoc.admin2Code) {
        andQuery.push(cts.jsonPropertyValueQuery(
          'admin2Code', secondLoc.admin2Code));
      }
      var tempResults = cts.search(cts.andQuery(andQuery)).toArray();
      if (tempResults.length === 0) {
        andQuery = [cts.directoryQuery('/locations/'), cts.jsonPropertyRangeQuery([
          'countryCode'
        ], '=', secondLoc.countryCode), cts.jsonPropertyRangeQuery(['featureCode'], '!=',
          'PCLI'), cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'], firstPlace.word, [
          'whitespace-sensitive', 'case-insensitive', 'unwildcarded'
        ])];
        tempResults = cts.search(cts.andQuery(andQuery)).toArray();
      }
      for (m in tempResults) {
        possibleFirstLocations.push(tempResults[m].toObject());
      }
      if (!tempResults) {
        //remove first locations that don't match anything
        possibleFirstLocations.splice(i, 1);
      }
    }

    //now we loop over them to try to weed out false positive hits
    if (possibleSecondLocations.length === 1) {
      var exactMatches = possibleFirstLocations.filter(function(loc) {
        return loc.asciiname.toLowerCase() === firstPlace.word.toLowerCase();
      });
      //did we get any exact matches? if so let's use those, because it makes sense
      if (exactMatches.length > 0) {
        possibleFirstLocations = exactMatches;
      }
    }

    confirmedLocations.second = possibleSecondLocations;
    confirmedLocations.first = possibleFirstLocations;
    return confirmedLocations;

  },
  getByConfirmedHigher: function(confirmed, place) {
    var andQuery = [cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'], place.word, [
        'whitespace-sensitive', 'case-insensitive', 'unwildcarded'
      ]),
      cts.jsonPropertyValueQuery(['countryCode'], confirmed.location.countryCode)
    ];

    if (confirmed.location.admin1Code) {
      andQuery.push(cts.jsonPropertyValueQuery(
        'admin1Code', confirmed.location.admin1Code));
    }

    if (confirmed.location.admin2Code) {
      andQuery.push(cts.jsonPropertyValueQuery(
        'admin2Code', confirmed.location.admin2Code));
    }

    return cts.search(cts.andQuery(andQuery), [cts.indexOrder(cts.jsonPropertyReference(
        'population', []),
      'descending'), cts.indexOrder(cts.jsonPropertyReference(
      'geonameid', []), 'ascending')]).toArray();
  },

  getByConfirmedLower: function(confirmed, place) {
    var andQuery = [cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'], place.word, [
        'whitespace-sensitive', 'case-insensitive', 'unwildcarded'
      ]),
      cts.jsonPropertyValueQuery(['countryCode'], confirmed.location.countryCode)
    ];

    if (confirmed.location.admin2Code) {
      andQuery.push(cts.orQuery([cts.jsonPropertyRangeQuery('featureCode', '=', 'ADM2'), cts.jsonPropertyRangeQuery(
        'featureCode', '=', 'ADM1'), cts.jsonPropertyRangeQuery('featureCode', '=',
        'PCLI')]));
    } else if (confirmed.location.admin1Code) {
      andQuery.push(cts.jsonPropertyRangeQuery('featureCode', '=', 'PCLI'));
    }

    return cts.search(cts.andQuery(andQuery), [cts.indexOrder(cts.jsonPropertyReference(
        'population', []),
      'descending'), cts.indexOrder(cts.jsonPropertyReference(
      'geonameid', []), 'ascending')]).toArray();
  },
  getOnlyPlace: function(place, type) {
    var result;
    if (type === 'airport') {
      result = Moses.Extract.getAirportCode(place);
    } else if (type === 'country') {
      result = Moses.Extract.getCountryCode(place);
    } else if (type === 'province') {
      result = Moses.Extract.getProvinceCode(place);
    } else {
      result = Moses.Extract.getGeneric(place);
    }
    place.location = result;
    place.confirmed = true;
    return place;
  },
  isAirportCode: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'AIRP', [
        'exact'
      ])
    ])) > 0) ? true : false;
  },
  getCountryCodesOnly: function(word) {
    return cts.elementValues(xs.QName("countryCode"), null, null, cts.andQuery([
      cts.directoryQuery('/locations/'), cts.jsonPropertyValueQuery(['asciiname',
        'alternatenames'
      ], word, ['whitespace-sensitive', 'case-insensitive', 'unwildcarded'])
    ])).toString().split('\n');
  },
  getDefault: function(place, countryCode, admin1Code) {
    var response = null;

    var andQuery = [cts.directoryQuery(
      '/locations/'), cts.jsonPropertyValueQuery(['asciiname', 'name', 'alternatenames'],
      place.word, [
        'case-insensitive', 'whitespace-sensitive',
        'unwildcarded', 'punctuation-insensitive'
      ])];
    if (countryCode) {
      andQuery.push(cts.jsonPropertyRangeQuery('countryCode', '=', countryCode));
    }
    if(admin1Code){
       andQuery.push(cts.jsonPropertyRangeQuery('admin1Code', '=', admin1Code));
    }
    response = cts.search(cts.andQuery(andQuery), [cts.indexOrder(cts.jsonPropertyReference(
        'population', []),
      'descending'), cts.indexOrder(cts.jsonPropertyReference(
      'geonameid', []), 'ascending')]).toArray();
    if (!response) {
      response = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'), cts.jsonPropertyWordQuery(['asciiname',
        'alternatenames'
      ], place.word, ['case-insensitive', 'whitespace-sensitive',
        'unwildcarded', 'punctuation-insensitive'
      ])]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
        'descending'), cts.indexOrder(cts.jsonPropertyReference(
        'geonameid', []), 'ascending')]).toArray();
    }
    if (response && response.length > 0) {
      response = response[0].toObject();
    }

    return response;
  },
  getGeneric: function(place) {
    return cts.search(cts.andQuery([cts.directoryQuery(
      '/locations/'), cts.jsonPropertyValueQuery(['asciiname',
      'alternatenames'
    ], place.word, ['case-insensitive', 'whitespace-sensitive',
      'unwildcarded', 'punctuation-insensitive'
    ])])).toArray()[0].toObject();
  },
  countGeneric: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
      '/locations/'), cts.jsonPropertyValueQuery(['asciiname',
      'alternatenames'
    ], place.word, ['case-insensitive', 'whitespace-sensitive',
      'unwildcarded', 'punctuation-insensitive'
    ])])));
  },
  isCountryCode: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/country-info/'),
      cts.jsonPropertyRangeQuery(['iso', 'iso3', 'fips'], '=',
        place.word)
    ])) > 0) ? true : false;
  },
  isProvinceCode: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])) > 0) ? true : false;
  },
  isCountry: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PCLI', [
        'exact'
      ])
    ])) > 0) ? true : false;
  },
  isProvince: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])) > 0) ? true : false;

  },
  isDistrict: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM2', [
        'exact'
      ])
    ])) > 0) ? true : false;
  },
  isCity: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PPL*', [
        'wildcard'
      ])
    ])) > 0) ? true : false;

  },
  isNatural: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['T', 'H', 'V'], [
        'exact'
      ])
    ])) > 0) ? true : false;

  },
  isIndividual: function(place) {
    return (cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['S', 'L', 'R'], [
        'exact'
      ]), cts.jsonPropertyRangeQuery('featureCode', '!=', ['AIRP'])
    ])) > 0) ? true : false;
  },
  countAirportCode: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'AIRP', [
        'exact'
      ])
    ])));
  },
  countCountryCode: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/country-info/'),
      cts.jsonPropertyRangeQuery(['iso', 'iso3', 'fips'], '=',
        place.word)
    ])));
  },
  countProvinceCode: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])));
  },
  countCountry: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PCLI', [
        'exact'
      ])
    ])));
  },
  countProvince: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])));

  },
  countDistrict: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM2', [
        'exact'
      ])
    ])));
  },
  countCity: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PPL*', [
        'wildcard'
      ])
    ])));

  },
  countNatural: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['T', 'H', 'V'], [
        'exact'
      ])
    ])));

  },
  countIndividual: function(place) {
    return parseInt(cts.estimate(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['S', 'L', 'R'], [
        'exact'
      ]), cts.jsonPropertyRangeQuery('featureCode', '!=', ['AIRP'])
    ])));
  },
  getAirportCode: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'AIRP', [
        'exact'
      ])
    ])).toArray()[0].toObject());
  },
  getCountryCode: function(place) {
    var countryDoc = (cts.search(cts.andQuery([cts.directoryQuery(
        '/country-info/'),
      cts.jsonPropertyRangeQuery(['iso', 'iso3', 'fips'], '=',
        place.word)
    ])).toArray()[0].toObject());
    var geonameid = countryDoc.geonameid;
    return cts.doc('/locations/' + geonameid + '.json').toObject();
  },
  getProvinceCode: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])).toArray()[0].toObject());
  },
  getCountry: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PCLI', [
        'exact'
      ])
    ])).toArray()[0].toObject());
  },
  getProvince: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ])).toArray()[0].toObject());

  },
  getDistrict: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM2', [
        'exact'
      ])
    ])).toArray()[0].toObject());
  },
  getCity: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PPL*', [
        'wildcard'
      ])
    ])).toArray()[0].toObject());
  },
  getNatural: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['T', 'H', 'V'], [
        'exact'
      ])
    ])).toArray()[0].toObject());
  },
  getIndividual: function(place) {
    return (cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['S', 'L', 'R'], [
        'exact'
      ]), cts.jsonPropertyRangeQuery('featureCode', '!=', ['AIRP'])
    ])).toArray()[0].toObject());
  },
  getCountryCodes: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/country-info/'),
      cts.jsonPropertyRangeQuery(['iso', 'iso3', 'fips'], '=',
        place.word)
    ]));
    if (results) {
      place.locations.country = results.toArray();
      for (i in place.locations.country) {
        place.locations.country[i] = place.locations.country[i].toObject();
      }
    }
    return place;
  },
  getProvinceCodes: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ]));
    if (results) {
      place.locations.province = results.toArray();
      for (i in place.locations.province) {
        place.locations.province[i] = place.locations.province[i].toObject();
      }
    }
    return place;
  },
  getCountrys: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PCLI', [
        'exact'
      ])
    ]));
    if (results) {
      place.locations.country = results.toArray();
      for (i in place.locations.country) {
        place.locations.country[i] = place.locations.country[i].toObject();
      }
    }
    return place;
  },
  getProvinces: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM1', [
        'exact'
      ])
    ]));
    if (results) {
      place.locations.province = results.toArray();
      for (i in place.locations.province) {
        place.locations.province[i] = place.locations.province[i].toObject();
      }
    }
    return place;
  },
  getDistricts: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'ADM2', [
        'exact'
      ])
    ]));
    if (results) {
      place.locations.district = results.toArray();
      for (i in place.locations.district) {
        place.locations.district[i] = place.locations.district[i].toObject();
      }
    }
    return place;
  },
  getCitys: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
        place.word, ['exact']), cts.jsonPropertyValueQuery('featureCode', 'PPL*', [
        'wildcard'
      ])
    ]));
    if (results) {
      place.locations.city = results.toArray();
      for (i in place.locations.city) {
        place.locations.city[i] = place.locations.city[i].toObject();
      }
    }
    return place;
  },
  getNaturals: function(place) {
    var results = cts.search(cts.andQuery([cts.directoryQuery(
        '/locations/'),
      cts.jsonPropertyWordQuery(['asciiname', 'alternatenames'],
        place.word, ['case-sensitive', 'whitespace-sensitive',
          'diacritic-insensitive',
          'unwildcarded'
        ]), cts.jsonPropertyValueQuery('featureClass', ['T', 'H', 'V'], [
        'exact'
      ])
    ]));
    if (results) {
      place.locations.natural = results.toArray();
      for (i in place.locations.natural) {
        place.locations.natural[i] = place.locations.natural[i].toObject();
      }
    }
    return place;
  },
  resolveAcronym: function(place) {
    placeList = [];
    if (place.charCount === 3) {
      var country = Moses.Extract.isCountryCode(place);
      var airport = Moses.Extract.isAirportCode(place);
      var individual = Moses.Extract.isIndividual(place);

    } else if (place.charCount === 2) {
      //Now, let's assume it's a country/province, BUT WHICH ONE?!
      var country = Moses.Extract.isCountryCode(place);
      var province = Moses.Extract.isProvinceCode(place);
    } else {
      var individual = Moses.Extract.isIndividual(place);
    }

    return placeList;
  },
  resolveWord: function(place) {

  },
  resolveEnrichedTextNLP: function(sentences) {
    var response = {
      records: [],
      text: ''
    }
    var countryCode = null;
    var admin1Code = null;
    var text = '';
    var idList = [];
    for (var s in sentences) {
      var taggedWords = sentences[s];
      for (var i in taggedWords) {
        var wordObject = taggedWords[i];
        var tag = wordObject.pos;
        var word = wordObject.word;
        var ner = wordObject.ner;
        var after = wordObject.after;
        var id;
        var loc;
        if (tag === 'NNPL') {
          if (wordObject.confirmed) {
            loc = wordObject.location;
            id = wordObject.location.geonameid;
          } else if (wordObject.locations.length > 0 && !wordObject.confirmed) {
            //now we gotta try to figure it out!
            //does it have locations with it? 
            var mostPopulation = Math.max.apply(Math, wordObject.locations.map(function(o) {
              return o.population;
            }));
            var mostPopulated = wordObject.locations.filter(function(o) {
              return o.population === mostPopulation;
            })[0];
            wordObject.location = mostPopulated;
            wordObject.confirmed = true;
            wordObject.locations = null;
            loc = wordObject.location;
            id = wordObject.location.geonameid;
          } else {
            //check some commonly used phrases around types of places
            var phraseCats = Moses.Extract.getPhraseCategories(taggedWords, i);
            loc = Moses.Extract.getDefault(wordObject, countryCode, admin1Code);
            if (loc) {
              id = parseInt(loc.geonameid);
            }
          }
          countryCode = loc.countryCode;
          admin1Code = loc.admin1Code != 00 ? loc.admin1Code : null;
          if (id) {
            wordObject.originalText = '<span class="highlight NNPL" geoid="' + id + '">' +
              wordObject.originalText + '</span>';
            if (idList.indexOf(id) === -1) {
              idList.push(id);
              response.records.push(loc);
            }
          }
        }
        response.text += wordObject.originalText + after;
      }
    }

    return response;
  },
  enrichTextNLP: function(text) {
    var locs = Moses.Extract.getNounsNLP(text)
    var places = Moses.Extract.findPlaceNounsNLP(locs);
    return Moses.Extract.resolveEnrichedTextNLP(places);
  },
};
module.exports = Moses;