import { useAuth } from "../utils/useAuth";

export default function Wishlist() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Wishlist</h1>
        <div className="alert alert-info">
          Please log in to view your wishlist.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>My Wishlist</h1>
      <p>Your wishlist is empty</p>
    </div>
  );
}
