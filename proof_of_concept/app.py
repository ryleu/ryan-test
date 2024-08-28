from flask import Flask, request
from os import environ
from requests import get
from json import loads, dumps

api_key = environ["OPENWEATHERMAP_API_KEY"]

app = Flask(__name__)

def get_coords_zip(zip, country):
    response = get(f"http://api.openweathermap.org/geo/1.0/zip?zip={zip},{country}&appid={api_key}").json()
    return (response["lon"], response["lat"])

def get_weather(longitude, latitude):
    response = get(f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}").json()
    return dumps(response, indent = 2)

@app.route("/")
def _index_html():
    with open("index.html") as f:
        index = f.read()
    
    response = app.make_response(index)
    response.mimetype = "text/html"

    return response

@app.route("/index.js")
def _index_js():
    with open("index.js") as f:
        index = f.read()
    
    response = app.make_response(index)
    response.mimetype = "text/javascript"

    return response

@app.route("/countries.json")
def _countries():
    with open("countries.json") as f:
        index = f.read()
    
    response = app.make_response(index)
    response.mimetype = "application/json"

    return response

@app.route("/get")
def _get():
    longitude = request.args.get("lon", None)
    latitude = request.args.get("lat", None)

    if longitude is not None and latitude is not None:
        return get_weather(longitude, latitude)

    zip_code = request.args.get("zip", None)
    country_code = request.args.get("country", None)

    if zip_code is not None and country_code is not None:
        return get_weather(*get_coords_zip(zip_code, country_code))

    city = request.args.get("city", None)

    if city is not None:
        return get_weather(*get_coords_city(city))

    return dumps({
        "error": "you are dumb and bad"
    })