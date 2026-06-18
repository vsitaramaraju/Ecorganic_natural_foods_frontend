import { useState, useEffect } from "react";
import { addressAPI } from "../api/api";
import { useAuth } from "../utils/useAuth";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const data = await addressAPI.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch addresses");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Addresses</h1>
        <div className="alert alert-info">
          Please log in to view your addresses.
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div>
        <p>Loading addresses...</p>
      </div>
    );
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="container">
      <h1 style={{ color: "black" }}>My Addresses</h1>
      {addresses && addresses.length > 0 ? (
        <div className="grid">
          {addresses.map(address => (
            <div key={address.id} className="card">
              <h3>{address.name}</h3>
              <p>{address.street}</p>
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
              <p>{address.country}</p>
              <p>Phone: {address.phone}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No addresses saved yet</p>
      )}
      <button className="btn btn-primary" style={{ marginTop: "24px" }}>
        Add New Address
      </button>
    </div>
  );
}
