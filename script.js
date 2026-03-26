// Weather code mapping for icons and descriptions
const weatherCodes = {
    0: { description: "Clear sky", icon: "☀️" },
    1: { description: "Mainly clear", icon: "🌤️" },
    2: { description: "Partly cloudy", icon: "⛅" },
    3: { description: "Overcast", icon: "☁️" },
    45: { description: "Fog", icon: "🌫️" },
    48: { description: "Rime fog", icon: "🌫️" },
    51: { description: "Light drizzle", icon: "🌧️" },
    53: { description: "Moderate drizzle", icon: "🌧️" },
    55: { description: "Dense drizzle", icon: "🌧️" },
    56: { description: "Freezing drizzle", icon: "🌨️" },
    57: { description: "Dense freezing drizzle", icon: "🌨️" },
    61: { description: "Light rain", icon: "🌦️" },
    63: { description: "Moderate rain", icon: "🌧️" },
    65: { description: "Heavy rain", icon: "🌧️" },
    66: { description: "Freezing rain", icon: "🌨️" },
    67: { description: "Heavy freezing rain", icon: "🌨️" },
    71: { description: "Light snow", icon: "❄️" },
    73: { description: "Moderate snow", icon: "❄️" },
    75: { description: "Heavy snow", icon: "❄️" },
    77: { description: "Snow grains", icon: "❄️" },
    80: { description: "Light showers", icon: "🌦️" },
    81: { description: "Moderate showers", icon: "🌧️" },
    82: { description: "Heavy showers", icon: "🌧️" },
    85: { description: "Light snow showers", icon: "🌨️" },
    86: { description: "Heavy snow showers", icon: "❄️" },
    95: { description: "Thunderstorm", icon: "⛈️" },
    96: { description: "Thunderstorm with hail", icon: "⛈️" },
    99: { description: "Heavy thunderstorm with hail", icon: "⛈️" }
};

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherResult = document.getElementById('weatherResult');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Main Function to Search Weather
async function searchWeather() {
    const cityName = cityInput.value.trim();

    if (!cityName) {
        showError('Please enter a city name');
        return;
    }

    // Show loading state
    showLoading();
    hideError();

    try {
        // Step 1: Get coordinates from city name
        const coordinates = await getCoordinates(cityName);

        // Step 2: Get weather data using coordinates
        const weatherData = await getWeatherData(coordinates.latitude, coordinates.longitude);

        // Step 3: Display the weather
        displayWeather(weatherData, coordinates.name, coordinates.country);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to fetch weather data. Please try again.');
        weatherResult.classList.remove('active');
    }
}

// Step 1: Geocoding - Convert city name to coordinates
async function getCoordinates(cityName) {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error('City not found. Please check the spelling and try again.');
    }

    const result = data.results[0];
    return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
    };
}

// Step 2: Fetch weather data from Open-Meteo
async function getWeatherData(latitude, longitude) {
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');

    // Add parameters
    weatherUrl.searchParams.append('latitude', latitude);
    weatherUrl.searchParams.append('longitude', longitude);
    weatherUrl.searchParams.append('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m');
    weatherUrl.searchParams.append('hourly', 'temperature_2m,weather_code');
    weatherUrl.searchParams.append('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    weatherUrl.searchParams.append('timezone', 'auto');
    weatherUrl.searchParams.append('forecast_days', '3');

    const response = await fetch(weatherUrl);

    if (!response.ok) {
        throw new Error('Weather service is currently unavailable');
    }

    return await response.json();
}

// Step 3: Display weather data in UI
function displayWeather(data, cityName, country) {
    const current = data.current;
    const daily = data.daily;
    const units = data.current_units;

    // Get weather info
    const weatherInfo = getWeatherInfo(current.weather_code);

    // Build HTML
    const html = `
        <div class="weather-card">
            <div class="city-name">${cityName}, ${country}</div>
            <div class="weather-icon">${weatherInfo.icon}</div>
            <div class="temperature">${Math.round(current.temperature_2m)}<span>${units.temperature_2m}</span></div>
            <div class="weather-description">${weatherInfo.description}</div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Feels like</div>
                    <div class="detail-value">${Math.round(current.apparent_temperature)}${units.apparent_temperature}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${current.relative_humidity_2m}${units.relative_humidity_2m}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${current.wind_speed_10m} ${units.wind_speed_10m}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Precipitation</div>
                    <div class="detail-value">${current.precipitation || 0} ${units.precipitation}</div>
                </div>
            </div>
        </div>
        
        <div class="forecast-section">
            <div class="forecast-title">3-Day Forecast</div>
            <div class="forecast-container">
                ${generateForecast(daily)}
            </div>
        </div>
    `;

    weatherResult.innerHTML = html;
    weatherResult.classList.add('active');
}

// Generate forecast HTML
function generateForecast(daily) {
    let forecastHtml = '';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherInfo = getWeatherInfo(daily.weather_code[i]);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        forecastHtml += `
            <div class="forecast-item">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">${weatherInfo.icon}</div>
                <div class="forecast-temp">${maxTemp}°</div>
                <div style="font-size: 12px; color: #666;">${minTemp}°</div>
            </div>
        `;
    }

    return forecastHtml;
}

// Helper: Get weather icon and description
function getWeatherInfo(code) {
    return weatherCodes[code] || { description: "Unknown", icon: "🌡️" };
}

// Helper: Show loading state
function showLoading() {
    weatherResult.innerHTML = '<div class="loading">🌍 Fetching weather data...</div>';
    weatherResult.classList.add('active');
}

// Helper: Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Helper: Hide error message
function hideError() {
    errorMessage.classList.remove('show');
}

// Optional: Get user's location for default weather
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const weatherData = await getWeatherData(
                    position.coords.latitude,
                    position.coords.longitude
                );
                displayWeather(weatherData, 'Your Location', '');
                hideError();
            } catch (error) {
                showError('Unable to fetch weather for your location');
            }
        }, () => {
            // Fallback to a default city
            cityInput.value = 'London';
            searchWeather();
        });
    } else {
        cityInput.value = 'London';
        searchWeather();
    }
}

// Load default weather on page load
window.addEventListener('load', () => {
    getUserLocation();
});