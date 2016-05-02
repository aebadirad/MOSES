function buildFormData() {
	var population;
	if ($('#population-amount').val()) {
		population = {
			amount: $('#population-amount').val(),
			inequality: $('#population-inequality').val()
		};
	}
	var geoc = null;
	var lat = null;
	var lon = null;
	if (window.geo && window.geo.type === 'point') {
		lat = window.geo.points.lat;
		lon = window.geo.points.lng;
		geoc = window.geo;
	} else if (window.geo && window.geo.type === 'circle') {
		//need to passby value not reference here 'cause we're changing stuff!
		geoc = $.extend({}, window.geo);
		geoc.points = [geo.points.lat, geo.points.lng];
	} else if (window.geo && window.geo.type === 'polygon') {
		geoc = window.geo;
	}
	var name = $('#name').val().trim();
	if (name.length < 3) {
		name = null;
	}
	var fuzzy = $('#fuzzy').val();
	var admin1Code = $('#admin1Code').val();
	var admin2Code = $('#admin2Code').val();
	var countryCode = $('#countryCode').val();
	var featureClass = $('#featureClass').val();
	var featureCode = $('#featureCode').val();
	var sortType = $('#sortType').val();
	var sortOrder = $('#sortOrder').val();
	var data = {
		options: {
			name: name ? name : null,
			fuzzy: fuzzy ? fuzzy : null,
			admin1Code: admin1Code ? admin1Code.split('.')[1] : null,
			admin2Code: admin2Code ? admin2Code.split('.')[2] : null,
			countryCode: countryCode ? countryCode : null,
			population: population,
			featureClass: featureClass ? featureClass : null,
			featureCode: featureCode ? featureCode : null,
			sortType: sortType ? sortType : null,
			sortOrder: sortOrder ? sortOrder : null,
			limit: $('#limit').val(),
			geo: geoc
		},
		lat: lat,
		lon: lon
	};
	return data;
};

function submitData() {
	var data = buildFormData();
	var endpoint = '';
	if('lat' in data && data.lat){
		endpoint = '/geo';
	}
	$.ajax({
		contentType: 'application/json',
		data: JSON.stringify(data),
		dataType: 'json',
		success: function(response) {
			parseResponse(response);
		},
		error: function() {
			console.log('woah error!');
		},
		complete: function() {
			$('#submitButton').prop('disabled', false);
		},
		processData: false,
		type: 'POST',
		url: '/api/search'+endpoint
	});
};

function submitExtractData() {
	var data = {
		text: $('#extract-text').val().trim()
	};
	$.ajax({
		contentType: 'application/json',
		data: JSON.stringify(data),
		dataType: 'json',
		success: function(response) {
			parseResponse(response.records);
			$('#enrich-text').html(response.text);
			$('.highlight').click(function() {
				var id = $(this).attr('geoid');
				toggleMarker(id);
			});
		},
		error: function() {
			console.log('woah error!');
		},
		complete: function() {
			$('#extractButton').prop('disabled', false);
		},
		processData: false,
		type: 'POST',
		url: '/api/extract/resolve'
	});
};

function parseResponse(data) {
	var result = '';
	// clear our markers if any were present
	markers.clearLayers();
	window.markerStore = {};
	if (!(Object.prototype.toString.call(data) === '[object Array]')) {
		data = [data];
	}
	if (data && data.length > 0) {
		//create table headers
		//result += 		"<tr id='results-header'><th>id</th><th>Name</th><th>Country</th><th>Province</th><th>District</th><th>Feature</th><th>Population</th><th>Lat</th><th>Lon</th></tr>";
		for (i = 0; i < data.length; i++) {
			var record = data[i];
			var district = record.district ? record.district : 'N/A';
			var province = record.province ? record.province : 'N/A';
			var feature = record.feature ? record.feature : 'N/A';
			var name = record.asciiname ? record.asciiname : record.name;
			result += '<tr id="' + record.geonameid + '" class="rowMarker"><td>' +
				record.geonameid + '</td><td>' + name + '</td><td>' + record.countryCode +
				'</td><td>' + province + '</td><td>' + district + '</td><td>' + feature +
				'</td><td>' + record.population + '</td><td>' + record.geo.latitude +
				'</td><td>' + record.geo.longitude + '</td></tr>';
			var marker = L.marker([record.geo.latitude, record.geo.longitude], {
				id: record.geonameid, frozen: false
			});
			marker.bindPopup('<p>' + name + '<br />Lat: ' + record.geo.latitude +
				'<br />Lon: ' + record.geo.longitude + '</p>', {
					showOnMouseOver: true
				});
			//add to our global markers group
			markers.addLayer(marker);
			window.markerStore[record.geonameid] = marker;
		}
		//readd these guys to the map
		map.addLayer(markers);
	} else {
		result = "<h3>No results found for your query.</h3>";
	}
	$('#results-table').html(result);
	$('.rowMarker').hover(function() {
		$(this).addClass("hover");
		var id = $(this).attr('id');
		var marker = window.markerStore[id]
		if (!marker.frozen) {
			marker.setIcon(orangeIcon);
			marker.setZIndexOffset(999);
		}
	}, function() {
		$(this).removeClass("hover");
		var id = $(this).attr('id');
		var marker = window.markerStore[id]
		if (!marker.frozen) {
			marker.setIcon(defaultIcon);
			marker.setZIndexOffset(5);
		}
	});
	$('.rowMarker').click(function() {
		var id = $(this).attr('id');
		toggleMarker(id);
	});
};

function toggleMarker(id) {
	var marker = window.markerStore[id];
	if (!marker.frozen) {
		marker.setIcon(redIcon);
		marker.frozen = true;
		marker.setZIndexOffset(999);
	} else {
		marker.setIcon(defaultIcon);
		marker.frozen = false;
		marker.setZIndexOffset(5);
	}
	$('[geoid=' + id + ']').toggleClass('highlight-selected highlight');
	$('#' + id).toggleClass("bg-info");
};

function getCountries() {
	var jqxhr = $.get("/api/country/all", function(data) {
		var select = '<option value="" selected>All</option>';
		for (i = 0; i < data.length; i++) {
			select += '<option value="' + data[i].iso + '">' + data[i].name.trunc(30) +
				'</option>';
		}
		$('#countryCode').html(select);
	}).fail(function() {
		alert("error");
	});
};

function getFeatureClass() {
	var jqxhr = $.get("/api/feature/class/all", function(data) {
		var select = '<option value="" selected>All</option>';
		for (i = 0; i < data.length; i++) {
			select += '<option value="' + data[i].featureClass + '">' + data[i].name.trunc(
				30) + '</option>';
		}
		$('#featureClass').html(select);
	}).fail(function() {
		alert("error");
	});
};

function getFeatureCode(featureClass) {
	var jqxhr = $.get("/api/feature/class/" + featureClass, function(data) {
		var select = '<option value="" selected>All</option>';
		for (i = 0; i < data.length; i++) {
			select += '<option value="' + data[i].featureCode + '" title="' + data[i].description +
				'">' + data[i].asciiname.trunc(30) + '</option>';
		}
		$('#featureCode').html(select);
	}).fail(function() {
		alert("error");
	});
};

function getProvince(countryCode) {
	var jqxhr = $.get("/api/admincode/" + countryCode, function(data) {
		var select = '<option value="" selected>All</option>';
		for (i = 0; i < data.length; i++) {
			select += '<option value="' + data[i].adminCode + '">' + data[i].asciiname
				.trunc(30) + '</option>';
		}
		$('#admin1Code').html(select);
	}).fail(function() {
		alert("error");
	});
};

function getDistrict(countryCode, admin1Code) {
	var jqxhr = $.get("/api/admincode/" + countryCode + "/" + admin1Code, function(
		data) {
		var select = '<option value="" selected>All</option>';
		for (i = 0; i < data.length; i++) {
			select += '<option value="' + data[i].adminCode + '">' + data[i].asciiname
				.trunc(30) + '</option>';
		}
		$('#admin2Code').html(select);
	}).fail(function() {
		alert("error");
	});
};
//shim from SO that lets us truncate strings by overriding the string prototype
String.prototype.trunc = String.prototype.trunc || function(n) {
	return (this.length > n) ? this.substr(0, n - 1) + '&hellip;' : this;
};