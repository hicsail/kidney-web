import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPublicKey } from '../../actions.js'

var jwt = require("jsonwebtoken")


// Get token from query parameters, validate token, set cookie, redirect.
export async function GET(request) {

	// Get token from query parameters
	const token = request.nextUrl.searchParams.get('token')

	// Get auth provider's public key for validation
	try {
	  const publickey = await getPublicKey()

	  // Validate token
      try {
        var _ = jwt.verify(token,publickey);
      } catch(err) {
	    return new Response("Token is missing or is not valid: " + err, {
		  status: 401,
	    })
      }

	} catch (err) {
	  return new Response("Could not fetch auth provider public keys: " + err, {
		  status: 500,
	  })
	}

    // JWT is valid; set cookie
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    })

    // Redirect to home
	redirect('/')
}
