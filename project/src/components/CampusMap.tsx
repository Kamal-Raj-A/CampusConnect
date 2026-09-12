import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, X, MapPin, CheckCircle } from 'lucide-react';
import type { IssueWithCategory } from '../lib/database.types';
import CampusNavigationPanel from './CampusNavigationPanel';
import { CAMPUS_PLACES, CampusPlace } from '../data/campusPlaces';
import { fetchAllIssues } from '../lib/issuesService';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

/* Fix default Leaflet marker icons */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CampusMapProps {
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
  selectMode?: boolean;
  selectedLocation?: { lat: number; lng: number; name: string } | null;
}

/* Calculate distance between coordinates in meters */
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function findNearestCampusPlace(lat: number, lng: number): { place: CampusPlace; distance: number } | null {
  if (!CAMPUS_PLACES || CAMPUS_PLACES.length === 0) return null;
  let nearest = CAMPUS_PLACES[0];
  let minDistance = getDistanceMeters(lat, lng, nearest.lat, nearest.lng);

  for (let i = 1; i < CAMPUS_PLACES.length; i++) {
    const d = getDistanceMeters(lat, lng, CAMPUS_PLACES[i].lat, CAMPUS_PLACES[i].lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = CAMPUS_PLACES[i];
    }
  }

  return { place: nearest, distance: minDistance };
}

/* Handle map click for location selection */
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (!onLocationSelect) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const nearest = findNearestCampusPlace(lat, lng);
      let locationName = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (nearest) {
        if (nearest.distance <= 40) {
          locationName = nearest.place.name;
        } else if (nearest.distance <= 120) {
          locationName = `Near ${nearest.place.name}`;
        }
      }

      onLocationSelect(lat, lng, locationName);
    },
  });
  return null;
}

/* Fly to selected location when changed */
function MapLocationSyncer({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 17, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

/* Ensure map resizes properly and calculates container dimensions */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

/* Draw route and distance */
function RoutingControl({
  start,
  end,
  onClose,
}: {
  start: [number, number];
  end: [number, number];
  onClose: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: '#2563EB', weight: 5 }],
      },
      router: (L as any).Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [start, end, map]);

  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-[1000] bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
    >
      <X size={18} />
      Clear Route
    </button>
  );
}

export default function CampusMap({
  onLocationSelect,
  selectMode = false,
  selectedLocation: externalSelectedLocation,
}: CampusMapProps) {
  const [issues, setIssues] = useState<IssueWithCategory[]>([]);
  const [currentSelected, setCurrentSelected] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(externalSelectedLocation || null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  const [showRouting, setShowRouting] = useState(false);

  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = [13.0286, 80.0189];
  const defaultZoom = 16;

  // Sync external selected location if passed
  useEffect(() => {
    if (externalSelectedLocation) {
      setCurrentSelected(externalSelectedLocation);
      const matched = CAMPUS_PLACES.find(p => p.name === externalSelectedLocation.name);
      if (matched) {
        setSelectedPlaceId(matched.id);
      }
    }
  }, [externalSelectedLocation]);

  useEffect(() => {
    loadIssues();

    const handleUpdate = () => {
      loadIssues();
    };

    window.addEventListener('campus_issues_updated', handleUpdate);
    return () => {
      window.removeEventListener('campus_issues_updated', handleUpdate);
    };
  }, []);

  const loadIssues = async () => {
    const data = await fetchAllIssues();
    setIssues(data);
  };

  const handleMapLocationChosen = (lat: number, lng: number, name: string) => {
    setCurrentSelected({ lat, lng, name });
    const matched = CAMPUS_PLACES.find(p => p.name === name);
    setSelectedPlaceId(matched ? matched.id : '');
    onLocationSelect?.(lat, lng, name);
  };

  const handleCampusPlaceDropdownChange = (placeId: string) => {
    setSelectedPlaceId(placeId);
    const place = CAMPUS_PLACES.find(p => p.id === placeId);
    if (place) {
      handleMapLocationChosen(place.lat, place.lng, place.name);
    }
  };

  const handleNavigateToIssue = (issue: IssueWithCategory) => {
    if (!issue.location_lat || !issue.location_lng) return;

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setRouteStart([pos.coords.latitude, pos.coords.longitude]);
        setRouteEnd([issue.location_lat!, issue.location_lng!]);
        setShowRouting(true);
      },
      () => {
        setRouteStart(defaultCenter);
        setRouteEnd([issue.location_lat!, issue.location_lng!]);
        setShowRouting(true);
      }
    );
  };

  /* Campus place → place navigation */
  const handleCampusNavigate = (start: [number, number], end: [number, number]) => {
    setRouteStart(start);
    setRouteEnd(end);
    setShowRouting(true);
  };

  const createIssueIcon = (color: string, status: string) => {
    const statusEmoji: Record<string, string> = {
      pending: '🔴',
      in_progress: '🟡',
      resolved: '🟢',
      closed: '⚪',
    };

    return L.divIcon({
      className: 'custom-issue-marker',
      html: `
        <div style="
          background-color:${color};
          width:32px;
          height:32px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;">
          ${statusEmoji[status] || '🔴'}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const selectedPinIcon = L.divIcon({
    className: 'custom-selected-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          background: #DC2626;
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
          margin-bottom: 2px;
          animation: bounce 1s infinite alternate;
        ">
          📍 Selected Location
        </div>
        <div style="
          width: 20px;
          height: 20px;
          background: #DC2626;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [120, 50],
    iconAnchor: [60, 48],
  });

  const campusPoiIcon = (name: string) => L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        background: #2563EB;
        color: white;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        transition: transform 0.15s ease;
      " title="${name}">
        🏛️
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl">
      {/* SELECTION OVERLAY IN REPORT MODE */}
      {selectMode && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 w-80 md:w-96 border border-blue-100 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Choose Campus Location</h3>
              <p className="text-xs text-gray-500">Pick from campus list or click map</p>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <select
              value={selectedPlaceId}
              onChange={(e) => handleCampusPlaceDropdownChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
            >
              <option value="">-- Choose Campus Building / Place --</option>
              {CAMPUS_PLACES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {currentSelected ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-800 truncate">
                    {currentSelected.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-mono">
                    {currentSelected.lat.toFixed(5)}, {currentSelected.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200 text-center">
                👉 Select a location above or tap on the map below to drop a pin.
              </p>
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION PANEL IN REGULAR MAP MODE ONLY */}
      {!selectMode && (
        <CampusNavigationPanel
          onNavigate={handleCampusNavigate}
          onClear={() => {
            setShowRouting(false);
            setRouteStart(null);
            setRouteEnd(null);
          }}
        />
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        className="w-full h-full rounded-2xl"
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <MapResizer />
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map Click Listener */}
        {selectMode && <MapClickHandler onLocationSelect={handleMapLocationChosen} />}

        {/* Smooth Map Pan Syncer */}
        <MapLocationSyncer target={currentSelected} />

        {/* CAMPUS PLACES / POIs */}
        {CAMPUS_PLACES.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={campusPoiIcon(place.name)}
            eventHandlers={{
              click: () => {
                if (selectMode) {
                  handleMapLocationChosen(place.lat, place.lng, place.name);
                }
              },
            }}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-gray-900 text-sm">{place.name}</h4>
                <p className="text-xs text-gray-500">Campus Landmark / Facility</p>
                {selectMode && (
                  <button
                    onClick={() => handleMapLocationChosen(place.lat, place.lng, place.name)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-lg font-medium transition"
                  >
                    Select this Location
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* SELECTED LOCATION PIN */}
        {selectMode && currentSelected && (
          <Marker
            position={[currentSelected.lat, currentSelected.lng]}
            icon={selectedPinIcon}
            zIndexOffset={1000}
          >
            <Popup autoPan={false}>
              <div className="text-center p-1">
                <span className="text-xs font-semibold text-red-600 block">Report Location:</span>
                <p className="font-bold text-gray-900 text-sm">{currentSelected.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  {currentSelected.lat.toFixed(5)}, {currentSelected.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* REPORTED ISSUES MARKERS */}
        {issues.map(
          (issue) =>
            issue.location_lat &&
            issue.location_lng && (
              <Marker
                key={issue.id}
                position={[issue.location_lat, issue.location_lng]}
                icon={createIssueIcon(issue.category?.color || '#3B82F6', issue.status)}
              >
                <Popup>
                  <div className="p-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: issue.category?.color || '#3B82F6' }}
                      />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {issue.category?.name || 'Issue'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{issue.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{issue.description}</p>
                    {issue.location_name && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                        <MapPin size={12} /> {issue.location_name}
                      </p>
                    )}
                    {!selectMode && (
                      <button
                        onClick={() => handleNavigateToIssue(issue)}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                      >
                        <Navigation size={12} /> Navigate Here
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
        )}

        {/* ROUTING CONTROL */}
        {showRouting && routeStart && routeEnd && (
          <RoutingControl
            start={routeStart}
            end={routeEnd}
            onClose={() => {
              setShowRouting(false);
              setRouteStart(null);
              setRouteEnd(null);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
