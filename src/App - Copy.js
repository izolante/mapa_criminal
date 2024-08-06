import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDc-Znsm41WJVPPTou32s3bEVvlHzhQTUo",
  authDomain: "tcc01-420505.firebaseapp.com",
  projectId: "tcc01-420505",
  storageBucket: "tcc01-420505.appspot.com",
  messagingSenderId: "1086977661958",
  appId: "1:1086977661958:web:5d99adf5ef2ff8da987787",
  measurementId: "G-F9R0BGNMQL"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function HeatmapApp() {
  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);

  useEffect(() => {
    const loadMap = () => {
      if (!window.google) {
        console.error("Google Maps API not yet loaded.");
        return;
      }
      const google = window.google;
      const mapElement = document.getElementById("map");
      const mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(37.7749, -122.4194), // Default to San Francisco
        mapTypeId: "satellite",
      };
      const mapInstance = new google.maps.Map(mapElement, mapOptions);
      setMap(mapInstance);

      loadCrimeData().then(heatmapData => {
        const heatmapInstance = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapInstance,
        });
        setHeatmap(heatmapInstance);
      });
    };

    const handleError = (error) => console.error("Map error:", error);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDc-Znsm41WJVPPTou32s3bEVvlHzhQTUo&libraries=visualization&callback=loadMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    script.onload = () => loadMap();
    script.onerror = handleError;

    return () => {
      // Remove Google Maps script if it exists
      const googleScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (googleScript) {
        document.head.removeChild(googleScript);
      }
    };
  }, []);

  const loadCrimeData = async () => {
    const querySnapshot = await getDocs(collection(db, 'crimes'));
    return querySnapshot.docs.map(doc => {
      let data = doc.data();
      return new window.google.maps.LatLng(data.lat, data.long);
    });
  };

  const toggleHeatmap = () => {
    heatmap && heatmap.setMap(heatmap.getMap() ? null : map);
  };

  const changeGradient = () => {
    const gradient = [
      "rgba(0, 255, 255, 0)",
      "rgba(0, 255, 255, 1)",
      "rgba(0, 191, 255, 1)",
      "rgba(0, 127, 255, 1)",
      "rgba(0, 63, 255, 1)",
      "rgba(0, 0, 255, 1)",
      "rgba(0, 0, 223, 1)",
      "rgba(0, 0, 191, 1)",
      "rgba(0, 0, 159, 1)",
      "rgba(0, 0, 127, 1)",
      "rgba(63, 0, 91, 1)",
      "rgba(127, 0, 63, 1)",
      "rgba(191, 0, 31, 1)",
      "rgba(255, 0, 0, 1)"
    ];
    heatmap && heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
  };

  const changeRadius = () => {
    heatmap && heatmap.set('radius', heatmap.get('radius') ? null : 20);
  };

  const changeOpacity = () => {
    heatmap && heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
  };

  return (
    <div>
      <div id="floating-panel">
        <button onClick={toggleHeatmap}>Toggle Heatmap</button>
        <button onClick={changeGradient}>Change Gradient</button>
        <button onClick={changeRadius}>Change Radius</button>
        <button onClick={changeOpacity}>Change Opacity</button>
      </div>
      <div id="map" style={{ height: '80vh', width: '100%' }}></div>
    </div>
  );
}

export default HeatmapApp;
