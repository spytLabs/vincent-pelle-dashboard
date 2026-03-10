"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { MapPickerProps } from './map-picker';

// Sri Lanka Bounds
const SRI_LANKA_BOUNDS: L.LatLngBoundsExpression = [
    [5.916667, 79.583333], // South West
    [9.85, 81.883333]      // North East
];

const COLOMBO_CENTER: L.LatLngExpression = [6.9271, 79.8612];

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

// Custom component to forcefully update map view if external props change significantly
function MapUpdater({ position }: { position: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom(), { animate: true });
        }
    }, [map, position]);
    return null;
}

export default function MapPickerImpl({ latitude, longitude, onChange }: MapPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(
        latitude && longitude ? L.latLng(latitude, longitude) : null
    );

    useEffect(() => {
        if (latitude && longitude && (position?.lat !== latitude || position?.lng !== longitude)) {
            setPosition(L.latLng(latitude, longitude));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latitude, longitude]);

    const handlePositionChange = (pos: L.LatLng) => {
        setPosition(pos);
        onChange(pos.lat, pos.lng);
    };

    return (
        <div className="h-[300px] w-full rounded-md overflow-hidden border">
            <MapContainer
                center={position || COLOMBO_CENTER}
                zoom={7}
                maxBounds={SRI_LANKA_BOUNDS}
                maxBoundsViscosity={1.0}
                minZoom={7}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={handlePositionChange} />
                <MapUpdater position={position} />
            </MapContainer>
        </div>
    );
}
