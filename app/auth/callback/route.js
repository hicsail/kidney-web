import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { validateAuthToken } from "../../actions.js";

// Get token from query parameters, validate token, set cookie, redirect.
export async function GET(request) {
  // Get token from query parameters
  const token = request.nextUrl.searchParams.get("token");

  // Validate token
  try {
    await validateAuthToken(token);
  } catch (err) {
    return new Response(err, { status: err.httpcode });
  }

  // JWT is valid; set cookie
  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 18, // SAIL auth issues tokens for 18 hours
    path: "/",
  });

  // Redirect to home
  redirect("/");
}
