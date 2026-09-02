import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { IMAGE_BASE_URL } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import "./Orders.css";

const STATUS_MAP = {
  PENDING: { color: "warning", icon: "⏳" },
  CONFIRMED: { color: "primary", icon: "✅" },
  SHIPPED: { color: "info", icon: "📦" },
  DELIVERED: { color: "success", icon: "🎉" },
  CANCELLED: { color: "danger", icon: "❌" }
};

function generateInvoiceHTML(order) {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "—";
  const itemRows = (order.items || [])
    .map(
      item => `<tr>
      <td>${item.productName || item.product?.name || "Product"}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">₹${item.price}</td>
      <td style="text-align:right">₹${item.quantity * item.price}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice - Order #${order.id}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1a2e1a;background:#fff;padding:40px}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #2d6a4f}.brand{font-size:1.6rem;font-weight:700;color:#1b4332}.brand-tag{font-size:.78rem;color:#5a7a5a;margin-top:4px}.invoice-title{text-align:right}.invoice-title h2{font-size:1.4rem;color:#2d6a4f}.invoice-title p{color:#5a7a5a;font-size:.85rem;margin-top:4px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}.meta-block h4{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#5a7a5a;margin-bottom:8px}.meta-block p{font-size:.9rem;line-height:1.7}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#1b4332;color:#fff;padding:10px 14px;font-size:.82rem;text-align:left}th:not(:first-child){text-align:center}th:last-child{text-align:right}td{padding:10px 14px;border-bottom:1px solid #d5e8d7;font-size:.88rem}tr:last-child td{border-bottom:none}.totals{display:flex;justify-content:flex-end}.totals-box{min-width:260px;background:#f0f4f0;border-radius:8px;padding:16px}.total-row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:.88rem;color:#5a7a5a}.total-row.grand{font-weight:700;color:#1b4332;font-size:1rem;padding-top:8px;border-top:2px solid #2d6a4f;margin-top:6px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #d5e8d7;text-align:center;font-size:.78rem;color:#8fab8f}.status-badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:.78rem;font-weight:600;background:#d8f3dc;color:#40916c}</style>
</head><body>
<div class="header">
  <div><div class="brand">🌿 EchOrganics</div><div class="brand-tag">Farm Fresh Organic Produce</div>
  <div style="margin-top:8px;font-size:.82rem;color:#5a7a5a">Vijayawada, AP – 520001<br/>📧 hello@echorganics.in | 📞 +91 98765 43210</div></div>
  <div class="invoice-title"><h2>INVOICE</h2><p>Order #${order.id}</p><p>Date: ${date}</p>
  <p style="margin-top:8px"><span class="status-badge">${order.status || "DELIVERED"}</span></p></div>
</div>
<div class="meta">
  <div class="meta-block"><h4>Delivery Address</h4><p>${order.address ? `${order.address.street || ""}<br/>${order.address.city || ""}, ${order.address.state || ""}<br/>${order.address.pincode || ""}` : "N/A"}</p></div>
  <div class="meta-block"><h4>Payment Info</h4><p>Method: ${order.paymentMethod || "Online"}<br/>Status: ${order.paymentStatus || "Paid"}<br/>GST: Inclusive</p></div>
</div>
<table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${itemRows}</tbody></table>
<div class="totals"><div class="totals-box">
  <div class="total-row"><span>Subtotal</span><span>₹${order.totalAmount}</span></div>
  <div class="total-row"><span>Delivery</span><span>Free</span></div>
  <div class="total-row"><span>Discount</span><span>₹0</span></div>
  <div class="total-row grand"><span>Total Paid</span><span>₹${order.totalAmount}</span></div>
</div></div>
<div class="footer"><p>Thank you for choosing EchOrganics! 🌿 Eat clean, live green.</p>
<p style="margin-top:6px">Computer-generated invoice — no signature required.</p>
<p style="margin-top:4px">Issues? support@echorganics.in</p></div>
</body></html>`;
}

function downloadInvoice(order) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EchOrganics_Invoice_Order${order.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function printInvoice(order) {
  const html = generateInvoiceHTML(order);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.print();
  }, 400);
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    API.get("/orders")
      .then(r => {
        const sortedOrders = (r.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sortedOrders);
      })
      .catch(() => setError("Failed to load orders"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, navigate]);

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="container orders-wrap">
      <h1 className="section-title">My Orders</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => {
            const s =
              STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
            const canDownload = ["DELIVERED", "SHIPPED", "CONFIRMED"].includes(
              order.status?.toUpperCase()
            );
            return (
              <div key={order.id} className="order-card card">
                <div className="order-head">
                  <div>
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "—"}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap"
                    }}
                  >
                    <span className={`badge badge-${s.color}`}>
                      {s.icon} {order.status || "PENDING"}
                    </span>
                    {canDownload && (
                      <div className="invoice-actions">
                        <button
                          className="btn btn-secondary btn-small invoice-btn"
                          onClick={() => downloadInvoice(order)}
                          title="Download Invoice"
                        >
                          ⬇️ Invoice
                        </button>
                        <button
                          className="btn btn-secondary btn-small invoice-btn"
                          onClick={() => printInvoice(order)}
                          title="Print Invoice"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span className="order-item-icon">
                          {(() => {
                            const displayImage =
                              item.product?.images?.[0]?.imageUrl ||
                              item.product?.imageUrl;
                            const fullImageUrl = displayImage
                              ? IMAGE_BASE_URL + displayImage
                              : null;
                            return fullImageUrl ? (
                              <img
                                src={fullImageUrl}
                                alt={item.product?.name || "Product"}
                                style={{ width: "100px" }}
                                width="100"
                                height="100"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span>🌿</span>
                            );
                          })()}
                        </span>
                        <span className="order-item-name">
                          {item.productName || item.product?.name || "Product"}
                        </span>
                        <span className="order-item-qty">
                          × {item.quantity}
                        </span>
                        <span className="order-item-price">
                          ₹{item.quantity * item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-foot">
                  <span className="order-total">
                    Total: <strong>₹{order.totalAmount}</strong>
                  </span>
                  {order.address && (
                    <span className="order-addr-mini">
                      📍{order.address.street}, {order.address.city},{" "}
                      {order.address.state}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No orders yet</h2>
          <p>Start shopping and your orders will appear here</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Shop Now
          </button>
        </div>
      )}
    </div>
  );
}
