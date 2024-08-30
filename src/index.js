let zipSubmit;
let zipInput;

let citySubmit;
let cityInput;
let citySelect;

let automaticLocation;
let dump;
let coords;
let buttons;

const STATES = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "District of Columbia": "DC",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Puerto Rico": "PR",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
}

function populateStates() {
    for (const [name, abbr] of Object.entries(STATES)) {
        const option = document.createElement("option");
        option.value = abbr;
        option.innerHTML = name;
        citySelect.appendChild(option);
    }
}

async function getWeather(data) {
    const url = new URL(`${window.location.origin}/forecast`);
    for (const [key, value] of Object.entries(data)) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url);
    return response.text().then((value) => {
        dump.innerHTML = value;
    });
}

function disableButtons(state) {
    buttons.forEach((value) => {
        value.disabled = state;
    });
}

async function onZipSubmit(event) {
    // submitting a form should not refresh
    event.preventDefault();

    const zip = zipInput.value;
    if (zip !== "") {
        disableButtons(true);
        getWeather({ "zip": zip }).finally(() => {
            disableButtons(false);
        });
    }
}

async function onCitySubmit(event) {
    // submitting a form should not refresh
    event.preventDefault();

    const city = cityInput.value;
    const state = citySelect.value;
    if (city !== "" && state !== "") {
        disableButtons(true);
        getWeather({ "city": city, "state": state }).finally(() => {
            disableButtons(false);
        });
    }
}

async function getAutomaticLocation(event) {
    event.preventDefault();
    disableButtons(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
        disableButtons(false);
        await getWeather({
            lat: position.coords.latitude,
            lon: position.coords.longitude
        });
    }, (err) => {
        disableButtons(false);
        alert(err.message);
    });
}

window.addEventListener('load', function () {
    zipSubmit = document.getElementById("zip-submit");
    zipInput = document.getElementById("zip-input");

    citySubmit = document.getElementById("city-submit");
    cityInput = document.getElementById("city-input");
    citySelect = document.getElementById("city-state");

    automaticLocation = document.getElementById("automatic-location");
    dump = document.getElementById("dump");

    populateStates();

    buttons = [
        zipSubmit, automaticLocation, citySubmit
    ];

    zipSubmit.addEventListener("click", onZipSubmit);
    citySubmit.addEventListener("click", onCitySubmit);
    automaticLocation.addEventListener("click", getAutomaticLocation);
})
