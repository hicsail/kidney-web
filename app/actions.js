import { cookies } from "next/headers";
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

export async function getCurrentUser() {
	const sessionCookie = cookies().get("session");
	if (sessionCookie === undefined) {
		return null;
	}
	// One hopes the auth service validates the token when you make the "me" query, so probably don't need this line
	//const tokendata = await validateAuthToken(sessionCookie.value);

	// Using token, query auth service for user details.
	// Awaiting response re: existence of "me" REST endpoint.
	// Meanwhile, presumably have to query the auth "backend" using /graphql. Absurd!
	// (The "frontend" now no longer exposes /graphql.)
	// Maybe soon they will stick all the user data into the JWT; who knows.
	const meResponse = await fetch(process.env.AUTH_BACKEND_URL + "/graphql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + sessionCookie.value,
		},
		body: JSON.stringify({ query: "{me {email fullname username}}" }),
	});
	const result = await meResponse.json();
	return result.data.me;
}
