"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface DefaultSettings {
    vehicleType: string;
    pickup_remark: string;
    pickup_address: string;
    latitude: number | null;
    longitude: number | null;
    phone: string;
    qty: string;
}

const defaultSettings: DefaultSettings = {
    vehicleType: 'Bike', // Bike, Three wheel, Lorry
    pickup_remark: '',
    pickup_address: '',
    latitude: null,
    longitude: null,
    phone: '',
    qty: '1',
};

interface SettingsContextType {
    settings: DefaultSettings;
    updateSettings: (newSettings: Partial<DefaultSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<DefaultSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load from local storage on mount
        const saved = localStorage.getItem('order-defaults');
        let initialSettings = defaultSettings;
        if (saved) {
            try {
                initialSettings = { ...defaultSettings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        setSettings(initialSettings); // eslint-disable-line react-hooks/set-state-in-effect
        setIsLoaded(true);
    }, []);

    const updateSettings = (newSettings: Partial<DefaultSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('order-defaults', JSON.stringify(updated));
            return updated;
        });
    };

    if (!isLoaded) {
        return null; // or a tiny loader if preferred, to avoid hydration mismatch
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
