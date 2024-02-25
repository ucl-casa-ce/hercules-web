var deckgl = null;
var experiment = null;
var changeExperiment = null;
var backgroundImage = null;

var layers = [];
var mapGLLayers = [];
var mainDeck;

const INITIAL_VIEW_STATE = {
    latitude: 0.090,
    longitude: 0.171,
    zoom: 10.99,
    bearing: 0,
    pitch: 0
};

const COLOR_RANGE = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

(function ($) {
    'use strict';
    $(function () {

        if (experiment == null) {
            // Assume Experiment 1
            experiment = "1";
            backgroundImage = "p" + experiment + "-ubi-grid.png";
        }

        function addTableRow(data) {
            const table = $('#dataTable');
            if (!table || table.length === 0) {
                console.error('Error: table not found');
                return;
            }
            const newRow = $('<tr>');
            $.each(data, function (index, value) {
                const newCell = $('<td>').text(value);
                newRow.append(newCell);
            });
            table.append(newRow);
        }

        $("#addPatient").click(function () {
            var userEntry = $("#patient_entry").val();
            userEntry = userEntry.replace(/[^a-zA-Z0-9]/g, '');
            if (userEntry != "") {
                lookupPatient(userEntry, function (patData) {
                    console.log(patData);
                    //if (patData.patient.length == 0) {
                    //    alert("Patient ID not found");
                    //} else {
                    //    addLayerRow(patData);
                    //}
                    loadMapData(patData);
                });
            }
        });

        function lookupPatient(pat_id, callback) {
            const url = 'http://localhost:3000/api/data/flows/single/' + parseInt(experiment) + '/' + pat_id;
            console.log(url);
            fetch(url)
                .then(response => response.json())
                .then(data => callback(data))
                .catch(error => callback(error, null));
        }

        function loadTableData(data) {
            // loop around data json array
            $(".num_rows").html(data.length);

            var count = data.length;
            if (count > 100) {
                count = 100;
            }

            for (var i = 0; i < count; i++) {
                var row = data[i];
                addTableRow([i + 1, row.patient_id, row.location, row.start_time, row.end_time, row.step_length]);
            }
        }

        changeExperiment = function changeExperiment(expID) {
            experiment = parseInt(expID);
            backgroundImage = "p" + experiment + "-ubi-grid.png";
            deckgl.setProps({ layers: [] });
            deckgl.redraw(true);
        }

        function loadMapData(data) {
            const TripsLayer = deck.TripsLayer;
            const LOOP_LENGTH = 5920;
            const VENDOR_COLORS = [
                [255, 0, 0],
                [0, 0, 255], // vendor #1
            ];
            let currentTime = 0;
            
            const tripProps = {
                id: "trips",
                data: data?.paths,
                getPath: (d) => d.path,
                getTimestamps: (d) => d.timestamps,
                getColor: (d) => VENDOR_COLORS[d.vendor],
                opacity: 3,
                widthMinPixels: 4,
                trailLength: 250000,
                currentTime,
                shadowEnabled: false,
            };

            const bitmapProps = {
                id: 'bitmap-layer',
                bounds: [0.0, 0.0, 0.34441, 0.18209],
                image: './assets/floorplans/' + backgroundImage
            };


            const animate = () => {
                currentTime = (currentTime + 1) % LOOP_LENGTH;
                const tripsLayer = new TripsLayer({
                    ...tripProps,
                    currentTime,
                });
                const bitmapLayer = new deck.BitmapLayer({
                    ...bitmapProps
                });
                mainDeck.setProps({
                    layers: [bitmapLayer, tripsLayer],
                });

                window.requestAnimationFrame(animate);
            };


            async function initMap() {
                console.log("initMap()");
                mainDeck = new deck.Deck({
                    container: 'deck-gl-wrapper',
                    initialViewState: INITIAL_VIEW_STATE,
                    layers: [
                        new TripsLayer({
                            tripProps
                        }),
                        new deck.BitmapLayer({
                            bitmapProps
                        })
                    ]
                });
                window.requestAnimationFrame(animate);
            }

            window.initMap = initMap;
            console.log(" window.initMap");
            initMap();

            document.getElementById('deck-gl-wrapper').appendChild(mainDeck.canvas);
        }

        function createBitmapLayer(initialViewState) {
            return new BitmapLayer({
                id: 'background-image',
                image: './assets/floorplans/' + backgroundImage,
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                //ransparentColor: [0, 0, 0, 255],
                tintColor: [52, 52, 52],
                bounds: [-initialViewState.width / 2, initialViewState.height / 2, initialViewState.width / 2, -initialViewState.height / 2],
            });
        }

        $(".map_reset_button").click(function () {
            deckgl.setProps({ viewState: initialViewState });
        });

        $(".layer_reset_button").click(function () {
            deckgl.setProps({ layers: [createBitmapLayer(initialViewState)] });
            deckgl.redraw(true);
        });

        $(".all_experiment_button").click(function () {
            deckgl.setProps({ layers: [] });
            deckgl.redraw(true);
            grabAllData(experiment);
        });

        loadMapData();

    });
})(jQuery);
