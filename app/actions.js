export async function getPublicKey() {
  // Response is cached by default.

  // TODO: make auth url configurable
  const response = await fetch('https://test-auth-service.sail.codes/graphql', {
  	method: "POST",
  	headers: {
  		"Content-Type": "application/json",
  	},
  	body: JSON.stringify({"query":"{publicKey}"}),
  });
  const result = await response.json();

  return result.data.publicKey[0]
}
