import { useState } from "react";
import { merchants } from "../data/data";

const tabs = [
    ["denominations", "cash-stack", "Opening Denominations"],
    ["tax", "percent", "Tax Configuration"],
    ["cashback", "arrow-counterclockwise", "Cashback"],
    ["service", "receipt", "Service Charge"],
    ["payments", "credit-card", "Payments"],
];

/* =========================================================
   MOCK DATA
========================================================= */

const initialCashDenominations = [
    {
        amount: "1",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/1_dollar.jpg",
    },
    {
        amount: "10",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/10_dollar.jpg",
    },
    {
        amount: "100",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/100_dollar.jpg",
    },
    {
        amount: "20",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/20_dollar.jpg",
    },
    {
        amount: "5",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/5_dollar.jpg",
    },
    {
        amount: "50",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/50_dollar.jpg",
    },
];

const initialCoinDenominations = [
    {
        amount: "0.05",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/5_cent.jpg",
    },
    {
        amount: "0.10",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/10_cent.jpg",
    },
    {
        amount: "0.25",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/25_cent.jpg",
    },
    {
        amount: "0.50",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/0.05cent.jpg",
    },
];

const initialTubeDenominations = [
    { amount: "100", quantity: "10", currency: "$" },
    { amount: "50", quantity: "10", currency: "$" },
    { amount: "20", quantity: "10", currency: "$" },
    { amount: "10", quantity: "10", currency: "$" },
    { amount: "5", quantity: "10", currency: "$" },
    { amount: "1", quantity: "10", currency: "$" },
];

const initialSafeDropDenominations = [
    {
        amount: "1",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/1_dollar.jpg",
    },
    {
        amount: "10",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/10_dollar.jpg",
    },
    {
        amount: "100",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/100_dollar.jpg",
    },
    {
        amount: "20",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/20_dollar.jpg",
    },
    {
        amount: "5",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/5_dollar.jpg",
    },
    {
        amount: "50",
        image: "https://merchantretail.alektasolutions.com/wp-content/uploads/2024/05/50_dollar.jpg",
    },
];

const initialCashbackTiers = [
    {
        from: "0",
        to: "50",
        fee: "1",
    },
    {
        from: "50.01",
        to: "100",
        fee: "2",
    },
];

const initialServiceTiers = [
    {
        from: "0",
        to: "100",
        fee: "2",
        feeType: "Fixed",
    },
    {
        from: "100.01",
        to: "500",
        fee: "3",
        feeType: "Percentage",
    },
];

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function SettingCheckbox({ label, checked, onChange }) {
    return (
        <label className="settings-checkbox">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="settings-checkbox-box">
                <i className="bi bi-check" />
            </span>
            <span>{label}</span>
        </label>
    );
}

function SettingInput({
    label,
    value,
    onChange,
    placeholder = "",
    type = "text",
}) {
    return (
        <div className="settings-row">
            <div className="settings-label">
                <label>{label}</label>
            </div>

            <div className="settings-field">
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

function SettingSelect({ label, value, onChange, children }) {
    return (
        <div className="settings-row">
            <div className="settings-label">
                <label>{label}</label>
            </div>

            <div className="settings-field">
                <select value={value} onChange={(e) => onChange(e.target.value)}>
                    {children}
                </select>
            </div>
        </div>
    );
}

/* =========================================================
   OPENING DENOMINATIONS
========================================================= */

function OpeningDenominations() {
    const [enableSafes, setEnableSafes] = useState(true);
    const [enableSafeDrop, setEnableSafeDrop] = useState(true);
    const [currencyCode, setCurrencyCode] = useState("$");
    const [tubeSize, setTubeSize] = useState("11");
    const [safeDropAmount, setSafeDropAmount] = useState("500");
    const [enableInitialDrawer, setEnableInitialDrawer] = useState(true);
    const [initialDrawerAmount, setInitialDrawerAmount] = useState("200");

    const [cashDenominations, setCashDenominations] = useState(
        initialCashDenominations
    );

    const [coinDenominations, setCoinDenominations] = useState(
        initialCoinDenominations
    );

    const [tubeDenominations, setTubeDenominations] = useState(
        initialTubeDenominations
    );

    const [safeDropDenominations, setSafeDropDenominations] = useState(
        initialSafeDropDenominations
    );

    const addDenomination = (setter) => {
        setter((items) => [
            ...items,
            {
                amount: "",
                image: "",
            },
        ]);
    };

    const removeDenomination = (setter, index) => {
        setter((items) => items.filter((_, i) => i !== index));
    };

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Opening Denominations</h2>
                    <p>
                        Configure cash drawers, safe drops and cash
                        denominations.
                    </p>
                </div>
            </div>

            <div className="settings-form">
                <h3>Tube Size and Safe Drop and Cash Drawer Amount</h3>

                <SettingCheckbox
                    label="Enable Safes"
                    checked={enableSafes}
                    onChange={setEnableSafes}
                />

                <SettingCheckbox
                    label="Enable Safes Drop"
                    checked={enableSafeDrop}
                    onChange={setEnableSafeDrop}
                />

                <SettingSelect
                    label="Currency Code"
                    value={currencyCode}
                    onChange={setCurrencyCode}
                >
                    <option value="$">$ - USD</option>
                    <option value="₹">₹ - INR</option>
                    <option value="€">€ - EUR</option>
                    <option value="£">£ - GBP</option>
                </SettingSelect>

                <SettingInput
                    label="Safe Drop Tube Size"
                    value={tubeSize}
                    onChange={setTubeSize}
                    type="number"
                />

                <SettingInput
                    label="Safe Drop Amount"
                    value={safeDropAmount}
                    onChange={setSafeDropAmount}
                    type="number"
                />

                <SettingCheckbox
                    label="Enable Initial Cash Drawer Amount"
                    checked={enableInitialDrawer}
                    onChange={setEnableInitialDrawer}
                />

                <SettingInput
                    label="Initial Cash Drawer Amount"
                    value={initialDrawerAmount}
                    onChange={setInitialDrawerAmount}
                    type="number"
                />

                {/* Cash */}
                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>Manage Cash Denominations</h3>
                            <p>Configure available cash denominations.</p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(setCashDenominations)
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    <div className="denomination-grid">
                        {cashDenominations.map((item, index) => (
                            <div className="denomination-row" key={index}>
                                <div className="denomination-image">
                                    {item.image ? (
                                        <img src={item.image} alt={item.amount} />
                                    ) : (
                                        <i className="bi bi-cash" />
                                    )}
                                </div>

                                <input
                                    type="number"
                                    value={item.amount}
                                    placeholder="Amount"
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setCashDenominations((items) =>
                                            items.map((x, i) =>
                                                i === index
                                                    ? { ...x, amount: value }
                                                    : x
                                            )
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    className="pos-remove-button"
                                    onClick={() =>
                                        removeDenomination(
                                            setCashDenominations,
                                            index
                                        )
                                    }
                                >
                                    <i className="bi bi-trash" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coins */}
                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>Manage Coin Denominations</h3>
                            <p>Configure available coin denominations.</p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(setCoinDenominations)
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    <div className="denomination-grid">
                        {coinDenominations.map((item, index) => (
                            <div className="denomination-row" key={index}>
                                <div className="denomination-image">
                                    {item.image ? (
                                        <img src={item.image} alt={item.amount} />
                                    ) : (
                                        <i className="bi bi-coin" />
                                    )}
                                </div>

                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.amount}
                                    placeholder="Amount"
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setCoinDenominations((items) =>
                                            items.map((x, i) =>
                                                i === index
                                                    ? { ...x, amount: value }
                                                    : x
                                            )
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    className="pos-remove-button"
                                    onClick={() =>
                                        removeDenomination(
                                            setCoinDenominations,
                                            index
                                        )
                                    }
                                >
                                    <i className="bi bi-trash" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tubes */}
                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>Manage Tube Denominations</h3>
                            <p>Configure tube denomination quantities.</p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                setTubeDenominations((items) => [
                                    ...items,
                                    {
                                        amount: "",
                                        quantity: "10",
                                        currency: currencyCode,
                                    },
                                ])
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    <div className="settings-table-wrapper">
                        <table className="settings-table">
                            <thead>
                                <tr>
                                    <th>Currency</th>
                                    <th>Amount</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tubeDenominations.map((item, index) => (
                                    <tr key={index}>
                                        <td>{currencyCode}</td>

                                        <td>
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) =>
                                                    setTubeDenominations(
                                                        (items) =>
                                                            items.map((x, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...x,
                                                                          amount:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : x
                                                            )
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    setTubeDenominations(
                                                        (items) =>
                                                            items.map((x, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...x,
                                                                          quantity:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : x
                                                            )
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="pos-remove-button"
                                                onClick={() =>
                                                    removeDenomination(
                                                        setTubeDenominations,
                                                        index
                                                    )
                                                }
                                            >
                                                <i className="bi bi-trash" />
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Safe Drops */}
                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>Manage Safe Drops Denominations</h3>
                            <p>
                                Configure denominations available for safe
                                drops.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(setSafeDropDenominations)
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    <div className="denomination-grid">
                        {safeDropDenominations.map((item, index) => (
                            <div className="denomination-row" key={index}>
                                <div className="denomination-image">
                                    {item.image ? (
                                        <img src={item.image} alt={item.amount} />
                                    ) : (
                                        <i className="bi bi-cash-stack" />
                                    )}
                                </div>

                                <input
                                    type="number"
                                    value={item.amount}
                                    placeholder="Amount"
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setSafeDropDenominations((items) =>
                                            items.map((x, i) =>
                                                i === index
                                                    ? { ...x, amount: value }
                                                    : x
                                            )
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    className="pos-remove-button"
                                    onClick={() =>
                                        removeDenomination(
                                            setSafeDropDenominations,
                                            index
                                        )
                                    }
                                >
                                    <i className="bi bi-trash" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="settings-actions">
                    <button type="button" className="pos-primary-button">
                        Save Denominations
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   TAX CONFIGURATION
========================================================= */

function TaxConfiguration() {
    /*
     * TEMPORARY MOCK DATA
     *
     * Later replace this with:
     *
     * WooCommerce
     *      ↓
     * PCH Backend
     *      ↓
     * Redis Cache
     *      ↓
     * React
     *
     * React should only READ the tax configuration.
     */

    const [tax] = useState({
        taxName: "GST",
        taxValue: "18%",
    });

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Tax Configuration</h2>
                    <p>
                        Tax configuration is managed by WooCommerce and is
                        read-only in PCH.
                    </p>
                </div>

                <span className="tax-readonly-badge">
                    <i className="bi bi-lock" />
                    Read Only
                </span>
            </div>

            <div className="settings-form">
                <div className="tax-info-box">
                    <i className="bi bi-info-circle" />

                    <div>
                        <strong>Tax information</strong>
                        <p>
                            Tax details are fetched from WooCommerce through
                            the PCH backend and Redis cache.
                        </p>
                    </div>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <label>Tax Name</label>
                    </div>

                    <div className="settings-field">
                        <input
                            type="text"
                            value={tax.taxName}
                            readOnly
                            disabled
                        />
                    </div>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <label>Tax Value</label>
                    </div>

                    <div className="settings-field">
                        <input
                            type="text"
                            value={tax.taxValue}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   CASHBACK
========================================================= */

function CashbackSettings() {
    const [enabled, setEnabled] = useState(true);
    const [maxLimit, setMaxLimit] = useState("100");
    const [tiers, setTiers] = useState(initialCashbackTiers);

    const addTier = () => {
        setTiers((items) => [
            ...items,
            {
                from: "",
                to: "",
                fee: "",
            },
        ]);
    };

    const removeTier = (index) => {
        setTiers((items) => items.filter((_, i) => i !== index));
    };

    const updateTier = (index, field, value) => {
        setTiers((items) =>
            items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Cashback</h2>
                    <p>Configure cashback settings and fee tiers.</p>
                </div>
            </div>

            <div className="settings-form">
                <SettingCheckbox
                    label="Enable Cash Back"
                    checked={enabled}
                    onChange={setEnabled}
                />

                <SettingInput
                    label="Max Cash Back Limit"
                    value={maxLimit}
                    onChange={setMaxLimit}
                    type="number"
                />

                <div className="settings-section-title">
                    <h3>Cash Back Fee Tiers</h3>
                </div>

                <div className="settings-table-wrapper">
                    <table className="settings-table">
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Fee</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tiers.map((tier, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="number"
                                            value={tier.from}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "from",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            value={tier.to}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "to",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            value={tier.fee}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "fee",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="pos-remove-button"
                                            onClick={() =>
                                                removeTier(index)
                                            }
                                        >
                                            <i className="bi bi-trash" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    type="button"
                    className="pos-add-button"
                    onClick={addTier}
                >
                    <i className="bi bi-plus-lg" />
                    Add Tier
                </button>

                <div className="settings-actions">
                    <button type="button" className="pos-primary-button">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   SERVICE CHARGE
========================================================= */

function ServiceChargeSettings() {
    const [enabled, setEnabled] = useState(true);
    const [applyTo, setApplyTo] = useState("All Orders");
    const [defaultType, setDefaultType] = useState("Percentage");
    const [maxLimit, setMaxLimit] = useState("50");
    const [tiers, setTiers] = useState(initialServiceTiers);

    const addTier = () => {
        setTiers((items) => [
            ...items,
            {
                from: "",
                to: "",
                fee: "",
                feeType: "Fixed",
            },
        ]);
    };

    const removeTier = (index) => {
        setTiers((items) => items.filter((_, i) => i !== index));
    };

    const updateTier = (index, field, value) => {
        setTiers((items) =>
            items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Service Charge</h2>
                    <p>Configure service charge settings and tiers.</p>
                </div>
            </div>

            <div className="settings-form">
                <SettingCheckbox
                    label="Enable Service Charge"
                    checked={enabled}
                    onChange={setEnabled}
                />

                <SettingSelect
                    label="Apply To"
                    value={applyTo}
                    onChange={setApplyTo}
                >
                    <option>All Orders</option>
                    <option>Dine In</option>
                    <option>Takeaway</option>
                    <option>Delivery</option>
                </SettingSelect>

                <SettingSelect
                    label="Default Charge Type"
                    value={defaultType}
                    onChange={setDefaultType}
                >
                    <option>Percentage</option>
                    <option>Fixed</option>
                </SettingSelect>

                <SettingInput
                    label="Max Service Charge Limit"
                    value={maxLimit}
                    onChange={setMaxLimit}
                    type="number"
                />

                <div className="settings-section-title">
                    <h3>Service Charge Tiers</h3>
                </div>

                <div className="settings-table-wrapper">
                    <table className="settings-table">
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Fee</th>
                                <th>Fee Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tiers.map((tier, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="number"
                                            value={tier.from}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "from",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            value={tier.to}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "to",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            value={tier.fee}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "fee",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <select
                                            value={tier.feeType}
                                            onChange={(e) =>
                                                updateTier(
                                                    index,
                                                    "feeType",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option>Fixed</option>
                                            <option>Percentage</option>
                                        </select>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="pos-remove-button"
                                            onClick={() =>
                                                removeTier(index)
                                            }
                                        >
                                            <i className="bi bi-trash" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    type="button"
                    className="pos-add-button"
                    onClick={addTier}
                >
                    <i className="bi bi-plus-lg" />
                    Add Tier
                </button>

                <div className="settings-actions">
                    <button type="button" className="pos-primary-button">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   PAYMENTS
========================================================= */

function PaymentSettings() {
    const [provider, setProvider] = useState("Kickback");
    const [deviceId, setDeviceId] = useState("");
    const [merchantId, setMerchantId] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Payments</h2>
                    <p>Configure the payment gateway integration.</p>
                </div>
            </div>

            <div className="settings-form">
                <div className="settings-row">
                    <div className="settings-label">
                        <label>Payment Gateway Provider</label>
                    </div>

                    <div className="settings-field">
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="Kickback"
                                    checked={provider === "Kickback"}
                                    onChange={(e) =>
                                        setProvider(e.target.value)
                                    }
                                />
                                <span>Kickback</span>
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="Payroc"
                                    checked={provider === "Payroc"}
                                    onChange={(e) =>
                                        setProvider(e.target.value)
                                    }
                                />
                                <span>Payroc</span>
                            </label>
                        </div>
                    </div>
                </div>

                <SettingInput
                    label="Device ID"
                    value={deviceId}
                    onChange={setDeviceId}
                    placeholder="Enter device ID"
                />

                <SettingInput
                    label="Merchant ID"
                    value={merchantId}
                    onChange={setMerchantId}
                    placeholder="Enter merchant ID"
                />

                <SettingInput
                    label="Secret Key"
                    value={secretKey}
                    onChange={setSecretKey}
                    placeholder="Enter secret key"
                    type="password"
                />

                <SettingInput
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={setWebhookUrl}
                    placeholder="https://example.com/webhook"
                />

                <div className="settings-actions">
                    <button type="button" className="pos-primary-button">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PosConfiguration() {
    const [tab, setTab] = useState("denominations");

    const merchant = merchants[1] || merchants[0];

    const renderContent = () => {
        switch (tab) {
            case "denominations":
                return <OpeningDenominations />;

            case "tax":
                return <TaxConfiguration />;

            case "cashback":
                return <CashbackSettings />;

            case "service":
                return <ServiceChargeSettings />;

            case "payments":
                return <PaymentSettings />;

            default:
                return <OpeningDenominations />;
        }
    };

    return (
        <div className="page-content pos-page-content">
            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="page-header">
                <div>
                    <h1>POS Configuration</h1>

                    <p>
                        Configure point-of-sale settings for your merchant
                        stores.
                    </p>
                </div>
            </div>


            {/* =====================================================
                CONFIGURATION TABS
            ===================================================== */}

            <div className="pos-config-card">
                <div className="pos-tabs">
                    {tabs.map(([id, icon, label]) => (
                        <button
                            key={id}
                            type="button"
                            className={`pos-tab ${
                                tab === id ? "active" : ""
                            }`}
                            onClick={() => setTab(id)}
                        >
                            <i className={`bi bi-${icon}`} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                <div className="pos-tab-content">{renderContent()}</div>
            </div>
        </div>
    );
}