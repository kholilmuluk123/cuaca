const els = {
  input: document.querySelector("#searchInput"),
  button: document.querySelector("#searchBtn"),
  status: document.querySelector("#status"),
  icon: document.querySelector("#weatherIcon"),
  temp: document.querySelector("#temperature"),
  location: document.querySelector("#location"),
  description: document.querySelector("#description"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind"),
  coords: document.querySelector("#coords"),
  updated: document.querySelector("#updated"),
  forecast: document.querySelector("#forecast")
};

const WEATHER = {
  0: ["☀️", "Cerah"],
  1: ["🌤️", "Cerah berawan"],
  2: ["⛅", "Berawan sebagian"],
  3: ["☁️", "Mendung"],
  45: ["🌫️", "Berkabut"],
  48: ["🌫️", "Kabut beku"],
  51: ["🌦️", "Gerimis ringan"],
  53: ["🌦️", "Gerimis"],
  55: ["🌧️", "Gerimis lebat"],
  61: ["🌦️", "Hujan ringan"],
  63: ["🌧️", "Hujan"],
  65: ["🌧️", "Hujan lebat"],
  71: ["🌨️", "Salju ringan"],
  73: ["🌨️", "Salju"],
  75: ["❄️", "Salju lebat"],
  80: ["🌦️", "Hujan singkat"],
  81: ["🌧️", "Hujan"],
  82: ["⛈️", "Hujan sangat lebat"],
  95: ["⛈️", "Badai petir"],
  96: ["⛈️", "Badai petir + es"],
  99: ["⛈️", "Badai petir + es berat"]
};

let googleMapsReadyPromise = null;
let googleGeocoder = null;

function weatherInfo(code) {
  return WEATHER[code] || ["🌡️", "Kondisi tidak diketahui"];
}

function setStatus(text, error = false) {
  els.status.textContent = text;
  els.status.style.color = error ? "#ffd1d1" : "";
}

function isCoordinateInput(value) {
  // Supports: "-7.7956, 110.3695" or "-7.7956 110.3695"
  const parts = value.trim().split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;

  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    latitude,
    longitude,
    name: `${latitude}, ${longitude}`
  };
}

function loadGoogleMapsApi() {
  if (googleMapsReadyPromise) return googleMapsReadyPromise;

  const apiKey = window.APP_CONFIG?.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    return Promise.reject(
      new Error("Google Maps API key belum diatur. Isi GOOGLE_MAPS_API_KEY di config.js.")
    );
  }

  googleMapsReadyPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      googleMapsReadyPromise = null;
      reject(new Error("Google Maps JavaScript API gagal dimuat."));
    };
    document.head.appendChild(script);
  });

  return googleMapsReadyPromise;
}

async function getGoogleLocationName(latitude, longitude) {
  try {
    await loadGoogleMapsApi();

    if (!googleGeocoder) {
      const { Geocoder } = await google.maps.importLibrary("geocoding");
      googleGeocoder = new Geocoder();
    }

    const response = await googleGeocoder.geocode({
      location: { lat: latitude, lng: longitude },
      language: "id",
      region: "ID"
    });

    if (response && response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result && result.formatted_address) {
        return result.formatted_address;
      }
    }

    return `${latitude}, ${longitude}`;
  } catch (error) {
    console.warn("Google reverse geocoding gagal, menggunakan koordinat default:", error);
    return `${latitude}, ${longitude}`;
  }
}

async function getWeather(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal mengambil data cuaca.");
  return response.json();
}

function formatDay(dateString, index) {
  if (index === 0) return "Hari ini";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric"
  });
}

function renderForecast(data) {
  const d = data.daily;
  els.forecast.innerHTML = d.time.map((date, i) => {
    const [icon, label] = weatherInfo(d.weather_code[i]);
    const rain = d.precipitation_probability_max?.[i];
    return `
      <article class="forecast-day" title="${label}">
        <div class="day">${formatDay(date, i)}</div>
        <div class="icon">${icon}</div>
        <div class="temp">${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°</div>
        <div class="rain">💧 ${rain ?? 0}%</div>
      </article>
    `;
  }).join("");
}

function render(place, data) {
  const c = data.current;
  const [icon, label] = weatherInfo(c.weather_code);

  // Mengambil nama kota dari timezone (misal: "Asia/Jakarta" -> "Jakarta")
  const rawTimezone = data.timezone || "";
  const cityName = rawTimezone.includes("/") 
    ? rawTimezone.split("/").pop().replace(/_/g, " ") 
    : rawTimezone;

  els.icon.textContent = icon;
  els.temp.textContent = `${Math.round(c.temperature_2m)}°C`;
  els.location.textContent = place.name || `${place.latitude}, ${place.longitude}`;
  els.description.textContent = label;
  els.humidity.textContent = `${Math.round(c.relative_humidity_2m)}%`;
  els.wind.textContent = `${Number(c.wind_speed_10m).toFixed(1)} km/h`;
  els.coords.textContent = `Lat ${Number(place.latitude).toFixed(4)} · Lon ${Number(place.longitude).toFixed(4)}`;
  
  // Tampilan diubah menjadi Zona Kota saja (misal: "Wilayah: Jakarta")
  els.updated.textContent = `Wilayah: ${cityName || "Tidak diketahui"}`;
  
  renderForecast(data);
}

async function loadWeather(query) {
  const value = query.trim();
  if (!value) return;

  const place = isCoordinateInput(value);
  if (!place) {
    setStatus("Format harus latitude, longitude. Contoh: -7.7956, 110.3695", true);
    return;
  }

  setStatus("Mengambil cuaca dan nama lokasi...");

  try {
    const [weather, locationName] = await Promise.all([
      getWeather(place),
      getGoogleLocationName(place.latitude, place.longitude)
    ]);

    place.name = locationName;
    render(place, weather);

    setStatus(
      `Terakhir diperbarui: ${new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })}`
    );
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Terjadi kesalahan.", true);
  }
}

els.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadWeather(els.input.value);
});

els.button.addEventListener("click", () => loadWeather(els.input.value));

// Default location: Yogyakarta.
loadWeather("-7.7956, 110.3695");
