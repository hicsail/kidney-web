var jwt = require("jsonwebtoken");

export async function getPublicKey() {
	// Response is cached by default.
	const response = await fetch(process.env.AUTH_PUBLICKEYS_URL);
	const result = await response.json();
	return result[0];
}

export async function validateAuthToken(token) {
	// Get auth provider's public key for validation
	try {
		var publickey = await getPublicKey();
	} catch (err) {
		const e = new Error("Could not fetch auth provider public keys", {
			cause: err,
		});
		e.httpcode = 500;
		throw e;
	}

	// Validate token
	try {
		var data = jwt.verify(token, publickey);
	} catch (err) {
		const e = new Error("Token is missing or is not valid", { cause: err });
		e.httpcode = 401;
		throw e;
	}

	return data;
}
