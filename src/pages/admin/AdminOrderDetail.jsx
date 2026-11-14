import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchOrder,
  formatCurrency,
  formatStatus,
  getOrderAmount,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  isPaidOnline as isOrderPaidOnline,
  shipOrder,
  updateOrderStatus,
} from "./adminShared";
import FulfilmentCard from "./FulfilmentCard";
import {
  downloadShippingLabel,
  formatAddressLines,
  getItemImage,
  getItemName,
  hasAddress,
  loadShipFromAddress,
  printShippingLabel,
} from "./orderShared";
import { getApiErrorMessage } from "../../utils/apiError";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // The detail endpoint also refreshes a pending refund's status with
  // Razorpay, so it is fetched fresh every time the page opens.
  const load = useCallback(async () => {
    const data = await fetchOrder(orderId);
    setOrder(data);
  }, [orderId]);

  useEffect(() => {
    setIsLoading(true);
    load()
      .catch((e) =>
        setMessage({
          type: "error",
          text:
            e?.response?.status === 404
              ? `Order #${orderId} was not found.`
              : getApiErrorMessage(e, "Failed to load order"),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [load, orderId]);

  // On failure the order isn't reloaded, so the dropdown keeps showing the
  // old status (e.g. a 502 means the refund failed and nothing changed).
  const changeStatus = async (status, successText) => {
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      await updateOrderStatus(order.id, status);
      await load();
      setMessage({ type: "success", text: successText });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.status === 502
            ? `${getApiErrorMessage(e, "The refund failed.")} The order was not cancelled.`
            : getApiErrorMessage(e, "Failed to update order"),
      });
    } finally {
      setIsSaving(false);
      setShowCancelConfirm(false);
    }
  };

  // Resolves true when saved, so the fulfilment form knows to close.
  const submitShipment = async (details) => {
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      const wasNew = !["SHIPPED", "OUT_FOR_DELIVERY"].includes(
        String(order.status || "").toUpperCase(),
      );
      await shipOrder(order.id, details);
      await load();
      setMessage({
        type: "success",
        text: wasNew
          ? `Order marked as packed and shipped with ${details.courierName}. The customer was emailed the tracking details.`
          : "Tracking details updated. The customer was emailed the new details.",
      });
      return true;
    } catch (e) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(e, "Failed to save the tracking details"),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading order...</p>;

  if (!order) {
    return (
      <div className="admin-stack">
        <Link to="/admin/orders" className="order-detail-back">
          ← All orders
        </Link>
        {message.text && (
          <div className="alert alert-error">{message.text}</div>
        )}
      </div>
    );
  }

  const status = String(order.status || "PENDING").toUpperCase();
  const isCancelled = status === "CANCELLED";
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const subtotal = Number(
    order.subtotalAmount ||
      items.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
  );
  const discount = Number(order.discountAmount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const shipFrom = loadShipFromAddress();
  const isPaidOnline = isOrderPaidOnline(order);
  const paymentStatus = order.paymentStatus || "UNPAID";

  return (
    <div className="admin-stack">
      <Link to="/admin/orders" className="order-detail-back">
        ← All orders
      </Link>

      {/* Header */}
      <section className="card admin-section order-detail-header">
        <div className="order-detail-head-row">
          <div>
            <div className="order-detail-title">
              <h3>Order #{order.id}</h3>
              <span
                className={`admin-status-pill status-${status.toLowerCase()}`}
              >
                {formatStatus(status)}
              </span>
            </div>
            <p className="order-detail-sub">
              Placed {formatDateTime(order.createdAt)} · {itemCount} item
              {itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="order-detail-amount">
            <span>Order total</span>
            <strong>{formatCurrency(getOrderAmount(order))}</strong>
          </div>
        </div>

        <div className="order-detail-toolbar">
          <div className="order-detail-toolbar-group">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => printShippingLabel(order, shipFrom)}
              disabled={!hasAddress(order)}
            >
              🖨 Print label
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => downloadShippingLabel(order, shipFrom)}
              disabled={!hasAddress(order)}
            >
              ⬇ Shipping label
            </button>
          </div>

          <div className="order-detail-toolbar-group">
            {!isCancelled && (
              <button
                type="button"
                className="btn btn-small order-detail-cancel"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isSaving}
              >
                {isPaidOnline ? "Cancel & refund" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </section>

      {message.text && (
        <div
          className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
        >
          {message.text}
        </div>
      )}

      <FulfilmentCard
        key={`${order.id}-${order.trackingId || ""}`}
        order={order}
        status={status}
        itemCount={itemCount}
        isSaving={isSaving}
        onShip={submitShipment}
        onMarkDelivered={() =>
          changeStatus("DELIVERED", "Order marked as delivered.")
        }
      />

      {/* Customer / address / payment */}
      <div className="order-detail-grid">
        <section className="card admin-section order-detail-info">
          <h4 className="order-detail-label">
            <span aria-hidden="true">👤</span> Customer
          </h4>
          <p className="order-detail-strong">{order.user?.name || "—"}</p>
          {order.user?.email && (
            <p className="order-detail-line">
              <span aria-hidden="true">✉️</span>
              <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
            </p>
          )}
          {order.user?.phone && (
            <p className="order-detail-line">
              <span aria-hidden="true">📞</span>
              <a href={`tel:${order.user.phone}`}>{order.user.phone}</a>
            </p>
          )}
        </section>

        <section className="card admin-section order-detail-info">
          <h4 className="order-detail-label">
            <span aria-hidden="true">📍</span> Delivery address
          </h4>
          {hasAddress(order) ? (
            formatAddressLines(order.address).map((line, i) => (
              <p key={i} className={i === 0 ? "order-detail-strong" : ""}>
                {line}
              </p>
            ))
          ) : (
            <p className="order-detail-warn">⚠️ No address on file</p>
          )}
        </section>

        <section className="card admin-section order-detail-info">
          <h4 className="order-detail-label">
            <span aria-hidden="true">💳</span> Payment
          </h4>
          <dl className="order-detail-kv">
            <div>
              <dt>Method</dt>
              <dd>{getPaymentMethodLabel(order)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span
                  className={`payment-pill payment-${paymentStatus.toLowerCase()}`}
                >
                  {getPaymentStatusLabel(order)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatCurrency(getOrderAmount(order))}</dd>
            </div>
            {order.couponCode && (
              <div>
                <dt>Coupon</dt>
                <dd>{order.couponCode}</dd>
              </div>
            )}
            {order.razorpayPaymentId && (
              <div>
                <dt>Payment ID</dt>
                <dd className="order-detail-mono">{order.razorpayPaymentId}</dd>
              </div>
            )}
            {["REFUND_PENDING", "REFUNDED", "REFUND_FAILED"].includes(
              paymentStatus,
            ) && (
              <div>
                <dt>
                  {paymentStatus === "REFUNDED"
                    ? "Refunded"
                    : paymentStatus === "REFUND_PENDING"
                      ? "Refund initiated"
                      : "Refund attempted"}
                </dt>
                <dd>
                  {formatCurrency(order.refundAmount ?? getOrderAmount(order))}
                  {order.refundedAt && (
                    <small>{formatDateTime(order.refundedAt)}</small>
                  )}
                </dd>
              </div>
            )}
            {order.refundId && (
              <div>
                <dt>Refund ID</dt>
                <dd className="order-detail-mono">{order.refundId}</dd>
              </div>
            )}
          </dl>
          {paymentStatus === "REFUND_PENDING" && (
            <p className="order-detail-hint">
              Razorpay is processing the refund; it usually reaches the
              customer in 5–7 working days. Reload this page to check for
              updates.
            </p>
          )}
          {paymentStatus === "REFUND_FAILED" && (
            <p className="order-detail-warn">
              ⚠️ Razorpay couldn&apos;t complete this refund. Check the payment
              in the Razorpay dashboard and contact the customer.
            </p>
          )}
        </section>
      </div>


      {/* Items */}
      <section className="card admin-section">
        <h4 className="order-detail-label">Items</h4>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-row">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const img = getItemImage(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="order-detail-product">
                          {img ? (
                            <img src={img} alt="" width="48" height="48" />
                          ) : (
                            <span className="order-detail-noimg">🌿</span>
                          )}
                          {item.product ? (
                            <Link
                              to={`/products/${item.productId}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {getItemName(item)}
                            </Link>
                          ) : (
                            <span>{getItemName(item)}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>× {item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(
                          Number(item.price || 0) * Number(item.quantity || 0),
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <dl className="order-detail-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          {deliveryFee > 0 && (
            <div>
              <dt>Delivery</dt>
              <dd>{formatCurrency(deliveryFee)}</dd>
            </div>
          )}
          {discount > 0 && (
            <div>
              <dt>
                Discount{order.couponCode ? ` (${order.couponCode})` : ""}
              </dt>
              <dd>− {formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="order-detail-grand">
            <dt>Total</dt>
            <dd>{formatCurrency(getOrderAmount(order))}</dd>
          </div>
        </dl>
      </section>

      {showCancelConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !isSaving && setShowCancelConfirm(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel order #{order.id}?</h3>
            {isPaidOnline ? (
              <p>
                This will refund{" "}
                <strong>{formatCurrency(getOrderAmount(order))}</strong> to the
                customer via Razorpay. Continue? If the refund fails, the order
                is not cancelled.
              </p>
            ) : (
              <p>
                The items go back into stock and the customer is notified that
                the order was cancelled.
                {order.paymentMethod === "COD" &&
                  " No refund is needed for Cash on Delivery."}
              </p>
            )}
            <div className="admin-form-actions">
              <button
                className="btn order-detail-cancel-solid"
                onClick={() =>
                  changeStatus(
                    "CANCELLED",
                    isPaidOnline
                      ? "Order cancelled and refund initiated through Razorpay. Stock was restored and the customer was notified."
                      : "Order cancelled. Stock was restored and the customer was notified.",
                  )
                }
                disabled={isSaving}
              >
                {isSaving
                  ? isPaidOnline
                    ? "Refunding…"
                    : "Saving…"
                  : isPaidOnline
                    ? "Yes, cancel & refund"
                    : "Yes, cancel order"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isSaving}
              >
                Keep as is
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
