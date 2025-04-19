import React, { useEffect, useState } from "react";

const FindDoctor = () => {
  const [map, setMap] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const loadMap = () => {
      if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded.");
        setErrorMessage("Google Maps failed to load. Check your API key.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
            center: userLocation,
            zoom: 14,
            disableDefaultUI: false,
          });

          setMap(mapInstance);
          searchNearbyHospitals(userLocation, mapInstance);
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrorMessage("Failed to get your location. Please enable GPS.");
        }
      );
    };

    if (window.google && window.google.maps) {
      loadMap();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          loadMap();
        }
      }, 500);
    }
  }, []);

  const searchNearbyHospitals = (location, mapInstance) => {
    if (!window.google) return;

    const placesService = new window.google.maps.places.PlacesService(mapInstance);
    const request = {
      location,
      radius: 5000,
      type: "hospital",
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setHospitals(results);
        results.forEach((place) => {
          new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapInstance,
            title: place.name,
          });
        });
      } else {
        console.error("Places API request failed:", status);
        setErrorMessage("No hospitals found nearby. Try again later.");
      }
    });
  };

  return (
    <div className="find-doctor-container">
      <h1>Find Nearby Hospitals</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div id="map" className="map-container"></div>
      <h2>Hospitals Near You</h2>
      <ul className="hospital-list">
        {hospitals.map((hospital) => (
          <li key={hospital.place_id}>
            <strong>{hospital.name}</strong> - {hospital.vicinity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FindDoctor;
