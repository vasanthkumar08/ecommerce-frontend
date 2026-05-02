export const normalizeProduct = (product) => {
  if (!product) return null;

  return {
    ...product,
    _id: product._id || product.id,
    name: product.name || "Unavailable product",
    image: product.image || product.images?.[0]?.url || "",
    price: Number(product.price || 0),
  };
};

export const getProductList = (data) => {
  const result = data?.getProducts;

  if (Array.isArray(result)) return result.map(normalizeProduct).filter(Boolean);
  if (Array.isArray(result?.items)) return result.items.map(normalizeProduct).filter(Boolean);

  return [];
};

export const hydrateProduct = (product, catalogProducts = []) => {
  const normalized = normalizeProduct(product);
  if (!normalized) return null;

  const catalogProduct = catalogProducts.find(
    (item) => item?._id === normalized._id || item?.id === normalized._id
  );

  return normalizeProduct({ ...normalized, ...catalogProduct });
};

export const hydrateProducts = (products = [], catalogProducts = []) =>
  products
    .map((product) => hydrateProduct(product, catalogProducts))
    .filter((product) => product?._id);

export const hydrateCartItems = (items = [], catalogProducts = []) =>
  items.map((item) => ({
    ...item,
    product: hydrateProduct(item.product, catalogProducts),
  })).filter((item) => item.product?._id);

export const normalizeCart = (payload) => {
  const cart = payload?.data || payload || {};
  const items = Array.isArray(cart.items) ? cart.items : [];

  return items
    .map((item) => {
      const product = normalizeProduct(item.product || item);
      if (!product?._id) return null;

      return {
        ...item,
        _id: item._id || item.id,
        id: item.id || item._id,
        product,
        quantity: Number(item.quantity || 1),
      };
    })
    .filter(Boolean);
};

export const normalizeWishlist = (payload) => {
  const wishlist = payload?.data || payload || {};
  const rawItems = wishlist.items || wishlist.products || [];

  return rawItems
    .map((item) => normalizeProduct(item.product || item))
    .filter((product) => product?._id);
};
