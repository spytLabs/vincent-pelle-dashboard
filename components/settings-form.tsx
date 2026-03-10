"use client";

import { useState } from "react";
import { useSettings } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPicker } from "@/components/map-picker";
import { toast } from "sonner";

export function SettingsForm() {
    const { settings, updateSettings } = useSettings();

    // Local state for the form so it doesn't instantly commit to local storage on every keystroke
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSave = () => {
        updateSettings(localSettings);
        toast.success("Settings saved successfully.");
    };

    const handleReset = () => {
        setLocalSettings(settings);
        toast.info("Settings discarded.");
    };

    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col gap-3 max-w-md">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                    value={localSettings.vehicleType}
                    onValueChange={(val) => setLocalSettings((s) => ({ ...s, vehicleType: val }))}
                >
                    <SelectTrigger id="vehicleType" className="w-full">
                        <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Bike">Bike</SelectItem>
                        <SelectItem value="Three wheel">Three wheel</SelectItem>
                        <SelectItem value="Lorry">Lorry</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-3 max-w-md">
                <Label htmlFor="pickup_remark">Pickup Remark</Label>
                <Input
                    id="pickup_remark"
                    placeholder="e.g. Call before arrival"
                    value={localSettings.pickup_remark}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, pickup_remark: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-3 max-w-md">
                <Label htmlFor="pickup_address">Pickup Address</Label>
                <Input
                    id="pickup_address"
                    placeholder="Warehouse location"
                    value={localSettings.pickup_address}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, pickup_address: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-3 max-w-md">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 7X XXXXXXX"
                    value={localSettings.phone}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, phone: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-3 max-w-md">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                    id="qty"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={localSettings.qty}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, qty: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t">
                <Label>Pickup Location (Sri Lanka)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                    Select the default coordinates for pickup.
                    {localSettings.latitude && localSettings.longitude &&
                        <span className="block mt-1 text-primary">
                            Selected: {localSettings.latitude.toFixed(4)}, {localSettings.longitude.toFixed(4)}
                        </span>
                    }
                </p>
                <div className="w-full max-w-2xl overflow-hidden rounded-md border">
                    <MapPicker
                        latitude={localSettings.latitude}
                        longitude={localSettings.longitude}
                        onChange={(lat, lng) => setLocalSettings((s) => ({ ...s, latitude: lat, longitude: lng }))}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button onClick={handleSave}>Save Defaults</Button>
                <Button variant="outline" onClick={handleReset}>Discard Changes</Button>
            </div>
        </div>
    );
}
