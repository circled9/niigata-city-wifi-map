/* global $, _, L, navigator */
(function() {
  var map;
  var yourMarker;

  var defaultLocation = [37.912041, 139.061762]; // Niigata Station
  var defaultZoom = 15;

  function initializeMap() {
    var osmTileUrl = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    var osm = new L.TileLayer(osmTileUrl);
    var layers = {
      "OpenStreatMap": osm
    };

    map = L.map("map").setView(defaultLocation, defaultZoom);
    map.addLayer(osm);
    map.addControl(new L.Control.Layers(layers, {}));
  }

  function showWiFiSpot() {
    var onSuccess = function(data) {
      _.map(data, function(item) {
        var name = item.name;
        var comment = item.comment;
        var lat = item.latlng.lat;
        var lng = item.latlng.lng;
        var icon = _getIcon("wifi-spot");

        L.marker([lat, lng], {icon: icon})
          .addTo(map)
          .bindPopup(_createPopupContent(name, comment));
      });
    };
    $.getJSON("./niigata-city-wifi-spot.json", onSuccess);
  }

  function _getIcon(fileName) {
    var icon = L.icon({
      iconUrl: "img/" + fileName + ".png",
      iconRetinaUrl: "img/" + fileName + "@2x.png",
      iconSize: [32, 32],
      shadowUrl: "img/shadow.png",
      shadowRetinaUrl: "img/shadow@2x.png",
      shadowSize: [32, 32],
      shadowAnchor: [16, 14]
    });
    return icon;
  }

  function _createPopupContent(name, comment) {
    var $title = $("<div></div>").addClass("title").text(name);
    var $description = $("<div></div>").addClass("description").text(comment);
    var $popupContent = $("<div></div>").append($title).append($description);
    return $popupContent.html();
  }

  function showCurrentPosition() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        _setYouCenter([lat, lng]);
      });
    } else {
      _setYouCenter(defaultLocation);
    }
  }

  function _setYouCenter(latlng) {
    if (yourMarker) {
      yourMarker.setLatLng(latlng);
    } else {
      var yourIcon = _getIcon("you");
      yourMarker = L.marker(latlng, {icon: yourIcon}).addTo(map);
    }
    map.setView(latlng, defaultZoom, {animate: true});
  }

  $(function() {
    initializeMap();
    showCurrentPosition();
    showWiFiSpot();

    $(".current-position").click(function() {
      showCurrentPosition();
    });
  });
})();
