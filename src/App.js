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

  // Estados para os filtros
  const [filterYear, setFilterYear] = useState("");
  const [filterPortal, setFilterPortal] = useState("");
  const [filterType, setFilterType] = useState("");
  const [crimeTypes, setCrimeTypes] = useState([]);

  useEffect(() => {
    const loadMapScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCWLpWz-tPQDYbTIy-rO538_qwNJV8l9Lk&libraries=visualization&callback=initMap`;
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

  useEffect(() => {
    if (map) {
      loadCrimeData().then(heatmapData => {
        if (heatmap) {
          heatmap.setMap(null);
        }

        const heatmapInstance = new google.maps.visualization.HeatmapLayer({
          data: heatmapData.map(crime => ({ location: crime.position, weight: crime.weight })),
          map: map,
        });
        heatmapInstance.set('radius', 100);
        setHeatmap(heatmapInstance);

        // Remove marcadores antigos
        crimeMarkers.forEach(marker => marker.setMap(null));

        // Adiciona marcadores para cada ponto de crime
        const markers = heatmapData.map(crime => {
          let iconUrl = ''; // Ícone padrão para casos indefinidos
          // Verifica se crime.tipo está definido
          if (crime.tipo) {
            switch (crime.tipo) {
              case 'Assalto':
                iconUrl = 'https://i.imgur.com/24TRGv0.png';
                break;
              case 'Homicídio':
                iconUrl = 'https://i.imgur.com/tgccQjG.png';
                break;
              case 'Posse ilegal de arma':
                iconUrl = 'https://i.imgur.com/FT5Yrn2.png';
                break;
              case 'Furto':
                iconUrl = 'https://i.imgur.com/FYKZa0w.png';
                break;
              case 'Tráfico de drogas':
                iconUrl = 'https://i.imgur.com/zT8VEQF_d.webp?maxwidth=760&fidelity=grand';
                break;
              case 'Agressão':
                iconUrl = 'https://i.imgur.com/tu6pNDh.png';
                break;  
              default:
                iconUrl = 'https://i.imgur.com/RWmrEv2.png';
                break;
            }
          }

          const marker = new google.maps.Marker({
            position: crime.position,
            map: map,
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
                <h3><strong>${crime.tipo}</strong></h3>
                <p><strong>Manchete:</strong> ${crime.titulo}</p>
                <p><strong>Endereço aproximado:</strong> ${crime.endereco}</p>
                <p><strong>Data da notícia:</strong> ${crime.data}</p>
                <p><strong>Noticiado por:</strong> ${crime.portal}</p>
                <p><button style=
                "background-color: #007bff;
                color: white;
                padding: 5px 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                " onclick="window.open('${crime.url}', '_blank')">Abrir notícia</button></p>
              </div>
            `;

            if (infoWindow) {
              infoWindow.close(); // Fecha a info window anterior, se existir
            }

            const newInfoWindow = new google.maps.InfoWindow({
              content: infoWindowContent,
            });
            newInfoWindow.open(map, marker);
            setInfoWindow(newInfoWindow); // Define a nova info window como estado
          });

          return marker;
        });

        setCrimeMarkers(markers);
      });
    }
  }, [filterYear, filterPortal, filterType, map]);

  window.initMap = () => {
    const mapElement = document.getElementById("map");
    const mapOptions = {
      zoom: 13,
      center: new google.maps.LatLng(-28.258417445763822, -52.403213941449465),
      mapTypeId: "hybrid",
    };
    const mapInstance = new google.maps.Map(mapElement, mapOptions);
    setMap(mapInstance);

    // faz um request de geolocalização quando o mapa inicia
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const userLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
        // ícone do marker de usuário
        const userIconURL = 'https://i.imgur.com/5RkHnGP.png';

        const userMarkerOptions = {
          position: userLoc,
          map: mapInstance,
          title: "Usuário",
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

  const getRandomOffset = () => {
    // Gera uma pequena variação aleatória nas coordenadas
    const offset = Math.random() * 0.002; // Ajuste a escala conforme necessário
    return offset;
  };

  const offsetDuplicateCoordinates = (crimes) => {
    // Cria um mapa para rastrear a contagem de coordenadas
    const coordCountMap = new Map();
    // Conta quantas vezes cada coordenada aparece
    crimes.forEach(crime => {
      const key = `${crime.position.lat()},${crime.position.lng()}`;
      coordCountMap.set(key, (coordCountMap.get(key) || 0) + 1);
    });

    // Ajusta as coordenadas duplicadas
    return crimes.map(crime => {
      const key = `${crime.position.lat()},${crime.position.lng()}`;
      if (coordCountMap.get(key) > 1) {
        return {
          ...crime,
          position: new window.google.maps.LatLng(
            crime.position.lat() + getRandomOffset(),
            crime.position.lng() + getRandomOffset()
          )
        };
      }
      return crime;
    });
  };

  const loadCrimeData = async () => {
    const querySnapshot = await getDocs(collection(db, 'crimes'));
    const crimes = querySnapshot.docs.map(doc => {
      let data = doc.data();
      return {
        position: new window.google.maps.LatLng(data.latlong.latitude, data.latlong.longitude),
        tipo: data.tipo,
        titulo: data.titulo,
        data: formatTimestamp(data.data),
        portal: data.portal,
        endereco: data.endereco,
        url: data.url,
        weight: getWeight(data.tipo),
      };
    }).filter(crime => 
      crime.endereco.toLowerCase() !== "passo fundo" && 
      crime.tipo.toLowerCase() !== "fora de escopo"
    );

    // Coleta todos os tipos de crimes para preencher o combobox
    const uniqueCrimeTypes = [...new Set(crimes.map(crime => crime.tipo))];
    setCrimeTypes(uniqueCrimeTypes);

    // Filtra os crimes de acordo com os filtros selecionados
    const filteredCrimes = crimes.filter(crime => {
      const crimeYear = new Date(crime.data).getFullYear();
      return (
        (!filterYear || crimeYear === parseInt(filterYear)) &&
        (!filterPortal || crime.portal === filterPortal) &&
        (!filterType || crime.tipo === filterType)
      );
    });

    // Aplica a variação somente aos pontos com coordenadas duplicadas
    return offsetDuplicateCoordinates(filteredCrimes);
  };

  const getWeight = (tipo) => {
    switch (tipo) {
      case 'Homicídio':
        return 5;
      case 'Assalto':
        return 4;
      case 'Furto':
        return 3;
      case 'Tráfico de drogas':
        return 2;
      default:
        return 1;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate(); // Converte o Timestamp para um objeto Date
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
    top: '140px',
    left: '10px',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    backgroundColor: '#dc3545',
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
    top: '100px',
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

  const selectStyle = {
    width: '100%',
    padding: '10px',
    margin: '5px 0',
    borderRadius: '5px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: '14px',
    cursor: 'pointer',
    maxWidth: '150px', // Altera a largura máxima para todos os combobox
  };

  const labelStyle = {
    margin: '8px 0 4px 0',
    fontWeight: 'bold',
  };

  const selectContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '150px', // Ajusta a largura máxima do contêiner para armonizar com os combobox
  };

  const handleYearChange = (event) => setFilterYear(event.target.value);
  const handlePortalChange = (event) => setFilterPortal(event.target.value);
  const handleTypeChange = (event) => setFilterType(event.target.value);

  return (
    <div>
      <button style={toggleButtonStyle} onClick={togglePanel}>&#9776;</button>
      {isPanelVisible && (
        <div id="floating-panel" style={panelStyle}>
          <button style={isHeatmapToggled ? toggledButtonStyle : buttonStyle} onClick={toggleHeatmap}>Heatmap</button>
          <button style={isOpacityToggled ? toggledButtonStyle : buttonStyle} onClick={toggleOpacity}>Opacidade</button>
          <br></br><p style={labelStyle}>Filtros</p><br></br>
          <div>
            <label htmlFor="filter-year" style={labelStyle}>Ano:</label>
            <select id="filter-year" value={filterYear} onChange={handleYearChange} style={selectStyle}>
              <option value="">Todos</option>
              {[2024, 2023, 2022, 2021, 2020, 2019].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-portal" style={labelStyle}>Portal:</label>
            <select id="filter-portal" value={filterPortal} onChange={handlePortalChange} style={selectStyle}>
              <option value="">Todos</option>
              <option value="O Nacional">O Nacional</option>
              <option value="Rádio Uirapuru">Rádio Uirapuru</option>
            </select>
          </div>
          <div style={selectContainerStyle}>
            <label htmlFor="filter-type" style={labelStyle}>Tipo de Crime:</label>
            <select id="filter-type" value={filterType} onChange={handleTypeChange} style={selectStyle}>
              <option value="">Todos</option>
              {crimeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div id="map" style={{ height: '100vh', width: '100%' }}></div>
    </div>
  );
}

export default HeatmapApp;
