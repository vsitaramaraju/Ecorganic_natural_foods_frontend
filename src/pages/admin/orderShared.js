import { IMAGE_BASE_URL } from "../../api/api";
import { formatCurrency, getOrderAmount } from "./adminShared";

// Helpers shared by the admin order list and order details pages.

export const resolveImage = raw => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${IMAGE_BASE_URL}${raw}`;
};

export const getItemImage = item =>
  resolveImage(item?.product?.images?.[0]?.imageUrl || item?.product?.imageUrl);

export const getItemName = item => item?.product?.name || "Deleted product";

/* ── Ship-From (return/warehouse) address — editable by the admin, persisted locally ── */
const SHIP_FROM_STORAGE_KEY = "admin_ship_from_address";

export const DEFAULT_SHIP_FROM = {
  business: "EchOrganics Fulfillment Center",
  street: "",
  city: "Vijayawada",
  state: "Andhra Pradesh",
  pincode: "520001",
  phone: "+91 98765 43210"
};

export const loadShipFromAddress = () => {
  try {
    const raw = localStorage.getItem(SHIP_FROM_STORAGE_KEY);
    if (!raw) return DEFAULT_SHIP_FROM;
    return { ...DEFAULT_SHIP_FROM, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHIP_FROM;
  }
};

export const saveShipFromAddress = address => {
  localStorage.setItem(SHIP_FROM_STORAGE_KEY, JSON.stringify(address));
};

const formatShipFromHTML = from => {
  const cityLine = [from.city, from.state, from.pincode]
    .filter(Boolean)
    .join(", ");
  return [
    from.business,
    from.street,
    cityLine,
    from.phone ? `📞 ${from.phone}` : ""
  ]
    .filter(Boolean)
    .join("<br/>");
};

/* ── Address helpers ── */
export const hasAddress = order =>
  Boolean(order?.address && (order.address.street || order.address.city));

export const formatAddressLines = address => {
  if (!address) return [];
  const lines = [];
  if (address.name || address.phone) {
    lines.push([address.name, address.phone].filter(Boolean).join(" · "));
  }
  if (address.street) lines.push(address.street);
  const cityLine = [address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  return lines;
};

/* ── Shipping / parcel label (for admin to print & paste on the package) ── */
function generateShippingLabelHTML(order, fromAddress) {
  const addr = order.address;
  const customerName =
    order.user?.name || order.customerName || addr?.name || "—";
  const itemCount = (order.items || []).reduce(
    (sum, i) => sum + Number(i?.quantity ?? 1),
    0
  );
  const itemRows = (order.items || []).length
    ? (order.items || [])
        .map(
          item =>
            `<tr><td>${getItemName(item)}</td><td>${
              item.quantity ?? 1
            }</td><td>${formatCurrency(
              Number(item.price || 0) * Number(item.quantity ?? 1)
            )}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3">No ordered items found.</td></tr>`;

  const toBlock = addr
    ? `${addr.name || customerName}<br/>
       ${addr.street || ""}<br/>
       ${[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}<br/>
       ${addr.country || ""}<br/>
       ${addr.phone ? `📞 ${addr.phone}` : ""}`
    : `<span style="color:#c53030">No delivery address on file — contact customer before shipping.</span>`;

  const fromBlock = formatShipFromHTML(fromAddress || DEFAULT_SHIP_FROM);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Shipping Label - Order #${order.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;color:#1a2e1a;background:#fff;padding:24px}
  .label{width:100%;max-width:520px;margin:0 auto;border:3px dashed #1b4332;border-radius:10px;padding:24px}
  .label-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2d6a4f;padding-bottom:12px;margin-bottom:18px}
  .brand{font-size:1.2rem;font-weight:700;color:#1b4332}
  .order-tag{font-size:.85rem;color:#2d6a4f;font-weight:700}
  .section{margin-bottom:16px}
  .section h4{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#5a7a5a;margin-bottom:6px}
  .from p{font-size:.8rem;line-height:1.5;color:#5a7a5a}
  .to{background:#f0f4f0;border-radius:8px;padding:14px 16px}
  .to p{font-size:1rem;line-height:1.7;font-weight:600}
  .items{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:.82rem}
  .items th,.items td{text-align:left;padding:7px 8px;border-bottom:1px solid #d5e8d7}
  .items th{color:#5a7a5a;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}
  .items th:nth-child(2),.items td:nth-child(2){text-align:center;width:54px}
  .items th:last-child,.items td:last-child{text-align:right;white-space:nowrap}
  .meta-row{display:flex;justify-content:space-between;font-size:.82rem;color:#5a7a5a;margin-top:14px;border-top:1px dashed #d5e8d7;padding-top:10px}
  .cod{display:inline-block;margin-top:10px;padding:4px 10px;border-radius:6px;background:#fff3cd;color:#856404;font-weight:700;font-size:.78rem}
</style>
</head><body>
<div class="label">
  <div class="label-header">
    <div class="brand">🌿 EchOrganics</div>
    <div class="order-tag">ORDER #${order.id}</div>
  </div>
  <div class="section from">
    <h4>Ship From</h4>
    <p>${fromBlock}</p>
  </div>
  <div class="section to">
    <h4>Ship To</h4>
    <p>${toBlock}</p>
  </div>
  <div class="section">
    <h4>Ordered Items</h4>
    <table class="items">
      <thead><tr><th>Product</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>
  <div class="meta-row">
    <span>Items: ${itemCount}</span>
    <span>Amount: ${formatCurrency(getOrderAmount(order))}</span>
    <span>Status: ${order.status || "PENDING"}</span>
  </div>
  ${
    String(order.paymentMethod || "")
      .toUpperCase()
      .includes("COD")
      ? `<span class="cod">💰 CASH ON DELIVERY</span>`
      : ""
  }
</div>
</body></html>`;
}

export function downloadShippingLabel(order, fromAddress) {
  const html = generateShippingLabelHTML(order, fromAddress);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EchOrganics_Label_Order${order.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printShippingLabel(order, fromAddress) {
  const html = generateShippingLabelHTML(order, fromAddress);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.print();
  }, 400);
}
