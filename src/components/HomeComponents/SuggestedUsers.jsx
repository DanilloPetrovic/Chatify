import React, { useState, useEffect } from "react";
import { auth, getAllUsers } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import nopfp from "../../photos/nopfp.png";
import { useNavigate } from "react-router-dom";
import loadingGif from "../../photos/Rolling@1x-1.9s-200px-200px.gif";

const SuggestedUsers = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [randomUsers, setRandomUsers] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState("Novi Pazar");
  const apiKey = "e108e072b6304c1796b142227241607";
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getOwnProfile();
      }
    });

    return () => unsubscribe();
  }, []);

  const getOwnProfile = async () => {
    if (auth.currentUser) {
      const allUsers = await getAllUsers();
      const ownProfileRef = allUsers.find(
        (u) => u.username === auth.currentUser.displayName
      );

      setOwnProfile(ownProfileRef);
    }
  };

  const getRandomUsers = async () => {
    if (ownProfile) {
      const allUsers = await getAllUsers();
      const validUsers = allUsers.filter(
        (user) =>
          !ownProfile.friends.includes(user.id) && user.id !== ownProfile.id
      );

      if (validUsers.length > 0) {
        const randomUsers = new Set();
        const numUsersToSelect = Math.min(3, validUsers.length); // Select up to 3 users

        while (randomUsers.size < numUsersToSelect) {
          const randomIndex = Math.floor(Math.random() * validUsers.length);
          randomUsers.add(validUsers[randomIndex]);
        }

        setRandomUsers([...randomUsers]);
      } else {
        setRandomUsers([]);
      }
    }
  };

  useEffect(() => {
    getRandomUsers();
  }, [ownProfile]);

  useEffect(() => {
    const fetchWeather = async () => {
      const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };

    fetchWeather();
  }, [city, apiKey]);

  return (
    <div className="suggested-users">
      <div className="suggetsted-users-div">
        <h3>Suggested users</h3>
        {randomUsers.length > 0
          ? randomUsers.map((user) => (
              <div className="randomuser-div" key={user.id}>
                {user.imageURL.length > 0 ? (
                  <img
                    className="suggested-img"
                    src={user.imageURL}
                    alt={`Profile of ${user.username}`}
                  />
                ) : (
                  <img
                    className="suggested-img"
                    src={nopfp}
                    alt="Default profile"
                  />
                )}
                <p onClick={() => navigate("/" + user.username)}>
                  {user.username}
                </p>
              </div>
            ))
          : null}
      </div>

      <div className="weather-div">
        <h3>Weather</h3>
        {weatherData ? (
          <div className="weather-div-info">
            <div className="weather-div-header">
              <div>
                <h2>{weatherData.location.name}</h2>
                <h5>{weatherData.location.region}</h5>
                <h3 className="weather-celsious">
                  {weatherData.current.temp_c + 10}°
                </h3>
              </div>
              <div>
                <img
                  className="w-icon"
                  src={weatherData.current.condition.icon}
                  alt="Weather icon"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="no-weather-div">
            <img className="no-weather" src={loadingGif} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedUsers;
