export async function getPublicKey() {
  // Response is cached by default.
  const response = await fetch(process.env.AUTH_PUBLICKEYS_URL);
  const result = await response.json();
  return result[0]
}
