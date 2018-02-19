'use strict';

const initialLocations = [
    {title: 'Google', position: {lat: 37.419858, lng: -122.078827}},
    {title: 'Facebook', position: {lat: 37.394439, lng: -122.080147}},
    {title: 'LinkedIn', position: {lat: 37.787884, lng: -122.396946}},
    {title: 'Oracle', position: {lat: 37.5294, lng: -122.265966}},
    {title: 'Stanford', position: {lat: 37.427475, lng: -122.169719}},
];

let initialized;
let map;
let infowindow;

const Location = function(data) {
    let self = this;
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.marker = new google.maps.Marker({
        position: data.position,
        title: data.title,
        animation: google.maps.Animation.DROP,
        map: map,
    });

    this.populateInfoWindow = function() {
        if (initialized && infowindow.marker !==  self.marker) {
            infowindow.close();
            infowindow.setContent('');
            infowindow.marker = self.marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });

            let contentStr = '<div class="title"><b>' + self.marker.title + '</b></div>';
            let wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.marker.title +
                '&format=json&callback=wikiCallback';
            let wikiRequestTimeout = setTimeout(function(){
                alert('Failed to get wikipedia resources.');
            }, 2000);
            $.ajax({
                url : wikiUrl,
                dataType: 'jsonp',
                success: function(data) {
                    console.log('success', data);
                    const articles = data[3];
                    if (articles.length > 0) {
                        contentStr += '<div><a target="_blank" href="' + articles[0] +
                            '">more on Wikipedia' + '</a></div>';
                    }
                    clearTimeout(wikiRequestTimeout);
                    infowindow.setContent(contentStr);
                    infowindow.open(map, self.marker);
                },
                error: function(data) {
                    infowindow.setContent(contentStr);
                    infowindow.open(map, self.marker);
                }
            });

            self.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                self.marker.setAnimation(null);
            }, 350);
        }
    };
    self.marker.addListener('click', function() {
        self.populateInfoWindow();
    });
};

const ViewModel = function() {
    let self = this;

    initialized = null;

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.419858, lng: -122.078827},
        zoom: 13,
        mapTypeControl: false
    });

    this.locationList = ko.observableArray([]);

    infowindow = new google.maps.InfoWindow();

    let bounds = new google.maps.LatLngBounds();

    initialLocations.forEach(function(location){
        self.locationList.push(new Location(location));
        bounds.extend(location.position);
    });
    map.fitBounds(bounds);
};

function startApp() {
    ko.applyBindings(new ViewModel());
    initialized = true;
}

function handleError() {
    alert('Unable to access Google Maps. Please check your network.');
}
