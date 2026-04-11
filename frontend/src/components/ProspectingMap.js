import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons by priority
const createIcon = (color, size = 25) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    "></div>`,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const priorityIcons = {
  alta: createIcon("#ef4444", 30),    // Red
  media: createIcon("#f59e0b", 25),   // Yellow
  baixa: createIcon("#22c55e", 20),   // Green
};

// Coordinates for Baixada Santista municipalities and neighborhoods
const municipioCoords = {
  "Santos": { lat: -23.9608, lng: -46.3336, zoom: 13 },
  "São Vicente": { lat: -23.9631, lng: -46.3889, zoom: 13 },
  "Guarujá": { lat: -23.9931, lng: -46.2564, zoom: 13 },
  "Praia Grande": { lat: -24.0058, lng: -46.4022, zoom: 13 },
  "Cubatão": { lat: -23.8950, lng: -46.4253, zoom: 13 },
  "Itanhaém": { lat: -24.1831, lng: -46.7889, zoom: 13 },
  "Mongaguá": { lat: -24.0867, lng: -46.6206, zoom: 13 },
  "Peruíbe": { lat: -24.3197, lng: -47.0019, zoom: 13 },
  "Bertioga": { lat: -23.8547, lng: -46.1389, zoom: 13 },
};

// Neighborhood coordinates (approximate)
const bairroCoords = {
  // Santos
  "Gonzaga": { lat: -23.9658, lng: -46.3336 },
  "Boqueirão": { lat: -23.9708, lng: -46.3236 },
  "Ponta da Praia": { lat: -23.9808, lng: -46.2936 },
  "Aparecida": { lat: -23.9558, lng: -46.3436 },
  "Vila Mathias": { lat: -23.9508, lng: -46.3286 },
  "Centro": { lat: -23.9358, lng: -46.3286 },
  "Embaré": { lat: -23.9758, lng: -46.3136 },
  "Marapé": { lat: -23.9508, lng: -46.3536 },
  // São Vicente
  "Itararé": { lat: -23.9681, lng: -46.3989 },
  "Gonzaguinha": { lat: -23.9731, lng: -46.3839 },
  "Cidade Náutica": { lat: -23.9581, lng: -46.3939 },
  // Guarujá
  "Pitangueiras": { lat: -23.9881, lng: -46.2564 },
  "Astúrias": { lat: -23.9931, lng: -46.2664 },
  "Enseada": { lat: -23.9831, lng: -46.2264 },
  // Praia Grande
  "Guilhermina": { lat: -24.0108, lng: -46.4222 },
  "Aviação": { lat: -24.0008, lng: -46.4122 },
  "Ocian": { lat: -23.9958, lng: -46.3922 },
  // Cubatão
  "Vila Nova": { lat: -23.8900, lng: -46.4153 },
  "Jardim Casqueiro": { lat: -23.9000, lng: -46.4353 },
};

// Map center adjuster component
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const ProspectingMap = ({ 
  leads = [], 
  selectedMunicipio = "Santos",
  showHeatmap = true,
  showClusters = true,
  route = null,
  onLeadClick = null,
  height = "500px"
}) => {
  const [mapCenter, setMapCenter] = useState([-23.9608, -46.3336]);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    const coords = municipioCoords[selectedMunicipio];
    if (coords) {
      setMapCenter([coords.lat, coords.lng]);
      setMapZoom(coords.zoom);
    }
  }, [selectedMunicipio]);

  // Get coordinates for a lead/zone
  const getLeadCoords = (lead) => {
    // Try to find by zone name
    if (bairroCoords[lead.zona]) {
      return bairroCoords[lead.zona];
    }
    // Fallback to municipality center with small offset
    const munCoords = municipioCoords[lead.municipio] || municipioCoords["Santos"];
    return {
      lat: munCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: munCoords.lng + (Math.random() - 0.5) * 0.02
    };
  };

  // Generate heatmap circles based on crime index
  const renderHeatmapCircles = () => {
    if (!showHeatmap) return null;
    
    return leads.map((lead, index) => {
      const coords = getLeadCoords(lead);
      const crimeIndex = lead.indice_criminalidade || 5;
      
      // Color based on crime index
      let color = "#22c55e"; // Green for low
      if (crimeIndex >= 7.5) color = "#ef4444"; // Red for high
      else if (crimeIndex >= 6) color = "#f59e0b"; // Orange for medium-high
      else if (crimeIndex >= 4) color = "#eab308"; // Yellow for medium
      
      return (
        <Circle
          key={`heatmap-${index}`}
          center={[coords.lat, coords.lng]}
          radius={Math.max(300, crimeIndex * 100)}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 1,
          }}
        />
      );
    });
  };

  // Render route polyline
  const renderRoute = () => {
    if (!route || !route.paradas || route.paradas.length < 2) return null;

    const routePoints = route.paradas.map(parada => {
      // Find the lead for this stop
      const lead = leads.find(l => l.zona === parada.local?.split(",")[0]) || 
                   { zona: parada.local, municipio: selectedMunicipio };
      const coords = getLeadCoords(lead);
      return [coords.lat, coords.lng];
    });

    return (
      <Polyline
        positions={routePoints}
        pathOptions={{
          color: "#3b82f6",
          weight: 4,
          opacity: 0.8,
          dashArray: "10, 10"
        }}
      />
    );
  };

  // Render markers
  const renderMarkers = () => {
    return leads.map((lead, index) => {
      const coords = getLeadCoords(lead);
      const icon = priorityIcons[lead.prioridade] || priorityIcons.baixa;
      
      return (
        <Marker
          key={`marker-${index}`}
          position={[coords.lat, coords.lng]}
          icon={icon}
          eventHandlers={{
            click: () => onLeadClick && onLeadClick(lead)
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h4 className="font-bold text-lg mb-1">{lead.zona}</h4>
              <p className="text-gray-600 text-sm mb-2">{lead.endereco_aproximado}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Condomínios:</span>
                  <span className="font-medium ml-1">{lead.potencial_condominios}</span>
                </div>
                <div>
                  <span className="text-gray-500">Empresas:</span>
                  <span className="font-medium ml-1">{lead.potencial_empresas}</span>
                </div>
                <div>
                  <span className="text-gray-500">Crime:</span>
                  <span className={`font-medium ml-1 ${
                    lead.indice_criminalidade >= 7 ? 'text-red-600' : 
                    lead.indice_criminalidade >= 5 ? 'text-orange-500' : 'text-green-600'
                  }`}>{lead.indice_criminalidade}</span>
                </div>
                <div>
                  <span className="text-gray-500">Chance:</span>
                  <span className="font-medium ml-1 text-green-600">{lead.chance_fechamento}%</span>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  lead.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                  lead.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {lead.prioridade?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  Melhor horário: {lead.melhor_horario}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <div style={{ height, width: "100%" }} className="rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showHeatmap && renderHeatmapCircles()}
        {renderRoute()}
        {renderMarkers()}
      </MapContainer>
    </div>
  );
};

export default ProspectingMap;
