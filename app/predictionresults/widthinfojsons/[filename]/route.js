import { GetUserObject } from "@/app/s3.js";
import { getCurrentUser } from "@/app/actions.js";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Please log in", { status: 403 });
  }
  const userdir = user.id;
  const bytes = await GetUserObject(
    `${userdir}/widthinfojsons/${params.filename}`,
  );
  return new Response(bytes);
}
