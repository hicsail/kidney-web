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
  DeleteObjectsCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
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
      })
    );
    return await resp.Body.transformToByteArray();
  } catch (e) {
    if (e instanceof NoSuchKey) {
      return null;
    } else {
      console.log(e);
      return null;
    }
  }
}

export async function ListUserDirContents(path = "") {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const userdir = user.id;

  const prefix = `${userdir}/${path}`;

  try {
    const objects = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: prefix,
        Delimiter: "/",
      })
    );

    const contents = objects.Contents || [];
    const commonPrefixes = objects.CommonPrefixes || [];

    if (objects.KeyCount === 0) {
      return [];
    }
    return contents.concat(commonPrefixes);
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function createFolder(folderPath) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please log in" };
  }
  const userdir = user.id;

  const folderKey = `${userdir}/${folderPath}/`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: folderKey,
        Body: "",
      })
    );
    revalidatePath("/");
    return { success: true, message: "Folder created successfully" };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Failed to create folder: " + e.message };
  }
}

export async function deleteFolder(folderPath) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please log in" };
  }
  const userdir = user.id;

  const folderKey = `${userdir}/${folderPath}`;

  try {
    const listObjectsResp = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: folderKey,
      })
    );

    const deleteObjects = listObjectsResp.Contents.map((object) => ({
      Key: object.Key,
    }));

    if (deleteObjects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Delete: { Objects: deleteObjects },
        })
      );
    }

    revalidatePath("/");
    return { success: true, message: "Folder deleted successfully" };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Failed to delete folder: " + e.message };
  }
}

export async function uploadFileFromForm(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please log in" };
  }
  const userdir = user.id;

  const folders = formData.get("folders") || ""; // Get the folders path from the form data
  let attemptCount = 0;
  let successCount = 0;

  for (const f of formData.getAll("file")) {
    try {
      const upload = new Upload({
        client,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${userdir}/inputs/${folders}${f.name}`,
          Body: f.stream(),
        },
      });

      await upload.done();
      successCount += 1;
    } catch (e) {
      console.error("Failed to upload file", f.name, e);
    }

    attemptCount += 1;
  }

  revalidatePath("/");

  return {
    success: successCount === attemptCount,
    message: `${successCount} of ${attemptCount} files successfully uploaded.`,
  };
}


export async function deleteFileFromForm(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please log in" };
  }
  const userdir = user.id;
  
  const folders = formData.get("folders"); // Get the folders path from the form data
  const unprefixedFilename = removeFilepathPrefix(formData.get("filename"));
  
  // Construct the paths to the files in the different directories, including the folders path
  const inputfilename = `${userdir}/inputs/${folders}/${unprefixedFilename}`;
  const outmaskfilename = `${userdir}/measurementmasks/${folders}/${unprefixedFilename}`;
  const widthjsonfilename = `${userdir}/widthinfojsons/${folders}/${changeExtension(unprefixedFilename, "json")}`;
  
  for (const k of [outmaskfilename, widthjsonfilename]) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: k,
        })
      );
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: "Failed to delete one or more associated output files: " + e + " Aborting delete operation.",
      };
    }
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: inputfilename,
      })
    );
  } catch (e) {
    console.log(e);
    return { success: false, message: "Failed to delete file: " + e };
  }

  revalidatePath("/");

  return {
    success: true,
    message: `Successfully deleted ${unprefixedFilename} and its associated output files.`,
  };
}
