'use strict'

const express = require('express');
const fs = require('node:fs');
const app = express();
const api_key = process.env.OPENWEATHERMAP_API_KEY;

// API ENDPOINTS //

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

    if (response.cod && response.cod !== "200") {
        throw new Error("in coordsFromCity: " + JSON.stringify(response));
    }

    // the closest match to the city will do for this demo
    let firstResult = response[0];
    return { lon: firstResult.lon, lat: firstResult.lat };
}

/**
 * Get coordinates from city and country or zip
 */
app.get('/coordinates', async (req, res) => {
    let city = req.query.city;
    let state = req.query.state;
    let zip = req.query.zip;

    // todo: check login

    let data;

    if (city && state) {
        data = await coordsFromCity(city, state);
    } else if (zip) {
        data = await coordsFromZip(zip);
    } else {
        res.statusCode = 400;
        res.send("Missing required parameters");
        return;
    }

    if (data.cod && data.cod !== "200") {
        throw new Error(JSON.stringify(data));
    }

    res.appendHeader("Content-Type", "application/json");
    res.send({
        name: data.name,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
    });
});

/**
 * Get the forecast from coordinates
 */
app.get('/forecast', async (req, res) => {
    let lat = req.query.lat;
    let lon = req.query.lon;

    // todo: check login

    let data = await (await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${api_key}`
    )).json();

    if (data.cod && data.cod !== "200") {
        throw new Error(JSON.stringify(data));
    }

    res.appendHeader("Content-Type", "application/json");
    res.send(data);
});

async function appWrapper(req, res) {
    // not great for prod, but should do for a demo
    try {
        await app(req, res);
    } catch (e) {
        console.error(e.message);
        res.statusCode = 500;
        res.send("Internal error");
    }
}

module.exports = appWrapper;
