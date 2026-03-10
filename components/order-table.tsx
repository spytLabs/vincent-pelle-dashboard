"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { Order } from "@/lib/google-sheets"
import { useSettings } from "./settings-provider";
import { MapPicker } from "./map-picker";

export function OrderTable({ orders: initialOrders }: { orders: Order[] }) {
    const { settings } = useSettings();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    const [columnVisibility, setColumnVisibility] = useState({
        "Order ID": true,
        "Date": true,
        "Status": true,
        "Customer": true,
        "Items": false,
        "Vehicle": true,
        "QTY": true,
        "Phone": true,
        "Pickup Address": false,
        "Pickup Remarks": false,
        "Lat / Lng": false,
        "Total": true,
    });

    const toggleColumn = (colName: keyof typeof columnVisibility) => {
        setColumnVisibility(prev => ({
            ...prev,
            [colName]: !prev[colName]
        }));
    };

    // Initialize orders with default settings if missing
    useEffect(() => {
        if (initialOrders) {
            const initialized = initialOrders.map(order => ({
                ...order,
                vehicleType: order.vehicleType || settings.vehicleType,
                pickup_remark: order.pickup_remark || settings.pickup_remark,
                pickup_address: order.pickup_address || settings.pickup_address,
                latitude: order.latitude || settings.latitude,
                longitude: order.longitude || settings.longitude,
                phone: order.phone || settings.phone,
                qty: order.qty || settings.qty,
            }));
            setOrders(initialized); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [initialOrders, settings]);

    const handleRowSelect = (orderId: string, checked: boolean) => {
        const newSet = new Set(selectedRows);
        if (checked) {
            newSet.add(orderId);
        } else {
            newSet.delete(orderId);
        }
        setSelectedRows(newSet);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(new Set(orders.map(o => o.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const updateOrderField = (orderId: string, field: keyof Order, value: string | number | null) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
    };

    // Bulk Edit State
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [bulkSettings, setBulkSettings] = useState({
        vehicleType: settings.vehicleType,
        pickup_remark: settings.pickup_remark,
        pickup_address: settings.pickup_address,
        latitude: settings.latitude,
        longitude: settings.longitude,
        phone: settings.phone,
        qty: settings.qty,
    });

    const handleBulkEdit = () => {
        setOrders(prev => prev.map(o => {
            if (selectedRows.has(o.id)) {
                return {
                    ...o,
                    ...bulkSettings
                };
            }
            return o;
        }));
        setIsBulkEditOpen(false);
        setSelectedRows(new Set()); // optional: clear selection after bulk edit
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">There are no orders to display or fetching has failed.</p>
            </div>
        );
    }

    const allSelected = orders.length > 0 && selectedRows.size === orders.length;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            View Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        {Object.entries(columnVisibility).map(([key, isVisible]) => (
                            <DropdownMenuCheckboxItem
                                key={key}
                                checked={isVisible}
                                onCheckedChange={() => toggleColumn(key as keyof typeof columnVisibility)}
                            >
                                {key}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedRows.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-muted/50 border rounded-lg animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium">{selectedRows.size} row(s) selected</span>
                    <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">Bulk Edit Logistics</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Bulk Edit Logistics Fields</DialogTitle>
                                <DialogDescription>
                                    Apply these values to all {selectedRows.size} selected orders.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Select value={bulkSettings.vehicleType} onValueChange={(v) => setBulkSettings({ ...bulkSettings, vehicleType: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bike">Bike</SelectItem>
                                            <SelectItem value="Three wheel">Three wheel</SelectItem>
                                            <SelectItem value="Lorry">Lorry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Pickup Remark</Label>
                                    <Input value={bulkSettings.pickup_remark} onChange={(e) => setBulkSettings({ ...bulkSettings, pickup_remark: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pickup Address</Label>
                                    <Input value={bulkSettings.pickup_address} onChange={(e) => setBulkSettings({ ...bulkSettings, pickup_address: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input type="tel" value={bulkSettings.phone} onChange={(e) => setBulkSettings({ ...bulkSettings, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>QTY</Label>
                                    <Input type="number" min="1" value={bulkSettings.qty} onChange={(e) => setBulkSettings({ ...bulkSettings, qty: e.target.value })} />
                                </div>
                                <div className="space-y-2 border-t pt-2 mt-2">
                                    <Label>Map Coordinates</Label>
                                    <div className="h-64 rounded-md border overflow-hidden">
                                        <MapPicker
                                            latitude={bulkSettings.latitude}
                                            longitude={bulkSettings.longitude}
                                            onChange={(lat, lng) => setBulkSettings({ ...bulkSettings, latitude: lat, longitude: lng })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleBulkEdit}>Apply to {selectedRows.size} Orders</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
                <Table className="min-w-[1400px]">
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={(c) => handleSelectAll(c as boolean)}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            {columnVisibility["Order ID"] && <TableHead className="w-[100px] font-semibold">Order ID</TableHead>}
                            {columnVisibility["Date"] && <TableHead className="font-semibold">Date</TableHead>}
                            {columnVisibility["Status"] && <TableHead className="w-[140px] font-semibold">Status</TableHead>}
                            {columnVisibility["Customer"] && <TableHead className="min-w-[150px] font-semibold">Customer</TableHead>}
                            {columnVisibility["Items"] && <TableHead className="font-semibold">Items</TableHead>}

                            {/* New Logistics Columns */}
                            {columnVisibility["Vehicle"] && <TableHead className="w-[140px] font-semibold bg-muted/70">Vehicle</TableHead>}
                            {columnVisibility["QTY"] && <TableHead className="w-[100px] font-semibold bg-muted/70">QTY</TableHead>}
                            {columnVisibility["Phone"] && <TableHead className="w-[140px] font-semibold bg-muted/70">Phone</TableHead>}
                            {columnVisibility["Pickup Address"] && <TableHead className="min-w-[180px] font-semibold bg-muted/70">Pickup Address</TableHead>}
                            {columnVisibility["Pickup Remarks"] && <TableHead className="min-w-[150px] font-semibold bg-muted/70">Pickup Remarks</TableHead>}
                            {columnVisibility["Lat / Lng"] && <TableHead className="w-[180px] font-semibold bg-muted/70">Lat / Lng</TableHead>}

                            {columnVisibility["Total"] && <TableHead className="text-right font-semibold">Total</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order, i) => (
                            <TableRow key={order.id || i} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.has(order.id)}
                                        onCheckedChange={(c) => handleRowSelect(order.id, c as boolean)}
                                        aria-label={`Select order ${order.id}`}
                                    />
                                </TableCell>
                                {columnVisibility["Order ID"] && <TableCell className="font-medium text-foreground">{order.id}</TableCell>}
                                {columnVisibility["Date"] && <TableCell className="text-muted-foreground whitespace-nowrap">{order.dateCreated}</TableCell>}
                                {columnVisibility["Status"] && (
                                    <TableCell>
                                        <Badge
                                            variant={
                                                order.status?.toLowerCase() === 'completed' ? 'default' :
                                                    order.status?.toLowerCase() === 'processing' ? 'secondary' : 'outline'
                                            }
                                            className="capitalize font-medium"
                                        >
                                            {order.status || 'Pending'}
                                        </Badge>
                                    </TableCell>
                                )}
                                {columnVisibility["Customer"] && (
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate">{order.customerName}</span>
                                            <span className="text-xs text-muted-foreground truncate">{order.email}</span>
                                        </div>
                                    </TableCell>
                                )}
                                {columnVisibility["Items"] && (
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={order.itemsSummary}>
                                        {order.itemsSummary}
                                    </TableCell>
                                )}

                                {/* Editable Logistics Cells */}
                                {columnVisibility["Vehicle"] && (
                                    <TableCell>
                                        <Select
                                            value={order.vehicleType || "Lorry"}
                                            onValueChange={(v) => updateOrderField(order.id, 'vehicleType', v)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Bike">Bike</SelectItem>
                                                <SelectItem value="Three wheel">Three wheel</SelectItem>
                                                <SelectItem value="Lorry">Lorry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                )}
                                {columnVisibility["QTY"] && (
                                    <TableCell>
                                        <Input
                                            className="h-8 text-xs w-[60px]"
                                            type="number"
                                            min="1"
                                            value={order.qty || "1"}
                                            onChange={(e) => updateOrderField(order.id, 'qty', e.target.value)}
                                        />
                                    </TableCell>
                                )}
                                {columnVisibility["Phone"] && (
                                    <TableCell>
                                        <Input
                                            className="h-8 text-xs w-[130px]"
                                            type="tel"
                                            value={order.phone || ""}
                                            onChange={(e) => updateOrderField(order.id, 'phone', e.target.value)}
                                        />
                                    </TableCell>
                                )}
                                {columnVisibility["Pickup Address"] && (
                                    <TableCell>
                                        <Input
                                            className="h-8 text-xs w-[180px]"
                                            value={order.pickup_address || ""}
                                            onChange={(e) => updateOrderField(order.id, 'pickup_address', e.target.value)}
                                        />
                                    </TableCell>
                                )}
                                {columnVisibility["Pickup Remarks"] && (
                                    <TableCell>
                                        <Input
                                            className="h-8 text-xs w-[180px]"
                                            value={order.pickup_remark || ""}
                                            onChange={(e) => updateOrderField(order.id, 'pickup_remark', e.target.value)}
                                        />
                                    </TableCell>
                                )}
                                {columnVisibility["Lat / Lng"] && (
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
                                            <Input
                                                className="h-8 p-1 w-[80px] bg-muted cursor-not-allowed"
                                                placeholder="Lat"
                                                value={order.latitude ?? ""}
                                                readOnly
                                            />
                                            <span>,</span>
                                            <Input
                                                className="h-8 p-1 w-[80px] bg-muted cursor-not-allowed"
                                                placeholder="Lng"
                                                value={order.longitude ?? ""}
                                                readOnly
                                            />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-8 w-8 ml-1 shrink-0">
                                                        <MapPin className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-4" align="end">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Pick Location</h4>
                                                            <p className="text-sm text-muted-foreground">Select the coordinates on the map.</p>
                                                        </div>
                                                        <div className="w-full h-[250px] overflow-hidden rounded-md border">
                                                            <MapPicker
                                                                latitude={order.latitude ?? null}
                                                                longitude={order.longitude ?? null}
                                                                onChange={(lat, lng) => {
                                                                    updateOrderField(order.id, 'latitude', lat);
                                                                    updateOrderField(order.id, 'longitude', lng);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableCell>
                                )}

                                {columnVisibility["Total"] && <TableCell className="text-right font-medium">{order.total}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
