
/**
 * @license
 * Copyright 2021 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
// TODO Use imports when Deck.gl works in more bundlers
// https://github.com/visgl/deck.gl/issues/6351#issuecomment-1079424167
// import { GoogleMapsOverlay } from "https://cdn.skypack.dev/@deck.gl/google-maps";
// import { TripsLayer } from "https://cdn.skypack.dev/deck.gl";

const INITIAL_VIEW_STATE = {
    latitude: 40.715,
    longitude: -73.98,
    zoom: 12,
    bearing: 0,
    pitch: 0
};


const TripsLayer = deck.TripsLayer;
const DATA_URL =
    "one_patient_translated.json";
const LOOP_LENGTH = 5920;
const VENDOR_COLORS = [
    [255, 0, 0],
    [0, 0, 255], // vendor #1
];
let currentTime = 0;

const tripProps = {
    id: "trips",
    data: DATA_URL,
    getPath: (d) => d.path,
    getTimestamps: (d) => d.timestamps,
    getColor: (d) => VENDOR_COLORS[d.vendor],
    opacity: 3,
    widthMinPixels: 4,
    trailLength: 250,
    currentTime,
    shadowEnabled: true,
};

const bitmapProps = {
    id: 'bitmap-layer',
    bounds: [-74.024034, 40.685544, -73.938146, 40.740193],
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