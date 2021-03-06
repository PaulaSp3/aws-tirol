/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Feuchtigkeit": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

//Stationen
let drawStations = function (geojson) {
    // Wetterstationen mit Icons und Popups implementieren
    L.geoJSON(geojson, {
        pointToLayer: function (geoJsonPoint, latlng) {
            //L.marker(latlng).addTo(map);
            //console.log(geoJsonPoint.geometry.coordinates)

            let popup = `<strong> ${geoJsonPoint.properties.name} </strong>
            (${geoJsonPoint.geometry.coordinates[2]} m) <br>
            <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Grafik</a>
            `;

            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37], //Verschieben des Icons dass Spitze richtig ist
                    popupAnchor: [0, -37] //Verschieben des Popups, dass es nicht das Icon verdeckt
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);
}

//Temperature
let drawTemperature = function (geojson) {
    L.geoJSON(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
                return true
            }

        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //L.marker(latlng).addTo(map);
            //console.log(geoJsonPoint.properties.LT)

            let popup = `<strong> ${geoJsonPoint.properties.name} </strong>
            (${geoJsonPoint.geometry.coordinates[2]} m)<br>
            <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Grafik</a>
            `;
            let color = getColor(
                geoJsonPoint.properties.LT,
                COLORS.temperature
            );
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);
}

//Schneehöhe
let drawSnowheight = function (geojson) {
    L.geoJSON(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.HS > 0 && geoJsonPoint.properties.HS < 20000) {
                return true
            }

        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //L.marker(latlng).addTo(map);
            //console.log(geoJsonPoint.properties.LT)

            let popup = `<strong> ${geoJsonPoint.properties.name} </strong>
            (${geoJsonPoint.geometry.coordinates[2]} m)<br>
            <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Grafik</a>
            `;
            let color = getColor(
                geoJsonPoint.properties.HS,
                COLORS.snowheight
            );
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}">${geoJsonPoint.properties.HS.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);
}

//WIndgeschwindigkeit
let drawWind = function (geojson) {
    L.geoJSON(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.WG > 0 && geoJsonPoint.properties.WG < 1000 &&
                geoJsonPoint.properties.WR >= 0 &&
                geoJsonPoint.properties.WR <= 360) {
                return true
            }

        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //L.marker(latlng).addTo(map);
            //console.log(geoJsonPoint.properties.LT)

            let popup = `<strong> ${geoJsonPoint.properties.name} </strong>
            (${geoJsonPoint.geometry.coordinates[2]} m)<br>
            <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Grafik</a>
            `;
            let windKmh = geoJsonPoint.properties.WG * 3.6;
            let color = getColor(
                windKmh,
                COLORS.wind
            );
            let deg = geoJsonPoint.properties.WR;
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}"><i class="fa-solid fa-circle-arrow-up" style = "transform: rotate(${deg}deg)"></i>${windKmh.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);
}

let drawHumidity = function (geojson) {
    L.geoJSON(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.RH >= 0 && geoJsonPoint.properties.RH <= 100) {
                return true
            }

        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //L.marker(latlng).addTo(map);
            //console.log(geoJsonPoint.properties.LT)

            let popup = `<strong> ${geoJsonPoint.properties.name} </strong>
            (${geoJsonPoint.geometry.coordinates[2]} m)<br>
            <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Grafik</a>
            `;
            let color = getColor(
                geoJsonPoint.properties.RH,
                COLORS.humidity
            );
            let deg = geoJsonPoint.properties.RH;
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}">${geoJsonPoint.properties.RH.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.humidity);
}

L.control.rainviewer({
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map)

//Farben nach Wert und Schwellen ermitteln
let getColor = function (value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
};
console.log(getColor(-40, COLORS.temperature))
// Layer beim Laden anzeigen
overlays.wind.addTo(map);


// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson);
    drawWind(geojson);
    drawHumidity(geojson);

}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");