These are route handlers to get prediction results (measurement masks, width info jsons) from s3.

These allow users to browse through old prediction results in the client without re-running the predictions.

NB: Using the request object with the GET method opts out of the default route handler caching behavior,
so there is no need to invalidate any cache when the user re-runs a prediction on an existing input image.
