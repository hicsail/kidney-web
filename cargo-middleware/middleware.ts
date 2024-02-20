import { awsAuthMiddlewareOptions } from "@aws-sdk/middleware-signing";
import { S3MiddlewareType, S3MiddlewareStack } from "./s3types";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  gql,
  NormalizedCacheObject,
} from "@apollo/client/core";
import fetch from "cross-fetch";
import { setContext } from "@apollo/client/link/context";

/** Used to setup the Cargo Middleware */
export interface CargoMiddlewareConfig {
  /** The Cargo Server to sign against */
  cargoEndpoint: string;
  /** Function that produces the JWT token */
  jwtTokenProvider: () => Promise<string>;
}

const getApolloClient: (
  config: CargoMiddlewareConfig
) => ApolloClient<NormalizedCacheObject> = (config) => {
  const httpLink = new HttpLink({
    uri: config.cargoEndpoint,
    fetch,
  });

  // Auth link allows grabbing the JWT from the provider. Since this is called
  // on every request, the JWT can be refreshed as needed.
  const authLink = setContext(async (_, { headers }) => {
    // Get the token from the provider
    const token = await config.jwtTokenProvider();

    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
};

/** Make the middleware based on the provided configuration */
const makeMiddleware: (config: CargoMiddlewareConfig) => S3MiddlewareType = (
  config
) => {
  const apolloClient = getApolloClient(config);

  return (next: any) => async (args: any) => {
    const query = gql`
      query cargoSignRequest($request: CargoResourceRequest!) {
        cargoSignRequest(request: $request) {
          signature
          bodyHash
          timestamp
        }
      }
    `;

    const response = await apolloClient.query({
      query,
      variables: { request: args.request },
    });
    const { signature, bodyHash, timestamp } = response.data.cargoSignRequest;
    args.request["headers"]["authorization"] = signature;
    args.request["headers"]["x-amz-content-sha256"] = bodyHash;
    args.request["headers"]["x-amz-date"] = timestamp;

    // Do something with the args
    return next(args);
  };
};

/**
 * Adds the Cargo Middleware to the given middleware stack after the
 * AWS signing middleware
 */
export const registerMiddleware = (
  config: CargoMiddlewareConfig,
  middlewareStack: S3MiddlewareStack
): void => {
  middlewareStack.addRelativeTo(makeMiddleware(config), {
    relation: "after",
    toMiddleware: awsAuthMiddlewareOptions.name,
  });
};
