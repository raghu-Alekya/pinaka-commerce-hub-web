import { useState } from "react";
import { merchants } from "../data/data";
import "../styles/pos-configuration.css";

/* =========================================================
   MAIN POS TABS
========================================================= */

const tabs = [
  ["roles", "people", "Roles & Menu"],
  ["denominations", "cash-stack", "Opening Denominations"],
  ["cashback", "arrow-counterclockwise", "Cashback"],
  ["service", "receipt", "Service Charge"],
  ["payments", "credit-card", "Payments"],
];

/* =========================================================
   TAX RATE TYPES
   Tax Options has been removed.
========================================================= */

const taxRateTypes = [
  ["standard", "Standard rates"],
  ["custom", "Custom rates"],
  ["grocery", "Grocery rates"],
  ["zero", "Zero tax rates"],
];

export default function PosConfiguration() {
  /* =========================================================
     MAIN TAB
  ========================================================= */

  const [tab, setTab] = useState("roles");

  /* =========================================================
     FILTERS
  ========================================================= */

  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
 

  /* =========================================================
     ROLES
  ========================================================= */

  const [roles, setRoles] = useState([
    {
      name: "Shop Keeper",
      key: "shop_keeper",
      access: "All POS menus",
    },
    {
      name: "Cashier",
      key: "cashier",
      access: "Orders, Payments",
    },
    {
      name: "Merchant",
      key: "merchant",
      access: "All menus",
    },
    {
      name: "Employee",
      key: "employee",
      access: "Orders",
    },
    {
      name: "Manager",
      key: "manager",
      access: "All POS menus",
    },
  ]);

  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");

  /* =========================================================
     CASHBACK
  ========================================================= */

  const [cashback, setCashback] = useState({
    enabled: true,
    maxLimit: "500",
  });

  /* =========================================================
     SERVICE CHARGE
  ========================================================= */

  const [serviceCharge, setServiceCharge] = useState({
    enabled: true,
    applyTo: "order",
    chargeType: "fixed",
    maxLimit: "1000",
  });

  /* =========================================================
     PAYMENTS
  ========================================================= */

  const [payment, setPayment] = useState({
    provider: "kickback",
    deviceId: "abd0aa9c-995d-4a02-98d",
    merchantId: "100000000165845",
    secretKey: "**********************",
    webhookUrl:
      "https://merchantretail.alektasolutions.com/wp-admin",
  });

  /* =========================================================
     CASH DENOMINATIONS
  ========================================================= */

  const [cashDenominations, setCashDenominations] = useState([
    "1",
    "10",
    "100",
    "20",
    "5",
    "50",
  ]);

  /* =========================================================
     COIN DENOMINATIONS
  ========================================================= */

  const [coinDenominations, setCoinDenominations] = useState([
    "0.05",
    "0.10",
    "0.25",
    "0.50",
  ]);

  /* =========================================================
     CASHBACK TIERS
  ========================================================= */

  const [cashbackTiers, setCashbackTiers] = useState([
    { from: "1", to: "9.9", fee: "1" },
    { from: "10", to: "19.9", fee: "2" },
    { from: "20", to: "29.9", fee: "3" },
    { from: "30", to: "39.9", fee: "4" },
    { from: "40", to: "49.9", fee: "5" },
    { from: "50", to: "59.9", fee: "6" },
  ]);

  /* =========================================================
     SERVICE CHARGE TIERS
  ========================================================= */

  const [serviceTiers, setServiceTiers] = useState([
    {
      from: "1",
      to: "9.9",
      fee: "0.5",
      type: "fixed",
    },
    {
      from: "10",
      to: "1000",
      fee: "2",
      type: "percentage",
    },
  ]);

  /* =========================================================
     TAX RATE DATA

     Tax Options state has been completely removed.
  ========================================================= */

  const [taxRates, setTaxRates] = useState({
    standard: [
      {
        country: "*",
        state: "*",
        postcode: "*",
        city: "*",
        rate: "9.1000",
        name: "Standard Rates - 9.1%",
        priority: "0",
        compound: true,
        shipping: false,
      },
    ],

    custom: [
      {
        country: "*",
        state: "*",
        postcode: "*",
        city: "*",
        rate: "10.0000",
        name: "Custom Rates - 10%",
        priority: "1",
        compound: false,
        shipping: true,
      },
    ],

    grocery: [],

    zero: [],
  });

  /* =========================================================
     TAX SEARCH
  ========================================================= */

  const [taxSearch, setTaxSearch] = useState({
    standard: "",
    custom: "",
    grocery: "",
    zero: "",
  });

  /* =========================================================
     ROLE FUNCTIONS
  ========================================================= */

  const addRole = () => {
    if (!roleKey.trim() || !roleName.trim()) {
      return;
    }

    setRoles((current) => [
      ...current,
      {
        name: roleName.trim(),
        key: roleKey.trim(),
        access: "Orders, Payments",
      },
    ]);

    setRoleKey("");
    setRoleName("");
  };

  const deleteRole = (index) => {
    setRoles((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /* =========================================================
     CASH DENOMINATION FUNCTIONS
  ========================================================= */

  const updateCashDenomination = (index, value) => {
    setCashDenominations((current) =>
      current.map((item, i) =>
        i === index ? value : item
      )
    );
  };

  const addCashDenomination = () => {
    setCashDenominations((current) => [
      ...current,
      "",
    ]);
  };

  const removeCashDenomination = (index) => {
    setCashDenominations((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /* =========================================================
     COIN DENOMINATION FUNCTIONS
  ========================================================= */

  const updateCoinDenomination = (index, value) => {
    setCoinDenominations((current) =>
      current.map((item, i) =>
        i === index ? value : item
      )
    );
  };

  const addCoinDenomination = () => {
    setCoinDenominations((current) => [
      ...current,
      "",
    ]);
  };

  const removeCoinDenomination = (index) => {
    setCoinDenominations((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /* =========================================================
     CASHBACK FUNCTIONS
  ========================================================= */

  const addCashbackTier = () => {
    setCashbackTiers((current) => [
      ...current,
      {
        from: "",
        to: "",
        fee: "",
      },
    ]);
  };

  const removeCashbackTier = (index) => {
    setCashbackTiers((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const updateCashbackTier = (
    index,
    field,
    value
  ) => {
    setCashbackTiers((current) =>
      current.map((tier, i) =>
        i === index
          ? {
              ...tier,
              [field]: value,
            }
          : tier
      )
    );
  };

  /* =========================================================
     SERVICE CHARGE FUNCTIONS
  ========================================================= */

  const addServiceTier = () => {
    setServiceTiers((current) => [
      ...current,
      {
        from: "",
        to: "",
        fee: "",
        type: "fixed",
      },
    ]);
  };

  const removeServiceTier = (index) => {
    setServiceTiers((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const updateServiceTier = (
    index,
    field,
    value
  ) => {
    setServiceTiers((current) =>
      current.map((tier, i) =>
        i === index
          ? {
              ...tier,
              [field]: value,
            }
          : tier
      )
    );
  };

  /* =========================================================
     TAX FUNCTIONS
  ========================================================= */

  const updateTaxRate = (
    type,
    index,
    field,
    value
  ) => {
    setTaxRates((current) => ({
      ...current,

      [type]: current[type].map(
        (row, i) =>
          i === index
            ? {
                ...row,
                [field]: value,
              }
            : row
      ),
    }));
  };

  const addTaxRate = (type) => {
    setTaxRates((current) => ({
      ...current,

      [type]: [
        ...current[type],
        {
          country: "*",
          state: "*",
          postcode: "*",
          city: "*",
          rate: "",
          name: "",
          priority: "0",
          compound: false,
          shipping: false,
        },
      ],
    }));
  };

  const removeTaxRate = (
    type,
    index
  ) => {
    setTaxRates((current) => ({
      ...current,

      [type]: current[type].filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* =========================================================
     TAX SEARCH FUNCTION
  ========================================================= */

  const getFilteredTaxRates = (type) => {
    const search =
      taxSearch[type]
        .trim()
        .toLowerCase();

    if (!search) {
      return taxRates[type];
    }

    return taxRates[type].filter((row) =>
      [
        row.country,
        row.state,
        row.postcode,
        row.city,
        row.rate,
        row.name,
        row.priority,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  };

  /* =========================================================
     ROLES UI
  ========================================================= */

  const renderRoles = () => (
    <section className="pos-panel">

      <div className="pos-panel-heading">

        <div>
          <h2>Roles & Menu</h2>

          <p>
            Create roles and control which POS menus
            each role can access.
          </p>
        </div>

        <button
          className="pos-outline-button"
          onClick={() =>
            document
              .getElementById("roleKeyInput")
              ?.focus()
          }
        >
          <i className="bi bi-plus" />
          Create New Role
        </button>

      </div>

      <div className="create-role-box">

        <input
          id="roleKeyInput"
          value={roleKey}
          onChange={(e) =>
            setRoleKey(e.target.value)
          }
          placeholder="Role key (e.g. manager)"
        />

        <input
          value={roleName}
          onChange={(e) =>
            setRoleName(e.target.value)
          }
          placeholder="Role name (e.g. Manager)"
        />

        <button
          className="pos-primary-button"
          onClick={addRole}
        >
          Create Role
        </button>

      </div>

      

    </section>
  );

  /* =========================================================
     DENOMINATIONS UI
  ========================================================= */

  const renderDenominations = () => (
    <section className="pos-panel">

      <div className="pos-panel-heading">

        <div>
          <h2>Opening Denominations</h2>

          <p>
            Configure cash and coin denominations used
            by the POS.
          </p>
        </div>

      </div>

      <div className="pos-settings-section">

        <h3>
          Tube Size and Safe Drop and Cash Drawer Amount
        </h3>

        <div className="pos-inline-setting">

          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            Enable Safe
          </label>

          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            Enable Safe Drops
          </label>

          <label>
            Currency Code
            <input defaultValue="$" />
          </label>

          <label>
            Safe Drop Limit
            <input defaultValue="0" />
          </label>

          <label>
            Initial Cash Drawer Amount
            <input defaultValue="500" />
          </label>

          <label>
            No Of Payouts Per Order
            <input defaultValue="1" />
          </label>

        </div>

      </div>

      <div className="denomination-columns">

        <div className="denomination-block">

          <div className="pos-section-title">

            <h3>
              Manage Cash Denominations
            </h3>

            <button
              className="pos-outline-button"
              onClick={addCashDenomination}
            >
              Add Denomination
            </button>

          </div>

          {cashDenominations.map(
            (value, index) => (
              <div
                className="denomination-row"
                key={index}
              >

                <input
                  value={value}
                  onChange={(e) =>
                    updateCashDenomination(
                      index,
                      e.target.value
                    )
                  }
                />

                <button
                  className="role-action delete-role"
                  onClick={() =>
                    removeCashDenomination(
                      index
                    )
                  }
                >
                  Remove
                </button>

              </div>
            )
          )}

        </div>

        <div className="denomination-block">

          <div className="pos-section-title">

            <h3>
              Manage Coin Denominations
            </h3>

            <button
              className="pos-outline-button"
              onClick={addCoinDenomination}
            >
              Add Denomination
            </button>

          </div>

          {coinDenominations.map(
            (value, index) => (
              <div
                className="denomination-row"
                key={index}
              >

                <input
                  value={value}
                  onChange={(e) =>
                    updateCoinDenomination(
                      index,
                      e.target.value
                    )
                  }
                />

                <button
                  className="role-action delete-role"
                  onClick={() =>
                    removeCoinDenomination(
                      index
                    )
                  }
                >
                  Remove
                </button>

              </div>
            )
          )}

        </div>

      </div>

      <button className="pos-primary-button">
        Save Denominations
      </button>

    </section>
  );

  /* =========================================================
     CASHBACK UI
  ========================================================= */

  const renderCashback = () => (
    <section className="pos-panel">

      <div className="pos-panel-heading">

        <div>
          <h2>Cashback Settings</h2>

          <p>
            Configure cashback functionality at checkout
            and POS.
          </p>
        </div>

      </div>

      <div className="settings-card">

        <label className="toggle-row">

          <input
            type="checkbox"
            checked={cashback.enabled}
            onChange={(e) =>
              setCashback({
                ...cashback,
                enabled:
                  e.target.checked,
              })
            }
          />

          <span>
            Enable Cash Back
          </span>

        </label>

        <label className="pos-field">

          <span>
            Max Cash Back Limit
          </span>

          <input
            value={cashback.maxLimit}
            onChange={(e) =>
              setCashback({
                ...cashback,
                maxLimit:
                  e.target.value,
              })
            }
          />

        </label>

        <h3>
          Cash Back Fee Tiers
        </h3>

        <table className="pos-table">

          <thead>
            <tr>
              <th>From Amount</th>
              <th>To Amount</th>
              <th>Fee Fixed</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {cashbackTiers.map(
              (tier, index) => (
                <tr key={index}>

                  <td>
                    <input
                      value={tier.from}
                      onChange={(e) =>
                        updateCashbackTier(
                          index,
                          "from",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      value={tier.to}
                      onChange={(e) =>
                        updateCashbackTier(
                          index,
                          "to",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      value={tier.fee}
                      onChange={(e) =>
                        updateCashbackTier(
                          index,
                          "fee",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <button
                      className="role-action delete-role"
                      onClick={() =>
                        removeCashbackTier(
                          index
                        )
                      }
                    >
                      Remove
                    </button>
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

        <button
          className="pos-outline-button"
          onClick={addCashbackTier}
        >
          Add Fee Tier
        </button>

      </div>

      <button className="pos-primary-button">
        Save Changes
      </button>

    </section>
  );

  /* =========================================================
     SERVICE CHARGE UI
  ========================================================= */

  const renderServiceCharge = () => (
    <section className="pos-panel">

      <div className="pos-panel-heading">

        <div>
          <h2>
            Service Charge Settings
          </h2>

          <p>
            Configure service charge rules for checkout
            and POS.
          </p>
        </div>

      </div>

      <div className="settings-card">

        <label className="toggle-row">

          <input
            type="checkbox"
            checked={serviceCharge.enabled}
            onChange={(e) =>
              setServiceCharge({
                ...serviceCharge,
                enabled:
                  e.target.checked,
              })
            }
          />

          <span>
            Enable Service Charge
          </span>

        </label>

        <label className="pos-field">

          <span>
            Apply To
          </span>

          <select
            value={serviceCharge.applyTo}
            onChange={(e) =>
              setServiceCharge({
                ...serviceCharge,
                applyTo:
                  e.target.value,
              })
            }
          >
            <option value="order">
              Order total
            </option>

            <option value="item">
              Order item
            </option>

          </select>

        </label>

        <label className="pos-field">

          <span>
            Default Charge Type
          </span>

          <select
            value={serviceCharge.chargeType}
            onChange={(e) =>
              setServiceCharge({
                ...serviceCharge,
                chargeType:
                  e.target.value,
              })
            }
          >

            <option value="fixed">
              Fixed amount
            </option>

            <option value="percentage">
              Percentage
            </option>

          </select>

        </label>

        <label className="pos-field">

          <span>
            Max Service Charge Limit
          </span>

          <input
            value={serviceCharge.maxLimit}
            onChange={(e) =>
              setServiceCharge({
                ...serviceCharge,
                maxLimit:
                  e.target.value,
              })
            }
          />

        </label>

        <h3>
          Service Charge Tiers
        </h3>

        <table className="pos-table">

          <thead>
            <tr>
              <th>From Amount</th>
              <th>To Amount</th>
              <th>Fee</th>
              <th>Fee Type</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {serviceTiers.map(
              (tier, index) => (
                <tr key={index}>

                  <td>
                    <input
                      value={tier.from}
                      onChange={(e) =>
                        updateServiceTier(
                          index,
                          "from",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      value={tier.to}
                      onChange={(e) =>
                        updateServiceTier(
                          index,
                          "to",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      value={tier.fee}
                      onChange={(e) =>
                        updateServiceTier(
                          index,
                          "fee",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td>

                    <select
                      value={tier.type}
                      onChange={(e) =>
                        updateServiceTier(
                          index,
                          "type",
                          e.target.value
                        )
                      }
                    >

                      <option value="fixed">
                        Fixed
                      </option>

                      <option value="percentage">
                        Percentage
                      </option>

                    </select>

                  </td>

                  <td>

                    <button
                      className="role-action delete-role"
                      onClick={() =>
                        removeServiceTier(
                          index
                        )
                      }
                    >
                      Remove
                    </button>

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

        <button
          className="pos-outline-button"
          onClick={addServiceTier}
        >
          Add Fee Tier
        </button>

      </div>

      <button className="pos-primary-button">
        Save Changes
      </button>

    </section>
  );

  /* =========================================================
     PAYMENTS UI
  ========================================================= */

  const renderPayments = () => (
    <section className="pos-panel">

      <div className="pos-panel-heading">

        <div>
          <h2>Payment Settings</h2>

          <p>
            Configure the payment gateway used by the POS.
          </p>
        </div>

      </div>

      <div className="settings-card">

        <div className="provider-options">

          <label>

            <input
              type="radio"
              name="provider"
              value="kickback"
              checked={
                payment.provider ===
                "kickback"
              }
              onChange={(e) =>
                setPayment({
                  ...payment,
                  provider:
                    e.target.value,
                })
              }
            />

            Kickback

          </label>

          <label>

            <input
              type="radio"
              name="provider"
              value="payroc"
              checked={
                payment.provider ===
                "payroc"
              }
              onChange={(e) =>
                setPayment({
                  ...payment,
                  provider:
                    e.target.value,
                })
              }
            />

            Payroc

          </label>

        </div>

        <div className="pos-form-grid">

          <label>

            <span>
              Device ID
            </span>

            <input
              value={payment.deviceId}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  deviceId:
                    e.target.value,
                })
              }
            />

          </label>

          <label>

            <span>
              Merchant ID
            </span>

            <input
              value={payment.merchantId}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  merchantId:
                    e.target.value,
                })
              }
            />

          </label>

          <label>

            <span>
              Secret Key
            </span>

            <input
              type="password"
              value={payment.secretKey}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  secretKey:
                    e.target.value,
                })
              }
            />

          </label>

          <label>

            <span>
              Webhook URL
            </span>

            <input
              value={payment.webhookUrl}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  webhookUrl:
                    e.target.value,
                })
              }
            />

          </label>

        </div>

        <button className="pos-primary-button">
          Save Settings
        </button>

      </div>

    </section>
  );

  /* =========================================================
     TAX RATE SECTION
     
     This renders ONE complete section.
     All four sections are called separately below.
  ========================================================= */

  const renderTaxRateSection = (
    type,
    label
  ) => {

    const rows =
      getFilteredTaxRates(type);

    return (
      <section
        className="tax-rate-section"
        key={type}
      >

        {/* Section Header */}

        <div className="tax-rate-section-header">

          <div>

            <h3>{label}</h3>

            <p>
              Manage {label.toLowerCase()} for
              this merchant.
            </p>

          </div>

          <div className="tax-rate-header-actions">

            <input
              type="text"
              value={taxSearch[type]}
              onChange={(e) =>
                setTaxSearch((current) => ({
                  ...current,
                  [type]:
                    e.target.value,
                }))
              }
              placeholder="Search..."
            />

            <button
              className="pos-outline-button"
              onClick={() =>
                addTaxRate(type)
              }
            >
              <i className="bi bi-plus" />
              Insert Row
            </button>

          </div>

        </div>

        {/* Table */}

        <div className="tax-table-wrapper">

          <table className="pos-table tax-rates-table">

            <thead>

              <tr>

                <th>
                  Country code
                </th>

                <th>
                  State code
                </th>

                <th>
                  Postcode / ZIP
                </th>

                <th>
                  City
                </th>

                <th>
                  Rate %
                </th>

                <th>
                  Tax name
                </th>

                <th>
                  Priority
                </th>

                <th>
                  Compound
                </th>

                <th>
                  Shipping
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan="10"
                    className="tax-empty-row"
                  >
                    No tax rates configured.
                  </td>

                </tr>

              ) : (

                rows.map(
                  (row, index) => (

                    <tr key={index}>

                      {/* Country */}

                      <td>

                        <input
                          value={row.country}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "country",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* State */}

                      <td>

                        <input
                          value={row.state}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "state",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* Postcode */}

                      <td>

                        <input
                          value={row.postcode}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "postcode",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* City */}

                      <td>

                        <input
                          value={row.city}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "city",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* Rate */}

                      <td>

                        <input
                          value={row.rate}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "rate",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* Tax Name */}

                      <td>

                        <input
                          value={row.name}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "name",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* Priority */}

                      <td>

                        <input
                          value={row.priority}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "priority",
                              e.target.value
                            )
                          }
                        />

                      </td>

                      {/* Compound */}

                      <td className="tax-checkbox-cell">

                        <input
                          type="checkbox"
                          checked={row.compound}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "compound",
                              e.target.checked
                            )
                          }
                        />

                      </td>

                      {/* Shipping */}

                      <td className="tax-checkbox-cell">

                        <input
                          type="checkbox"
                          checked={row.shipping}
                          onChange={(e) =>
                            updateTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              ),
                              "shipping",
                              e.target.checked
                            )
                          }
                        />

                      </td>

                      {/* Actions */}

                      <td>

                        <button
                          className="role-action delete-role"
                          onClick={() =>
                            removeTaxRate(
                              type,
                              taxRates[type].indexOf(
                                row
                              )
                            )
                          }
                        >
                          Remove
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* Bottom Actions */}

        <div className="tax-rate-actions">

          <button
            className="pos-outline-button"
            onClick={() =>
              addTaxRate(type)
            }
          >
            Insert row
          </button>

          <button className="pos-outline-button">
            Import CSV
          </button>

          <button className="pos-outline-button">
            Export CSV
          </button>

        </div>

        <button className="pos-primary-button">
          Save Changes
        </button>

      </section>
    );
  };

  /* =========================================================
     ACTIVE POS TAB
  ========================================================= */

  const renderActiveTab = () => {

    switch (tab) {

      case "roles":
        return renderRoles();

      case "denominations":
        return renderDenominations();

      case "cashback":
        return renderCashback();

      case "service":
        return renderServiceCharge();

      case "payments":
        return renderPayments();

      default:
        return renderRoles();
    }
  };

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="page-content pos-page-content">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="page-header">

        <div>

          <h1>
            POS Configuration
          </h1>

          <p>
            Manage the settings used by your POS
            terminals and store operations.
          </p>

        </div>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="pos-filter-card">

        <div className="pos-filter-grid">

          {/* Merchant */}

          <div className="pos-filter-field">

            <label>
              Merchant Name
            </label>

            <select
              value={selectedMerchant}
              onChange={(e) => {
                setSelectedMerchant(
                  e.target.value
                );

                setSelectedStore("");
              }}
            >

              <option value="">
                Select Merchant
              </option>

              {merchants.map(
                (merchant) => (

                  <option
                    key={merchant.id}
                    value={merchant.id}
                  >
                    {merchant.name}
                  </option>

                )
              )}

            </select>

          </div>

          {/* Store */}

          <div className="pos-filter-field">

            <label>
              Store Name
            </label>

            <select
              value={selectedStore}
              onChange={(e) =>
                setSelectedStore(
                  e.target.value
                )
              }
              disabled={!selectedMerchant}
            >

              <option value="">
                Select Store
              </option>

              <option value="store-1">
                Westside Market
              </option>

              <option value="store-2">
                Downtown Store
              </option>

              <option value="store-3">
                Main Street Store
              </option>

            </select>

          </div>

          

          

        </div>

      </div>

      {/* =====================================================
          MAIN POS CONFIGURATION
      ===================================================== */}

      <div className="pos-config-card">

        {/* POS TABS */}

        <div className="pos-tabs">

          {tabs.map(
            ([key, icon, label]) => (

              <button
                key={key}
                className={`pos-tab ${
                  tab === key
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setTab(key)
                }
              >

                <i
                  className={`bi bi-${icon}`}
                />

                <span>
                  {label}
                </span>

              </button>

            )
          )}

        </div>

        {/* POS CONTENT */}

        {renderActiveTab()}

      </div>

      {/* =====================================================
          TAX CONFIGURATION
          
          No Tax Options tab.
          No horizontal tax tabs.
          All four sections are displayed vertically.
      ===================================================== */}

      <div className="tax-config-box">

        <div className="tax-config-header">

          <div className="tax-breadcrumb">
            POS / Tax Configuration
          </div>

          <h2>
            Tax Configuration
          </h2>

          <p>
            Manage the tax rates used by the store.
          </p>

        </div>

        {/* =================================================
            VERTICAL TAX SECTIONS
        ================================================= */}

        <div className="tax-config-content">

          {taxRateTypes.map(
            ([type, label]) =>
              renderTaxRateSection(
                type,
                label
              )
          )}

        </div>

      </div>

    </div>
  );
}