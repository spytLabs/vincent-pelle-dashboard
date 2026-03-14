"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/google-sheets";
import { Button } from "./ui/button";
import {
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import { Checkbox } from "radix-ui";

type SortKey = "id" | "dateCreated" | "status" | "district";
type SortDirection = "asc" | "desc";

const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

function SortIcon({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
}) {
  if (columnKey !== sortKey)
    return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 ml-1" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 ml-1" />
  );
}

function parseDate(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function isLockedStatus(status?: string) {
  const s = (status ?? "").toLowerCase().trim();
  return s === "sent-to-koombiyo" || s === "rejected";
}

export function OrderTable({ orders }: { orders: Order[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [showFiltered, setShowFiltered] = useState(false);

  // Selection state
  const [selectedMain, setSelectedMain] = useState<Set<string>>(new Set());
  const [selectedFiltered, setSelectedFiltered] = useState<Set<string>>(new Set());

  const toggleMainRow = (id: string) => {
    setSelectedMain(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFilteredRow = (id: string) => {
    setSelectedFiltered(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(orders.map((o) => o.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [orders]);

  const hasActiveFilters =
    filterStatus !== "" || filterDistrict !== "" || filterSearch !== "";

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "dateCreated" ? "desc" : "asc");
    }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterDistrict("");
    setFilterSearch("");
    setShowFiltered(false);
  };

  // Apply sorting
  const sortOrders = (list: Order[]) => {
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = Number(a.id || 0) - Number(b.id || 0);
          break;
        case "dateCreated":
          cmp = parseDate(a.dateCreated) - parseDate(b.dateCreated);
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "district":
          cmp = (a.district || "").localeCompare(b.district || "");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  };

  const sortedOrders = useMemo(
    () => sortOrders(orders),
    [orders, sortKey, sortDirection],
  );

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus) {
      result = result.filter(
        (o) => o.status?.toLowerCase() === filterStatus.toLowerCase(),
      );
    }
    if (filterDistrict) {
      result = result.filter(
        (o) => o.district?.toLowerCase() === filterDistrict.toLowerCase(),
      );
    }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      result = result.filter((o) => {
        const id = String(o.id ?? "").toLowerCase();
        const name = String(o.customerName ?? "").toLowerCase();
        const email = String(o.email ?? "").toLowerCase();
        return id.includes(q) || name.includes(q) || email.includes(q);
      });
    }
    return sortOrders(result);
  }, [
    orders,
    filterStatus,
    filterDistrict,
    filterSearch,
    sortKey,
    sortDirection,
  ]);

  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const getOrderId = (o: Order) => String(o.id ?? "").trim();
  const getDisplayStatus = (o: Order) => statusOverrides[getOrderId(o)] ?? (o.status ?? "");
  const isSendable = (o: Order) => {
    const id = getOrderId(o);
    if (!id) return false;
    return !isLockedStatus(getDisplayStatus(o));
  };

  const appendLog = (line: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  const processOrders = async (inputOrders: Order[]) => {
    const toSend = inputOrders.filter(isSendable);
    if (!toSend.length) {
      appendLog("No eligible orders selected.");
      return;
    }

    setIsProcessing(true);
    setLogs((prev) => [...prev, `Starting processing for ${toSend.length} order(s)...`]);

    try {
      const res = await fetch("/api/koombiyo/send-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: toSend }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send orders.");

      if (Array.isArray(data?.logs)) {
        setLogs((prev) => [...prev, ...data.logs]);
      }

      if (Array.isArray(data?.updatedOrderIds)) {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          for (const id of data.updatedOrderIds) next[String(id)] = "sent-to-koombiyo";
          return next;
        });

        setSelectedMain((prev) => {
          const next = new Set(prev);
          for (const id of data.updatedOrderIds) next.delete(String(id));
          return next;
        });

        setSelectedFiltered((prev) => {
          const next = new Set(prev);
          for (const id of data.updatedOrderIds) next.delete(String(id));
          return next;
        });
      }
    } catch (e) {
      appendLog(`ERROR: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectableSortedOrders = useMemo(
    () => sortedOrders.filter(isSendable),
    [sortedOrders, statusOverrides],
  );

  const selectableFilteredOrders = useMemo(
    () => filteredOrders.filter(isSendable),
    [filteredOrders, statusOverrides],
  );

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-card border rounded-xl shadow-sm">
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">
          There are no orders to display or fetching has failed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Menu */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by ID, name, or email..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-56"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Districts</option>
          {SRI_LANKA_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowFiltered(true)}
              className="cursor-pointer"
            >
              Show Filtered ({filteredOrders.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="cursor-pointer text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </>
        )}
      </div>

      {(isProcessing || logs.length > 0) && (
        <div className="rounded-xl border bg-black text-green-400 p-3 font-mono text-xs max-h-56 overflow-auto">
          {isProcessing && <div>Processing orders...</div>}
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      {/* Filtered Results Temp Table */}
      {showFiltered && hasActiveFilters && (
        <div className="rounded-xl border-2 border-primary/30 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-primary/5 px-4 py-2 border-b">
            <span className="text-sm font-semibold">
              Filtered Results — {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""}
              {filterStatus && (
                <Badge variant="secondary" className="ml-2 capitalize">
                  {filterStatus}
                </Badge>
              )}
              {filterDistrict && (
                <Badge variant="secondary" className="ml-2">
                  {filterDistrict}
                </Badge>
              )}
              {filterSearch && (
                <Badge variant="outline" className="ml-2">
                  &quot;{filterSearch}&quot;
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={isProcessing || selectedFiltered.size === 0}
                onClick={() =>
                  processOrders(filteredOrders.filter((o) => selectedFiltered.has(getOrderId(o))))
                }
              >
                Send Selected ({selectedFiltered.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFiltered(false)}
                className="cursor-pointer h-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No orders match the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-center font-semibold  pl-4">
                    <Checkbox.Root
                      checked={
                        selectableFilteredOrders.length > 0 &&
                        selectableFilteredOrders.every((o) => selectedFiltered.has(getOrderId(o)))
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFiltered(new Set(selectableFilteredOrders.map((o) => getOrderId(o))));
                        } else {
                          setSelectedFiltered(new Set());
                        }
                      }}
                      className="flex h-4 w-4 items-center justify-center rounded border border-primary shadow-sm cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    >
                      <Checkbox.Indicator>
                        <Check className="h-3 w-3" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </TableHead>
                  <TableHead className="w-[100px] font-semibold text-center">
                    Order ID
                  </TableHead>
                  <TableHead className="w-50 font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("district")}
                      className="inline-flex items-center cursor-pointer hover:text-foreground transition-colors"
                    >
                      District{" "}
                      <SortIcon
                        columnKey="district"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="text-center font-semibold">
                    Total
                  </TableHead>
                  <TableHead className="text-center font-semibold"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order, i) => {
                  const orderId = getOrderId(order);
                  const locked = !isSendable(order);
                  const displayStatus = getDisplayStatus(order);

                  return (
                    <TableRow key={order.id || i} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="w-4 pl-4">
                        <Checkbox.Root
                          disabled={locked}
                          checked={selectedFiltered.has(orderId)}
                          onCheckedChange={() => !locked && toggleFilteredRow(orderId)}
                          className="flex h-4 w-4 items-center justify-center rounded border border-primary shadow-sm cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        >
                          <Checkbox.Indicator>
                            <Check className="h-3 w-3" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </TableCell>

                      <TableCell className="font-medium text-foreground text-center">
                        #{order.id}
                      </TableCell>

                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {order.dateCreated}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            displayStatus?.toLowerCase() === "completed"
                              ? "default"
                              : displayStatus?.toLowerCase() === "processing"
                                ? "secondary"
                                : "outline"
                          }
                          className="capitalize font-medium"
                        >
                          {displayStatus || "Pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customerName}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.email}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{order.district}</TableCell>

                      <TableCell
                        className="max-w-[250px] truncate text-muted-foreground"
                        title={order.itemsSummary}
                      >
                        {(order.itemsSummary ?? "").split("|").filter(Boolean).map((item, idx) => (
                          <div key={idx}>{item}</div>
                        ))}
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        {order.total}
                      </TableCell>

                      <TableCell>
                        {locked ? null : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="max-w-35 cursor-pointer"
                            disabled={isProcessing}
                            onClick={() => processOrders([order])}
                          >
                            Send to Koombiyo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Main Orders Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex justify-end p-3 border-b">
          <Button
            size="sm"
            disabled={isProcessing || selectedMain.size === 0}
            onClick={() => processOrders(sortedOrders.filter((o) => selectedMain.has(getOrderId(o))))}
          >
            Send Selected ({selectedMain.size})
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-center font-semibold  pl-4">
                <Checkbox.Root
                  checked={
                    selectableSortedOrders.length > 0 &&
                    selectableSortedOrders.every((o) => selectedMain.has(getOrderId(o)))
                  }
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setSelectedMain(new Set(selectableSortedOrders.map((o) => getOrderId(o))));
                    } else {
                      setSelectedMain(new Set());
                    }
                  }}
                  className="flex h-4 w-4 items-center justify-center rounded border border-primary shadow-sm cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                >
                  <Checkbox.Indicator>
                    <Check className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-center">
                <button
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center cursor-pointer hover:text-foreground transition-colors"
                >
                  Order ID{" "}
                  <SortIcon
                    columnKey="id"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </TableHead>
              <TableHead className="w-50 font-semibold">
                <button
                  onClick={() => handleSort("dateCreated")}
                  className="inline-flex items-center cursor-pointer hover:text-foreground transition-colors"
                >
                  Date{" "}
                  <SortIcon
                    columnKey="dateCreated"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </TableHead>
              <TableHead className="font-semibold">
                <button
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center cursor-pointer hover:text-foreground transition-colors"
                >
                  Status{" "}
                  <SortIcon
                    columnKey="status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">
                <button
                  onClick={() => handleSort("district")}
                  className="inline-flex items-center cursor-pointer hover:text-foreground transition-colors"
                >
                  District{" "}
                  <SortIcon
                    columnKey="district"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="text-center font-semibold">Total</TableHead>
              <TableHead className="text-center font-semibold"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedOrders.map((order, i) => {
              const orderId = getOrderId(order);
              const locked = !isSendable(order);
              const displayStatus = getDisplayStatus(order);

              return (
                <TableRow key={order.id || i} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="w-4 pl-4">
                    <Checkbox.Root
                      disabled={locked}
                      checked={selectedMain.has(orderId)}
                      onCheckedChange={() => !locked && toggleMainRow(orderId)}
                      className="flex h-4 w-4 items-center justify-center rounded border border-primary shadow-sm cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    >
                      <Checkbox.Indicator>
                        <Check className="h-3 w-3" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </TableCell>

                  <TableCell className="font-medium text-foreground text-center">
                    #{order.id}
                  </TableCell>

                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {order.dateCreated}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        displayStatus?.toLowerCase() === "completed"
                          ? "default"
                          : displayStatus?.toLowerCase() === "processing"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize font-medium"
                    >
                      {displayStatus || "Pending"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>{order.district}</TableCell>

                  <TableCell
                    className="max-w-[250px] truncate text-muted-foreground"
                    title={order.itemsSummary}
                  >
                    {(order.itemsSummary ?? "").split("|").filter(Boolean).map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {order.total}
                  </TableCell>

                  <TableCell>
                    {locked ? null : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="max-w-35 cursor-pointer"
                        disabled={isProcessing}
                        onClick={() => processOrders([order])}
                      >
                        Send to Koombiyo
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
