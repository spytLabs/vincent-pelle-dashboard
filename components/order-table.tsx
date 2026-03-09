"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/google-sheets"

export function OrderTable({ orders }: { orders: Order[] }) {
    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">There are no orders to display or fetching has failed.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[120px] font-semibold">Order ID</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order, i) => (
                        <TableRow key={order.id || i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-foreground">{order.id}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{order.dateCreated}</TableCell>
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
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{order.customerName}</span>
                                    <span className="text-xs text-muted-foreground">{order.email}</span>
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate text-muted-foreground" title={order.itemsSummary}>
                                {order.itemsSummary}
                            </TableCell>
                            <TableCell className="text-right font-medium">{order.total}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
