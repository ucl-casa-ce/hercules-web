var deckgl = null;
var experiment = null;
var changeExperiment = null;
var backgroundImage = null;

var layers = [];
var mapGLLayers = [];

var url = new URL(window.location.origin);
url.port = '32769';
const baseURL = url.toString();

const initialViewState = {
    x: 0,
    y: 0,
    //width: 1022,
    //height: 600,
    width: 1200,
    height: 633,
};

const { DeckGL, BitmapLayer, ScatterplotLayer, LineLayer, COORDINATE_SYSTEM, OrthographicView, OrbitController } = deck;

(function ($) {
    'use strict';
    $(function () {

        if(experiment == null){
            // Assume Experiment 1
            experiment = "1";
            backgroundImage = "p"+experiment+"-ubi-grid.png";
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

        $("#addPatient").click(function(){
            var userEntry = $("#patient_entry").val();
            userEntry = userEntry.replace(/[^a-zA-Z0-9]/g, '');
            if(userEntry != ""){        
                lookupPatient(userEntry, function(patData){
                    console.log(patData);
                    if(patData.patient.length == 0){
                        alert("Patient ID not found");
                    }else{
                        addLayerRow(patData);
                    }
                });
            }
        });

        function lookupPatient(pat_id, callback) {
            const url = baseURL + 'api/data/'+ parseInt(experiment) + '/'+pat_id;
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

            layers.push({"id": layer_id, "type": "ScatterPlot" ,"point_data": pointData, "opacity": 100});

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
            
            const slider = $('<td>').html(" <input id='slider_"+layer_id+"' type='text' data-slider-min='0' data-slider-max='100' data-slider-step='1' data-slider-value='100'/>");
            newRow.append(slider);
            newRow.append( $('<td>').html('<i class="mdi mdi-delete"></i>') );
            table.append(newRow);

            $('#slider_' + layer_id).slider({
                formatter: function(value) {
                    return 'Current value: ' + value;
                }
            });

            $('#slider_' + layer_id).on('slideStop', function () {
                changeOpacityOfLayer(layer_id, $(this).val());
            });

            reloadLayers();
        }

        function reloadLayers(){
            // Clear Layers
            deckgl.setProps({ layers: [] });

            var localLayers = [];
            localLayers.push(createBitmapLayer(initialViewState));

            // Loop Around Layers
            layers.forEach(function(layer){
                var opacity_slider = $('#slider_' + layer.id).val();
                if(layer.type == "ScatterPlot"){
                    localLayers.push(createScatterplotLayer(initialViewState, layer.point_data, layer.id, opacity_slider));
                }
            });

            deckgl.setProps({ layers: localLayers });
            deckgl.redraw(true);
        };

        function loadTableData(data) {
            // loop around data json array
            $(".num_rows").html(data.length);

            var count = data.length;
            if (count > 100) {
                count = 100;
            }

            for (var i = 0; i < count; i++) {
                var row = data[i];
                addTableRow([i+1, row.patient_id, row.location, row.start_time, row.end_time, row.step_length]);
            }
        }

        changeExperiment = function changeExperiment(expID){
            experiment = parseInt(expID);    
            backgroundImage = "p"+experiment+"-ubi-grid.png";
            deckgl.setProps({ layers: [] });
            deckgl.redraw(true);
            grabAllData(experiment);    
        }

        function grabAllData(experiment){
            var data = {};
            const apiUrl = baseURL + 'api/data/all/exp/' + parseInt(experiment);
    
            let jsonData;
    
            $.ajax({
                url: apiUrl,
                type: 'GET',
                dataType: 'json',
                async: false,
                success: function(data) {
                    jsonData = data;
                    loadTableData(jsonData.point_data);
                    loadMapData(jsonData.point_data);
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                }
            });
        }

        function loadMapData(jsonData){
            let pointData = [];
        
            pointData = jsonData.map(d => ({
                position: [d.y_location, d.x_location],
                color: [255, 0, 0],
                color: [65, 105, 225, 30],
                size: 5
            }));

            deckgl = new DeckGL({
                container: 'deck-gl-wrapper',
                views: new OrthographicView({controller: true}),
                initialViewState,
                layers: [
                    createBitmapLayer(initialViewState),
                    createScatterplotLayer(initialViewState, pointData, "test", 10),
                ]
            });
    
            document.getElementById('deck-gl-wrapper').appendChild(deckgl.canvas);
        }

        grabAllData(experiment);

        function changeOpacityOfLayer(layer_id, opacity){
            reloadLayers();
        }

        function createBitmapLayer(initialViewState) {
            return new BitmapLayer({
                id: 'background-image',
                image: './assets/floorplans/' + backgroundImage,
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                //ransparentColor: [0, 0, 0, 255],
                tintColor: [52,52,52],
                bounds: [-initialViewState.width / 2, initialViewState.height / 2, initialViewState.width / 2, -initialViewState.height / 2],
            });
        }

        function createScatterplotLayer(initialViewState, data, layer_id, opacity) {
            //     const xScale = d3.scaleLinear().domain([0, initialViewState.width]).range([0, 18.209]);
            //     const yScale = d3.scaleLinear().domain([0, initialViewState.height]).range([0, 34.441]);

            const xScale = d3.scaleLinear().domain([0, 18.209]).range([0, initialViewState.width]);
            const yScale = d3.scaleLinear().domain([0, 34.441]).range([0, initialViewState.height]);

            return new ScatterplotLayer({
                id: layer_id,
                // data: [
                //     { position: [0, 0], color: [0, 0, 0] },
                //     { position: [9.1045, 17.2205], color: [0, 255, 0] },
                //     { position: [18.209, 34.441], color: [0, 0, 255] },
                // ],
                data: data,
                getPosition: d => [xScale(d.position[0]) - initialViewState.width / 2, initialViewState.height / 2 - yScale(d.position[1])],
                getFillColor: d => d.color,
                opacity: opacity / 100,
                getRadius: 3
            });
        }

        function createLineLayer(initialViewState) {

            const xScale = d3.scaleLinear().domain([0, 18.209]).range([0, initialViewState.width]);
            const yScale = d3.scaleLinear().domain([0, 34.441]).range([0, initialViewState.height]);

            data = [
                { start: [0, 0], end: [18.209, 34.441], color: [0, 0, 255] },
                { start: [0, 18.209], end: [34.441, 0], color: [255, 0, 0] },
                { start: [0, 9.1045], end: [34.441, 9.1045], color: [0, 255, 0] }
              ];

              const scaledData = data.map(d => ({
                sourcePosition: [xScale(d.start[0]) - initialViewState.width / 2, initialViewState.height / 2 - yScale(d.start[1]), 0],
                targetPosition: [xScale(d.end[0])  - initialViewState.width / 2, initialViewState.height / 2 - yScale(d.end[1]), 0],
                color: d.color
              }));
            
            
            return new LineLayer({
                data: scaledData,
                getSourcePosition: d => d.start,
                getTargetPosition: d => d.end,
                getColor: d => d.color,
                getWidth: 5
            });
          }

        $(".map_reset_button").click(function() {
            deckgl.setProps({viewState: initialViewState});
        });

        $(".layer_reset_button").click(function() {
            deckgl.setProps({ layers: [createBitmapLayer(initialViewState)] });
            deckgl.redraw(true);    
        });

        $(".all_experiment_button").click(function() {
            deckgl.setProps({ layers: [] });
            deckgl.redraw(true);    
            grabAllData(experiment);
        });

    });
})(jQuery);
