const baseUrl = "http://api.weatherapi.com/v1/current.json";
const apiKey = "4c595ed231134985860192153250401";

// Tab elements
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");

// Container elements
const weatherContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(
  ".grant-location-container"
);
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");

let currentTab = userTab;
const ACTIVE_CLASS = "active";
const CURRENT_TAB_CLASS = "current-tab";

// Country codes mapping for proper flag display
const countryCodeMap = {
  "United States of America": "us",
  "United Kingdom": "gb",
  India: "in",
};

function getCountryCode(country) {
  if (countryCodeMap[country]) {
    return countryCodeMap[country];
  }

  let code = country
    .toLowerCase()
    .replace("united states of america", "us")
    .replace("united kingdom", "gb")
    .replace("united states", "us")
    .replace("united arab emirates", "ae");

  if (code.length > 2) {
    code = code.slice(0, 2);
  }

  return code;
}

async function fetchWeatherByCoordinates(lat, lon) {
  const weatherUrl = `${baseUrl}?key=${apiKey}&q=${lat},${lon}&aqi=no`;
  try {
    loadingScreen.classList.add(ACTIVE_CLASS);
    grantAccessContainer.classList.remove(ACTIVE_CLASS);
    userInfoContainer.classList.remove(ACTIVE_CLASS);

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    renderWeatherInfo(data);
    loadingScreen.classList.remove(ACTIVE_CLASS);
    userInfoContainer.classList.add(ACTIVE_CLASS);
  } catch (error) {
    loadingScreen.classList.remove(ACTIVE_CLASS);
    userInfoContainer.classList.remove(ACTIVE_CLASS);
    handleApiError(error);
  }
}

async function fetchWeatherByCity(city) {
  const weatherUrl = `${baseUrl}?key=${apiKey}&q=${city}&aqi=no`;
  try {
    loadingScreen.classList.add(ACTIVE_CLASS);
    userInfoContainer.classList.remove(ACTIVE_CLASS);

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    renderWeatherInfo(data);
    loadingScreen.classList.remove(ACTIVE_CLASS);
    userInfoContainer.classList.add(ACTIVE_CLASS);
    searchForm.classList.remove(ACTIVE_CLASS);
  } catch (error) {
    loadingScreen.classList.remove(ACTIVE_CLASS);
    userInfoContainer.classList.remove(ACTIVE_CLASS);
    searchForm.classList.add(ACTIVE_CLASS);
    handleApiError(error);
  }
}

function renderWeatherInfo(weatherData) {
  if (!weatherData || !weatherData.current || !weatherData.location) {
    console.error("Invalid weather data provided.");
    return;
  }

  const cityName = document.querySelector("[data-cityName]");
  const countryIcon = document.querySelector("[data-countryIcon]");
  const desc = document.querySelector("[data-weatherDesc]");
  const weatherIcon = document.querySelector("[data-weatherIcon]");
  const temp = document.querySelector("[data-temp]");
  const windspeed = document.querySelector("[data-windSpeed]");
  const humidity = document.querySelector("[data-humidity]");
  const cloudiness = document.querySelector("[data-cloudiness]");

  const countryCode = getCountryCode(weatherData.location.country);

  cityName.innerText = `${weatherData.location.name}, ${
    weatherData.location.region || weatherData.location.country
  }`;

  // Update flag URL with error handling
  countryIcon.onerror = function () {
    this.src = `https://www.countryflagicons.com/FLAT/64/${countryCode.toUpperCase()}.png`;
    this.onerror = function () {
      this.style.display = "none";
    };
  };
  countryIcon.src = `https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png`;
  countryIcon.style.display = "inline"; // Reset display if it was hidden

  desc.innerText = weatherData.current.condition.text;
  weatherIcon.src = weatherData.current.condition.icon.replace(
    "http:",
    "https:"
  );
  temp.innerText = `${weatherData.current.temp_c}°C`;
  windspeed.innerText = `${weatherData.current.wind_kph} km/h`;
  humidity.innerText = `${weatherData.current.humidity}%`;
  cloudiness.innerText = `${weatherData.current.cloud}%`;
}

function handleApiError(error) {
  let errorMessage;

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "Invalid API key. Please check your configuration.";
        break;
      case 404:
        errorMessage =
          "Location not found. Please check the spelling and try again.";
        break;
      case 429:
        errorMessage = "Too many requests. Please try again later.";
        break;
      default:
        errorMessage = "Failed to fetch weather data. Please try again later.";
    }
  } else {
    errorMessage = "An unexpected error occurred. Please try again later.";
  }

  showError(errorMessage, true);
  console.error("Weather API Error:", error);
}

function showError(message, isTemporary = false) {
  const errorContainer =
    document.querySelector(".error-container") || createErrorContainer();
  errorContainer.textContent = message;
  errorContainer.classList.add("active");

  if (isTemporary) {
    setTimeout(() => {
      errorContainer.classList.remove("active");
    }, 5000);
  }
}

function createErrorContainer() {
  const container = document.createElement("div");
  container.className = "error-container";
  container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background-color: #ff5555;
        color: white;
        border-radius: 5px;
        display: none;
        z-index: 1000;
    `;
  document.body.appendChild(container);
  return container;
}

function switchTab(clickedTab) {
  if (clickedTab === currentTab) return;

  currentTab.classList.remove(CURRENT_TAB_CLASS);
  clickedTab.classList.add(CURRENT_TAB_CLASS);
  currentTab = clickedTab;

  // Hide all containers
  [searchForm, userInfoContainer, grantAccessContainer].forEach((container) => {
    container.classList.remove(ACTIVE_CLASS);
  });

  if (clickedTab === searchTab) {
    searchForm.classList.add(ACTIVE_CLASS);
  } else {
    checkLocationAndShowWeather();
  }
}

function checkLocationAndShowWeather() {
  const localCoordinates = sessionStorage.getItem("user-coordinates");
  if (!localCoordinates) {
    grantAccessContainer.classList.add(ACTIVE_CLASS);
  } else {
    grantAccessContainer.classList.remove(ACTIVE_CLASS);
    const coordinates = JSON.parse(localCoordinates);
    fetchWeatherByCoordinates(coordinates.lat, coordinates.lon);
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  checkLocationAndShowWeather();

  userTab.addEventListener("click", () => switchTab(userTab));
  searchTab.addEventListener("click", () => switchTab(searchTab));

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityInput = document.querySelector("[data-searchInput]");
    const cityName = cityInput.value.trim();
    if (cityName) {
      fetchWeatherByCity(cityName);
    }
  });

  const grantAccessButton = document.querySelector("[data-grantAccess]");
  grantAccessButton.addEventListener("click", getLocation);
});

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      showPosition,
      showGeolocationError
    );
  } else {
    showError("Geolocation is not supported by your browser.", true);
  }
}

function showPosition(position) {
  const userCoordinates = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };

  sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
  grantAccessContainer.classList.remove(ACTIVE_CLASS);
  fetchWeatherByCoordinates(userCoordinates.lat, userCoordinates.lon);
}

function showGeolocationError(error) {
  const errorMessages = {
    1: "Location access denied. Please grant location permission to use your current location.",
    2: "Location information is unavailable.",
    3: "The request to get user location timed out.",
    0: "An unknown error occurred while getting location.",
  };
  showError(errorMessages[error.code] || errorMessages[0], true);
}

// Add styles for error container
const style = document.createElement("style");
style.textContent = `
.error-container {
    display: none;
    animation: fadeIn 0.3s ease-in;
}

.error-container.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
