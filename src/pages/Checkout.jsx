import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Checkout.css";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  const [addressErrors, setAddressErrors] = useState({});

  // Fetch cart
  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      setCart(res.data || []);
    } catch (err) {
      setError("Failed to fetch cart");
    } finally {
      setIsLoadingCart(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const res = await API.get("/address");
      setAddresses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedAddressId(res.data[0].id);
      }
    } catch (err) {
      setError("Failed to fetch addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchCart();
    fetchAddresses();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isLoadingCart && cart.length === 0) {
      navigate("/cart");
    }
  }, [isLoadingCart, cart, navigate]);

  // Calculate total
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Validate address form
  const validateAddressForm = () => {
    const errors = {};

    if (!newAddress.name.trim()) errors.name = "Name is required";
    if (!newAddress.phone.trim()) errors.phone = "Phone is required";
    if (!newAddress.street.trim()) errors.street = "Street is required";
    if (!newAddress.city.trim()) errors.city = "City is required";
    if (!newAddress.state.trim()) errors.state = "State is required";
    if (!newAddress.pincode.trim()) errors.pincode = "Pincode is required";
    if (!newAddress.country.trim()) errors.country = "Country is required";

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new address
  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateAddressForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await API.post("/address", newAddress);
      setAddresses([...addresses, res.data]);
      setSelectedAddressId(res.data.id);
      setShowNewAddressForm(false);
      setNewAddress({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add address");
    } finally {
      setIsProcessing(false);
    }
  };

  // Place order
  const placeOrder = async () => {
    setError("");

    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }

    setIsProcessing(true);
    try {
      await API.post("/orders", {
        addressId: selectedAddressId,
      });

      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingCart || isLoadingAddresses) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container checkout-container">
      <h1>Checkout</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-grid">
        {/* Left Column: Order Review */}
        <div className="checkout-left">
          <div className="checkout-section">
            <h2>Order Review</h2>

            {cart.length > 0 ? (
              <>
                <div className="cart-items-review">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item-review">
                      <div className="item-details">
                        <h4>{item.product.name}</h4>
                        <p className="item-description">{item.product.description}</p>
                        <p className="item-quantity">Qty: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        <p className="price-label">₹{item.product.price}</p>
                        <p className="price-subtotal">
                          Total: ₹{item.product.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>Calculated on next page</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </>
            ) : (
              <p>Your cart is empty</p>
            )}
          </div>
        </div>

        {/* Right Column: Delivery Address */}
        <div className="checkout-right">
          <div className="checkout-section">
            <h2>Delivery Address</h2>

            {/* Existing Addresses */}
            {addresses.length > 0 && (
              <div className="addresses-list">
                <h3>Select Address</h3>
                {addresses.map((addr) => (
                  <label key={addr.id} className="address-radio">
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="address-content">
                      <p className="address-name">{addr.name}</p>
                      <p className="address-text">{addr.street}</p>
                      <p className="address-text">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="address-text">{addr.country}</p>
                      <p className="address-phone">Phone: {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {!showNewAddressForm ? (
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewAddressForm(true)}
                style={{ marginTop: "16px", width: "100%" }}
              >
                {addresses.length > 0 ? "Add New Address" : "Add Address"}
              </button>
            ) : (
              <form onSubmit={handleAddNewAddress} className="new-address-form">
                <h3>Add New Address</h3>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newAddress.name}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className={addressErrors.name ? "form-error" : ""}
                    disabled={isProcessing}
                  />
                  {addressErrors.name && (
                    <span className="form-error-message">{addressErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={newAddress.phone}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, phone: e.target.value })
                    }
                    placeholder="+91 9876543210"
                    className={addressErrors.phone ? "form-error" : ""}
                    disabled={isProcessing}
                  />
                  {addressErrors.phone && (
                    <span className="form-error-message">{addressErrors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="street">Street Address</label>
                  <input
                    type="text"
                    id="street"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    placeholder="123 Main Street"
                    className={addressErrors.street ? "form-error" : ""}
                    disabled={isProcessing}
                  />
                  {addressErrors.street && (
                    <span className="form-error-message">{addressErrors.street}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      placeholder="New York"
                      className={addressErrors.city ? "form-error" : ""}
                      disabled={isProcessing}
                    />
                    {addressErrors.city && (
                      <span className="form-error-message">{addressErrors.city}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      placeholder="NY"
                      className={addressErrors.state ? "form-error" : ""}
                      disabled={isProcessing}
                    />
                    {addressErrors.state && (
                      <span className="form-error-message">{addressErrors.state}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pincode">Postal Code</label>
                    <input
                      type="text"
                      id="pincode"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, pincode: e.target.value })
                      }
                      placeholder="10001"
                      className={addressErrors.pincode ? "form-error" : ""}
                      disabled={isProcessing}
                    />
                    {addressErrors.pincode && (
                      <span className="form-error-message">{addressErrors.pincode}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, country: e.target.value })
                      }
                      placeholder="United States"
                      className={addressErrors.country ? "form-error" : ""}
                      disabled={isProcessing}
                    />
                    {addressErrors.country && (
                      <span className="form-error-message">{addressErrors.country}</span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Adding..." : "Add Address"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewAddressForm(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            className="btn btn-primary btn-full checkout-btn"
            disabled={isProcessing || cart.length === 0 || !selectedAddressId}
          >
            {isProcessing ? "Processing..." : `Place Order (₹${total})`}
          </button>
        </div>
      </div>
    </div>
  );
}