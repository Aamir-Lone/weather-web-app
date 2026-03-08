document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const getWeatherBtn = document.getElementById("get-weather-btn");
  const weatherInfo = document.getElementById("weather-info");
  const cityNameDisplay = document.getElementById("city-name");
  const temperatureDisplay = document.getElementById("temperature");
  const descriptionDisplay = document.getElementById("description");
  const iconDisplay = document.getElementById("iconDisplay");
  const feelsLikeDisplay = document.getElementById("feels-like");
  const humidityDisplay = document.getElementById("humidity");
  const windSpeedDisplay = document.getElementById("wind-speed");
  const errorMessage = document.getElementById("error-message");

  // Attempt to fetch weather by geolocation on load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherData = await fetchWeatherByCoords(latitude, longitude);
          displayWeatherData(weatherData);
        } catch (error) {
          console.error("Error fetching location weather:", error);
          // Don't show an explicit error on load if location fails, just let them use the input
        }
      },
      (error) => {
        console.warn("Geolocation blocked or failed.", error);
      },
    );
  }

  getWeatherBtn.addEventListener("click", async () => {
    const city = cityInput.value.trim();
    if (!city) {
      weatherInfo.classList.add("hidden");
      return;
    }

    // it may throw an error
    // server/database is always in another continent

    try {
      const weatherData = await fetchWeatherData(city);
      displayWeatherData(weatherData);
    } catch (error) {
      showError();
    }
  });

  cityInput.addEventListener("keydown", async (event) => {
    const city = cityInput.value.trim();
    if (!city) {
      weatherInfo.classList.add("hidden");
      return;
    } else if (event.key === "Enter") {
      // Optional: Prevent the default form submission behavior (if the input is inside a form)
      event.preventDefault();

      try {
        const weatherData = await fetchWeatherData(city);
        displayWeatherData(weatherData);
      } catch (error) {
        showError();
      }
    }
  });

  async function fetchWeatherData(city) {
    //gets the data
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);
    console.log(typeof response);
    console.log("RESPONSE", response);

    if (!response.ok) {
      // throw new Error(`responce status :${response.status}`)
      throw new Error(" City Not found");
    }
    const data = await response.json();
    return data;
  }

  async function fetchWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to fetch weather for location");
    }

    return await response.json();
  }

  function displayWeatherData(data) {
    console.log(data);
    const { name, main, weather, sys } = data;
    cityNameDisplay.textContent =
      sys && sys.country ? `${name}, ${sys.country}` : name;
    temperatureDisplay.textContent = `${Math.round(main.temp)}°C`;
    descriptionDisplay.textContent = weather[0].description;
    const iconCode = weather[0].icon;

    // 2. Set the innerHTML of iconDisplay to an <img> tag
    iconDisplay.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="weather icon">`;

    // Set extra info
    feelsLikeDisplay.textContent = `${Math.round(main.feels_like)}°C`;
    humidityDisplay.textContent = `${main.humidity}%`;
    windSpeedDisplay.textContent = `${data.wind.speed} m/s`;

    //unlock the display
    weatherInfo.classList.remove("hidden");
    errorMessage.classList.add("hidden");
  }

  function showError() {
    weatherInfo.classList.add("hidden");
    errorMessage.classList.remove("hidden");
  }
});
