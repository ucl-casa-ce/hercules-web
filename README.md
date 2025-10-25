# Hercules Web 
[![Build Website](https://github.com/ucl-casa-ce/hercules-web/actions/workflows/main.yml/badge.svg)](https://github.com/ucl-casa-ce/hercules-web/actions/workflows/main.yml)

This repository contains the visualisation application for the Hercules Project.  The other components to this project are contained in the main [Hercules repository](https://github.com/djdunc/hercules)

## Demo video

https://github.com/user-attachments/assets/4d0146e2-fe47-4b9c-9a78-59cb82032b36

## How it works
This app simply plays back patient journeys as they happened on the test day. By utilising Ubisense location data, the app utilises an open-source tool from Deck.gl ([Trips Layer](https://deck.gl/docs/api-reference/geo-layers/trips-layer)) to animate the path for each patient. The app is also capable of controlling the playback (pausing, going forward or backwards), in addition to advanced filtering according to patient cases, experiment number, or specific patient ID.

## Application architecture
The data comes from the main [Hercules repository](https://github.com/djdunc/hercules), where a Docker script does the importing process. Data is stored in a PostgreSQL database for the API to use.
The Express.js server is responsible for aggregating the data and then sending it via the RESTful API to the Frontend. On the frontend side, jQuery receives the data and handles user interaction. The heavy animation logic is contained in the `hercules-flow.js` file. NGINX is responsible for routing HTTP requests from/to the application.

![App architecture](docs/architecture.png)


