"use client";

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';

// Leaflet uses 'window' which breaks Next.js SSR, so we load it dynamically
const MapPickerImpl = dynamic<MapPickerProps>(() => import('./map-picker-impl'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-md flex items-center justify-center text-muted-foreground">Loading Map...</div>
});

export interface MapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onChange: (lat: number, lng: number) => void;
}

export const MapPicker = forwardRef<HTMLDivElement, MapPickerProps>(
    (props, ref) => {
        return (
            <div ref={ref} className="w-full relative z-0">
                <MapPickerImpl {...props} />
            </div>
        );
    }
);
MapPicker.displayName = "MapPicker";
