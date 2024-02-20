import {
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { registerMiddleware } from "@hicsail/cargo-middleware";
import { getCurrentToken } from "./actions.js";

const client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.MINIO_URL,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  // 'region' needs to exist for the S3 Client to work,
  // but the value does not matter if the S3 service is Minio
  region: "us-east-1",
});
// TODO: Fix middleware 'invalid access key' issue
//registerMiddleware({ cargoEndpoint: process.env.CARGO_ENDPOINT, jwtTokenProvider: getCurrentToken }, client.middlewareStack);

export async function main() {
  // Example of listing buckets
  console.log("Requesting list of buckets - AWS S3 Client");
  const buckets = await client.send(new ListBucketsCommand({}));
  console.log(buckets);

  //// Example of reading a bucket's contents, only possible if the user has
  //// read access on the bucket
  //console.log(`List objects in ${process.env.READ_ACCESS_BUCKET}`);
  //const objects = await client.send(new ListObjectsCommand({ Bucket: process.env.READ_ACCESS_BUCKET }));
  //console.log(objects);

  //// Example of writing a file to a bucket, only possible of the user has
  //// write access on the bucket
  //console.log(`Writing file to ${process.env.WRITE_ACCESS_BUCKET}`);
  //await client.send(new PutObjectCommand({
  //  Bucket: process.env.WRITE_ACCESS_BUCKET,
  //  Key: 'test.txt',
  //  Body: 'Hello World!'
  //}));
}
