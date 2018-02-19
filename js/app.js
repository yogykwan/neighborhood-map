'use strict';

const initialLocations = [
    {title: 'Google', position: {lat: 37.419858, lng: -122.078827}},
    {title: 'Facebook', position: {lat: 37.394439, lng: -122.080147}},
    {title: 'LinkedIn', position: {lat: 37.787884, lng: -122.396946}},
    {title: 'Oracle', position: {lat: 37.5294, lng: -122.265966}},
    {title: 'Stanford', position: {lat: 37.427475, lng: -122.169719}},
];

let map;

const Location = function(data, populateInfowindow) {
    let self = this;
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.visible = ko.observable(true);
    this.marker = new google.maps.Marker({
        position: data.position,
        title: data.title,
        animation: google.maps.Animation.DROP,
    });

    self.marker.addListener('click', function() {
        populateInfowindow(this);
    });

    this.showMarker = ko.computed(function() {
        if(this.visible() === true) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);
};

const ViewModel = function() {
    let self = this;

    map = new google.maps.Map(document.getElementById('map'), {
        center: initialLocations[0].position,
        zoom: 13,
        mapTypeControl: false
    });

    let infowindow = new google.maps.InfoWindow();

    this.populateInfowindow = function(marker) {
        if (infowindow.marker !==  marker) {
            infowindow.close();
            infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });

            let contentStr = '<div class="title"><b>' + marker.title + '</b></div>';
            let wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title +
                '&format=json&callback=wikiCallback';
            let wikiRequestTimeout = setTimeout(function(){
                console.log('Failed to get wikipedia for ', marker.title);
            }, 2000);
            $.ajax({
                url : wikiUrl,
                dataType: 'jsonp',
                success: function(data) {
                    console.log('success', data);
                    const articles = data[3];
                    if (articles.length > 0) {
                        contentStr += '<div><a target="_blank" href="' + articles[0] +
                            '">' + articles[0] + '</a></div>';
                    }
                    clearTimeout(wikiRequestTimeout);
                    infowindow.setContent(contentStr);
                    infowindow.open(map, marker);
                },
                error: function(data) {
                    infowindow.setContent(contentStr);
                    infowindow.open(map, marker);
                }
            });

            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 300);
        }
    };

    this.initialLocationList = ko.observableArray([]);

    let bounds = new google.maps.LatLngBounds();
    initialLocations.forEach(function(initialLocation){
        self.initialLocationList.push(new Location(initialLocation, self.populateInfowindow));
        bounds.extend(initialLocation.position);
    });
    map.fitBounds(bounds);

    this.filterText = ko.observable("");
    this.locationList = ko.computed(function() {
        const filter = self.filterText().toLowerCase();
        if (!filter) {
            self.initialLocationList().forEach(function(location){
                location.visible(true);
            });
            return self.initialLocationList();
        } else {
            return ko.utils.arrayFilter(self.initialLocationList(), function(location) {
                const result = location.title().toLowerCase().search(filter) >= 0;
                location.visible(result);
                return result;
            });
        }
    }, self);
};

function startApp() {
    ko.applyBindings(new ViewModel());
}

function handleError() {
    alert('Unable to access Google Maps. Please check your network.');
}
