import { useState } from "react";
import "../styles/pos-configuration.css";

/* =========================================================
   TABS
========================================================= */

const tabs = [
    ["denominations", "cash-stack", "Opening Denominations"],
    ["tax", "percent", "Tax Configuration"],
    ["cashback", "arrow-counterclockwise", "Cashback"],
    ["service", "receipt", "Service Charge"],
    ["payments", "credit-card", "Payments"],
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
                onChange={(event) =>
                    onChange(event.target.checked)
                }
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
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                />
            </div>
        </div>
    );
}

function SettingSelect({
    label,
    value,
    onChange,
    children,
}) {
    return (
        <div className="settings-row">
            <div className="settings-label">
                <label>{label}</label>
            </div>

            <div className="settings-field">
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                >
                    {children}
                </select>
            </div>
        </div>
    );
}

/* =========================================================
   DENOMINATION ROW
========================================================= */

function DenominationRow({
    item,
    index,
    onAmountChange,
    onImageChange,
    onRemove,
}) {
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        onImageChange(index, {
            file,
            image: imageUrl,
            imageName: file.name,
        });
    };

    return (
        <div className="denomination-row">
            {/* AMOUNT */}

            <div className="denomination-amount-field">
                <label>Amount</label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    placeholder="Enter amount"
                    onChange={(event) =>
                        onAmountChange(
                            index,
                            event.target.value
                        )
                    }
                />
            </div>

            {/* IMAGE */}

            <div className="denomination-image-field">
                <label>Image</label>

                <div className="denomination-image-upload">
                    <div className="denomination-image-preview">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={
                                    item.amount ||
                                    "Denomination"
                                }
                            />
                        ) : (
                            <i className="bi bi-image" />
                        )}
                    </div>

                    <div className="denomination-upload-content">
                        <label className="denomination-upload-button">
                            <i className="bi bi-upload" />

                            {item.image
                                ? "Change Image"
                                : "Select Image"}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>

                        <span>
                            {item.imageName ||
                                "PNG, JPG or WEBP"}
                        </span>
                    </div>
                </div>
            </div>

            {/* REMOVE */}

            <div className="denomination-action-field">
                <label>Actions</label>

                <button
                    type="button"
                    className="pos-remove-button"
                    onClick={() => onRemove(index)}
                >
                    <i className="bi bi-trash" />
                    Remove
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   OPENING DENOMINATIONS
========================================================= */

function OpeningDenominations() {
    const [enableSafes, setEnableSafes] =
        useState(false);

    const [enableSafeDrop, setEnableSafeDrop] =
        useState(false);

    const [currencyCode, setCurrencyCode] =
        useState("");

    const [tubeSize, setTubeSize] =
        useState("");

    const [safeDropAmount, setSafeDropAmount] =
        useState("");

    const [enableInitialDrawer, setEnableInitialDrawer] =
        useState(false);

    const [initialDrawerAmount, setInitialDrawerAmount] =
        useState("");

    /* ---------------------------------------------------------
       EMPTY LISTS
    --------------------------------------------------------- */

    const [cashDenominations, setCashDenominations] =
        useState([]);

    const [coinDenominations, setCoinDenominations] =
        useState([]);

    const [tubeDenominations, setTubeDenominations] =
        useState([]);

    const [safeDropDenominations, setSafeDropDenominations] =
        useState([]);

    /* ---------------------------------------------------------
       ADD CASH / COIN / SAFE DROP
    --------------------------------------------------------- */

    const addDenomination = (setter) => {
        setter((items) => [
            ...items,
            {
                amount: "",
                image: "",
                imageName: "",
                file: null,
            },
        ]);
    };

    /* ---------------------------------------------------------
       ADD TUBE
    --------------------------------------------------------- */

    const addTubeDenomination = () => {
        setTubeDenominations((items) => [
            ...items,
            {
                amount: "",
                quantity: "",
            },
        ]);
    };

    /* ---------------------------------------------------------
       UPDATE AMOUNT
    --------------------------------------------------------- */

    const updateDenominationAmount = (
        setter,
        index,
        value
    ) => {
        setter((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          amount: value,
                      }
                    : item
            )
        );
    };

    /* ---------------------------------------------------------
       UPDATE IMAGE
    --------------------------------------------------------- */

    const updateDenominationImage = (
        setter,
        index,
        imageData
    ) => {
        setter((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          ...imageData,
                      }
                    : item
            )
        );
    };

    /* ---------------------------------------------------------
       REMOVE
    --------------------------------------------------------- */

    const removeDenomination = (
        setter,
        index
    ) => {
        setter((items) =>
            items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    /* ---------------------------------------------------------
       UPDATE TUBE
    --------------------------------------------------------- */

    const updateTube = (
        index,
        field,
        value
    ) => {
        setTubeDenominations((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    /* ---------------------------------------------------------
       SAVE
    --------------------------------------------------------- */

    const saveDenominations = () => {
        const allDenominations = [
            ...cashDenominations,
            ...coinDenominations,
            ...safeDropDenominations,
        ];

        const invalidAmount =
            allDenominations.some(
                (item) => !item.amount
            );

        const invalidImage =
            allDenominations.some(
                (item) => !item.image
            );

        if (invalidAmount) {
            alert(
                "Please enter the amount for all denominations."
            );
            return;
        }

        if (invalidImage) {
            alert(
                "Please select an image for all denominations."
            );
            return;
        }

        if (
            tubeDenominations.some(
                (item) =>
                    !item.amount ||
                    !item.quantity
            )
        ) {
            alert(
                "Please enter amount and quantity for all tube denominations."
            );
            return;
        }

        /*
         * API integration will be added here.
         */

        alert("Denominations saved successfully.");
    };

    return (
        <div className="pos-panel opening-denominations-panel">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="pos-panel-heading">
                <div>
                    <h2>Opening Denominations</h2>

                    <p>
                        Configure cash drawers, safe drops
                        and cash denominations.
                    </p>
                </div>
            </div>

            {/* =================================================
                GENERAL SETTINGS
            ================================================= */}

            <div className="settings-form opening-settings">
                <h3 className="settings-main-title">
                    Tube Size and Safe Drop and Cash Drawer
                    Amount
                </h3>

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
                    <option value="">
                        Select Currency
                    </option>

                    <option value="$">
                        $ - USD
                    </option>

                    <option value="₹">
                        ₹ - INR
                    </option>

                    <option value="€">
                        € - EUR
                    </option>

                    <option value="£">
                        £ - GBP
                    </option>
                </SettingSelect>

                <SettingInput
                    label="Safe Drop Tube Size"
                    value={tubeSize}
                    onChange={setTubeSize}
                    type="number"
                    placeholder="Enter tube size"
                />

                <SettingInput
                    label="Safe Drop Amount"
                    value={safeDropAmount}
                    onChange={setSafeDropAmount}
                    type="number"
                    placeholder="Enter safe drop amount"
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
                    placeholder="Enter initial drawer amount"
                />
            </div>

            {/* =================================================
                DENOMINATION GRID
            ================================================= */}

            <div className="denomination-config-grid">
                {/* =================================================
                    CASH
                ================================================= */}

                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>
                                Manage Cash Denominations
                            </h3>

                            <p>
                                Configure available cash
                                denominations.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(
                                    setCashDenominations
                                )
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    {cashDenominations.length === 0 ? (
                        <div className="settings-empty-state">
                            <i className="bi bi-cash-stack" />

                            <p>
                                No cash denominations added
                                yet.
                            </p>

                            <span>
                                Click "Add Denomination" to
                                add a denomination.
                            </span>
                        </div>
                    ) : (
                        <div className="denomination-list">
                            {cashDenominations.map(
                                (item, index) => (
                                    <DenominationRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onAmountChange={(
                                            rowIndex,
                                            value
                                        ) =>
                                            updateDenominationAmount(
                                                setCashDenominations,
                                                rowIndex,
                                                value
                                            )
                                        }
                                        onImageChange={(
                                            rowIndex,
                                            imageData
                                        ) =>
                                            updateDenominationImage(
                                                setCashDenominations,
                                                rowIndex,
                                                imageData
                                            )
                                        }
                                        onRemove={(rowIndex) =>
                                            removeDenomination(
                                                setCashDenominations,
                                                rowIndex
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* =================================================
                    COINS
                ================================================= */}

                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>
                                Manage Coin Denominations
                            </h3>

                            <p>
                                Configure available coin
                                denominations.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(
                                    setCoinDenominations
                                )
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    {coinDenominations.length === 0 ? (
                        <div className="settings-empty-state">
                            <i className="bi bi-coin" />

                            <p>
                                No coin denominations added
                                yet.
                            </p>

                            <span>
                                Click "Add Denomination" to
                                add a denomination.
                            </span>
                        </div>
                    ) : (
                        <div className="denomination-list">
                            {coinDenominations.map(
                                (item, index) => (
                                    <DenominationRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onAmountChange={(
                                            rowIndex,
                                            value
                                        ) =>
                                            updateDenominationAmount(
                                                setCoinDenominations,
                                                rowIndex,
                                                value
                                            )
                                        }
                                        onImageChange={(
                                            rowIndex,
                                            imageData
                                        ) =>
                                            updateDenominationImage(
                                                setCoinDenominations,
                                                rowIndex,
                                                imageData
                                            )
                                        }
                                        onRemove={(rowIndex) =>
                                            removeDenomination(
                                                setCoinDenominations,
                                                rowIndex
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* =================================================
                    TUBE
                ================================================= */}

                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>
                                Manage Tube Denominations
                            </h3>

                            <p>
                                Configure tube denomination
                                quantities.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={addTubeDenomination}
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    {tubeDenominations.length === 0 ? (
                        <div className="settings-empty-state">
                            <i className="bi bi-box-seam" />

                            <p>
                                No tube denominations added
                                yet.
                            </p>

                            <span>
                                Click "Add Denomination" to
                                add a denomination.
                            </span>
                        </div>
                    ) : (
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
                                    {tubeDenominations.map(
                                        (item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    {currencyCode ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            item.amount
                                                        }
                                                        placeholder="Amount"
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateTube(
                                                                index,
                                                                "amount",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            item.quantity
                                                        }
                                                        placeholder="Quantity"
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateTube(
                                                                index,
                                                                "quantity",
                                                                event
                                                                    .target
                                                                    .value
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
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* =================================================
                    SAFE DROP
                ================================================= */}

                <div className="denomination-section">
                    <div className="denomination-heading">
                        <div>
                            <h3>
                                Manage Safe Drops
                                Denominations
                            </h3>

                            <p>
                                Configure denominations
                                available for safe drops.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pos-add-button"
                            onClick={() =>
                                addDenomination(
                                    setSafeDropDenominations
                                )
                            }
                        >
                            <i className="bi bi-plus-lg" />
                            Add Denomination
                        </button>
                    </div>

                    {safeDropDenominations.length === 0 ? (
                        <div className="settings-empty-state">
                            <i className="bi bi-safe" />

                            <p>
                                No safe drop denominations
                                added yet.
                            </p>

                            <span>
                                Click "Add Denomination" to
                                add a denomination.
                            </span>
                        </div>
                    ) : (
                        <div className="denomination-list">
                            {safeDropDenominations.map(
                                (item, index) => (
                                    <DenominationRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onAmountChange={(
                                            rowIndex,
                                            value
                                        ) =>
                                            updateDenominationAmount(
                                                setSafeDropDenominations,
                                                rowIndex,
                                                value
                                            )
                                        }
                                        onImageChange={(
                                            rowIndex,
                                            imageData
                                        ) =>
                                            updateDenominationImage(
                                                setSafeDropDenominations,
                                                rowIndex,
                                                imageData
                                            )
                                        }
                                        onRemove={(rowIndex) =>
                                            removeDenomination(
                                                setSafeDropDenominations,
                                                rowIndex
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="settings-actions">
                <button
                    type="button"
                    className="pos-primary-button"
                    onClick={saveDenominations}
                >
                    Save Denominations
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   TAX CONFIGURATION
========================================================= */

function TaxConfiguration() {
    /*
     * Tax will eventually come from:
     *
     * WooCommerce
     *      ↓
     * PCH Backend
     *      ↓
     * Redis
     *      ↓
     * React
     *
     * This screen is READ ONLY.
     */

    const [tax] = useState({
        taxName: "",
        taxValue: "",
    });

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Tax Configuration</h2>

                    <p>
                        Tax configuration is managed by
                        WooCommerce and is read-only in PCH.
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
                        <strong>
                            Tax information
                        </strong>

                        <p>
                            Tax details will be fetched from
                            WooCommerce through the PCH
                            backend and Redis cache.
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
                            placeholder="Tax name"
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
                            placeholder="Tax value"
                            readOnly
                            disabled
                        />
                    </div>
                </div>

                {!tax.taxName &&
                    !tax.taxValue && (
                        <div className="settings-empty-state">
                            <i className="bi bi-percent" />

                            <p>
                                No tax configuration
                                available.
                            </p>

                            <span>
                                Tax information will appear
                                here once received from
                                WooCommerce.
                            </span>
                        </div>
                    )}
            </div>
        </div>
    );
}

/* =========================================================
   CASHBACK
========================================================= */

function CashbackSettings() {
    const [enabled, setEnabled] =
        useState(false);

    const [maxLimit, setMaxLimit] =
        useState("");

    const [tiers, setTiers] =
        useState([]);

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
        setTiers((items) =>
            items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const updateTier = (
        index,
        field,
        value
    ) => {
        setTiers((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Cashback</h2>

                    <p>
                        Configure cashback settings and fee
                        tiers.
                    </p>
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
                    placeholder="Enter maximum cashback limit"
                />

                <div className="settings-section-title">
                    <h3>Cash Back Fee Tiers</h3>
                </div>

                {tiers.length === 0 ? (
                    <div className="settings-empty-state">
                        <i className="bi bi-arrow-counterclockwise" />

                        <p>
                            No cashback tiers added yet.
                        </p>

                        <span>
                            Click "Add Tier" to configure a
                            cashback tier.
                        </span>
                    </div>
                ) : (
                    <div className="settings-table-wrapper">
                        <table className="settings-table">
                            <thead>
                                <tr>
                                    <th>
                                        From (amount)
                                    </th>

                                    <th>
                                        To (amount)
                                    </th>

                                    <th>
                                        Fee
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {tiers.map(
                                    (tier, index) => (
                                        <tr
                                            key={
                                                index
                                            }
                                        >
                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.from
                                                    }
                                                    placeholder="From"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "from",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.to
                                                    }
                                                    placeholder="To"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "to",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.fee
                                                    }
                                                    placeholder="Fee"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "fee",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="pos-remove-button"
                                                    onClick={() =>
                                                        removeTier(
                                                            index
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-trash" />
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <button
                    type="button"
                    className="pos-add-button"
                    onClick={addTier}
                >
                    <i className="bi bi-plus-lg" />
                    Add Tier
                </button>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="pos-primary-button"
                    >
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
    const [enabled, setEnabled] =
        useState(false);

    const [applyTo, setApplyTo] =
        useState("");

    const [defaultType, setDefaultType] =
        useState("");

    const [maxLimit, setMaxLimit] =
        useState("");

    const [tiers, setTiers] =
        useState([]);

    const addTier = () => {
        setTiers((items) => [
            ...items,
            {
                from: "",
                to: "",
                fee: "",
                feeType: "",
            },
        ]);
    };

    const removeTier = (index) => {
        setTiers((items) =>
            items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const updateTier = (
        index,
        field,
        value
    ) => {
        setTiers((items) =>
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Service Charge</h2>

                    <p>
                        Configure service charge settings
                        and tiers.
                    </p>
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
                    <option value="">
                        Select
                    </option>

                    <option value="All Orders">
                        All Orders
                    </option>

                    <option value="Dine In">
                        Dine In
                    </option>

                    <option value="Takeaway">
                        Takeaway
                    </option>

                    <option value="Delivery">
                        Delivery
                    </option>
                </SettingSelect>

                <SettingSelect
                    label="Default Charge Type"
                    value={defaultType}
                    onChange={setDefaultType}
                >
                    <option value="">
                        Select
                    </option>

                    <option value="Percentage">
                        Percentage
                    </option>

                    <option value="Fixed">
                        Fixed
                    </option>
                </SettingSelect>

                <SettingInput
                    label="Max Service Charge Limit"
                    value={maxLimit}
                    onChange={setMaxLimit}
                    type="number"
                    placeholder="Enter maximum service charge"
                />

                <div className="settings-section-title">
                    <h3>
                        Service Charge Tiers
                    </h3>
                </div>

                {tiers.length === 0 ? (
                    <div className="settings-empty-state">
                        <i className="bi bi-receipt" />

                        <p>
                            No service charge tiers
                            added yet.
                        </p>

                        <span>
                            Click "Add Tier" to configure
                            a service charge tier.
                        </span>
                    </div>
                ) : (
                    <div className="settings-table-wrapper">
                        <table className="settings-table">
                            <thead>
                                <tr>
                                    <th>
                                        From
                                    </th>

                                    <th>
                                        To
                                    </th>

                                    <th>
                                        Fee
                                    </th>

                                    <th>
                                        Fee Type
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {tiers.map(
                                    (tier, index) => (
                                        <tr
                                            key={
                                                index
                                            }
                                        >
                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.from
                                                    }
                                                    placeholder="From"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "from",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.to
                                                    }
                                                    placeholder="To"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "to",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    value={
                                                        tier.fee
                                                    }
                                                    placeholder="Fee"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "fee",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <select
                                                    value={
                                                        tier.feeType
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateTier(
                                                            index,
                                                            "feeType",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select
                                                    </option>

                                                    <option value="Fixed">
                                                        Fixed
                                                    </option>

                                                    <option value="Percentage">
                                                        Percentage
                                                    </option>
                                                </select>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="pos-remove-button"
                                                    onClick={() =>
                                                        removeTier(
                                                            index
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-trash" />
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <button
                    type="button"
                    className="pos-add-button"
                    onClick={addTier}
                >
                    <i className="bi bi-plus-lg" />
                    Add Tier
                </button>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="pos-primary-button"
                    >
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
    const [provider, setProvider] =
        useState("");

    const [deviceId, setDeviceId] =
        useState("");

    const [merchantId, setMerchantId] =
        useState("");

    const [secretKey, setSecretKey] =
        useState("");

    const [webhookUrl, setWebhookUrl] =
        useState("");

    return (
        <div className="pos-panel">
            <div className="pos-panel-heading">
                <div>
                    <h2>Payments</h2>

                    <p>
                        Configure the payment gateway
                        integration.
                    </p>
                </div>
            </div>

            <div className="settings-form">
                <div className="settings-row">
                    <div className="settings-label">
                        <label>
                            Payment Gateway Provider
                        </label>
                    </div>

                    <div className="settings-field">
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="Kickback"
                                    checked={
                                        provider ===
                                        "Kickback"
                                    }
                                    onChange={(event) =>
                                        setProvider(
                                            event.target
                                                .value
                                        )
                                    }
                                />

                                <span>
                                    Kickback
                                </span>
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="Payroc"
                                    checked={
                                        provider ===
                                        "Payroc"
                                    }
                                    onChange={(event) =>
                                        setProvider(
                                            event.target
                                                .value
                                        )
                                    }
                                />

                                <span>
                                    Payroc
                                </span>
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
                    placeholder="Enter webhook URL"
                />

                <div className="settings-actions">
                    <button
                        type="button"
                        className="pos-primary-button"
                    >
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
    const [tab, setTab] =
        useState("denominations");

    const renderContent = () => {
        switch (tab) {
            case "denominations":
                return (
                    <OpeningDenominations />
                );

            case "tax":
                return (
                    <TaxConfiguration />
                );

            case "cashback":
                return (
                    <CashbackSettings />
                );

            case "service":
                return (
                    <ServiceChargeSettings />
                );

            case "payments":
                return (
                    <PaymentSettings />
                );

            default:
                return (
                    <OpeningDenominations />
                );
        }
    };

    return (
        <div className="page-content pos-page-content">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="page-header">
                <div>
                    <h1>POS Configuration</h1>

                    <p>
                        Configure point-of-sale settings for
                        your merchant stores.
                    </p>
                </div>
            </div>

            {/* =================================================
                CONFIGURATION CARD
            ================================================= */}

            <div className="pos-config-card">
                <div className="pos-tabs">
                    {tabs.map(
                        ([id, icon, label]) => (
                            <button
                                key={id}
                                type="button"
                                className={`pos-tab ${
                                    tab === id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setTab(id)
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

                <div className="pos-tab-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}