import { useEffect, useMemo, useState } from "react";
import {
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  getOrderItemsCount,
  exportToCSV as sharedExport
} from "./adminShared";

function exportToCSV(data, filename) {
  const headers = [
    "Order ID",
    "Date",
    "Customer",
    "Email",
    "Items",
    "Amount",
    "Status"
  ];
  const rows = data.map(o => [
    `#${o.id}`,
    formatDate(o.createdAt || o.orderDate),
    o.user?.name || o.customerName || "-",
    o.user?.email || "-",
    getOrderItemsCount(o),
    getOrderAmount(o).toFixed(2),
    o.status || "PENDING"
  ]);
  sharedExport(headers, rows, filename);
}

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444"
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load sales data"
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (statusFilter !== "ALL")
      result = result.filter(
        o => String(o.status || "PENDING").toUpperCase() === statusFilter
      );
    if (dateFrom)
      result = result.filter(
        o => new Date(o.createdAt || o.orderDate) >= new Date(dateFrom)
      );
    if (dateTo)
      result = result.filter(
        o =>
          new Date(o.createdAt || o.orderDate) <= new Date(dateTo + "T23:59:59")
      );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o =>
          String(o.id).includes(q) ||
          (o.user?.name || o.customerName || "").toLowerCase().includes(q) ||
          (o.user?.email || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "amount_desc":
          return getOrderAmount(b) - getOrderAmount(a);
        case "amount_asc":
          return getOrderAmount(a) - getOrderAmount(b);
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
    return result;
  }, [orders, statusFilter, dateFrom, dateTo, searchQuery, sortBy]);

  // Reset to page 1 whenever filters/search/sort/page size change.
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo, searchQuery, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const summary = useMemo(
    () => ({
      totalRevenue: filtered.reduce((s, o) => s + getOrderAmount(o), 0),
      totalOrders: filtered.length,
      totalItems: filtered.reduce((s, o) => s + getOrderItemsCount(o), 0)
    }),
    [filtered]
  );

  if (isLoading)
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );

  return (
    <div className="admin-stack">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary KPIs */}
      <div className="sales-kpi-row">
        <div className="sales-kpi-item">
          <div className="sales-kpi-label">Revenue (filtered)</div>
          <div className="sales-kpi-val">
            {formatCurrency(summary.totalRevenue)}
          </div>
        </div>
        <div className="sales-kpi-item">
          <div className="sales-kpi-label">Orders (filtered)</div>
          <div className="sales-kpi-val">{summary.totalOrders}</div>
        </div>
        <div className="sales-kpi-item">
          <div className="sales-kpi-label">Items Sold</div>
          <div className="sales-kpi-val">{summary.totalItems}</div>
        </div>
        <div className="sales-kpi-item">
          <div className="sales-kpi-label">Avg. Order</div>
          <div className="sales-kpi-val">
            {formatCurrency(
              summary.totalOrders
                ? summary.totalRevenue / summary.totalOrders
                : 0
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown Pills */}
      <div className="sales-status-pills">
        {[
          "ALL",
          "PENDING",
          "CONFIRMED",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED"
        ].map(s => (
          <button
            key={s}
            className={`sales-status-pill-btn ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s)}
            style={
              statusFilter === s && s !== "ALL"
                ? {
                    background: STATUS_COLORS[s],
                    borderColor: STATUS_COLORS[s],
                    color: "#fff"
                  }
                : {
                    color: STATUS_COLORS[s] || "#000"
                  }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <section className="card admin-section">
        <div className="sales-filter-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Search</label>
            <input
              placeholder="Order ID, customer name, email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
          <div className="form-group">
            <label>Rows</label>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() =>
                exportToCSV(filtered, `sales-report-${Date.now()}.csv`)
              }
              title="Export filtered orders to CSV"
            >
              ⬇ Export CSV
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStatusFilter("ALL");
                setDateFrom("");
                setDateTo("");
                setSearchQuery("");
                setSortBy("date_desc");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section className="card admin-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14
          }}
        >
          <h3 style={{ margin: 0 }}>
            Online Sales — {filtered.length} order
            {filtered.length !== 1 ? "s" : ""}
          </h3>
          <button
            className="btn btn-secondary"
            onClick={() =>
              exportToCSV(filtered, `sales-${statusFilter}-${Date.now()}.csv`)
            }
          >
            ⬇ Export This View
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-row">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map(o => (
                  <tr key={o.id}>
                    <td>
                      <strong>#{o.id}</strong>
                    </td>
                    <td>{formatDate(o.createdAt || o.orderDate)}</td>
                    <td>{o.user?.name || o.customerName || "-"}</td>
                    <td style={{ color: "#667eea", fontSize: 13 }}>
                      {o.user?.email || "-"}
                    </td>
                    <td>{getOrderItemsCount(o)}</td>
                    <td>
                      <strong>{formatCurrency(getOrderAmount(o))}</strong>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill status-${String(o.status || "").toLowerCase()}`}
                      >
                        {o.status || "PENDING"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <p className="admin-pagination-summary">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of{" "}
            {filtered.length} orders
          </p>

          {totalPages > 1 && (
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="btn-action"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ← Prev
              </button>
              <span className="admin-pagination-page">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-action"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
