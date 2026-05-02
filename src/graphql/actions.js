import { gql } from "@apollo/client";
import { apolloClient } from "../graphql/client";
import { GET_CART, GET_ORDERS, GET_WISHLIST } from "../graphql/operations";

const quoted = (value) => JSON.stringify(String(value || ""));
const number = (value, fallback = 0) => Number(value || fallback);

export const addToCartAction = (productId, quantity = 1) =>
  apolloClient.mutate({
    mutation: gql`
      mutation AddToCartInline {
        addToCart(input: { product: ${quoted(productId)}, quantity: ${number(quantity, 1)} }) {
          id
          items {
            quantity
            product {
              _id
              price
              image
            }
          }
        }
      }
    `,
    refetchQueries: [{ query: GET_CART }],
  });

export const updateCartQuantityAction = (productId, quantity) =>
  apolloClient.mutate({
    mutation: gql`
      mutation UpdateCartQuantityInline {
        updateCartQuantity(input: { product: ${quoted(productId)}, quantity: ${number(quantity, 1)} }) {
          id
          items {
            quantity
            product {
              _id
              price
              image
            }
          }
        }
      }
    `,
    refetchQueries: [{ query: GET_CART }],
  });

export const removeFromCartAction = (cartItemId) =>
  apolloClient.mutate({
    mutation: gql`
      mutation RemoveFromCartInline {
        removeFromCart(input: { cartItemId: ${quoted(cartItemId)} }) {
          id
          items {
            id
            _id
            quantity
            product {
              _id
              price
              image
            }
          }
        }
      }
    `,
    refetchQueries: [{ query: GET_CART }],
  });

export const addToWishlistAction = (productId) =>
  apolloClient.mutate({
    mutation: gql`
      mutation AddToWishlistInline {
        addToWishlist(productId: ${quoted(productId)}) {
          id
          items {
            product {
              _id
            }
          }
        }
      }
    `,
    refetchQueries: [{ query: GET_WISHLIST }],
  });

export const removeFromWishlistAction = (productId) =>
  apolloClient.mutate({
    mutation: gql`
      mutation RemoveFromWishlistInline {
        removeFromWishlist(productId: ${quoted(productId)}) {
          id
          items {
            product {
              _id
            }
          }
        }
      }
    `,
    refetchQueries: [{ query: GET_WISHLIST }],
  });

export const placeOrderAction = (items, total) => {
  const orderItems = items
    .map((item) => `{ product: ${quoted(item.product?._id)}, quantity: ${number(item.quantity, 1)} }`)
    .join(", ");

  return apolloClient.mutate({
    mutation: gql`
      mutation PlaceOrderInline {
        placeOrder(input: { total: ${number(total)}, items: [${orderItems}] }) {
          _id
          status
          totalAmount
          createdAt
        }
      }
    `,
    refetchQueries: [{ query: GET_CART }, { query: GET_ORDERS }],
  });
};
