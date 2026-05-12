import { useAuth } from "../utils/useAuth";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Profile</h1>
        <div className="alert alert-info">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>My Profile</h1>
        <div style={{ marginTop: "24px" }}>
          <div className="form-group">
            <label>Name</label>
            <p className="text-lg font-bold">{user?.name}</p>
          </div>
          <div className="form-group">
            <label>Email</label>
            <p className="text-lg font-bold">{user?.email}</p>
          </div>
          <div className="form-group">
            <label>Role</label>
            <p className="text-lg font-bold">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
