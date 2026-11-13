import { useEffect, useState } from "react";
import { MAX_DELIVERY_FEE, deliveryChargeText, formatDeliveryFee } from "../../constants/delivery";
import { setCachedDeliveryFee } from "../../utils/useDeliveryFee";
import { getApiErrorMessage } from "../../utils/apiError";
import { fetchDeliveryFee, saveDeliveryFee } from "./adminShared";

// Admin → Delivery Fee: the flat charge added to every order (0 = free delivery).
// The backend charges whatever is saved here; the cart, checkout, FAQ and
// shipping policy pages all display it.
export default function AdminDeliveryFee() {
  const [savedFee, setSavedFee] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    fetchDeliveryFee()
      .then(fee => {
        if (!active) return;
        setSavedFee(fee);
        setInput(String(fee));
      })
      .catch(err => {
        if (active) {
          setMessage({ type: "error", text: getApiErrorMessage(err, "Couldn't load the delivery fee") });
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const parsed = input.trim() === "" ? NaN : Number(input);
  const isValid = Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_DELIVERY_FEE;
  const isDirty = isValid && parsed !== savedFee;

  const handleSave = async e => {
    e.preventDefault();
    if (!isValid) {
      setMessage({ type: "error", text: `Enter an amount from ₹0 to ₹${MAX_DELIVERY_FEE}.` });
      return;
    }
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const fee = await saveDeliveryFee(parsed);
      setSavedFee(fee);
      setInput(String(fee));
      setCachedDeliveryFee(fee);
      setMessage({
        type: "success",
        text:
          fee > 0
            ? `Saved. Customers now pay ₹${fee} delivery on every order.`
            : "Saved. Delivery is now free on every order."
      });
    } catch (err) {
      setMessage({ type: "error", text: getApiErrorMessage(err, "Couldn't save the delivery fee") });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-stack">
      <section className="card admin-section">
        <h3>Delivery Fee</h3>
        <p style={{ marginBottom: 16, color: "var(--color-text-muted, #5a7a5a)" }}>
          A flat charge added to every order. Set it to <strong>0</strong> for free delivery.
          Changes apply to new orders straight away; orders already placed keep the fee they
          were charged.
        </p>

        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        <form className="admin-form-grid" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="delivery-fee">Delivery fee (₹)</label>
            <input
              id="delivery-fee"
              type="number"
              inputMode="decimal"
              min="0"
              max={MAX_DELIVERY_FEE}
              step="any"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. 49"
            />
          </div>

          <div className="form-group">
            <label>Current fee</label>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, paddingTop: 6 }}>
              {savedFee === null ? "—" : formatDeliveryFee(savedFee)}
            </div>
          </div>

          <div className="admin-form-full">
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              <strong>Customers will see:</strong>{" "}
              {isValid ? (
                <>
                  Delivery <strong>{formatDeliveryFee(parsed)}</strong> in the cart and checkout ·
                  “{deliveryChargeText(parsed)}” on the FAQ and Shipping Policy
                </>
              ) : (
                `Enter an amount from ₹0 to ₹${MAX_DELIVERY_FEE}.`
              )}
            </div>
          </div>

          <div className="admin-form-actions admin-form-full">
            <button className="btn btn-primary" type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? "Saving…" : "Save delivery fee"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setInput(String(savedFee ?? ""));
                setMessage({ type: "", text: "" });
              }}
              disabled={isSaving || !isDirty}
            >
              Discard changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
