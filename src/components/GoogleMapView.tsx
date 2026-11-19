/// <reference types="@types/google.maps" />
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  ColorScheme,
  APILoadingStatus,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  Zap,
  MapPin,
  Compass,
  Loader2,
  BatteryCharging,
  Layers,
  Search,
  X,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { Station } from '../types';

export interface GoogleMapViewProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  onUserLocationChange?: (coords: [number, number]) => void;
  heightClass?: string;
}

interface SearchedPlaceMarker {
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

// Controller component to smoothly pan and zoom the map
function MapController({
  center,
  zoom,
  selectedStation,
  userLocation,
  getStationPosition,
}: {
  center?: [number, number];
  zoom?: number;
  selectedStation: Station | null;
  userLocation?: [number, number] | null;
  getStationPosition: (station: Station) => { lat: number; lng: number };
}) {
  const map = useMap();
  const prevUserLocRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!map) return;
    if (selectedStation) {
      map.panTo(getStationPosition(selectedStation));
      map.setZoom(14);
    }
  }, [map, selectedStation, getStationPosition]);

  useEffect(() => {
    if (!map) return;
    if (!selectedStation && center) {
      map.panTo({ lat: center[0], lng: center[1] });
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center?.[0], center?.[1], zoom, selectedStation]);

  useEffect(() => {
    if (!map || !userLocation) return;
    const prev = prevUserLocRef.current;
    if (!prev || prev[0] !== userLocation[0] || prev[1] !== userLocation[1]) {
      prevUserLocRef.current = userLocation;
      map.panTo({ lat: userLocation[0], lng: userLocation[1] });
      map.setZoom(14);
    }
  }, [map, userLocation]);

  return null;
}

// AdvancedMarker wrapper that exposes the underlying marker instance for InfoWindow anchoring
function StationMarker({
  station,
  position,
  isSelected,
  onMarkerClick,
  zIndex,
}: {
  station: Station;
  position: { lat: number; lng: number };
  isSelected: boolean;
  onMarkerClick: (station: Station, marker: google.maps.marker.AdvancedMarkerElement) => void;
  zIndex: number;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const isHigh = station.demand_level === 'High';
  const isMed = station.demand_level === 'Medium';
  const bgColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
  const shadowColor = isHigh
    ? 'rgba(239, 68, 68, 0.45)'
    : isMed
    ? 'rgba(245, 158, 11, 0.45)'
    : 'rgba(16, 185, 129, 0.45)';

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      title={`${station.station_name} (${station.demand_level} Demand)`}
      onClick={() => {
        if (marker) {
          onMarkerClick(station, marker);
        }
      }}
      zIndex={zIndex}
    >
      <div
        className={`custom-station-pin relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125' : 'hover:scale-110'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl border-2 ${
            isSelected ? 'border-white ring-2 ring-emerald-400/80' : 'border-white/95'
          }`}
          style={{
            backgroundColor: bgColor,
            boxShadow: `0 4px 14px ${shadowColor}`,
          }}
        >
          <Zap className="w-4 h-4 fill-white" />
        </div>
        <div
          className="absolute -bottom-1 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: bgColor }}
        />
      </div>
    </AdvancedMarker>
  );
}

// Map Search + My Location floating control bar
function MapSearchAndLocationBar({
  stations,
  onSelectStationMatch,
  onSelectPlaceMatch,
  onLocate,
  getStationPosition,
}: {
  stations: Station[];
  onSelectStationMatch: (station: Station) => void;
  onSelectPlaceMatch: (place: SearchedPlaceMarker) => void;
  onLocate: (coords: [number, number]) => void;
  getStationPosition: (station: Station) => { lat: number; lng: number };
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Instant matching EV stations from active dataset
  const matchingStations = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return stations
      .filter(
        (s) =>
          s.station_name.toLowerCase().includes(trimmed) ||
          s.area.toLowerCase().includes(trimmed) ||
          s.address.toLowerCase().includes(trimmed) ||
          s.provider.toLowerCase().includes(trimmed) ||
          s.city.toLowerCase().includes(trimmed)
      )
      .slice(0, 4);
  }, [stations, query]);

  // Fetch Places API (New) Autocomplete suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2 || !placesLib) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingPlaces(true);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const mapCenter = map?.getCenter();
        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['in'],
          ...(mapCenter
            ? {
                locationBias: {
                  center: { lat: mapCenter.lat(), lng: mapCenter.lng() },
                  radius: 30000,
                },
              }
            : {}),
        };

        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (!cancelled) {
          setPlaceSuggestions(response.suggestions.slice(0, 4));
        }
      } catch (err) {
        // Fallback gracefully to local station search if Places API is restricted or quota-limited
        if (!cancelled) {
          setPlaceSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingPlaces(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, placesLib, map]);

  const handleSelectStation = (station: Station) => {
    setQuery(station.station_name);
    setIsOpen(false);
    const pos = getStationPosition(station);
    if (map) {
      map.panTo(pos);
      map.setZoom(15);
    }
    onSelectStationMatch(station);
  };

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });

      const loc = place.location;
      if (loc && map) {
        if (place.viewport) {
          map.fitBounds(place.viewport);
        } else {
          map.panTo(loc);
          map.setZoom(14);
        }
        onSelectPlaceMatch({
          name: place.displayName || suggestion.placePrediction.text.text,
          address: place.formattedAddress || '',
          location: { lat: loc.lat(), lng: loc.lng() },
        });
      }
      setQuery(place.displayName || suggestion.placePrediction.text.text);
    } catch (err) {
      console.error('Error fetching place details:', err);
    } finally {
      sessionTokenRef.current = null;
      setPlaceSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        onLocate(coords);
        if (map) {
          map.panTo({ lat: coords[0], lng: coords[1] });
          map.setZoom(14);
        }
      },
      () => {
        setIsLocating(false);
        setErrorMsg('Location access denied or unavailable.');
        setTimeout(() => setErrorMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map, onLocate]);

  const showDropdown =
    isOpen &&
    query.trim().length > 0 &&
    (matchingStations.length > 0 || placeSuggestions.length > 0 || isSearchingPlaces);

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap sm:flex-nowrap items-start gap-2 pointer-events-none"
    >
      {/* Search Input & Results */}
      <div className="relative flex-1 min-w-[200px] sm:w-72 pointer-events-auto">
        <div className="relative flex items-center bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-emerald-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Search area or station..."
            aria-label="Search area or charging station on map"
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 px-2.5 py-2 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPlaceSuggestions([]);
                setIsOpen(false);
              }}
              aria-label="Clear map search"
              className="p-1.5 mr-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div className="mt-1.5 bg-slate-900/98 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800/80">
            {matchingStations.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  EV Charging Stations
                </div>
                {matchingStations.map((station) => (
                  <button
                    key={station.station_id}
                    type="button"
                    onClick={() => handleSelectStation(station)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/90 transition flex items-start gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {station.station_name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {station.area}, {station.city} &bull; {station.available_ports ?? 0}/{station.total_ports} ports free
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(placeSuggestions.length > 0 || isSearchingPlaces) && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                  <span>Locations</span>
                  {isSearchingPlaces && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                {placeSuggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion.placePrediction?.placeId || idx}
                    type="button"
                    onClick={() => void handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/90 transition flex items-start gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 truncate">
                      {suggestion.placePrediction?.text.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Location Button */}
      <div className="flex flex-col items-start gap-1 pointer-events-auto">
        <button
          onClick={handleLocateMe}
          type="button"
          title="Center map on your current location"
          className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 hover:text-white px-3 py-2 rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-semibold transition cursor-pointer active:scale-95 group"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          ) : (
            <Compass className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
          )}
          <span className="whitespace-nowrap">{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>
        {errorMsg && (
          <span className="text-[11px] bg-rose-950/95 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md">
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}

// Accessible Zoom In / Zoom Out helper buttons synced with Google Map instance
function CustomZoomControls() {
  const map = useMap();

  const handleZoom = (delta: number) => {
    if (!map) return;
    const current = map.getZoom() ?? 12;
    map.setZoom(Math.min(20, Math.max(3, current + delta)));
  };

  return (
    <div className="absolute bottom-4 right-3 z-10 flex flex-col bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
      <button
        type="button"
        onClick={() => handleZoom(1)}
        aria-label="Zoom in"
        title="Zoom in"
        className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer border-b border-slate-800"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleZoom(-1)}
        aria-label="Zoom out"
        title="Zoom out"
        className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  center = [13.0827, 80.2707], // Default center on Chennai, India
  zoom = 12,
  userLocation = null,
  onUserLocationChange,
  heightClass = 'h-[420px] sm:h-[500px]',
}) => {
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [activeMarker, setActiveMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<[number, number] | null>(userLocation);
  const [searchedPlace, setSearchedPlace] = useState<SearchedPlaceMarker | null>(null);
  const [resolvedPositions, setResolvedPositions] = useState<Record<string, { lat: number; lng: number }>>({});

  const apiLoadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const lookedUpIdsRef = useRef<Set<string>>(new Set());

  // Sync userLocation prop
  useEffect(() => {
    if (userLocation) {
      setCurrentUserLocation(userLocation);
    }
  }, [userLocation]);

  // Clear InfoWindow when station list changes city completely
  useEffect(() => {
    if (activeStation && !stations.some((s) => s.station_id === activeStation.station_id)) {
      setActiveStation(null);
      setActiveMarker(null);
    }
  }, [stations, activeStation]);

  // Look up coordinates via modern Places API (New) Place.searchByText ONLY for stations missing lat/lng
  useEffect(() => {
    if (!placesLib) return;
    const { Place } = placesLib;

    stations.forEach((station) => {
      const hasCoords =
        typeof station.latitude === 'number' &&
        typeof station.longitude === 'number' &&
        !isNaN(station.latitude) &&
        !isNaN(station.longitude) &&
        station.latitude !== 0 &&
        station.longitude !== 0;

      if (!hasCoords && !lookedUpIdsRef.current.has(station.station_id)) {
        lookedUpIdsRef.current.add(station.station_id);
        const query = station.address?.trim()
          ? `${station.address}, ${station.city || 'Chennai'}, India`
          : `${station.station_name}, ${station.area || ''}, ${station.city || 'Chennai'}, India`;

        void Place.searchByText({
          textQuery: query,
          fields: ['location'],
          maxResultCount: 1,
        })
          .then(({ places }) => {
            const loc = places?.[0]?.location;
            if (loc) {
              setResolvedPositions((prev) => ({
                ...prev,
                [station.station_id]: { lat: loc.lat(), lng: loc.lng() },
              }));
            }
          })
          .catch(() => {
            // Silently keep fallback coordinates if search fails
          });
      }
    });
  }, [placesLib, stations]);

  const defaultMapCenter = useMemo(() => {
    return {
      lat: center ? center[0] : 13.0827,
      lng: center ? center[1] : 80.2707,
    };
  }, [center]);

  const getStationPosition = useCallback(
    (station: Station): { lat: number; lng: number } => {
      if (resolvedPositions[station.station_id]) {
        return resolvedPositions[station.station_id];
      }
      return {
        lat: station.latitude || 13.0827,
        lng: station.longitude || 80.2707,
      };
    },
    [resolvedPositions]
  );

  const handleMarkerClick = useCallback(
    (station: Station, marker: google.maps.marker.AdvancedMarkerElement) => {
      setSearchedPlace(null);
      setActiveStation(station);
      setActiveMarker(marker);
    },
    []
  );

  const hasApiError =
    apiLoadingStatus === APILoadingStatus.FAILED ||
    apiLoadingStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-zinc-800 shadow-xl bg-black`}
    >
      {/* Loading / Error State Overlay */}
      {apiLoadingStatus === APILoadingStatus.LOADING && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 text-slate-300 text-xs gap-2">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Loading Google Maps...</span>
        </div>
      )}

      {hasApiError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <h4 className="text-sm font-bold text-white">Unable to Load Google Maps</h4>
          <p className="text-xs text-slate-400 max-w-md">
            Please verify that your Google Maps API key is configured, has Maps JavaScript API enabled, and allows this referrer domain.
          </p>
        </div>
      )}

      <Map
        mapId="DEMO_MAP_ID"
        colorScheme={ColorScheme.DARK}
        defaultCenter={defaultMapCenter}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={true}
        clickableIcons={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
        onClick={() => {
          setActiveStation(null);
          setActiveMarker(null);
        }}
      >
        <MapController
          center={center}
          zoom={zoom}
          selectedStation={selectedStation}
          userLocation={userLocation}
          getStationPosition={getStationPosition}
        />

        {/* Floating Search & My Location Bar */}
        <MapSearchAndLocationBar
          stations={stations}
          getStationPosition={getStationPosition}
          onSelectStationMatch={(station) => {
            setSearchedPlace(null);
            setActiveStation(station);
            setActiveMarker(null);
          }}
          onSelectPlaceMatch={(place) => {
            setActiveStation(null);
            setActiveMarker(null);
            setSearchedPlace(place);
          }}
          onLocate={(loc) => {
            setCurrentUserLocation(loc);
            onUserLocationChange?.(loc);
          }}
        />

        {/* Custom Zoom In/Out Buttons */}
        <CustomZoomControls />

        {/* Searched Place Marker */}
        {searchedPlace && (
          <AdvancedMarker
            position={searchedPlace.location}
            title={searchedPlace.name}
            zIndex={150}
          >
            <div className="flex flex-col items-center">
              <div className="px-2 py-0.5 mb-1 rounded-md bg-slate-900/95 border border-sky-500/60 text-[10px] font-semibold text-sky-300 shadow-lg whitespace-nowrap max-w-[160px] truncate">
                {searchedPlace.name}
              </div>
              <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-lg" />
            </div>
          </AdvancedMarker>
        )}

        {/* User Location Beacon Marker */}
        {currentUserLocation && (
          <AdvancedMarker
            position={{ lat: currentUserLocation[0], lng: currentUserLocation[1] }}
            title="Your Current Location"
            zIndex={200}
          >
            <div className="relative flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 bg-sky-500 border-2 border-white rounded-full shadow-lg z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div className="absolute w-8 h-8 bg-sky-400/40 rounded-full animate-ping" />
            </div>
          </AdvancedMarker>
        )}

        {/* EV Station Markers */}
        {stations.map((station) => {
          const pos = getStationPosition(station);
          const isSelected =
            selectedStation?.station_id === station.station_id ||
            activeStation?.station_id === station.station_id;

          return (
            <StationMarker
              key={station.station_id}
              station={station}
              position={pos}
              isSelected={isSelected}
              onMarkerClick={handleMarkerClick}
              zIndex={isSelected ? 100 : 10}
            />
          );
        })}

        {/* Anchored InfoWindow Preview when a station marker is clicked */}
        {activeStation && (
          <InfoWindow
            anchor={activeMarker ?? undefined}
            position={!activeMarker ? getStationPosition(activeStation) : undefined}
            onCloseClick={() => {
              setActiveStation(null);
              setActiveMarker(null);
            }}
            pixelOffset={activeMarker ? [0, -4] : [0, -36]}
            maxWidth={300}
          >
            <div className="p-1 w-full max-w-[260px] sm:min-w-[245px] text-slate-100 font-sans">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-sm"
                  style={{
                    backgroundColor:
                      activeStation.demand_level === 'High'
                        ? '#ef4444'
                        : activeStation.demand_level === 'Medium'
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                >
                  {activeStation.demand_level} Demand
                </span>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    activeStation.status === 'Operational'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                      : activeStation.status === 'Busy'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                      : 'bg-rose-950/80 text-rose-400 border-rose-800/80'
                  }`}
                >
                  {activeStation.status}
                </span>
              </div>

              {/* Station Name & Location */}
              <h4 className="font-bold text-sm text-white line-clamp-2 mb-1">
                {activeStation.station_name}
              </h4>
              <p className="text-xs text-slate-300 mb-2 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {activeStation.address || `${activeStation.area}, ${activeStation.city}`}
                </span>
              </p>

              {/* Availability & Power */}
              <div className="grid grid-cols-2 gap-1.5 py-2 px-2.5 bg-slate-900/90 rounded-lg text-xs mb-2 border border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Availability
                  </span>
                  <span className="font-bold text-emerald-400">
                    {activeStation.available_ports ?? 'N/A'} / {activeStation.total_ports} ports
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Power & Rate
                  </span>
                  <span className="font-bold text-slate-200">
                    {activeStation.power_kw}kW &bull; ₹{activeStation.cost_per_kwh}
                  </span>
                </div>
              </div>

              {/* Charger Type */}
              {activeStation.charger_type && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mb-2.5 bg-slate-950/70 px-2 py-1.5 rounded-md border border-slate-800">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{activeStation.charger_type}</span>
                </div>
              )}

              {/* View Details Action Button */}
              <button
                type="button"
                onClick={() => onSelectStation(activeStation)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Full Details</span>
                <span>&rarr;</span>
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Desktop Demand Indicator Legend Overlay (Top Right) */}
      <div className="absolute top-3 right-3 z-10 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 px-3 py-2.5 rounded-xl text-xs shadow-lg space-y-1.5 hidden sm:block pointer-events-auto">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>Station Demand</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Low Demand (Available)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span>Medium Demand</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          <span>High Demand (Crowded)</span>
        </div>
      </div>

      {/* Mobile Compact Demand Legend (Bottom Left, clear of Zoom Controls) */}
      <div className="absolute bottom-4 left-3 z-10 sm:hidden bg-zinc-950/95 backdrop-blur-md border border-zinc-800 px-2.5 py-1.5 rounded-lg text-[10px] shadow-lg flex items-center gap-2.5 text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Med
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> High
        </span>
      </div>
    </div>
  );
};
