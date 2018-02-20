'use strict';

// Global google map object.
let map;

const Location = function(data, populateInfowindow) {
    let self = this;

    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.visible = ko.observable(true);

    // Create new marker for each location.
    this.marker = new google.maps.Marker({
        position: data.position,
        title: data.title,
        animation: google.maps.Animation.DROP,
    });

    // Popout info window with wikipedia source when clicking the marker.
    self.marker.addListener('click', function() {
        populateInfowindow(this);
    });

    // Show or hide marker according to the value of `visible`.
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

    // Create a global google map object.
    map = new google.maps.Map(document.getElementById('map'), {
        center: initialLocations[0].position,
        zoom: 13,
        mapTypeControl: false
    });

    let infowindow = new google.maps.InfoWindow();

    // Require resouces from wikipedia's api using ajax, and populate info window with its response.
    this.populateInfowindow = function(marker) {
        if (infowindow.marker !==  marker) {
            infowindow.close();
            infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });

            let contentStr = `<div class="title"><b>${marker.title}</b></div>`;
            let wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${marker.title}
            &format=json&callback=wikiCallback`;
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
                        contentStr += `<div><a target="_blank" href="${articles[0]}">${articles[0]}</a></div>`;
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

            // When showing the info window of some chosen location, let its marker bounce once for attention.
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 300);
        }
    };

    // Construct `Location` objects using name and position of locations and fit them into map's boundary.
    this.initialLocationList = ko.observableArray([]);
    let bounds = new google.maps.LatLngBounds();
    initialLocations.forEach(function(initialLocation){
        self.initialLocationList.push(new Location(initialLocation, self.populateInfowindow));
        bounds.extend(initialLocation.position);
    });
    map.fitBounds(bounds);

    // When user type into input box, we generate a list of filtered locations including the filter text.
    this.filterText = ko.observable("");
    this.locationList = ko.computed(function() {
        const filter = self.filterText().toLowerCase();
        if (!filter) {
            // If there's no filter, display all locations.
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

// When google api script can't be loaded, show this alert.
function handleError() {
    alert('Unable to access Google Maps. Please check your network.');
}
