import { GetUserObject } from "@/app/s3.js";
import { getCurrentUser } from "@/app/actions.js";

/*
 * This is a route handler to get prediction mask images from s3.
 * The reason that this (1) is a route handler and (2) is a separate step from running the predictions
 *   is so that users can browse through old prediction results (1) in the client (2) without re-running the predictions.
 * The route is /predictionimages/masks/[imgfilename] (and not just /masks) so that in future if
 *   the prediction returns more images, the route handlers can all be under /predictionimages.
 */

// NB: Using the request object with the GET method opts out of the default route handler caching behavior,
// so there is no need to invalidate any cache when the user re-runs a prediction on an existing image.
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Please log in", { status: 403 });
  }
  const userdir = user.id;
  const bytes = await GetUserObject(
    `${userdir}/measurementmasks/${params.filename}`,
  );
  return new Response(bytes);
}
