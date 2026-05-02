import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { GRAPHQL_URL } from "../config/env";
import { getAuthToken } from "../utils/storage";

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

const authLink = new ApolloLink((operation, forward) => {
  const token = getAuthToken();

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));

  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Product: { keyFields: ["_id"] },
      Order: { keyFields: ["_id"] },
    },
  }),
});
