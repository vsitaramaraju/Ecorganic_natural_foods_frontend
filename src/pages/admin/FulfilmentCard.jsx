import { useState } from "react";

// Delivery partners offered when packing an order. "Other" lets the admin type a
// name and paste that courier's tracking link.
const COURIERS = [
  { name: "DTDC", trackingUrl: "https://www.dtdc.com/track-your-shipment/" },
  { name: "Other", trackingUrl: "" }
];
const DEFAULT_COURIER = COURIERS[0];

const STEPS = ["New", "Packed", "Delivered"];

const stageOf = status => {
  if (status === "DELIVERED") return 2;
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return 1;
  return 0;
};

const formatShippedAt = value => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
};

// Form values prefilled from the order when it already has tracking details,
// otherwise DTDC with its tracking page.
const initialForm = order => {
  if (!order.courierName) {
    return {
      partner: DEFAULT_COURIER.name,
      otherName: "",
      trackingId: "",
      trackingUrl: DEFAULT_COURIER.trackingUrl
    };
  }
  const known = COURIERS.find(
    c => c.name !== "Other" && c.name === order.courierName
  );
  return {
    partner: known ? known.name : "Other",
    otherName: known ? "" : order.courierName,
    trackingId: order.trackingId || "",
    trackingUrl: order.trackingUrl || known?.trackingUrl || ""
  };
};

/**
 * Fulfilment steps for one order: New → Packed (handed to a courier) → Delivered.
 * `onShip(details)` resolves true when the tracking details were saved.
 */
export default function FulfilmentCard({
  order,
  status,
  itemCount,
  isSaving,
  onShip,
  onMarkDelivered
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => initialForm(order));

  if (status === "CANCELLED") return null;

  const stage = stageOf(status);
  const hasTracking = Boolean(order.trackingId);

  const openForm = () => {
    setForm(initialForm(order));
    setIsEditing(true);
  };

  const changePartner = partner => {
    const courier = COURIERS.find(c => c.name === partner);
    setForm(f => ({ ...f, partner, trackingUrl: courier?.trackingUrl ?? "" }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const saved = await onShip({
      courierName:
        form.partner === "Other" ? form.otherName.trim() : form.partner,
      trackingId: form.trackingId.trim(),
      trackingUrl: form.trackingUrl.trim()
    });
    if (saved) setIsEditing(false);
  };

  const trackingSummary = hasTracking && (
    <dl className="fulfil-tracking">
      <div>
        <dt>Delivery partner</dt>
        <dd>{order.courierName}</dd>
      </div>
      <div>
        <dt>Tracking ID</dt>
        <dd className="fulfil-tracking-id">{order.trackingId}</dd>
      </div>
      {order.trackingUrl && (
        <div>
          <dt>Tracking link</dt>
          <dd>
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
              Open tracking page ↗
            </a>
          </dd>
        </div>
      )}
    </dl>
  );

  let panel;
  if (isEditing) {
    panel = (
      <form className="fulfil-form" onSubmit={handleSubmit}>
        <div className="fulfil-form-grid">
          <label className="fulfil-field">
            <span>Delivery partner</span>
            <select
              value={form.partner}
              onChange={e => changePartner(e.target.value)}
              disabled={isSaving}
            >
              {COURIERS.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {form.partner === "Other" && (
            <label className="fulfil-field">
              <span>Partner name</span>
              <input
                value={form.otherName}
                onChange={e => setForm(f => ({ ...f, otherName: e.target.value }))}
                placeholder="e.g. Delhivery"
                maxLength={60}
                required
                disabled={isSaving}
              />
            </label>
          )}

          <label className="fulfil-field">
            <span>Tracking ID</span>
            <input
              value={form.trackingId}
              onChange={e => setForm(f => ({ ...f, trackingId: e.target.value }))}
              placeholder="e.g. D12345678"
              maxLength={60}
              required
              autoFocus
              disabled={isSaving}
            />
          </label>

          <label className="fulfil-field fulfil-field-full">
            <span>Tracking link</span>
            <input
              type="url"
              value={form.trackingUrl}
              onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))}
              placeholder="https://"
              maxLength={500}
              required
              disabled={isSaving}
            />
          </label>
        </div>

        <p className="fulfil-hint">
          The customer is emailed the delivery partner, tracking ID and this link
          so they can track the parcel.
        </p>

        <div className="fulfil-actions">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-small" disabled={isSaving}>
            {isSaving
              ? "Saving…"
              : stage === 0
                ? "Confirm & notify customer"
                : "Save & re-send email"}
          </button>
        </div>
      </form>
    );
  } else if (stage === 0) {
    panel = (
      <div className="fulfil-row">
        <p>
          Pick and pack {itemCount} item{itemCount === 1 ? "" : "s"}, then confirm.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openForm}
          disabled={isSaving}
        >
          Mark as packed
        </button>
      </div>
    );
  } else if (stage === 1) {
    panel = (
      <>
        <div className="fulfil-row">
          <p>
            {status === "OUT_FOR_DELIVERY" ? "Out for delivery" : "Packed and shipped"}
            {order.shippedAt ? ` · ${formatShippedAt(order.shippedAt)}` : ""}
            {!hasTracking && " · no tracking details yet"}
          </p>
          <div className="fulfil-row-actions">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={openForm}
              disabled={isSaving}
            >
              {hasTracking ? "Edit tracking" : "Add tracking"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onMarkDelivered}
              disabled={isSaving}
            >
              Mark as delivered
            </button>
          </div>
        </div>
        {trackingSummary}
      </>
    );
  } else {
    panel = (
      <>
        <div className="fulfil-row">
          <p>✅ Delivered to the customer.</p>
        </div>
        {trackingSummary}
      </>
    );
  }

  return (
    <section className="card admin-section fulfil-card">
      <h4 className="fulfil-title">Fulfilment</h4>
      <ol className="fulfil-steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i < stage ? "done" : i === stage ? "current" : ""}
            aria-current={i === stage ? "step" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>
      <div className="fulfil-panel">{panel}</div>
    </section>
  );
}
