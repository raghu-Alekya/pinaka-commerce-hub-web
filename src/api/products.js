import { getAccessToken } from "../auth/tokenStore";

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "/connector/api/v1";

// =========================================================
// COMMON API REQUEST
// =========================================================

async function request(
    path,
    {
        token,
        ...options
    } = {}
) {
    const accessToken =
        token ?? getAccessToken();

    const response = await fetch(
        `${BASE_URL}${path}`,
        {
            ...options,

            credentials: "omit",

            headers: {
                Accept: "application/json",

                ...(options.body
                    ? {
                          "Content-Type":
                              "application/json",
                      }
                    : {}),

                ...(accessToken
                    ? {
                          Authorization: `Bearer ${accessToken}`,
                      }
                    : {}),

                ...(options.headers || {}),
            },
        }
    );

    const raw =
        await response.text();

    let data = null;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(
                `API returned a non-JSON response (${response.status}).`
            );
        }
    }

    if (
        !response.ok ||
        data?.success === false
    ) {
        throw new Error(
            data?.message ??
                data?.error ??
                `Request failed (${response.status}).`
        );
    }

    return data;
}

// =========================================================
// STORE CATALOG PATH
// =========================================================

const storeCatalogPath = (
    storeId
) =>
    `/stores/${encodeURIComponent(
        storeId
    )}/catalog`;

// =========================================================
// PRODUCTS API
// =========================================================

export const productsApi = {
    // -----------------------------------------------------
    // GET STORE CATALOG
    // -----------------------------------------------------

    getCatalog: (
        storeId,
        token
    ) => {
        if (!storeId) {
            throw new Error(
                "Store ID is required to load products."
            );
        }

        return request(
            storeCatalogPath(storeId),
            {
                token,
                method: "GET",
            }
        );
    },
};

// =========================================================
// EXTRACT PRODUCTS
// =========================================================

export function extractProducts(
    response
) {
    const products =
        response?.products ??
        response?.data?.products ??
        response?.data?.items ??
        response?.items ??
        [];

    return Array.isArray(products)
        ? products
        : [];
}

// =========================================================
// EXTRACT CATEGORIES
// =========================================================

export function extractCategories(
    response
) {
    const categories =
        response?.categories ??
        response?.data?.categories ??
        [];

    return Array.isArray(categories)
        ? categories
        : [];
}

// =========================================================
// NORMALIZE PRODUCT
// =========================================================

export function normalizeProduct(
    product = {},
    categories = []
) {
    const category =
        categories.find(
            (item) =>
                item?.id ===
                product?.categoryId
        );

    const rawPayload =
        product?.payload &&
        typeof product.payload ===
            "object"
            ? product.payload
            : {};

    // -----------------------------------------------------
    // BASIC PRODUCT DATA
    // -----------------------------------------------------

    const name =
        product?.name ??
        rawPayload?.name ??
        "";

    const price =
        product?.price ??
        rawPayload?.price ??
        "";

    const image =
        product?.image ??
        rawPayload?.image ??
        "";

    // -----------------------------------------------------
    // TAGS
    // -----------------------------------------------------

    const rawTags = Array.isArray(
        product?.tags
    )
        ? product.tags
        : Array.isArray(
              rawPayload?.tags
          )
        ? rawPayload.tags
        : [];

    const tags = rawTags
        .map((tag) => {
            if (
                typeof tag ===
                "string"
            ) {
                return tag;
            }

            if (
                tag &&
                typeof tag ===
                    "object"
            ) {
                return (
                    tag.name ??
                    tag.slug ??
                    ""
                );
            }

            return "";
        })
        .filter(Boolean);

    // -----------------------------------------------------
    // STOCK QUANTITY
    // -----------------------------------------------------

    const quantity =
        product?.quantity ??
        product?.stockQuantity ??
        product?.stock_quantity ??
        rawPayload?.quantity ??
        rawPayload?.stockQuantity ??
        rawPayload?.stock_quantity;

    // -----------------------------------------------------
    // STOCK STATUS
    // -----------------------------------------------------

    const stockStatus =
        product?.stockStatus ??
        product?.stock_status ??
        rawPayload?.stockStatus ??
        rawPayload?.stock_status ??
        "";

    // -----------------------------------------------------
    // PRODUCT TYPE
    // -----------------------------------------------------

    const type =
        product?.type ??
        product?.productType ??
        rawPayload?.type ??
        rawPayload?.product_type ??
        "";

    // -----------------------------------------------------
    // BRAND
    // -----------------------------------------------------

    const brand =
        product?.brand ??
        rawPayload?.brand ??
        "";

    // -----------------------------------------------------
    // TAX
    // -----------------------------------------------------

    const taxStatus =
        product?.taxStatus ??
        product?.tax_status ??
        rawPayload?.taxStatus ??
        rawPayload?.tax_status ??
        "";

    const taxClass =
        product?.taxClass ??
        product?.tax_class ??
        rawPayload?.taxClass ??
        rawPayload?.tax_class ??
        "";

    // -----------------------------------------------------
    // RETURN NORMALIZED PRODUCT
    // -----------------------------------------------------

    return {
        id:
            product?.id ??
            product?.wordpressId ??
            rawPayload?.id ??
            "",

        merchantId:
            product?.merchantId ??
            "",

        storeId:
            product?.storeId ??
            "",

        categoryId:
            product?.categoryId ??
            "",

        wordpressId:
            product?.wordpressId ??
            rawPayload?.id ??
            "",

        wordpressCategoryId:
            product?.wordpressCategoryId ??
            "",

        name,

        sku:
            product?.sku ??
            rawPayload?.sku ??
            "",

        type,

        brand,

        price,

        image,

        tags,

        category:
            product?.category ??
            category?.name ??
            "",

        quantity,

        stockStatus,

        taxStatus,

        taxClass,

        createdAt:
            product?.createdAt ??
            product?.created_at ??
            "",

        updatedAt:
            product?.updatedAt ??
            product?.updated_at ??
            "",
    };
}

// =========================================================
// NORMALIZE COMPLETE CATALOG
// =========================================================

export function normalizeCatalog(
    response
) {
    const categories =
        extractCategories(
            response
        );

    const products =
        extractProducts(
            response
        );

    return {
        storeId:
            response?.storeId ??
            "",

        merchantId:
            response?.merchantId ??
            "",

        categoryCount:
            response?.categoryCount ??
            categories.length,

        productCount:
            response?.productCount ??
            products.length,

        categories,

        products: products.map(
            (product) =>
                normalizeProduct(
                    product,
                    categories
                )
        ),
    };
}