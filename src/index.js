
import {fromUnixTime} from 'date-fns';
import {formatInTimeZone} from 'date-fns-tz';

const locationElement = document.querySelector(`input[name='location']`);
const submitButton = document.querySelector('button');
const unitElements = document.querySelectorAll(`input[type='radio']`);
const NotFoundElement = document.querySelector('.not-found');
const currentWeatherElement = document.querySelector('.current-weather');
const todayDateElement = document.querySelector('.city-container span');
const cityElement = document.querySelector('.city-container h2');
const mainWeatherIcon = document.querySelector('.current-temp-container img');
const todayTemp = document.querySelector('.current-temp-container span.current-temp');
const feelsLike = document.querySelector('.temp-container span.feels-like');
const highLowTemp = document.querySelector('.temp-container span.high-low-temp');
const sunrise = document.querySelector('.sunrise');
const sunset = document.querySelector('.sunset');
const dewPoint = document.querySelector('.dew-point');
const pressure = document.querySelector('.pressure');
const visibility = document.querySelector('.visibility');
const humidity = document.querySelector('.humidity');
const uvIndex = document.querySelector('.uv-index');
const windSpeed = document.querySelector('.wind-speed');
const forecastContainer = document.querySelector('.forecast-container');
const loadingMessage = document.querySelector('.loading-msg');
const hourlyForecastContainer = document.querySelector('.hourly-forecast-container');
const hourlyForecastData = document.querySelector('.hourly-forecast-data');
const dailyForecastContainer = document.querySelector('.daily-forecast-container');
const dailyForecastData = document.querySelector('.daily-forecast-data');


let weatherInfo = null;
let unit = Array.from(unitElements).find(element => element.checked).value; 

locationElement.addEventListener('input',()=>{
    locationElement.setCustomValidity('');

    if(locationElement.validity.valueMissing){
        locationElement.setCustomValidity('Location field cannot be empty');
        !locationElement.classList.contains('invalid') && locationElement.classList.add('invalid');   
        locationElement.reportValidity();
        submitButton.setAttribute('disabled',true);
    }
    else {
        locationElement.classList.contains('invalid') && locationElement.classList.remove('invalid'); 
        submitButton.removeAttribute('disabled');
    }
});

unitElements.forEach(element => {
    element.addEventListener('change',()=>{
        unitElements.forEach(elem =>{
            elem.parentElement.toggleAttribute('checked');
            if(elem.checked){
                console.log(`Selected value: `, elem.value);
                unit = elem.value;
            }
        }); 
        convertWeatherData(unit);  
    });
});


submitButton.addEventListener('click', async (event)=>{

    currentWeatherElement.style.display='none'
    NotFoundElement.style.visibility = 'hidden';
    forecastContainer.style.display='grid';
    loadingMessage.style.display = 'block';
    hourlyForecastContainer.style.display='none';
    dailyForecastContainer.style.display='none';
    hourlyForecastData.innerHTML='';
    dailyForecastData.innerHTML='';
    //console.log(`Unit: `, unit);
    try{
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${locationElement.value}&appid=20f7632ffc2c022654e4093c6947b4f4&units=${unit}`, {mode: 'cors'});
        const weatherData = await weatherResponse.json();
        //console.log(`Got data for ${locationElement.value}: `, weatherData);
        const {lat,lon} = weatherData.coord;

        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=20f7632ffc2c022654e4093c6947b4f4&units=${unit}`, {mode: 'cors'});
        const forecastData = await forecastResponse.json();
        //console.log(`Forecast: `, forecastData);
        
        weatherInfo = processWeatherData(weatherData,forecastData);
        //console.log(`Weather Data:`, weatherInfo );
        populateWeatherInfo();
    }catch (error){
        //console.log(`Unable to fetch weather data for ${locationElement.value}`, error.message);
        NotFoundElement.style.visibility = 'visible';
        forecastContainer.style.display='none';
    }
    locationElement.value='';
    submitButton.setAttribute('disabled',true);
});

function processWeatherData(weatherInfo,forecast){

    return {
        city:weatherInfo.name,
        country:weatherInfo.sys.country,
        date: formatInTimeZone(fromUnixTime(weatherInfo.dt),forecast.timezone,'MMM dd, h:mmaaa'),
        temp:Math.round(weatherInfo.main.temp),
        temp_max:Math.round(weatherInfo.main.temp_max),
        temp_min:Math.round(weatherInfo.main.temp_min),
        humidity:Math.round(weatherInfo.main.humidity),
        visibility:Math.round(weatherInfo.visibility/1000).toFixed(1),
        feels:Math.round(weatherInfo.main.feels_like),
        description: weatherInfo.weather[0].description,
        main:weatherInfo.weather[0].main,
        pressure:weatherInfo.main.pressure,
        dew_point:Math.round(forecast.current.dew_point),
        wind_speed:Math.round(forecast.current.wind_speed*10)/10,
        wind_direction:getDirection(forecast.current.wind_deg),
        uv_index:forecast.current.uvi,
        sunset:formatInTimeZone(fromUnixTime(forecast.current.sunset),forecast.timezone,'h:mmaaa'),
        sunrise:formatInTimeZone(fromUnixTime(forecast.current.sunrise),forecast.timezone,'h:mmaaa'),
        hourly_forecast:forecast.hourly.map(data=>{
            const time = fromUnixTime(data.dt);
            const timeOfDay= formatInTimeZone(time,forecast.timezone,'haaa') === '12am'? formatInTimeZone(time,forecast.timezone,'MMM d'): formatInTimeZone(time,forecast.timezone,'haaa') ;
            const hourlyData = {
                time: timeOfDay,
                temp:Math.round(data.temp),
                pop:Math.round(100*data.pop),
                icon_url: `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`
            }
            return hourlyData;
        }),
        daily_forecast:forecast.daily.map(data=>({
            day: formatInTimeZone(fromUnixTime(data.dt),forecast.timezone,'ccc, MMM dd'),
            temp_max:Math.round(data.temp.max),
            temp_min:Math.round(data.temp.min),
            description:data.weather[0].description,
            icon_url: `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`
        })),
        icon_url: `http://openweathermap.org/img/wn/${weatherInfo.weather[0].icon}@2x.png`
    }
}

function getDirection(degree){
    if(degree===0)
        return 'N';
    if(degree > 0 && degree < 45)
        return 'NNE';
    if(degree ===45)
        return 'NE';
    if(degree >45 && degree < 90)
        return 'ENE';
        if(degree ===90)
        return 'E';
    if(degree >90 && degree < 135)
        return 'ESE';
    if(degree ===135)
        return 'SE';
    if(degree >135 && degree < 180)
        return 'SSE';
    if(degree ===180)
        return 'S';
    if(degree >180 && degree < 225)
        return 'SSW';
    if(degree ===225)
        return 'SW';
    if(degree >225 && degree < 270)
        return 'WSW';
    if(degree ===270)
        return 'W';
    if(degree >270 && degree < 315)
        return 'WNW';
    if(degree ===315)
        return 'NW';
    if(degree >315)
        return 'NNW';
}

function convertWeatherData(unit){
    if(!weatherInfo){
        console.log('Nothing to convert');
        return;
    }

    if(unit==='metric'){
        weatherInfo.temp = convertToCelcius( weatherInfo.temp);
        weatherInfo.temp_max = convertToCelcius( weatherInfo.temp_max);
        weatherInfo.temp_min = convertToCelcius( weatherInfo.temp_min);
        weatherInfo.dew_point = convertToCelcius( weatherInfo.dew_point);
        weatherInfo.feels = convertToCelcius( weatherInfo.feels);
        weatherInfo.hourly_forecast.forEach(hourlyData=>{
            hourlyData.temp= convertToCelcius(hourlyData.temp);
        });
        weatherInfo.daily_forecast.forEach(dailyData=>{
            dailyData.temp_max = convertToCelcius(dailyData.temp_max);
            dailyData.temp_min = convertToCelcius(dailyData.temp_min);
        });
        weatherInfo.wind_speed = convertToMetric(weatherInfo.wind_speed);
    }
    else{   
        weatherInfo.temp = convertToFahrenheit( weatherInfo.temp);
        weatherInfo.temp_max = convertToFahrenheit( weatherInfo.temp_max);
        weatherInfo.temp_min = convertToFahrenheit( weatherInfo.temp_min);
        weatherInfo.feels = convertToFahrenheit( weatherInfo.feels);
        weatherInfo.dew_point = convertToFahrenheit( weatherInfo.dew_point);
        weatherInfo.hourly_forecast.forEach(hourlyData=>{
            hourlyData.temp= convertToFahrenheit(hourlyData.temp);
        });
        weatherInfo.daily_forecast.forEach(dailyData=>{
            dailyData.temp_max = convertToFahrenheit(dailyData.temp_max);
            dailyData.temp_min = convertToFahrenheit(dailyData.temp_min);
        });
        weatherInfo.wind_speed = convertToImperial(weatherInfo.wind_speed);
    }

    //console.log(`Converted Weather data:`, weatherInfo);
    updateConvertedData();
}

function convertToCelcius(temp){
    return Math.round(((temp-32)*5)/9);
}

function convertToFahrenheit(temp){
    return Math.round((temp * 9)/5) + 32;
}

function convertToImperial(speed){
    return Math.round(speed*2.237*10)/10;
}

function convertToMetric(speed){
    return Math.round(speed*0.447*10)/10;
}

function populateWeatherInfo(){
    currentWeatherElement.style.display='flex';
    loadingMessage.style.display = 'none';
    hourlyForecastContainer.style.display='block';
    dailyForecastContainer.style.display='block';
    const tempUnit = unit==='metric'? '°C': '°F';
    const speedUnit =  unit==='metric'? 'm/s': 'mph';
    todayDateElement.innerText = weatherInfo.date;
    cityElement.innerText = `${weatherInfo.city}, ${weatherInfo.country}`;
    mainWeatherIcon.setAttribute('src',weatherInfo.icon_url);
    todayTemp.innerText = `${weatherInfo.temp} ${tempUnit}`;
    feelsLike.innerText = `Feels like ${weatherInfo.feels}${tempUnit}. ${weatherInfo.description.slice(0,1).toUpperCase()}${weatherInfo.description.slice(1)}` ;
    highLowTemp.innerText = `High: ${weatherInfo.temp_max}${tempUnit}; Low: ${weatherInfo.temp_min}${tempUnit}`;
    sunrise.innerText = `Sunrise: ${weatherInfo.sunrise}`;
    sunset.innerText = `Sunset: ${weatherInfo.sunset}`;
    dewPoint.innerText = `Dew Point: ${weatherInfo.dew_point} ${tempUnit}`;
    pressure.innerText = `Pressure: ${weatherInfo.pressure}hPa`;
    visibility.innerText = `Visibility: ${weatherInfo.visibility}km`;
    humidity.innerText = `Humidity: ${weatherInfo.humidity}%`;
    uvIndex.innerText = `UV Index: ${weatherInfo.uv_index}`;
    windSpeed.innerText = `Wind Speed: ${weatherInfo.wind_speed}${speedUnit}  ${weatherInfo.wind_direction}`;
    forecastContainer.style.display='grid';
    populateHourlyForecast(tempUnit);
    populateDailyForecast(tempUnit);
}   

function populateHourlyForecast(tempUnit){

    weatherInfo.hourly_forecast.forEach(hourlyData=>{
        const hourlyDataContainer = document.createElement('div');
        hourlyDataContainer.classList.add('hourly-data');
        const hourlytime = document.createElement('span');
        hourlytime.classList.add('hourly-time')
        hourlytime.innerText=hourlyData.time;
        const hourlyTemp = document.createElement('span');
        hourlyTemp.classList.add('hourly-temp');
        hourlyTemp.innerText = `${hourlyData.temp} ${tempUnit}`;
        const hourlyWeatherIcon = document.createElement('img');
        hourlyWeatherIcon.setAttribute('src', hourlyData.icon_url);
        const hourlyPop = document.createElement('span');
        hourlyPop.classList.add('pop');
        hourlyPop.innerText = `Chance of rain: ${hourlyData.pop}%`;

        hourlyDataContainer.append(hourlytime,hourlyWeatherIcon,hourlyTemp,hourlyPop);
        hourlyForecastData.append(hourlyDataContainer);
    });

}

function populateDailyForecast(tempUnit){
    weatherInfo.daily_forecast.forEach(dailyData=>{
        const dailyDataContainer = document.createElement('li');
        dailyDataContainer.classList.add('daily-data');
        const dailyDay = document.createElement('span');
        dailyDay.innerText = dailyData.day;
        const dailyWeatherIcon = document.createElement('img');
        dailyWeatherIcon.setAttribute('src', dailyData.icon_url); 
        const dailyMaxMinTemp = document.createElement('span');
        dailyMaxMinTemp.classList.add('daily-temp');
        dailyMaxMinTemp.innerText = `${dailyData.temp_max}/${dailyData.temp_min}${tempUnit}`;
        const dailyDescription = document.createElement('span');
        dailyDescription.classList.add('daily-data-description');
        dailyDescription.innerText = dailyData.description;

        dailyDataContainer.append(dailyDay,dailyWeatherIcon,dailyMaxMinTemp,dailyDescription);
        dailyForecastData.append(dailyDataContainer);
     });
}

function updateConvertedData(){
    const tempUnit = unit==='metric'? '°C': '°F';
    const speedUnit =  unit==='metric'? 'm/s': 'mph';
    todayTemp.innerText = `${weatherInfo.temp} ${tempUnit}`;
    feelsLike.innerText = `Feels like ${weatherInfo.feels}${tempUnit}. ${weatherInfo.description.slice(0,1).toUpperCase()}${weatherInfo.description.slice(1)}` ;
    highLowTemp.innerText = `High: ${weatherInfo.temp_max}${tempUnit}; Low: ${weatherInfo.temp_min}${tempUnit}`;
    dewPoint.innerText = `Dew Point: ${weatherInfo.dew_point} ${tempUnit}`;
    windSpeed.innerText = `Wind Speed: ${weatherInfo.wind_speed}${speedUnit}  ${weatherInfo.wind_direction}`;
    const hourlyTempElements = document.querySelectorAll('.hourly-temp');
    const dailyTempElements = document.querySelectorAll('.daily-temp');
    hourlyTempElements.forEach((element,index) => {
        element.innerText = `${weatherInfo.hourly_forecast[index].temp} ${tempUnit}`;
    });
    dailyTempElements.forEach((element,index) => {
        element.innerText = `${weatherInfo.daily_forecast[index].temp_max}/${weatherInfo.daily_forecast[index].temp_min}${tempUnit}`;
    });
}
