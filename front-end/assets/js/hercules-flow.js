var deckgl = null;
var experiment = null;
var changeExperiment = null;
var backgroundImage = null;

var layers = [];
var mapGLLayers = [];

const initialViewState = {
    longitude: 0.0011182,
    latitude: 0.0020000,
    zoom: 5,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5
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

        function generateRandomId() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let randomId = '';
            for (let i = 0; i < 5; i++) {
                randomId += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return randomId;
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

        function addLayerRow(data) {
            var layer_id = generateRandomId();

            var patient_info = [data.patient[0].patient_id, data.patient[0].condition, data.patient[0].visit_length, data.patient[0].day_of_week];

            // Add Layer To Global Layers Array
            var pointData = data.point_data.map(d => ({
                position: [d.y_location, d.x_location],
                color: [255, 0, 0],
                size: 5
            }));

            layers.push({ "id": layer_id, "type": "ScatterPlot", "point_data": pointData, "opacity": 100 });

            const table = $('#layerTable');
            if (!table || table.length === 0) {
                console.error('Error: table not found');
                return;
            }
            const newRow = $('<tr>');

            $.each(patient_info, function (index, value) {
                const newCell = $('<td>').text(value);
                newRow.append(newCell);
            });

            const slider = $('<td>').html(" <input id='slider_" + layer_id + "' type='text' data-slider-min='0' data-slider-max='100' data-slider-step='1' data-slider-value='100'/>");
            newRow.append(slider);
            newRow.append($('<td>').html('<i class="mdi mdi-delete"></i>'));
            table.append(newRow);

            $('#slider_' + layer_id).slider({
                formatter: function (value) {
                    return 'Current value: ' + value;
                }
            });

            $('#slider_' + layer_id).on('slideStop', function () {
                changeOpacityOfLayer(layer_id, $(this).val());
            });

            reloadLayers();
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
            grabHexData(experiment);
        }

        function grabHexData(experiment) {
            var data = {};
            const apiUrl = 'http://localhost:3000/api/data/hex/all/exp/' + parseInt(experiment);

            let jsonData;

            $.ajax({
                url: apiUrl,
                type: 'GET',
                dataType: 'json',
                async: false,
                success: function (data) {
                    jsonData = data;
                    loadTableData(jsonData.point_data);
                    //loadMapData();
                    renderLayer(jsonData.point_data);
                },
                error: function (xhr, status, error) {
                    console.error('Error:', error);
                }
            });
        }

        function loadMapData(data) {
            const INITIAL_VIEW_STATE = {
                latitude: 0.28,
                longitude: 0.45,
                zoom: 9.5,
                bearing: 0,
                pitch: 0
            };


            const TripsLayer = deck.TripsLayer;
            const LOOP_LENGTH = 5920;
            const VENDOR_COLORS = [
                [255, 0, 0],
                [0, 0, 255], // vendor #1
            ];
            let currentTime = 0;

            const tripProps = {
                id: "trips",
                data: data.paths,
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
                bounds: [0.0, 0.0, 0.914112, 0.54649],
                image: 'p2.png'
            };

            var mainDeck;

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

        grabHexData(experiment);

        function changeOpacityOfLayer(layer_id, opacity) {
            reloadLayers();
        }

        function renderLayer(data) {
            console.log(data);
            const hexagonLayer = new HexagonLayer({
                id: 'heatmap',
                coverage: 1,
                lowerPercentile: 50,
                radius: 1,
                upperPercentile: 100,
                colorRange: COLOR_RANGE,
                data,
                elevationRange: [0, 1000],
                elevationScale: 250,
                extruded: true,
                getPosition: d => [d.lng, d.lat]
            });

            deckgl.setProps({
                layers: [hexagonLayer]
            });
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

    });
})(jQuery);
