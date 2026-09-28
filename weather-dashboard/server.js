const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,precipitation_probability,weather_code"
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max"
    );
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("wind_speed_unit", "kmh");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Open-Meteo request failed");
    }

    res.json(await response.json());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load weather data" });
  }
});

app.get("/api/geocode", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Location required" });
    }

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

    url.searchParams.set("name", name);
    url.searchParams.set("count", "8");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    res.json(await response.json());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Location search failed" });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("  SkyCast Pakistan Weather Dashboard");
  console.log("====================================");
  console.log("");
  console.log("Running at:");
  console.log("http://localhost:3000");
  console.log("");
});
