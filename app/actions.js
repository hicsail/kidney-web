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

export async function getCurrentToken() {
  const sessionCookie = cookies().get("session");
  if (sessionCookie === undefined) {
    return null;
  }
  return sessionCookie.value;
}

export async function getCurrentUser() {
  const sessionCookie = cookies().get("session");
  if (sessionCookie === undefined) {
    return null;
  }
  // Using token, query auth service for user details.
  // Note: Pass token to auth service w/o validating it; auth service should validate.
  // Note: Auth service does not have a working "me" REST endpoint. So: use /graphql
  const meResponse = await fetch(process.env.AUTH_BACKEND_URL + "/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sessionCookie.value,
    },
    body: JSON.stringify({
      query: "{me {id projectId username fullname email role}}",
    }),
  });
  const result = await meResponse.json();

  // This app only sets the session cookie if it passes validation,
  // and if the cookie is valid, then auth service should not error.
  // So this should not happen:
  if (result.data === null) {
    console.log(
      `Session cookie was present and probably valid, but auth service 'me' query returned: ${result.errors[0].message}`,
    );
  }
  // At any rate, return null if auth service returns null.
  return result.data?.me;
}
