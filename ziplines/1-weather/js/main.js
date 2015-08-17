/*
  Random dev stuff
 */

function loadJquery() {
    var s = document.createElement('script');
    s.src='https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js';
    s.type='text/javascript';
    document.head.appendChild(s);
}
function what() {
    console.log(arguments);
}
function dumpArg(n) {
    return function() {
        console.log(arguments[n]);  
    };
}
/*
 Algorithms / Helpers
*/

var __copy = Function.prototype.call.bind(Array.prototype.slice);
/*
 Creates a new hash.
 Uses the map dictionary to remap the keys of the data hash.
 It also plucks the data so non-mapped data is excluded.
 */
function mapData(map, data) {
    var newData = {};
    $.each(data, function(p, v) {
        if ( typeof map[p]==='undefined' ) {
            newData[p] = data[p];
        } else {
            newData[map[p]] = data[p];
        }
    });
    return newData;
}
/*
 Creates a new hash made up of only the fields from data.
 */
function pluckData(fields, data) {
    var newData = {};
    $.each(fields, function(i, field) {
        newData[field] = data[field];
    });
    return newData;
}
/*
 
 @return array of values for the properties in the obj
 */
function pluckValues(obj, properties) {
    return $.map(properties, function(prop) {
        return obj[prop]; 
    });
}
/*
 Creates a callback that can execute a function with fields as arguments.

 @return function
 */
function callFunctionWith(fn, fields) {
    return function(data) {
        return fn.apply(this, pluckValues(data, fields));
    };
}

/*
 @source https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 @return arr shuffled
 */
function durstenfeldShuffle(arr) {
    var a = __copy(arr);
    function rnd(max) {
        return Math.floor(Math.random()*(max+1));
    }
    function swap(a, i, j) {
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    var i, j, tmp;
    for(i=a.length-1; i>1; i--) {
        j = rnd(i);
        swap(a, i, j);
    }
    return a;
}

function randomInteger(max, min) {
    if( typeof min!=='number' ) min=0;
    var range = max-min;
    return Math.floor(Math.random()*(range+1)) + min;
}

/*
 Fire off a JSONp call and return a promise.

 @return promise
 */
function makeCall(url, data, callback) {
    var ajax = {
        url: url,
        dataType: 'jsonp',
        timeout: 2000
    };
    if ( typeof callback==='string' ) ajax.jsonp = callback;
    if( typeof data==='object' ) ajax.data = data;
    return $.ajax(ajax);
}

/*
 Takes an endpoint url, a data map and converter and returns a function
 that can be used to make an API call and return normalized data.

 @return function
 */
function createApiCall(url, options) {
    //map, converter) {
    options = $.extend({
        converter: function(d) { return d; },
        map: {},
        callback: undefined
    }, options);
    return function(data) {
        return makeCall(url, data, options.callback)
            .then(function(data) {
                data = options.converter(mapData(options.map, data));                   return $.Deferred().resolve(data);
            });
    };
}


/*
 IP locator API calls.

 They seem to throttle when there are too many requests/s
 */
var ipInfo = createApiCall(
    'http://ipinfo.io/',
    {
        map: {
            ip:'ip', city:'city', 'postal': 'postalCode',
            'country':'country', region:'region', loc:'loc'
        },
        converter: function(data) {
            if ( data.loc!==undefined ) {
                var parts = data.loc.split(',');
                data.lat = parseFloat(parts[0]);
                data.long = parseFloat(parts[1]);
                delete data.loc;
            }
            return data;
        }
    }
);

var ipApi = createApiCall(
    'http://ip-api.com/json/',
    {
        map: {
            query:'ip', city:'city', zip:'postalCode', countryCode:'country',
            regionName:'region', lat:'lat', lon:'long'
        }
    }
);

var freeGeoIp = createApiCall(
    'http://freegeoip.net/json/',
    {
        map: {
            ip:'ip', countr_code:'country', region_name:'region', city:'city', zip_code:'postalCode', latitude:'lat', longitude:'long'
        }
    }
);

// Given a list of webservices that might timeout try each one till we get a response
// also randomize the calls so we don't get throttled
function oneOf() {
    var hasResponse = false;
    var promise = $.Deferred();
    function helper() {
        if( arguments.length===0 ) promise.reject('failed');
        var args = __copy(arguments);
        var fn = args.shift();
        fn().then(function() {
            hasResponse = true;
            promise.resolve.apply(this, arguments);
        });
        setTimeout(function() {
            if( !hasResponse ) {
                helper.apply(this, args);
            }
        }, 2000);
    }
    helper.apply(this, durstenfeldShuffle(arguments));
    return promise;
}

/*
 Widgets

 The active parts of the view.
 */
var WindWidget = {
    UNITS: {
        KNOTS: 0,
        KPH: 1,
        MPH: 2,
    },
    unitType: 1,
    render: function(info) {
        this._direction = info.deg;
        this._speed = info.speed;
        this.draw();
    },
    draw: function(){
        $('.wa-wind-direction-widget').text(this.degToDirection(this._direction) + ' ' + this.niceSpeed(this._speed));
    },
    // source: http://climate.umn.edu/snow_fence/components/winddirectionanddegreeswithouttable3.htm
    degToDirection: function(deg) {
        if( deg>348.7499 ) return 'N';
        if( deg>326.2499 ) return 'NNW';
        if( deg>303.7499 ) return 'NW';
        if( deg>281.2499 ) return 'WNW';
        if( deg>258.7499 ) return 'W';
        if( deg>236.2499 ) return 'WSW';
        if( deg>213.7499 ) return 'SW';
        if( deg>191.2499 ) return 'SSW';
        if( deg>168.7499 ) return 'S';
        if( deg>146.2499 ) return 'SSE';
        if( deg>123.7499 ) return 'SE';
        if( deg>101.2499 ) return 'ESE';
        if( deg>78.7499 ) return 'E';
        if( deg>56.2499 ) return 'ENE';
        if( deg>33.7499 ) return 'NE';
        if( deg>11.2499 ) return 'NNE';
        return 'N';
    },
    cycleUnits: function(withDraw) {
        if( typeof withDraw!=='boolean' ) withDraw=true;
        this.unitType++;
        if( this.unitType>2 ) this.unitType=1;

        if( withDraw ) this.draw();
    },
    niceSpeed: function(speed) {
        switch( this.unitType ) {
        case this.UNITS.KNOTS: return this.mpsToKnots(speed).toFixed(1) + ' knots';
        case this.UNITS.MPH: return this.mpsToMph(speed).toFixed(1) + ' m/h';
        case this.UNITS.KPH:
        default: return this.mpsToKph(speed).toFixed(1) + 'k/h';
        }
    },
//source: http://www.metric-conversions.org/speed/meters-per-second-to-knots-table.htm
    mpsToKnots: function(mps) {
        return mps * 1.94384;
    },
    mpsToKph: function(mps) {
        return mps * 3.6;
    },
    mpsToMph: function(mps) {
        return mps * 2.23694;
    }
};

var DescriptionWidget = {
    render: function(info) {
        $('.wa-description-widget').text(info.description);  
    }
};

var LocationWidget = {
    render: function(info) {
        $('.wa-location-widget').text(info.name);
    }
};

var TemperatureWidget = {
    UNITS: {
        KELVIN: 1,
        CELSIUS: 2,
        FAHRENHEIT: 4
    },
    unitType: 2,
    render: function(info) {
        this._temperature = info.temp;
        this._min = info.temp_min;
        this._max = info.temp_max;
        this._humidity = info.humidity;
        this._pressure = info.pressure;
        this.draw();
    },
    draw: function() {
        $('.wa-temperature-widget .wa-temperature').text(this.niceTemperature(this._temperature));
        $('.wa-temperature-widget .wa-temperature-min .wa-value').text(this.niceTemperature(this._min));
        $('.wa-temperature-widget .wa-temperature-max .wa-value').text(this.niceTemperature(this._max));
        $('.wa-temperature-widget .wa-humidity').text(this._humidity + '%');
        $('.wa-temperature-widget .wa-pressure').text(this._pressure + ' hPa');
    },
    cycleUnits: function(withDraw) {
        // limit it to Celcius and Fahrenheit
        this.unitType = this.unitType ^ 6;
        if( typeof withDraw!=='boolean' || withDraw===true ) this.draw();
    },
    niceTemperature:  function(temperature) {
        switch( this.unitType ) {
        case this.UNITS.FAHRENHEIT:
            return this.kelvinTo(temperature, this.UNITS.FAHRENHEIT).toFixed() + '°F';
        case this.UNITS.CELCIUS:
        default:
            return this.kelvinTo(temperature, this.UNITS.CELCIUS).toFixed() + '°C';
        }
    },
    kelvinTo: function(kelvin, desiredUnit) {
        if( desiredUnit === this.UNITS.CELCIUS ) {
            return kelvin - 273.15;
        } else if( desiredUnit === this.UNITS.FAHRENHEIT ) {
            return (kelvin - 273.15) * 1.8 + 32;
        }
        return kelvin;
    }
};


/*

 @return object  weather data
 */
function getWeather(lat, long) {
    return makeCall('http://api.openweathermap.org/data/2.5/weather', { lat:lat, lon: long});
}

function objectReduce(o, fn, carry) {
    o = $.extend({}, o);
    if ( carry===undefined ) {
        carry='';
    }
    $.each(o, function(p, v) {
        carry = fn.call(this, carry, p, v);
    });
    return carry;
}
function createEndpoint(uri, data) {
    return uri + '?' + $.map(data, function(v, p) {
        return p + '=' + v;
    }).join('&');
}

var FLICKR_ENDPOINT = 'https://api.flickr.com/services/rest/';
var flickrApi = createApiCall(
    createEndpoint(FLICKR_ENDPOINT, {
        //api_key: '6de5c86df96cc838226d2c91d9e4701d'
        api_key: '8585fe51ef2851eac207fde547e87cd8',
        format:  'json'
    }), {
        callback: 'jsoncallback'
    });

var BACKGROUND_TIMEOUT=700000;
function startRandomBackground(lat, lon) {
    var photos = getPhotosForLocation(lat, lon);
    function helper(photos) {
        photos
            .then(samplePhoto)
            .then(renderLocationPhoto);
        
        setTimeout(helper.bind(this, photos), BACKGROUND_TIMEOUT);
    }
    helper(photos);
}

function getPhotosForLocation(lat, lon) {
    return flickrApi({
        method: 'flickr.photos.search',
        lat: lat,
        lon: lon
    });
}

function getPhotoForLocation(lat, lon) {
    return getPhotosForLocation(lat, lon).then(samplePhoto);
}
function samplePhoto(data) {
    var photos = data.photos.photo;
    var whichOne = randomInteger(photos.length-1);
    var theChosenOne = photos[whichOne];
    return $.when(
        flickrApi({
            method:   'flickr.photos.getSizes',
            photo_id: theChosenOne.id
        }),
        flickrApi({
            method:   'flickr.photos.getInfo',
            photo_id: theChosenOne.id
            //, secret:   theChosenOne.secret
        }))
//        .then(what);
        .then(mergePhotoData);
}
function mergePhotoData(sizes, info) {
    function area(photo) {
        return photo.height * photo.width;
    }
    // mutative
    function sortSizes(sizes) {
        return sizes.sort(function(a, b) {
            return area(a) > area(b);
        });
    }
    function findNiceSizeForBackground(sizes) {
        sizes = sortSizes(sizes);
        var mediumSize = Math.floor(sizes.length/2);
        return sizes[mediumSize];
    }
    var data = info.photo;
    data.actualPhoto = findNiceSizeForBackground(sizes.sizes.size);
    return $.Deferred().resolve(data);
}

var img = undefined;
function renderLocationPhoto(data) {
    var $widget = $('.wa-background-widget');
    if ( img===undefined ) {
        img = document.createElement('img');
        $widget.find('.wa-img-box').prepend(img);
    }
    img.src = data.actualPhoto.source;
    $widget.find('.wa-overlay .wa-title').text(data.title._content);
    $widget.find('.wa-overlay .wa-author').text(data.owner.username);
    $widget.find('.wa-overlay .wa-url').text(data.urls.url[0]._content);
   // $('body').css({
   //     'background-image': 'url("' + data.actualPhoto.source + '")'
   //     , 'background-repeat': 'no-repeat'
   //     , 'background-size': 'contain'
   //     , 'background-position': 'center'
   // });
}

function renderWeatherInfo(info) {
    TemperatureWidget.render(info.main);
    WindWidget.render(info.wind);
    DescriptionWidget.render(info.weather.shift());
    LocationWidget.render(info);
}

function setupEvents() {
    $('.wa-wind-direction-widget.wa-clickable')
        .on('click', WindWidget.cycleUnits.bind(WindWidget));

    $('.wa-temperature-box.wa-clickable')
        .on('click', TemperatureWidget.cycleUnits.bind(TemperatureWidget));
}

function showPage(info) {
    $('.wa-app').removeClass('hidden');
    $('.wa-loader').addClass('hidden');
    return info;
}

function renderPage() {
    setupEvents();
    var locationData = oneOf(freeGeoIp, ipApi, ipInfo);

    locationData
        .then(callFunctionWith(getWeather, ['lat', 'long']))
        .then(renderWeatherInfo)
        .then(showPage);

    locationData
        .then(callFunctionWith(startRandomBackground, ['lat', 'long']));
//        .then(callFunctionWith(getPhotoForLocation, ['lat', 'long']))
//        .then(renderLocationPhoto);
}

// On document ready render the page.
$(renderPage);
