import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

/* global google */


const firebaseConfig = {
  apiKey: "AIzaSyCWLpWz-tPQDYbTIy-rO538_qwNJV8l9Lk",
  authDomain: "tcc01-420505.firebaseapp.com",
  projectId: "tcc01-420505",
  storageBucket: "tcc01-420505.appspot.com",
  messagingSenderId: "1086977661958",
  appId: "1:1086977661958:web:5d99adf5ef2ff8da987787",
  measurementId: "G-F9R0BGNMQL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function HeatmapApp() {
  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [userLocationMarker, setUserLocationMarker] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isHeatmapToggled, setIsHeatmapToggled] = useState(true);
  const [isRadiusToggled, setIsRadiusToggled] = useState(true);
  const [isOpacityToggled, setIsOpacityToggled] = useState(true);
  const [crimeMarkers, setCrimeMarkers] = useState([]);
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);

  useEffect(() => {

    const loadMapScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDc-Znsm41WJVPPTou32s3bEVvlHzhQTUo&libraries=visualization&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadMapScript();

    return () => {
      document.head.querySelectorAll('script').forEach(script => {
        if (script.src.includes("googleapis")) {
          document.head.removeChild(script);
        }
      });
    };
  }, []);

  window.initMap = () => {
    const mapElement = document.getElementById("map");
    const mapOptions = {
      zoom: 13,
      center: new google.maps.LatLng(-28.258417445763822, -52.403213941449465),
      mapTypeId: "hybrid",
    };
    const mapInstance = new google.maps.Map(mapElement, mapOptions);
    setMap(mapInstance);

    loadCrimeData().then(heatmapData => {
      const heatmapInstance = new google.maps.visualization.HeatmapLayer({
        data: heatmapData.map(crime => crime.position),
        map: mapInstance,
      });
      heatmapInstance.set('radius', 100);
      setHeatmap(heatmapInstance);

      // Adiciona marcadores para cada ponto de crime
      const markers = heatmapData.map(crime => {
        let iconUrl = ''; // Ícone padrão para casos indefinidos

        // Verifica se crime.tipo está definido
        if (crime.tipo) {
          switch (crime.tipo) {
            case 'assalto':
              iconUrl = 'https://i.imgur.com/24TRGv0.png';
              break;
            case 'furto':
              iconUrl = 'https://i.imgur.com/RWmrEv2.png';
              break;
            default:
              iconUrl = '';
              break;
          }
        }

        const marker = new google.maps.Marker({
          position: crime.position,
          map: mapInstance,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(40, 40),
          }
        });

        // Adiciona evento de clique ao marcador
        marker.addListener('click', () => {
          setSelectedCrime(crime); // Define o crime selecionado para exibir na info window
          const infoWindowContent = `
            <div>
              <h3>${crime.tipo}</h3>
              <p>Detalhes do crime: (endereço, url)</p>
            </div>
          `;

          if (infoWindow) {
            infoWindow.close(); // Fecha a info window anterior, se existir
          }

          const newInfoWindow = new google.maps.InfoWindow({
            content: infoWindowContent,
          });
          newInfoWindow.open(mapInstance, marker);
          setInfoWindow(newInfoWindow); // Define a nova info window como estado
        });

        return marker;
      });

      setCrimeMarkers(markers);
    });

    // faz um request de geolocalização quando o mapa inicia
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const userLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
        // ícone do marker de usuário
        const userIconURL = 'https://i.imgur.com/5RkHnGP.png';

        
        const userMarkerOptions = {
          position: userLoc,
          map: mapInstance,
          title: "usuário",
          icon: {
            url: userIconURL,
            scaledSize: new google.maps.Size(40, 40),
          }
        };

        const userMarker = new google.maps.Marker(userMarkerOptions);
        setUserLocationMarker(userMarker);
        mapInstance.setCenter(userLoc);
      }, function(error) {
        console.error("Erro ao receber localização: ", error);
        alert("Erro ao receber localização: " + error.message);
      }, {
        maximumAge: 10000,
        timeout: 5000,
        enableHighAccuracy: true
      });
    } else {
      alert("Geolocalização não suportada.");
    }
  };

  const loadCrimeData = async () => {
    const querySnapshot = await getDocs(collection(db, 'crimes_teste'));
    return querySnapshot.docs.map(doc => {
      let data = doc.data();
      return {
        position: new window.google.maps.LatLng(data.lat, data.long),
        tipo: data.tipo
      };
    });
  };

  const toggleHeatmap = () => {
    setIsHeatmapToggled(!isHeatmapToggled);
    heatmap && heatmap.setMap(isHeatmapToggled ? null : map);
  };

  const toggleRadius = () => {
    setIsRadiusToggled(!isRadiusToggled);
    heatmap && heatmap.set('radius', isRadiusToggled ? null : 100);
  };

  const toggleOpacity = () => {
    setIsOpacityToggled(!isOpacityToggled);
    heatmap && heatmap.set('opacity', isOpacityToggled ? null : 0.5);
  };

  const togglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  const panelStyle = {
    position: 'absolute',
    top: '40px',
    left: '10px',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    backgroundColor: '#007bff',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  const toggledButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'green'
  };

  const toggleButtonStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 6,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  return (
    <div>
      <button style={toggleButtonStyle} onClick={togglePanel}>&#9776;</button>
      {isPanelVisible && (
        <div id="floating-panel" style={panelStyle}>
          <button style={isHeatmapToggled ? toggledButtonStyle : buttonStyle} onClick={toggleHeatmap}>Heatmap</button>
          <button style={isRadiusToggled ? toggledButtonStyle : buttonStyle} onClick={toggleRadius}>Radius</button>
          <button style={isOpacityToggled ? toggledButtonStyle : buttonStyle} onClick={toggleOpacity}>Opacity</button>
        </div>
      )}
      <div id="map" style={{ height: '100vh', width: '100%' }}></div>
    </div>
  );
}

export default HeatmapApp;

