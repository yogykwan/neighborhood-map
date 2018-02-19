'use strict';

const initialLocations = [
    {title: 'Google', position: {lat: 37.419858, lng: -122.078827}},
    {title: 'Facebook', position: {lat: 37.394439, lng: -122.080147}},
    {title: 'LinkedIn', position: {lat: 37.787884, lng: -122.396946}},
    {title: 'Oracle', position: {lat: 37.5294, lng: -122.265966  }},
    {title: 'Stanford', position: {lat: 37.427475, lng: -122.169719}},
];

let map;

const Location = function(data) {
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.marker = new google.maps.Marker({
        position: data.position,
        title: data.title,
        animation: google.maps.Animation.DROP,
        map: map,
    });
};

const ViewModel = function() {
    let self = this;

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.419858, lng: -122.078827},
        zoom: 13,
        mapTypeControl: false
    });

    this.locationList = ko.observableArray([]);

    let bounds = new google.maps.LatLngBounds();

    initialLocations.forEach(function(location){
        self.locationList.push(new Location(location));
        bounds.extend(location.position)
    });
    map.fitBounds(bounds);
};

function startApp() {
    ko.applyBindings(new ViewModel());
}

function handleError() {
    alert('Unable to access Google Maps. Please check your network.');
}
