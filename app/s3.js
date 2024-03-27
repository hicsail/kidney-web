"use server";

// The s3 bucket used by this app is structured as follows.
// Each user has his own subdirectory.
//   The user id is used as the name of the user's subdirectory in the bucket.
// Each user's subdirectory has the following folders:
//   - /inputs (images uploaded by the user, on which to run predictions)
//   - /measurementmasks (output masks from the predictions)
//   - /???
// For some input image foo.png, userdir/inputs/foo.png is the original image,
//   userdir/measurementmasks/foo.png is the masked image with measurement overlay,
//   and so on.

import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/actions.js";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
});

export async function GetUserObject(key) {
  const user = await getCurrentUser();
  if (!user || !key.startsWith(user.id)) {
    console.log("Fishy activity detected");
    return { message: 400 };
  }

  const resp = await client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
  const bytes = await resp.Body.transformToByteArray();
  return bytes;
}

export async function ListUserDirContents() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const userdir = user.id;

  const objects = await client.send(
    new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: userdir + "/inputs",
    }),
  );
  if (objects.KeyCount == 0) {
    return [];
  }
  return objects.Contents;
}

// this server action is passed to useFormState and turns into a formAction
export async function uploadFileFromForm(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    console.log("Fishy activity detected");
    return { message: 400 };
  }
  const userdir = user.id;

  // NB: At least on S3, you don't need to create folders; folders are just bits of filepaths;
  // just create the file, and intermediate directories will get created.

  let attemptCount = 0;
  let successCount = 0;
  // Text, image, zip archive OK; directories not OK.
  for (const f of formData.getAll("file")) {
    const resp = await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${userdir}/inputs/${f["name"]}`,
        Body: await f.arrayBuffer(),
      }),
    );
    attemptCount += 1;
    if (resp.$metadata.httpStatusCode == "200") {
      successCount += 1;
    }
  }
  revalidatePath("/");

  return {
    message: `${successCount} of ${attemptCount} files successfully uploaded.`,
  };
}

// this server action is passed to useFormState and turns into a formAction
export async function deleteFileFromForm(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    console.log("Fishy activity detected");
    return { message: 400 };
  }
  const userdir = user.id;

  // Check for bad behavior. NB: Putting ".." in filepath does not work either
  if (!formData.get("filename").startsWith(userdir)) {
    console.log("Fishy activity detected");
    return { message: 400 };
  }
  const resp = await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      // No userdir prefix here; the userdir is already passed in from the form
      Key: `${formData.get("filename")}`,
    }),
  );
  revalidatePath("/");

  return { message: `${resp.$metadata.httpStatusCode}` };
}
