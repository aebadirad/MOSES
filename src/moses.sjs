var Moses = {
  name: "Moses",
  //note, marklogic requires this to do the backend calculations for certain geo functions
  geo: require('/MarkLogic/geospatial/geospatial'),
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
    ])).toArray();
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
      FeatureClass: 'A',
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
    return cts.search(cts.andQuery([cts.collectionQuery('country'),
      cts.jsonPropertyRangeQuery('iso', '=', code)
    ])).toArray()[0].root.country;
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
    return cts.search(cts.andQuery([cts.collectionQuery('admin-code'),
      cts.jsonPropertyRangeQuery('adminCode', '=', code)
    ])).toArray()[0].root.asciiname;
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
    if ('featureClass' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('featureClass', '=',
        options.featureClass));
    }
    if ('featureCode' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('featureCode', '=',
        options.featureCode));
    }
    if ('countryCode' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('countryCode', '=',
        options.countryCode));
    }
    if ('admin1Code' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('admin1Code', '=', options
        .admin1Code));
    }
    if ('admin2Code' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('admin2Code', '=', options
        .admin2Code));
    }
    if ('population' in options) {
      comboQuery.push(cts.jsonPropertyRangeQuery('population', options.population
        .inequality, options.population.amount));
    }
    if ('name' in options && !('fuzzy' in options)) {
      comboQuery.push(cts.jsonPropertyValueQuery(['asciiname', 'name'],
        options.name, ['case-insensitive', 'diacritic-insensitive',
          'punctuation-insensitive', 'whitespace-sensitive',
          'unwildcarded'
        ]));
    }
    if ('name' in options && 'fuzzy' in options) {
      comboQuery.push(cts.jsonPropertyWordQuery(['asciiname', 'name'],
        options.name, ['case-insensitive', 'diacritic-insensitive',
          'punctuation-insensitive', 'whitespace-insensitive',
          'wildcarded'
        ]));
    }
    if ('geo' in options) {
      var geoShape;
      if (options.geo.type === 'circle') {
        geoShape = cts.circle(options.geo.radius, cts.point(options.geo.points[
          0], options.geo.points[1]))
      }
      if (options.geo.type === 'polygon') {
        if (options.geo.points.constructor === Array) {
          options.geo.points = options.geo.points.join(' ');
        }
        geoShape = cts.polygon(options.geo.points)
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
    }else{
      sortOrder = options.sortOrder;
    }
    if ('sortType' in options) {
      comboOptions.push(cts.indexOrder(cts.jsonPropertyReference(options.sortType, []),
        sortOrder));
    }
    return comboOptions;
  },
  parseLimit: function(options) {
    var limit = 1;
    if ('limit' in options) {
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
    while ((count > 1 || count < 1) && tries < 200 && radius < 25000) {
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
        lat, lon))), cts.andQuery(andQuery)])).toArray();
    if (results.length > 1) {
      var distances = [];
      for (var i = 0; i < results.length; i++) {
        var longlat = results[i].toObject().geo;
        var point = cts.point(longlat.latitude, longlat.longitude);
        var distance = Moses.geo.distance(cts.point(lat, lon), point)
        distances[i] = distance;
      }
      result = results[distances.indexOf(Math.min.apply(null, distances))];
    } else if (results.length < 1) {
      result = {};
    } else {
      result = results[0];
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
module.exports = Moses;