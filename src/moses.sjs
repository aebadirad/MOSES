var Moses = {
  name: "Moses",
  //note, marklogic requires this to do the backend calculations for certain geo functions
  geo: require('/MarkLogic/geospatial/geospatial'),
  pos: require('/lib/pos/index.sjs'),
  methods: function(obj) {
    return Object.getOwnPropertyNames(obj).filter(function(p) {
      return typeof obj[p] === 'function';
    });
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
      var fullDoc = docs[i].toObject();
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
      var backpeek = taggedWords[oneBehind];
      var oneAhead = 0;
      oneAhead = i;
      oneAhead++;
      twoAhead = oneAhead + 1;
      var peek = taggedWords[oneAhead];
      var peek2 = taggedWords[twoAhead];
      //all junk responses go here
      //yeaaah this is gonna need to be its own regex or array kept elsewhere. This is silly.
      if (word === '£' || word === "$" || word === "@" || word === '^' || word === '--' || word ===
        '\\' ||
        ((word === 'A' || word === 'I') && peek !== '.') || word === '/' || word === "%" ||
        word === "*") {
        tag = 'JUNK';
      }
      if ((tag === 'JJ' && (peek[1] !== 'NN' && peek2[1] === 'NNP' && peek[1] !== 'CC') || (tag ===
          'NNS' && peek2[1] === 'NNP') || (tag === 'JJ' && peek[1] === 'NNP')) && word[0] ===
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
        var commonMatches = cts.estimate(cts.jsonPropertyValueQuery('word', word.toLowerCase(), [
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
          if ((nextWord[1] === 'PRP' || commonMatches > 0 || (nextWord[1] === 'NNP' && nextWord[
              0].length > 1)) && taggedWords[i][0] === ".") {
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
        if (word.substr(word.length - 1, 1) === "'" || word.substr(word.length -
            1, 1) === ".") {
          clipped = word.substr(word.length - 1, 1);
          word = word.substr(0, word.length - 1);
        }
        var found = 0;
        var failedArray = failed.split(" ");
        if (failedArray.indexOf(word) === -1) {
          found = cts.estimate(cts.andQuery([cts.directoryQuery(
              '/locations/'),
            cts.jsonPropertyValueQuery(['asciiname', 'alternatenames'],
              word, ['whitespace-sensitive', caseSense,
                'unwildcarded'
              ])
          ]));
        }
        if (found > 0) {
          foundNouns.push({
            word: word+clipped,
            tag: 'NNPL'
          });
        } else {
          failed += ' ' + word;
          foundNouns.push({
            word: word+clipped,
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
  resolveLocation: function(foundNoun) {
    return fn.subsequence(cts.search(cts.andQuery([cts.directoryQuery(
      '/locations/'), cts.jsonPropertyValueQuery(['asciiname',
      'alternatenames'
    ], foundNoun, ['case-sensitive', 'whitespace-sensitive',
      'unwildcarded', 'punctuation-insensitive'
    ])]), [cts.indexOrder(cts.jsonPropertyReference('population', []),
      'descending'), cts.indexOrder(cts.jsonPropertyReference(
      'geonameid', []), 'ascending')]), 1, 1);
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
  }
};
module.exports = Moses;