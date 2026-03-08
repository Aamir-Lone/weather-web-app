document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const getWeatherBtn = document.getElementById("get-weather-btn");
  const weatherInfo = document.getElementById("weather-info");
  const cityNameDisplay = document.getElementById("city-name");
  const dateDisplay = document.getElementById("date-display");
  const temperatureDisplay = document.getElementById("temperature");
  const descriptionDisplay = document.getElementById("description");
  const iconDisplay = document.getElementById("iconDisplay");
  const feelsLikeDisplay = document.getElementById("feels-like");
  const humidityDisplay = document.getElementById("humidity");
  const windSpeedDisplay = document.getElementById("wind-speed");
  const errorMessage = document.getElementById("error-message");
  const forecastList = document.getElementById("forecast-list");
  
  // Track the name/country for the currently searched city across forecast clicks.
  let currentCityName = "";
  let currentCountry = "";

  // Attempt to fetch weather by geolocation on load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherData = await fetchWeatherByCoords(latitude, longitude);
          displayWeatherData(weatherData);
          const forecastData = await fetchForecastByCoords(latitude, longitude);
          displayForecastData(forecastData);
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
      const forecastData = await fetchForecastData(city);
      displayForecastData(forecastData);
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
        const forecastData = await fetchForecastData(city);
        displayForecastData(forecastData);
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

  async function fetchForecastData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Forecast Not found");
    return await response.json();
  }

  async function fetchForecastByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to fetch forecast for location");
    return await response.json();
  }

  function displayForecastData(data) {
    forecastList.innerHTML = "";
    
    // We get 3-hour interval data (40 items in total). We try to grab the items closest to noon (12:00:00).
    let dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    
    // If not enough noon readings (e.g., timezone issues), fallback to every 8th reading (~24 hours)
    if (dailyData.length < 5) {
      dailyData = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);
    } else {
      dailyData = dailyData.slice(0, 5);
    }

    dailyData.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;

      const forecastItem = document.createElement("div");
      forecastItem.classList.add("forecast-item");
      forecastItem.innerHTML = `
        <span class="day">${dayName}</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
        <span class="temp">${temp}°C</span>
      `;
      
      // Add click listener
      forecastItem.addEventListener("click", () => {
        // Build a fake "data" object that displayWeatherData expects
        const fakeData = {
          name: currentCityName,
          main: item.main,
          weather: item.weather,
          wind: item.wind,
          dt: item.dt, // Pass the specific timestamp of the forecast item
          sys: { country: currentCountry }
        };
        displayWeatherData(fakeData);
      });

      forecastList.appendChild(forecastItem);
    });
  }

  function displayWeatherData(data) {
    console.log(data);
    const { name, main, weather, sys, wind, dt } = data;
    
    // Store globally so forecast clicks can reuse the correct city/country name
    if (name) currentCityName = name;
    if (sys && sys.country) currentCountry = sys.country;

    cityNameDisplay.textContent =
      currentCountry ? `${currentCityName}, ${currentCountry}` : currentCityName;
      
    // Determine the date to show
    let displayDate;
    if (dt) {
       // It's from a forecast click or API response that includes a timestamp
       displayDate = new Date(dt * 1000);
    } else {
       // Fallback to exactly right now
       displayDate = new Date();
    }
    
    // Format: "Monday, March 8"
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.textContent = displayDate.toLocaleDateString("en-US", options);
      
    temperatureDisplay.textContent = `${Math.round(main.temp)}°C`;
    descriptionDisplay.textContent = weather[0].description;
    const iconCode = weather[0].icon;

    // Apply dynamic background
    updateWeatherBackground(weather[0].main);

    // 2. Set the innerHTML of iconDisplay to an <img> tag
    iconDisplay.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="weather icon">`;

    // Set extra info
    feelsLikeDisplay.textContent = `${Math.round(main.feels_like)}°C`;
    humidityDisplay.textContent = `${main.humidity}%`;
    windSpeedDisplay.textContent = wind ? `${wind.speed} m/s` : "";

    //unlock the display
    weatherInfo.classList.remove("hidden");
    document.querySelector(".forecast-container").classList.remove("hidden");
    errorMessage.classList.add("hidden");
  }

  function showError() {
    weatherInfo.classList.add("hidden");
    errorMessage.classList.remove("hidden");
    document.body.className = "";
    document.getElementById("weather-bg").innerHTML = "";
    document.querySelector(".forecast-container").classList.add("hidden");
  }

  function updateWeatherBackground(condition) {
    const bgContainer = document.getElementById("weather-bg");
    bgContainer.innerHTML = ""; // clear previous
    document.body.className = ""; // clear body classes
    
    const weatherMain = condition.toLowerCase();
    
    if (weatherMain === "clear") {
      document.body.classList.add("clear");
      // Add a sun glow
      bgContainer.innerHTML = '<div style="position:absolute; top:10%; right:10%; width:150px; height:150px; background:radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%); border-radius:50%; box-shadow: 0 0 60px rgba(255,215,0,0.4); animation: pulse 4s infinite;"></div>';
    } else if (weatherMain === "clouds") {
      document.body.classList.add("clouds");
      for (let i = 0; i < 6; i++) {
        const cloud = document.createElement("div");
        cloud.classList.add("cloud-bg");
        cloud.style.width = `${Math.random() * 300 + 200}px`;
        cloud.style.height = `${Math.random() * 100 + 50}px`;
        cloud.style.top = `${Math.random() * 40}%`;
        cloud.style.left = `-${Math.random() * 200}px`;
        cloud.style.animationDuration = `${Math.random() * 30 + 30}s`;
        bgContainer.appendChild(cloud);
      }
    } else if (weatherMain.includes("rain") || weatherMain === "drizzle" || weatherMain === "thunderstorm") {
      document.body.classList.add("rain");
      for (let i = 0; i < 80; i++) {
        const drop = document.createElement("div");
        drop.classList.add("rain-drop");
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        bgContainer.appendChild(drop);
      }
    } else if (weatherMain === "snow") {
      document.body.classList.add("snow");
      for (let i = 0; i < 100; i++) {
        const flake = document.createElement("div");
        flake.classList.add("snowflake");
        const size = Math.random() * 5 + 3;
        flake.style.width = `${size}px`;
        flake.style.height = `${size}px`;
        flake.style.left = `${Math.random() * 100}vw`;
        flake.style.animationDuration = `${Math.random() * 5 + 5}s`;
        flake.style.animationDelay = `${Math.random() * 5}s`;
        bgContainer.appendChild(flake);
      }
    } else {
      // Wind, mist, fog, etc.
      document.body.classList.add("clouds");
      for(let i=0; i<30; i++) {
         const line = document.createElement("div");
         line.style.position = "absolute";
         line.style.background = "rgba(255,255,255,0.3)";
         line.style.height = "2px";
         line.style.width = `${Math.random() * 150 + 50}px`;
         line.style.top = `${Math.random() * 100}vh`;
         line.style.left = "-200px";
         line.style.animation = `windLine ${Math.random() * 1.5 + 0.5}s linear infinite`;
         bgContainer.appendChild(line);
      }
    }
  }
});
