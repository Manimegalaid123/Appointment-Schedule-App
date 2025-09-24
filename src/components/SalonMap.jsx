import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, X, MapPin, ExternalLink } from 'lucide-react';

// Custom marker icons
const createCustomIcon = (color = '#ef4444') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20]
  });
};

const SalonMap = ({ address, businessName, isOpen, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied:', error)
      );
    }
  }, []);

  // Geocode address using free Nominatim service
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=US`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      throw new Error('Address not found');
    } catch (error) {
      throw new Error('Failed to find location');
    }
  };

  // Calculate route using free routing service
  const calculateRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: (route.distance / 1000).toFixed(1) + ' km',
          duration: Math.round(route.duration / 60) + ' min',
          geometry: route.geometry
        };
      }
      return null;
    } catch (error) {
      console.log('Route calculation failed:', error);
      return null;
    }
  };

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError('');

        // Geocode the address
        const coords = await geocodeAddress(address);
        setCoordinates(coords);

        // Create map
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([coords.lat, coords.lng], 15);

        // Add free tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Add business marker
        const businessMarker = L.marker([coords.lat, coords.lng], {
          icon: createCustomIcon('#ef4444')
        }).addTo(map);

        businessMarker.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <h4 style="margin: 0 0 4px 0;">${businessName}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
          </div>
        `).openPopup();

        // Add user location marker if available
        if (userLocation) {
          L.marker([userLocation.lat, userLocation.lng], {
            icon: createCustomIcon('#10b981')
          }).addTo(map).bindPopup('Your Location');

          // Calculate and display route
          const route = await calculateRoute(userLocation, coords);
          if (route) {
            setRouteInfo(route);
            
            // Draw route on map
            const routeLayer = L.geoJSON(route.geometry, {
              style: {
                color: '#10b981',
                weight: 4,
                opacity: 0.8
              }
            }).addTo(map);

            // Fit map to show both locations
            const group = L.featureGroup([businessMarker, routeLayer]);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        }

        mapInstanceRef.current = map;
        setLoading(false);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, address, businessName, userLocation]);

  // Open in external map apps
  const openInExternalMap = () => {
    if (coordinates) {
      let url;
      if (userLocation) {
        // With directions
        url = `https://www.openstreetmap.org/directions?from=${userLocation.lat},${userLocation.lng}&to=${coordinates.lat},${coordinates.lng}`;
      } else {
        // Just location
        url = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=15`;
      }
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        maxHeight: '600px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              📍 {businessName}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {address}
            </p>
            {routeInfo && (
              <div style={{ 
                marginTop: '8px',
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                color: '#10b981',
                fontWeight: '500'
              }}>
                <span>📏 {routeInfo.distance}</span>
                <span>⏱️ {routeInfo.duration}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={openInExternalMap}
              style={{
                padding: '8px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px'
              }}
            >
              <ExternalLink size={14} />
              Open Map
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb',
              zIndex: 1000
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }}></div>
                <p style={{ color: '#6b7280' }}>Loading map...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb',
              zIndex: 1000
            }}>
              <div style={{ textAlign: 'center', color: '#ef4444' }}>
                <MapPin size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Failed to load map: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: '0 0 12px 12px'
            }}
          ></div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .custom-map-marker {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
        `}
      </style>
    </div>
  );
};

export default SalonMap;