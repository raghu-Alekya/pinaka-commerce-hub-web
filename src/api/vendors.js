import { getAccessToken } from "../auth/tokenStore";

/*
|--------------------------------------------------------------------------
| API ROOT
|--------------------------------------------------------------------------
|
| Local React:
|   /connector/api/v1
|
| Vite proxy:
|   https://pch.alektasolutions.com
|
|--------------------------------------------------------------------------
*/

const API_ROOT =
  import.meta.env.VITE_API_BASE_URL ||
  "/connector/api/v1";

/*
|--------------------------------------------------------------------------
| BUILD API URL
|--------------------------------------------------------------------------
*/

function buildUrl(path = "") {
  const root = API_ROOT.replace(/\/+$/, "");

  const cleanPath = String(path).replace(
    /^\/+/,
    ""
  );

  return `${root}/${cleanPath}`;
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE / TIME
|--------------------------------------------------------------------------
|
| Example:
|
| Sep 17, 2026, 12:27 PM
| Sep 18, 2026, 05:22 PM
|
|--------------------------------------------------------------------------
*/

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/*
|--------------------------------------------------------------------------
| REQUEST HELPER
|--------------------------------------------------------------------------
*/

async function request(
  path,
  {
    token,
    signal,
    ...options
  } = {}
) {
  const accessToken =
    token ?? getAccessToken();

  const response = await fetch(
    buildUrl(path),
    {
      ...options,

      signal,

      /*
      |--------------------------------------------------------------------------
      | Authentication is handled through Bearer token.
      |--------------------------------------------------------------------------
      */

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

  /*
  |--------------------------------------------------------------------------
  | READ RESPONSE
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | HTTP ERROR
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status}).`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | API SUCCESS FALSE
  |--------------------------------------------------------------------------
  */

  if (
    data &&
    data.success === false
  ) {
    throw new Error(
      data.message ||
        data.error ||
        "API request failed."
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| UI VENDOR TYPE -> API VENDOR TYPE
|--------------------------------------------------------------------------
|
| UI:
|   Individual
|   Organization
|
| API:
|   SUPPLIER
|   ORGANIZER
|
|--------------------------------------------------------------------------
*/

function toApiVendorType(
  vendorType
) {
  const value =
    String(
      vendorType || ""
    ).trim();

  if (
    value.toLowerCase() ===
    "organization"
  ) {
    return "ORGANIZER";
  }

  if (
    value.toLowerCase() ===
    "individual"
  ) {
    return "SUPPLIER";
  }

  if (
    value.toUpperCase() ===
      "ORGANIZER" ||
    value.toUpperCase() ===
      "SUPPLIER"
  ) {
    return value.toUpperCase();
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| API VENDOR TYPE -> UI VENDOR TYPE
|--------------------------------------------------------------------------
*/

function toUiVendorType(
  vendorType
) {
  const value =
    String(
      vendorType || ""
    ).trim();

  if (
    value.toUpperCase() ===
    "ORGANIZER"
  ) {
    return "Organization";
  }

  if (
    value.toUpperCase() ===
    "SUPPLIER"
  ) {
    return "Individual";
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| UI STATUS -> API STATUS
|--------------------------------------------------------------------------
*/

function toApiStatus(
  status
) {
  const value =
    String(
      status || ""
    ).trim();

  if (
    value.toLowerCase() ===
    "active"
  ) {
    return "ACTIVE";
  }

  if (
    value.toLowerCase() ===
    "inactive"
  ) {
    return "INACTIVE";
  }

  if (
    value.toUpperCase() ===
      "ACTIVE" ||
    value.toUpperCase() ===
      "INACTIVE"
  ) {
    return value.toUpperCase();
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| API STATUS -> UI STATUS
|--------------------------------------------------------------------------
*/

function toUiStatus(
  status
) {
  const value =
    String(
      status || ""
    ).trim();

  if (
    value.toUpperCase() ===
    "ACTIVE"
  ) {
    return "Active";
  }

  if (
    value.toUpperCase() ===
    "INACTIVE"
  ) {
    return "Inactive";
  }

  return value || "Active";
}

/*
|--------------------------------------------------------------------------
| NORMALIZE VENDOR
|--------------------------------------------------------------------------
|
| Backend -> UI
|
| vendorName      -> name
| vendorCode      -> code
| productCategory -> category
| createdAt       -> createdTime
| updatedAt       -> updatedTime
|
|--------------------------------------------------------------------------
*/

function normalizeVendor(
  vendor = {}
) {
  return {
    ...vendor,

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    id:
      vendor.id ??
      vendor.vendorId ??
      "",

    /*
    |--------------------------------------------------------------------------
    | BASIC INFORMATION
    |--------------------------------------------------------------------------
    */

    name:
      vendor.name ??
      vendor.vendorName ??
      "",

    code:
      vendor.code ??
      vendor.vendorCode ??
      "",

    vendorType:
      toUiVendorType(
        vendor.vendorType
      ),

    contactPerson:
      vendor.contactPerson ??
      "",

    phone:
      vendor.phone ??
      "",

    email:
      vendor.email ??
      "",

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    category:
      vendor.category ??
      vendor.productCategory ??
      "",

    /*
    |--------------------------------------------------------------------------
    | ADDRESS
    |--------------------------------------------------------------------------
    */

    addressLine1:
      vendor.addressLine1 ??
      "",

    addressLine2:
      vendor.addressLine2 ??
      "",

    city:
      vendor.city ??
      "",

    state:
      vendor.state ??
      "",

    zipCode:
      vendor.zipCode ??
      "",

    country:
      vendor.country ??
      "",

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status:
      toUiStatus(
        vendor.status
      ),

    /*
    |--------------------------------------------------------------------------
    | CREATED TIME
    |--------------------------------------------------------------------------
    */

    createdTime:
      formatDateTime(
        vendor.createdTime ??
          vendor.createdAt
      ),

    /*
    |--------------------------------------------------------------------------
    | UPDATED TIME
    |--------------------------------------------------------------------------
    */

    updatedTime:
      formatDateTime(
        vendor.updatedTime ??
          vendor.updatedAt
      ),

    /*
    |--------------------------------------------------------------------------
    | DELETE DATE
    |--------------------------------------------------------------------------
    */

    deletedAt:
      vendor.deletedAt ??
      null,
  };
}

/*
|--------------------------------------------------------------------------
| EXTRACT VENDOR LIST
|--------------------------------------------------------------------------
|
| Supports:
|
| {
|   success: true,
|   vendors: []
| }
|
| {
|   success: true,
|   data: {
|     vendors: []
|   }
| }
|
| {
|   data: []
| }
|
|--------------------------------------------------------------------------
*/

function extractVendorList(
  data
) {
  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.vendors
    )
  ) {
    return data.vendors;
  }

  if (
    Array.isArray(
      data?.data?.vendors
    )
  ) {
    return data.data.vendors;
  }

  if (
    Array.isArray(
      data?.data
    )
  ) {
    return data.data;
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| PREPARE VENDOR PAYLOAD
|--------------------------------------------------------------------------
|
| Converts the React form data into
| the backend API field names.
|
|--------------------------------------------------------------------------
*/

function prepareVendorPayload(
  values = {}
) {
  return {
    /*
    |--------------------------------------------------------------------------
    | VENDOR INFORMATION
    |--------------------------------------------------------------------------
    */

    vendorName:
      values.vendorName ??
      values.name ??
      "",

    vendorType:
      toApiVendorType(
        values.vendorType
      ),

    vendorCode:
      values.vendorCode ??
      values.code ??
      "",

    /*
    |--------------------------------------------------------------------------
    | CONTACT INFORMATION
    |--------------------------------------------------------------------------
    */

    contactPerson:
      values.contactPerson ??
      "",

    phone:
      values.phone ??
      "",

    email:
      values.email ??
      "",

    /*
    |--------------------------------------------------------------------------
    | PRODUCT CATEGORY
    |--------------------------------------------------------------------------
    */

    productCategory:
      values.productCategory ??
      values.category ??
      "",

    /*
    |--------------------------------------------------------------------------
    | ADDRESS
    |--------------------------------------------------------------------------
    */

    addressLine1:
      values.addressLine1 ??
      "",

    addressLine2:
      values.addressLine2 ??
      "",

    city:
      values.city ??
      "",

    /*
    |--------------------------------------------------------------------------
    | State is NOT restricted to 2 characters.
    |--------------------------------------------------------------------------
    */

    state:
      values.state ??
      "",

    zipCode:
      values.zipCode ??
      "",

    country:
      values.country ??
      "",

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status:
      toApiStatus(
        values.status
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET ALL VENDORS
|--------------------------------------------------------------------------
|
| GET /vendors
|
|--------------------------------------------------------------------------
*/

export async function getVendors(
  {
    token,
    signal,
  } = {}
) {
  const data =
    await request(
      "/vendors",
      {
        method: "GET",
        token,
        signal,
      }
    );

  const vendors =
    extractVendorList(
      data
    );

  return vendors.map(
    normalizeVendor
  );
}

/*
|--------------------------------------------------------------------------
| GET VENDOR BY ID
|--------------------------------------------------------------------------
|
| GET /vendors/{vendorId}
|
|--------------------------------------------------------------------------
*/

export async function getVendor(
  vendorId,
  {
    token,
    signal,
  } = {}
) {
  if (!vendorId) {
    throw new Error(
      "Vendor ID is required."
    );
  }

  const data =
    await request(
      `/vendors/${encodeURIComponent(
        vendorId
      )}`,
      {
        method: "GET",
        token,
        signal,
      }
    );

  const vendor =
    data?.vendor ??
    data?.data?.vendor ??
    data?.data ??
    data;

  return normalizeVendor(
    vendor
  );
}

/*
|--------------------------------------------------------------------------
| CREATE VENDOR
|--------------------------------------------------------------------------
|
| POST /vendors
|
|--------------------------------------------------------------------------
*/

export async function createVendor(
  values,
  {
    token,
    signal,
  } = {}
) {
  const payload =
    prepareVendorPayload(
      values
    );

  const data =
    await request(
      "/vendors",
      {
        method: "POST",

        token,

        signal,

        body: JSON.stringify(
          payload
        ),
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Actual API response:
  |
  | {
  |   success: true,
  |   message: "Vendor created",
  |   vendor: {...}
  | }
  |--------------------------------------------------------------------------
  */

  const vendor =
    data?.vendor ??
    data?.data?.vendor ??
    data?.data ??
    data;

  return normalizeVendor(
    vendor
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE VENDOR
|--------------------------------------------------------------------------
|
| PUT /vendors/{vendorId}
|
|--------------------------------------------------------------------------
*/

export async function updateVendor(
  vendorId,
  values,
  {
    token,
    signal,
  } = {}
) {
  if (!vendorId) {
    throw new Error(
      "Vendor ID is required."
    );
  }

  const payload =
    prepareVendorPayload(
      values
    );

  const data =
    await request(
      `/vendors/${encodeURIComponent(
        vendorId
      )}`,
      {
        method: "PUT",

        token,

        signal,

        body: JSON.stringify(
          payload
        ),
      }
    );

  const vendor =
    data?.vendor ??
    data?.data?.vendor ??
    data?.data ??
    data;

  return normalizeVendor(
    vendor
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE VENDOR STATUS
|--------------------------------------------------------------------------
|
| PATCH /vendors/{vendorId}
|
|--------------------------------------------------------------------------
*/

export async function updateVendorStatus(
  vendorId,
  status,
  {
    token,
    signal,
  } = {}
) {
  if (!vendorId) {
    throw new Error(
      "Vendor ID is required."
    );
  }

  const data =
    await request(
      `/vendors/${encodeURIComponent(
        vendorId
      )}`,
      {
        method: "PATCH",

        token,

        signal,

        body: JSON.stringify({
          status:
            toApiStatus(
              status
            ),
        }),
      }
    );

  const vendor =
    data?.vendor ??
    data?.data?.vendor ??
    data?.data ??
    data;

  return normalizeVendor(
    vendor
  );
}

/*
|--------------------------------------------------------------------------
| DELETE VENDOR
|--------------------------------------------------------------------------
|
| DELETE /vendors/{vendorId}
|
|--------------------------------------------------------------------------
*/

export async function deleteVendor(
  vendorId,
  {
    token,
    signal,
  } = {}
) {
  if (!vendorId) {
    throw new Error(
      "Vendor ID is required."
    );
  }

  return request(
    `/vendors/${encodeURIComponent(
      vendorId
    )}`,
    {
      method: "DELETE",

      token,

      signal,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DEFAULT API OBJECT
|--------------------------------------------------------------------------
*/

export const vendorsApi = {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
};