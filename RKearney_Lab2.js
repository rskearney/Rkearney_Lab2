//Robert Kearney
//4/30/2021
//Computer Programming for GIS
//Assignment 2

// Fetch a MODIS NDVI collection and select NDVI.
var col = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI');

// Define a mask to clip the NDVI data. 
var mask = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017').filter(ee.Filter.eq('country_na','Poland'));

// Define region bounds of animation frames.
var rectangle = ee.Geometry.Rectangle([13.5, 48.5, 24.5, 55]);

// Add day-of-year (DOY) property to each image.
col = col.map(function(img) {
  var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
  return img.set('doy', doy);
});

// Get a collection of distinct images by 'doy'.
var distinctDOY = col.filterDate('2014-01-01', '2015-01-01');

// Define a filter that identifies which images from the complete
// collection match the DOY from the distinct DOY collection.
var filter = ee.Filter.equals({leftField: 'doy', rightField: 'doy'});

// Define a join.
var join = ee.Join.saveAll('doy_matches');

// Apply the join and convert the resulting FeatureCollection to an
// ImageCollection.
var joinCol = ee.ImageCollection(join.apply(distinctDOY, col, filter));

// Apply median reduction among matching DOY collections.
var comp = joinCol.map(function(img) {
  var doyCol = ee.ImageCollection.fromImages(
    img.get('doy_matches')
  );
  return doyCol.reduce(ee.Reducer.median());
});

// Define RGB visualization parameters.
var visParams = {
  min: 0.0,
  max: 10000.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

// Create RGB visualization images for use as animation frames.
var rgbVis = comp.map(function(img) {
  return img.visualize(visParams).clip(mask);
});

// Define GIF visualization arguments.
var gifParams = {
  'region': rectangle,
  'dimensions': 600,
  'crs': 'EPSG:3857',
  'framesPerSecond': 8,
  'format': 'gif'
};

// Print the GIF URL to the console.
print(rgbVis.getVideoThumbURL(gifParams));

// Render the GIF animation in the console.
print(ui.Thumbnail(rgbVis, gifParams));