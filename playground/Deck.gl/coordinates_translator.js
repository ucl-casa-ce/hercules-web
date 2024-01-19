function translateCoordinates(i, w) {
    // Define the ranges for i, w, longitude, and latitude
    const iRange = { min: 0, max: 35 };
    const wRange = { min: 0, max: 20 };
    const longitudeRange = { min: 40.65000, max: 40.75000 };
    const latitudeRange = { min: -74.0066, max: -73.97000 };

    // Calculate the ratio of i and w within their respective ranges
    const iRatio = (i - iRange.min) / (iRange.max - iRange.min);
    const wRatio = (w - wRange.min) / (wRange.max - wRange.min);

    // Use the ratios to calculate the longitude and latitude
    const longitude = longitudeRange.min + iRatio * (longitudeRange.max - longitudeRange.min);
    const latitude = latitudeRange.min + wRatio * (latitudeRange.max - latitudeRange.min);

    // Return the calculated longitude and latitude
    return [longitude, latitude];
}


//Usage Example:
//let [longitude, latitude] = translateCoordinates(10, 5);
//console.log(`Longitude: ${longitude}, Latitude: ${latitude}`);