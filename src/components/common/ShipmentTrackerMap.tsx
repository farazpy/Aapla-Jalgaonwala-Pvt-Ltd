import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Truck } from 'lucide-react';

export interface MapCoordinate {
  latitude: number;
  longitude: number;
  label?: string;
  location?: string;
  date?: string;
  remarks?: string;
  isDelivered?: boolean;
  isOutForDelivery?: boolean;
}

interface ShipmentTrackerMapProps {
  coordinates?: MapCoordinate[];
  originCity?: string;
  destinationCity?: string;
  status?: string;
  awbNumber?: string;
  mapHeight?: string;
}

export const ShipmentTrackerMap: React.FC<ShipmentTrackerMapProps> = ({
  coordinates = [],
  originCity = 'Jalgaon',
  destinationCity = 'Destination',
  status = 'In Transit',
  awbNumber = '',
  mapHeight = 'h-[260px] sm:h-[300px] lg:h-[360px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filter valid numeric coordinates
  const validCoordinates = (coordinates || []).filter(
    (c) =>
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !isNaN(c.latitude) &&
      !isNaN(c.longitude) &&
      c.latitude !== 0 &&
      c.longitude !== 0
  );

  const latestCoordinate = validCoordinates[validCoordinates.length - 1];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: Jalgaon/Maharashtra [20.9980, 75.5667]
    const defaultCenter: [number, number] = [20.9980, 75.5667];
    const initialCenter: [number, number] = latestCoordinate
      ? [latestCoordinate.latitude, latestCoordinate.longitude]
      : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: latestCoordinate ? 12 : 7,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    // Custom Icon Generator using SVG
    const createCustomIcon = (
      bgColor: string,
      iconSvg: string,
      isPulse: boolean = false
    ) => {
      const pulseHtml = isPulse
        ? `<div style="position: absolute; inset: -6px; border-radius: 9999px; background: ${bgColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : '';

      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            ${pulseHtml}
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #ffffff; z-index: 2;">
              ${iconSvg}
            </div>
            <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${bgColor}; z-index: 1;"></div>
          </div>
        `,
        iconSize: [34, 38],
        iconAnchor: [17, 38],
        popupAnchor: [0, -36]
      });
    };

    const truckSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>`;
    const checkSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const pinSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    const routeLatLngs: [number, number][] = [];

    // Add markers for all checkpoints with coordinates
    validCoordinates.forEach((coord, idx) => {
      const isLatest = idx === validCoordinates.length - 1;
      const isDelivered = coord.isDelivered || status.toLowerCase() === 'delivered';
      const isOutForDelivery = coord.isOutForDelivery || String(coord.label).toLowerCase().includes('out for delivery');

      let markerColor = '#9B111E'; // Brand Maroon
      let iconContent = pinSvg;
      let isPulse = false;

      if (isDelivered && isLatest) {
        markerColor = '#10B981'; // Green
        iconContent = checkSvg;
      } else if (isOutForDelivery) {
        markerColor = '#D9531E'; // Amber Orange
        iconContent = truckSvg;
        isPulse = true;
      } else if (isLatest) {
        markerColor = '#9B111E'; // Brand Maroon
        iconContent = truckSvg;
        isPulse = true;
      }

      const icon = createCustomIcon(markerColor, iconContent, isPulse);
      const latLng: [number, number] = [coord.latitude, coord.longitude];
      routeLatLngs.push(latLng);
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon }).addTo(map);

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 2px; min-width: 190px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${markerColor};"></span>
            <strong style="font-size: 13px; color: #1c1917;">${coord.label || 'Checkpoint'}</strong>
          </div>
          ${coord.location ? `<p style="margin: 2px 0; font-size: 11.5px; color: #44403c;">📍 <strong>Location:</strong> ${coord.location}</p>` : ''}
          ${coord.date ? `<p style="margin: 2px 0; font-size: 11px; color: #78716c;">🕒 <strong>Time:</strong> ${coord.date}</p>` : ''}
          ${coord.remarks ? `<p style="margin: 2px 0; font-size: 11px; color: #78716c;">📝 <strong>Remarks:</strong> ${coord.remarks}</p>` : ''}
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f5f5f4; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-family: monospace; color: #a8a29e;">${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}</span>
            <a href="https://www.google.com/maps/search/?api=1&query=${coord.latitude},${coord.longitude}" target="_blank" rel="noopener noreferrer" style="font-size: 10.5px; color: #9B111E; text-decoration: none; font-weight: bold;">Google Maps →</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Auto-open latest marker popup
      if (isLatest) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    });

    // Draw route polyline if multiple coordinates
    if (routeLatLngs.length > 1) {
      L.polyline(routeLatLngs, {
        color: '#9B111E',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);
    }

    // Fit map bounds
    if (validCoordinates.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } else if (validCoordinates.length === 1) {
      map.setView([validCoordinates[0].latitude, validCoordinates[0].longitude], 13);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, status, latestCoordinate]);

  const googleMapsUrl = latestCoordinate
    ? `https://www.google.com/maps/search/?api=1&query=${latestCoordinate.latitude},${latestCoordinate.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationCity || originCity || 'Jalgaon')}`;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Map Header */}
      <div className="px-4 py-3 bg-stone-50/90 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              Live GPS Location Pin
              {validCoordinates.length > 0 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                  {validCoordinates.length} GPS Pin{validCoordinates.length > 1 ? 's' : ''}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-stone-500">
              {originCity} &rarr; {destinationCity}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {latestCoordinate && (
            <span className="text-[10.5px] font-mono text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs hidden sm:inline-block">
              {latestCoordinate.latitude.toFixed(4)}, {latestCoordinate.longitude.toFixed(4)}
            </span>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className={`w-full bg-stone-100 ${mapHeight}`}
          style={{ zIndex: 1 }}
        />

        {/* Fallback Notice if DTDC scan has no GPS pins yet */}
        {validCoordinates.length === 0 && (
          <div className="absolute inset-0 bg-stone-50/85 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-stone-800">Shipment Route in Progress</p>
            <p className="text-[11px] text-stone-500 max-w-xs mt-0.5">
              Hub scans are recorded in the timeline. Exact delivery vehicle GPS pins appear once scanned by the field partner.
            </p>
          </div>
        )}
      </div>

      {/* Map Footer Summary */}
      {latestCoordinate && (
        <div className="px-4 py-2.5 bg-[#9B111E]/5 border-t border-[#9B111E]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-stone-800">
            <MapPin className="w-3.5 h-3.5 text-[#9B111E] shrink-0" />
            <span>
              <strong>Latest GPS Checkpoint:</strong> {latestCoordinate.location || latestCoordinate.label} ({latestCoordinate.date})
            </span>
          </div>
          {latestCoordinate.remarks && (
            <span className="text-[10.5px] text-[#9B111E] font-semibold">
              Signee/Remarks: {latestCoordinate.remarks}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
