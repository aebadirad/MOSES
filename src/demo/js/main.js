function buildFormData() {

  var population;
  if ($('#population-amount')) {
    population = {
      amount: $('#population-amount').val(),
      inequality: $('#population-inequality').val()
    };
  }
  var data = {
    name: $('#name').val(),
    fuzzy: $('#fuzzy').val(),
    admin1Code: $('#admin1Code').val(),
    admin2Code: $('#admin2Code').val(),
    countryCode: $('#countryCode').val(),
    population: population,
    featureClass: $('#featuerClass').val(),
    featureCode: $('#featureCode').val(),
    limit: $('#limit').val(),
    geo: window.geo
  };
  return data;
};


function getCountries() {
  var jqxhr = $.get("example.php", function() {
      alert("success");
    })
    .done(function() {
      alert("second success");
    })
    .fail(function() {
      alert("error");
    })
    .always(function() {
      alert("finished");
    });
}
