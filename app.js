'use strict'

const express = require('express');
const fs = require('node:fs');
const app = express();
const api_key = process.env.OPENWEATHERMAP_API_KEY;

const main_js = fs.readFileSync("src/index.js", { encoding: "utf8" });
const main_page = fs.readFileSync("src/index.html", { encoding: "utf8" }).replace(
    '<script src="/index.js"></script>',
    `<script>${main_js}</script>`
);
const main_css = fs.readFileSync("src/index.css", { encoding: "utf8" });

// STATIC ENDPOINTS //

app.get('/', (req, res) => {
    res.appendHeader("Content-Type", "text/html");
    res.send(main_page);
});
app.get('/index.js', (req, res) => {
    res.appendHeader("Content-Type", "text/javascript");
    res.send(main_js);
});
app.get('/index.css', (req, res) => {
    res.appendHeader
});

// API ENDPOINTS //

// this isn't ideal, but it is better than crashing
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

    // todo: consider a proper router
    if (zip) {
        // geolocation api is free, so we don't mind making two calls
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

function appWrapper(req, res) {
    // for some reason, serverless will pass an empty url
    // when this happens, express will freak out
    if (!req.path) {
        req.url = "/";
    }

    return app(req, res);
}

module.exports = appWrapper;
