"use server";

// The s3 bucket used by this app is structured as follows.
// Each user has his own subdirectory.
//   The user id is used as the name of the user's subdirectory in the bucket.
// Each user's subdirectory has the following folders:
//   - /inputs (images uploaded by the user, on which to run predictions)
//   - /measurementmasks (output masks from the predictions)
//   - /widthinfojsons (output values from the predictions)
// For some input image foo.png, userdir/inputs/foo.png is the original image,
//   userdir/measurementmasks/foo.png is the masked image with measurement overlay,
//   and so on.
// This file structure is intended to mirror the one originally in use in
//   Anqi's code - to the extent which makes sense, while accommodating the fact
//   that at the same time, Anqi's code was written for bulk job runs on a local
//   machine, not for API calls on individual images. (So, for example, where
//   originally each job run produced a CSV with width data, one row per input image,
//   along with a JSON file with individual FP widths, one dict per input
//   image, now for each input image there is a single JSON file combining
//   the data from that image's CSV row and JSON dict; this lives under
//   /widthinfojsons.)
// The intended way for the user to interact with their files from the web
//   client is that they click through a list of their input files, and on
//   clicking each input file, they can access functionality related to that
//   input file (run prediction, view results, download results, etc).
// In other words, the web interface is oriented around individual input
//   images, and not around batch prediction jobs on multiple images.
//   This decision was driven by client input and had to do with, among other
//   things, a desire for simplicity along with a concern over the amount
//   of time needed to run the predictions.

import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/actions.js";
import { removeFilepathPrefix, changeExtension } from "@/app/utils.js";

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

  try {
    const resp = await client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      }),
    );
    return await resp.Body.transformToByteArray();
  } catch (e) {
    if (e instanceof NoSuchKey) {
      return null;
    } else {
      console.log(e);
      // will be indistinguishable from 404 downstream.
      // if need arises, throw e instead and catch in route handlers.
      return null;
    }
  }
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

  const unprefixedFilename = removeFilepathPrefix(formData.get("filename"));
  const inputfilename = `${userdir}/inputs/${unprefixedFilename}`;
  const outmaskfilename = `${userdir}/measurementmasks/${unprefixedFilename}`;
  const widthjsonfilename = `${userdir}/widthinfojsons/${changeExtension(unprefixedFilename, "json")}`;

  // Delete associated output files; terminate early if failure
  for (const k of [outmaskfilename, widthjsonfilename]) {
    try {
      const resp = await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: k,
        }),
      );
      // This will succeed and return 204 even if file was not found, which is good.
    } catch (e) {
      // Whereas this is found but failed to delete - not good.
      console.log(e);
      return {
        message:
          "Failed to delete one or more associated output files: " +
          e +
          "Aborting delete operation.",
      };
    }
  }

  // Then delete original input file
  try {
    const resp = await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: inputfilename,
      }),
    );
  } catch (e) {
    console.log(e);
    return { message: "Failed to delete file: " + e };
  }

  revalidatePath("/");

  return {
    message: "Successfully deleted the file and its associated output files.",
  };
}
