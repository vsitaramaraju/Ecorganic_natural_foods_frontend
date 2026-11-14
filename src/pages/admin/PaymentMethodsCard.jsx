import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../utils/apiError";
import { fetchPaymentSettings, savePaymentSettings } from "./adminShared";

// Admin → Delivery & Payments: switch Cash on Delivery on or off at checkout.
// Online payment (Razorpay) is always offered when it's configured, and COD
// can't be turned off without it, so customers always have a way to pay.
export default function PaymentMethodsCard() {
  const [settings, setSettings] = useState(null); // { codEnabled, razorpayEnabled }
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    fetchPaymentSettings()
      .then(data => active && setSettings(data))
      .catch(err => {
        if (active) {
          setMessage({
            type: "error",
            text: getApiErrorMessage(err, "Couldn't load the payment settings")
          });
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const toggleCod = async () => {
    const next = !settings.codEnabled;
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const saved = await savePaymentSettings(next);
      setSettings({ codEnabled: saved.codEnabled, razorpayEnabled: saved.razorpayEnabled });
      setMessage({
        type: "success",
        text: saved.codEnabled
          ? "Cash on Delivery is on. Customers can choose it or pay online."
          : "Cash on Delivery is off. Customers can only pay online (Razorpay)."
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(err, "Couldn't save the payment settings")
      });
    } finally {
      setIsSaving(false);
    }
  };

  const codEnabled = Boolean(settings?.codEnabled);
  const razorpayEnabled = Boolean(settings?.razorpayEnabled);
  // Turning COD off needs online payment as the fallback.
  const lockedOn = codEnabled && !razorpayEnabled;

  return (
    <section className="card admin-section payment-settings">
      <h3>Payment methods</h3>
      <p className="payment-settings-intro">
        Choose what customers can pay with at checkout. Changes apply straight away.
      </p>

      {message.text && (
        <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <p className="payment-settings-intro">Loading…</p>
      ) : settings ? (
        <ul className="payment-settings-list">
          <li>
            <div>
              <strong>💳 Pay online (Razorpay)</strong>
              <span>
                {razorpayEnabled
                  ? "UPI, cards, net banking and wallets. Always offered."
                  : "Not set up. Add the Razorpay keys to the backend to accept online payments."}
              </span>
            </div>
            <span className={`payment-settings-badge ${razorpayEnabled ? "on" : "off"}`}>
              {razorpayEnabled ? "Active" : "Not set up"}
            </span>
          </li>
          <li>
            <div>
              <strong id="cod-toggle-label">💵 Cash on Delivery</strong>
              <span>
                {lockedOn
                  ? "Can't be turned off until online payment is set up, or customers would have no way to pay."
                  : codEnabled
                    ? "Shown at checkout. Customers pay when the order arrives."
                    : "Hidden at checkout. Customers can only pay online."}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={codEnabled}
              aria-labelledby="cod-toggle-label"
              className={`switch ${codEnabled ? "on" : ""}`}
              onClick={toggleCod}
              disabled={isSaving || lockedOn}
            >
              <span className="switch-knob" />
            </button>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
