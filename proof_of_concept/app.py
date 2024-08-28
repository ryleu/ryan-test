from flask import Flask, request
from os import environ
from requests import get
from json import dumps

api_key = environ["OPENWEATHERMAP_API_KEY"]

app = Flask(__name__)

def get_coords_zip(zip):
    response = get(f"http://api.openweathermap.org/geo/1.0/zip?zip={zip},US&appid={api_key}").json()
    return (response["lon"], response["lat"])

def get_coords_city(city, state):
    response = get(f"http://api.openweathermap.org/geo/1.0/direct?q={city},{state},US&limit=1&appid={api_key}").json()[0]
    return (response["lon"], response["lat"])

def get_weather(longitude, latitude):
    response = get(f"https://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&units=imperial&appid={api_key}").json()
    return dumps(response, indent = 2)

@app.route("/")
def _index_html():
    with open("src/index.html") as f:
        index = f.read()
    
    response = app.make_response(index)
    response.mimetype = "text/html"

    return response

@app.route("/index.js")
def _index_js():
    with open("src/index.js") as f:
        index = f.read()
    
    response = app.make_response(index)
    response.mimetype = "text/javascript"

    return response

@app.route("/get")
def _get():
    longitude = request.args.get("lon", None)
    latitude = request.args.get("lat", None)

    if longitude is not None and latitude is not None:
        return get_weather(longitude, latitude)

    zip_code = request.args.get("zip", None)

    if zip_code is not None:
        return get_weather(*get_coords_zip(zip_code))

    city = request.args.get("city", None)
    state = request.args.get("state", None)

    if city is not None and state is not None:
        return get_weather(*get_coords_city(city, state))

    return dumps({
        "error": "you are dumb and bad"
    })