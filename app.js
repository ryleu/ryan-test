require('dotenv').config()
const express = require('express');
const fs = require('node:fs');
const app = express();
const port = process.env.PORT;
const api_key = process.env.OPENWEATHERMAP_API_KEY;

app.get('/', (req, res) => {
    let file = fs.readFileSync("src/index.html", { encoding: "utf8" });
    res.appendHeader("Content-Type", "text/html");
    res.send(file);
});

app.get('/index.js', (req, res) => {
    let file = fs.readFileSync("src/index.js", { encoding: "utf8" });
    res.appendHeader("Content-Type", "text/javascript");
    res.send(file);
});

async function handleApiError(req, res, callback) {
    try {
        await callback(req, res);
    } catch (e) {
        console.error(e.message);
        res.statusCode = 500;
        res.send("Internal error");
    }
}

async function coordsFromZip(zip) {
    // api docs ask that we not directly search for weather by zip code
    let response = await (await fetch(
        `http://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${api_key}`
    )).json();

    if (response.cod !== "200" && response.cod !== undefined) {
        throw new Error("in coordsFromZip: " + JSON.stringify(response));
    }

    return { lon: response.lon, lat: response.lat };
}

async function coordsFromCity(city, state) {
    // api docs ask that we not directly search for weather by city & state either
    let response = (await (await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&limit=1&appid=${api_key}`
    )).json());

    if (response.cod !== "200") {
        throw new Error("in coordsFromCity: " + JSON.stringify(response));
    }

    // the closest match to the city will do for this demo
    let firstResult = response[0];
    return { lon: firstResult.lon, lat: firstResult.lat };
}

async function getForecast(latitude, longitude) {
    let response = await (await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=imperial&appid=${api_key}`
    )).json();

    if (response.cod !== "200") {
        throw new Error("in getForecast: " + JSON.stringify(response));
    }

    return response;
}

app.get('/forecast', async (q, s) => handleApiError(q, s, async (req, res) => {
    let latitude, longitude;

    let zip = req.query.zip;
    let city = req.query.city;
    let state = req.query.state;

    if (zip) {
        let coords = await coordsFromZip(zip);
        latitude = coords.lat;
        longitude = coords.lon;
    } else if (city && state) {
        let coords = await coordsFromCity(city, state);
        latitude = coords.lat;
        longitude = coords.lon;
    } else {
        latitude = req.query.lat;
        longitude = req.query.lon;
    }

    if (!latitude || !longitude) {
        res.statusCode = 400;
        res.send("Invalid latitude and longitude");
        return;
    }

    let forecast = await getForecast(latitude, longitude);
    res.appendHeader("Content-Type", "application/json");
    res.send(forecast);
}));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
