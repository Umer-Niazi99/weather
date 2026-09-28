const state = {
  location: {
    name: "Lahore",
    latitude: 31.5204,
    longitude: 74.3587,
    country: "Pakistan"
  },
  weather: null,
  unit: "C"
};

const $ = id => document.getElementById(id);

const icons = {
  0: ["Clear sky","??"],
  1: ["Mainly clear","???"],
  2: ["Partly cloudy","?"],
  3: ["Overcast","??"],
  45: ["Fog","???"],
  48: ["Fog","???"],
  51: ["Light drizzle","???"],
  53: ["Drizzle","???"],
  55: ["Heavy drizzle","???"],
  61: ["Light rain","???"],
  63: ["Rain","???"],
  65: ["Heavy rain","???"],
  71: ["Light snow","???"],
  73: ["Snow","??"],
  75: ["Heavy snow","??"],
  80: ["Rain showers","???"],
  81: ["Rain showers","???"],
  82: ["Heavy showers","??"],
  95: ["Thunderstorm","??"],
  96: ["Thunderstorm","??"],
  99: ["Thunderstorm","??"]
};

function info(code) {
  return icons[code] || ["Unknown","???"];
}

function temp(c) {
  const value = state.unit === "C"
    ? c
    : (c * 9 / 5) + 32;

  return `${Math.round(value)}°`;
}

function time(value) {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: state.weather?.timezone || "Asia/Karachi",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function date(value) {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: state.weather?.timezone || "Asia/Karachi",
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function toast(message) {

  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2500);
}

async function geocode(name) {

  const response = await fetch(
    `/api/geocode?name=${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  return response.json();
}

async function loadWeather() {

  try {

    const params = new URLSearchParams({
      latitude: state.location.latitude,
      longitude: state.location.longitude
    });

    const response = await fetch(
      `/api/weather?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    state.weather = await response.json();

    render();

  } catch (error) {

    console.error(error);
    toast("Unable to load weather data.");

  }
}

function render() {

  const w = state.weather;
  const c = w.current;
  const d = w.daily;

  const [condition, icon] = info(c.weather_code);

  $("location").textContent =
    `${state.location.name}, ${state.location.country}`;

  $("date").textContent = date(c.time);

  $("day").textContent =
    c.is_day ? "DAY" : "NIGHT";

  $("weatherIcon").textContent = icon;

  $("temperature").textContent =
    temp(c.temperature_2m);

  $("condition").textContent =
    condition;

  $("feels").textContent =
    `Feels like ${temp(c.apparent_temperature)}`;

  $("humidity").textContent =
    `${Math.round(c.relative_humidity_2m)}%`;

  $("wind").textContent =
    `${Math.round(c.wind_speed_10m)} km/h`;

  $("clouds").textContent =
    `${Math.round(c.cloud_cover)}%`;

  $("pressure").textContent =
    `${Math.round(c.pressure_msl)} hPa`;

  $("sunrise").textContent =
    time(d.sunrise[0]);

  $("sunset").textContent =
    time(d.sunset[0]);

  $("rain").textContent =
    `${Math.round(d.precipitation_probability_max[0] || 0)}%`;

  $("uv").textContent =
    Number(d.uv_index_max[0] || 0).toFixed(1);

  $("unitButton").textContent =
    state.unit === "C" ? "°C" : "°F";

  renderForecast();
  renderHourly();

  $("updated").textContent =
    `Updated ${new Date().toLocaleTimeString("en-PK", {
      hour: "numeric",
      minute: "2-digit"
    })}`;
}

function renderForecast() {

  const d = state.weather.daily;

  $("forecast").innerHTML =
    d.time.map((day,index) => {

      const [condition,icon] =
        info(d.weather_code[index]);

      const dayName =
        index === 0
          ? "Today"
          : new Intl.DateTimeFormat("en-PK", {
              timeZone: state.weather.timezone,
              weekday: "short"
            }).format(new Date(`${day}T12:00:00`));

      return `
        <div class="forecast-card ${index === 0 ? "today" : ""}">

          <div class="forecast-day">
            ${dayName}
          </div>

          <div class="forecast-icon" title="${condition}">
            ${icon}
          </div>

          <div class="forecast-temp">
            ${temp(d.temperature_2m_max[index])}
            <span>
              ${temp(d.temperature_2m_min[index])}
            </span>
          </div>

          <div class="forecast-rain">
            ?? ${Math.round(
              d.precipitation_probability_max[index] || 0
            )}%
          </div>

        </div>
      `;

    }).join("");

}

function renderHourly() {

  const h = state.weather.hourly;

  const now = new Date();

  let start =
    h.time.findIndex(
      value => new Date(value) >= now
    );

  if (start < 0) start = 0;

  const indexes =
    Array.from({length: 6},(_,i) =>
      Math.min(start+i,h.time.length-1)
    );

  $("hourly").innerHTML =
    indexes.map(index => {

      const [condition,icon] =
        info(h.weather_code[index]);

      return `
        <div class="hour">

          <div class="hour-time">
            ${time(h.time[index])}
          </div>

          <div class="hour-icon">
            ${icon}
          </div>

          <div class="hour-temp">
            ${temp(h.temperature_2m[index])}
          </div>

          <div class="hour-rain">
            ?? ${Math.round(
              h.precipitation_probability[index] || 0
            )}%
          </div>

        </div>
      `;

    }).join("");

}

function chooseLocation(result) {

  state.location = {
    name: result.name,
    latitude: Number(result.latitude),
    longitude: Number(result.longitude),
    country: result.country || "Pakistan"
  };

  $("locationInput").value =
    result.name;

  $("searchResults").classList.add("hidden");

  loadWeather();
}

$("searchForm").addEventListener("submit", async event => {

  event.preventDefault();

  const query =
    $("locationInput").value.trim();

  if (!query) {
    toast("Enter a city first.");
    return;
  }

  try {

    const data =
      await geocode(query);

    const results =
      data.results || [];

    const pakistan =
      results.filter(
        item => item.country_code === "PK"
      );

    const finalResults =
      pakistan.length ? pakistan : results;

    $("searchResults").innerHTML =
      finalResults.map((result,index) => `
        <button
          class="result"
          data-result="${index}"
        >
          <strong>
            ${result.name}
          </strong>

          <small>
            ${result.admin1 || ""}
            ${result.admin1 ? ", " : ""}
            ${result.country || ""}
          </small>
        </button>
      `).join("");

    $("searchResults")
      .classList.remove("hidden");

    document
      .querySelectorAll(".result")
      .forEach((button,index) => {

        button.addEventListener("click", () => {
          chooseLocation(finalResults[index]);
        });

      });

  } catch(error) {

    console.error(error);
    toast("Location search failed.");

  }

});

document
  .querySelectorAll("[data-city]")
  .forEach(button => {

    button.addEventListener("click", async () => {

      try {

        const data =
          await geocode(button.dataset.city);

        const result =
          (data.results || []).find(
            item => item.country_code === "PK"
          );

        if (result) {
          chooseLocation(result);
        }

      } catch(error) {

        toast("Could not load this city.");

      }

    });

  });

$("unitButton").addEventListener("click", () => {

  state.unit =
    state.unit === "C"
      ? "F"
      : "C";

  render();

});

loadWeather();
