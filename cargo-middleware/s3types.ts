import { ServiceInputTypes, ServiceOutputTypes } from "@aws-sdk/client-s3";
import { MiddlewareType, MiddlewareStack } from "@aws-sdk/types";

// These types are extracted from the AWS S3 SDK and are used to scope the
// middleware stack to the S3 client
export declare type S3MiddlewareType = MiddlewareType<
  ServiceInputTypes,
  ServiceOutputTypes
>;
export declare type S3MiddlewareStack = MiddlewareStack<
  ServiceInputTypes,
  ServiceOutputTypes
>;
