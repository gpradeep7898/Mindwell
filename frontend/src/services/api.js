import axios from "axios";
import React, { useEffect } from "react";

const API_URL = "https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net";

const loadGoogleMaps = (callback) => {
  if (!window.google) {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = callback;
    document.body.appendChild(script);
  } else {
    callback();
  }
};

function App() {
  useEffect(() => {
    loadGoogleMaps(() => {
      console.log("Google Maps API Loaded");
    });
  }, []);

  return (
    <div>
      <h1>Welcome to the Mental Health App</h1>
    </div>
  );
}

export default App;
