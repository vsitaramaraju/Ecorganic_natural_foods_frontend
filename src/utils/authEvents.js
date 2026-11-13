// Lets the API clients (axios + fetch) tell AuthContext that the server rejected
// the saved login token, without importing React context into plain modules.
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

// Call when a request that carried a token got a 401 back.
export const notifySessionExpired = () => {
  if (!localStorage.getItem("token")) return; // already logged out
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
