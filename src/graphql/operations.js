import { gql } from "@apollo/client";

export const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    _id
    id
    name
    price
    description
    category
    countInStock
    image
  }
`;

export const GET_PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query GetProducts {
    getProducts {
      items {
        ...ProductFields
      }
      total
      hasMore
    }
  }
`;

export const GET_CART = gql`
  query GetCart {
    getCart {
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
`;

export const GET_WISHLIST = gql`
  query GetWishlist {
    getWishlist {
      id
      items {
        product {
          _id
          price
          image
          category
          countInStock
        }
        addedAt
      }
    }
  }
`;

export const GET_ORDERS = gql`
  query GetOrders {
    getOrders {
      _id
      status
      totalAmount
      totalPrice
      createdAt
      items {
        name
        quantity
        price
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      accessToken
      refreshToken
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      accessToken
      refreshToken
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($input: CartItemInput!) {
    addToCart(input: $input) {
      id
      items {
        quantity
        product {
          _id
          name
          price
          image
        }
      }
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartItemId: ID!) {
    removeFromCart(input: { cartItemId: $cartItemId }) {
      id
      items {
        id
        _id
        quantity
        product {
          _id
          name
          price
          image
        }
      }
    }
  }
`;

export const UPDATE_CART_QUANTITY = gql`
  mutation UpdateCartQuantity($input: UpdateCartQuantityInput!) {
    updateCartQuantity(input: $input) {
      id
      items {
        quantity
        product {
          _id
          name
          price
          image
        }
      }
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      _id
      status
      totalAmount
      createdAt
    }
  }
`;

export const ADD_TO_WISHLIST = gql`
  mutation AddToWishlist($productId: ID!) {
    addToWishlist(productId: $productId) {
      id
      items {
        product {
          _id
        }
      }
    }
  }
`;

export const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveFromWishlist($productId: ID!) {
    removeFromWishlist(productId: $productId) {
      id
      items {
        product {
          _id
        }
      }
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id) {
      _id
      status
      totalAmount
      createdAt
    }
  }
`;
