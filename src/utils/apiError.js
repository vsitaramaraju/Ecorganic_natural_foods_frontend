/**
 * Turns an axios (or fetch-wrapper) error into a message for the user.
 * The API sends { message } for most errors, but the auth middleware sends
 * { error } with a 401, so both keys are checked.
 */
export function getApiErrorMessage(
  err,
  fallback = "Something went wrong. Please try again."
) {
  const data = err?.response?.data ?? err?.data;
  const serverMessage = data?.message || data?.error;
  if (serverMessage) return serverMessage;

  // axios: a request that never got a response (offline, DNS, CORS, timeout).
  if (err?.isAxiosError && !err.response) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  // A plain Error we threw ourselves; axios' own "Request failed with status
  // code 500" style messages aren't useful to customers.
  if (err?.message && !err?.isAxiosError) return err.message;
  return fallback;
}
