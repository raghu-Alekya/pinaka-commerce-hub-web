import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import "../styles/pos-configuration.css";
import { ApiError } from "../api/http";
import {
    createPosCurrencyTax,
    getPosCurrencyTax,
    updatePosCurrencyTax,
} from "../api/posCurrencyTax";
import {
    createPosServiceCharges,
    getPosServiceCharges,
    updatePosServiceCharges,
} from "../api/posServiceCharge";
import {
    createPosCashback,
    getPosCashback,
    updatePosCashback,
} from "../api/posCashback";
import {
    createPosOpeningBalance,
    getPosOpeningBalance,
    updatePosOpeningBalance,
} from "../api/posOpeningBalance";
import {
    createPosCashDenominations,
    getPosCashDenominations,
    updatePosCashDenominations,
} from "../api/posCashDenominations";

/* =========================================================
   POS CONFIGURATION CARDS
========================================================= */

const configurationCards = [
    {
        id: "currency-tax",
        icon: "gear",
        iconClass: "blue",
        title: "Currency & Taxes",
        description: "Set your store currency and tax configuration.",
        component: "tax",
        enabled: true,
    },
    {
        id: "service",
        icon: "bell",
        iconClass: "purple",
        title: "Service Charges",
        description: "Configure dine-in, delivery and large party service charges.",
        component: "service",
        enabled: true,
    },
    {
        id: "cashback",
        icon: "gift",
        iconClass: "pink",
        title: "Cashback Settings",
        description: "Set cashback rules and denominations.",
        component: "cashback",
        enabled: true,
    },
    {
        id: "opening-balance",
        icon: "cash-stack",
        iconClass: "green",
        title: "Opening Balance",
        description: "Configure opening balance rules and shift settings.",
        component: "opening-balance",
        enabled: true,
    },
    {
        id: "cash-denominations",
        icon: "cash-stack",
        iconClass: "yellow",
        title: "Cash Denominations",
        description: "Manage denominations for cash counting.",
        component: "cash-denominations",
        enabled: true,
    },
    {
        id: "cash-register",
        icon: "cash-register",
        iconClass: "blue",
        title: "Cash Register Settings",
        description: "Configure registers, cash in/out and limits.",
        component: "cash-register",
        enabled: true,
    },
    {
        id: "safe-drop",
        icon: "shield-check",
        iconClass: "purple",
        title: "Safe & Safe Drop",
        description: "Configure safe and drop rules.",
        component: "safe-drop",
        enabled: true,
    },
    {
        id: "card-payments",
        icon: "credit-card",
        iconClass: "pink",
        title: "Card Payment Settings",
        description: "Manage card payment terminals and processor settings.",
        component: "payments",
        enabled: true,
    },
    {
        id: "terminal-mapping",
        icon: "display",
        iconClass: "green",
        title: "Terminal and Register Mapping",
        description: "Map devices to registers and locations.",
        component: "terminal-mapping",
        enabled: true,
    },
];

/* =========================================================
   COMMON COMPONENTS
========================================================= */

// Shared screen lifecycle. Existing forms keep their local React state and save handlers.
const PosSettingsContext = createContext(null);
const snapshotKey = (value) => JSON.stringify(value);
function usePosSettings() {
    return useContext(PosSettingsContext);
}
function useConfigState(name, initialValue) {
    const settings = usePosSettings();
    const [value, setValue] = useState(() => {
        const initial = settings.session.saved[name] ?? (typeof initialValue === "function" ? initialValue() : initialValue);
        settings.session.baseline[name] = initial;
        settings.session.draft[name] = initial;
        return initial;
    });
    const update = (next) => {
        const resolved = typeof next === "function" ? next(settings.session.draft[name]) : next;
        settings.session.draft[name] = resolved;
        setValue(resolved);
        settings.clearNotice();
    };
    settings.session.resets[name] = () => setValue(settings.session.baseline[name]);
    return [value, update];
}
// Opening an editor is not itself a change. Only edits to its fields are dirty.
function useConfigEditor() {
    const { session } = usePosSettings();
    const [editor, setEditor] = useState(null);
    const current = useRef(null);
    const baseline = useRef(null);
    session.editorDirty = () => current.current !== null && snapshotKey(current.current) !== baseline.current;
    session.resetEditor = () => { current.current = null; baseline.current = null; setEditor(null); };
    return [editor, (next) => {
        const resolved = typeof next === "function" ? next(current.current) : next;
        if (resolved !== null && current.current === null) baseline.current = snapshotKey(resolved);
        current.current = resolved;
        setEditor(resolved);
    }];
}
function useSaveAction(handler) {
    const settings = usePosSettings();
    useEffect(() => { settings.session.save = handler; });
    return () => settings.saveChanges();
}
function SettingsChangeDialog({ busy, onSave, onDiscard, onStay }) {
    const dialog = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        dialog.current.showModal();
        return () => { if (previous?.isConnected) previous.focus(); };
    }, []);
    return <dialog className="pos-change-dialog" ref={dialog} aria-labelledby="pos-change-title"
        aria-describedby="pos-change-description" onCancel={(event) => { event.preventDefault(); if (!busy) onStay(); }}>
        <h2 id="pos-change-title">Unsaved changes</h2>
        <p id="pos-change-description">Save or discard your changes. You will stay on this screen.</p>
        <div className="pos-change-actions">
            <button type="button" className="pc-button" disabled={busy} onClick={onStay}>Keep Editing</button>
            <button type="button" className="pc-button" disabled={busy} onClick={onDiscard}>Discard Changes</button>
            <button type="button" className="pc-button pc-primary" disabled={busy} onClick={onSave}>{busy ? "Saving…" : "Save Changes"}</button>
        </div>
    </dialog>;
}

function SettingsGearIcon() {
    return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></svg>;
}

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
    const { currency } = usePosSettings();
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
                <label>Amount ({currency})</label>

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

function OpeningBalanceSettings() {
    const settings = usePosSettings();
    const savedId = useRef(null);
    const currencySymbol = settings.currencySymbol;
    const [requireOpeningBalance, setRequireOpeningBalance] =
        useConfigState("requireOpeningBalance", true);

    const [defaultOpeningAmount, setDefaultOpeningAmount] =
        useConfigState("defaultOpeningAmount", "200.00");

    const [managerApprovalRequired, setManagerApprovalRequired] =
        useConfigState("managerApprovalRequired", true);

    const [varianceTolerance, setVarianceTolerance] =
        useConfigState("varianceTolerance", "5.00");

    const [allowCashierOverride, setAllowCashierOverride] =
        useConfigState("allowCashierOverride", false);

    const [countByDenomination, setCountByDenomination] =
        useConfigState("countByDenomination", true);

    const toggleClass = (value) =>
        `opening-balance-switch ${value ? "active" : ""}`;

    const applyOpeningBalance = (record) => {
        savedId.current = record.id;
        setRequireOpeningBalance(Boolean(record.requireOpeningBalance));
        setDefaultOpeningAmount(String(record.defaultOpeningAmount));
        setManagerApprovalRequired(Boolean(record.managerApprovalRequired));
        setVarianceTolerance(String(record.varianceTolerance));
        setAllowCashierOverride(Boolean(record.allowCashierOverride));
        setCountByDenomination(Boolean(record.countByDenomination));
        settings.session.baseline = { ...settings.session.draft };
    };

    useEffect(() => {
        if (!settings.storeId) return undefined;
        let active = true;
        getPosOpeningBalance(settings.storeId)
            .then((record) => {
                if (active && record?.id) applyOpeningBalance(record);
            })
            .catch((error) => {
                if (error instanceof ApiError && error.status === 404) return;
                if (active) alert(error?.message || "Unable to load opening balance settings.");
            });
        return () => { active = false; };
    }, [settings.storeId]);

    const saveOpeningBalanceSettings = useSaveAction(async () => {
        if (!settings.storeId) {
            alert("Open Opening Balance from a store before saving.");
            return;
        }

        const payload = {
            requireOpeningBalance,
            defaultOpeningAmount: Number(defaultOpeningAmount || 0),
            managerApprovalRequired,
            varianceTolerance: Number(varianceTolerance || 0),
            allowCashierOverride,
            countByDenomination,
        };
        const record = savedId.current
            ? await updatePosOpeningBalance(settings.storeId, payload)
            : await createPosOpeningBalance(settings.storeId, payload);
        applyOpeningBalance(record);
        return true;
    });

    return (
        <div className="pos-panel opening-balance-panel">

            {/* =================================================
                HEADER
            ================================================= */}

            <ConfigHeader />


            {/* =================================================
                SETTINGS CARD
            ================================================= */}

            <div className="opening-balance-card">

                                {/* =================================================
                    SETTINGS GRID
                ================================================= */}

                <div className="opening-balance-grid">

                    {/* ------------------------------------------------
                        REQUIRE OPENING BALANCE
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Require Opening Balance
                        </label>

                        <button
                            type="button"
                            className={toggleClass(
                                requireOpeningBalance
                            )}
                            onClick={() =>
                                setRequireOpeningBalance(
                                    (value) => !value
                                )
                            }
                            aria-pressed={
                                requireOpeningBalance
                            }
                        >
                            <span />
                        </button>

                    </div>


                    {/* ------------------------------------------------
                        MANAGER APPROVAL
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Manager Approval Required
                        </label>

                        <button
                            type="button"
                            className={toggleClass(
                                managerApprovalRequired
                            )}
                            onClick={() =>
                                setManagerApprovalRequired(
                                    (value) => !value
                                )
                            }
                            aria-pressed={
                                managerApprovalRequired
                            }
                        >
                            <span />
                        </button>

                    </div>


                    {/* ------------------------------------------------
                        DEFAULT OPENING AMOUNT
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Default Opening Amount
                        </label>

                        <div className="opening-balance-money-input">

                            <span>{currencySymbol}</span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    defaultOpeningAmount
                                }
                                onChange={(event) =>
                                    setDefaultOpeningAmount(
                                        event.target.value
                                    )
                                }
                                placeholder="0.00"
                            />

                        </div>

                    </div>


                    {/* ------------------------------------------------
                        VARIANCE TOLERANCE
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Variance Tolerance
                        </label>

                        <div className="opening-balance-money-input">

                            <span>{currencySymbol}</span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    varianceTolerance
                                }
                                onChange={(event) =>
                                    setVarianceTolerance(
                                        event.target.value
                                    )
                                }
                                placeholder="0.00"
                            />

                        </div>

                    </div>


                    {/* ------------------------------------------------
                        CASHIER OVERRIDE
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Allow Cashier Override
                        </label>

                        <button
                            type="button"
                            className={toggleClass(
                                allowCashierOverride
                            )}
                            onClick={() =>
                                setAllowCashierOverride(
                                    (value) => !value
                                )
                            }
                            aria-pressed={
                                allowCashierOverride
                            }
                        >
                            <span />
                        </button>

                    </div>


                    {/* ------------------------------------------------
                        COUNT BY DENOMINATION
                    ------------------------------------------------ */}

                    <div className="opening-balance-setting">

                        <label>
                            Count Cash by Denomination
                        </label>

                        <button
                            type="button"
                            className={toggleClass(
                                countByDenomination
                            )}
                            onClick={() =>
                                setCountByDenomination(
                                    (value) => !value
                                )
                            }
                            aria-pressed={
                                countByDenomination
                            }
                        >
                            <span />
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="opening-balance-actions pos-form-actions">

                <button
                    type="button"
                    className="opening-balance-back"
                 onClick={() => settings.requestLeave(null)}>Cancel</button>

                <button
                    type="button"
                    className="opening-balance-save"
                    onClick={
                        saveOpeningBalanceSettings
                    }
                >
                    Save Changes
                </button>

            </div>

        </div>
    );
}

/* =========================================================
   TAX CONFIGURATION
========================================================= */

const serverTaxClassId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function currencyTaxPayload(values) {
    return {
        currency: values.currency,
        rounding: values.rounding,
        decimalPlaces: Number(values.decimalPlaces),
        taxEnabled: values.taxEnabled,
        defaultTaxRate: values.defaultTaxRate === "" ? undefined : Number(values.defaultTaxRate),
        taxCalculation: values.taxCalculation,
        taxClasses: values.taxClasses
            .filter((item) => item.name.trim())
            .map((item) => ({
                ...(typeof item.id === "string" && serverTaxClassId.test(item.id) ? { id: item.id } : {}),
                name: item.name.trim(),
                rate: Number(item.rate),
            })),
    };
}

function TaxConfiguration() {
    const settings = usePosSettings();
    const savedId = useRef(null);
    const [currency, setCurrency] = useConfigState("currency", settings.currency);

    const [rounding, setRounding] = useConfigState("rounding", 
        "nearest-cent"
    );

    const [decimalPlaces, setDecimalPlaces] =
        useConfigState("decimalPlaces", "2");

    const [taxEnabled, setTaxEnabled] =
        useConfigState("taxEnabled", true);

    const [defaultTaxRate, setDefaultTaxRate] =
        useConfigState("defaultTaxRate", "8.25");

    const [taxCalculation, setTaxCalculation] =
        useConfigState("taxCalculation", "item-price");

    const [taxClasses, setTaxClasses] = useConfigState("taxClasses", [
        {
            id: 1,
            name: "Standard",
            rate: "8.25",
        },
        {
            id: 2,
            name: "Reduced",
            rate: "0.00",
        },
        {
            id: 3,
            name: "Zero Rated",
            rate: "0.00",
        },
    ]);

    const [saving, setSaving] = useState(false);

    const applyCurrencyTax = (record) => {
        savedId.current = record.id;
        setCurrency(record.currency);
        setRounding(record.rounding);
        setDecimalPlaces(String(record.decimalPlaces));
        setTaxEnabled(Boolean(record.taxEnabled));
        setDefaultTaxRate(record.defaultTaxRate === null || record.defaultTaxRate === undefined ? "" : String(record.defaultTaxRate));
        setTaxCalculation(record.taxCalculation);
        setTaxClasses((record.taxClasses || []).map((item) => ({
            id: item.id,
            name: item.name,
            rate: String(item.rate),
        })));
        settings.session.baseline = { ...settings.session.draft };
    };

    useEffect(() => {
        if (!settings.storeId) return undefined;
        let active = true;
        getPosCurrencyTax(settings.storeId)
            .then((record) => {
                if (active && record?.id) applyCurrencyTax(record);
            })
            .catch((error) => {
                if (error instanceof ApiError && error.status === 404) return;
                if (active) alert(error?.message || "Unable to load currency and tax settings.");
            });
        return () => { active = false; };
    }, [settings.storeId]);

    const updateTaxClass = (id, field, value) => {
        setTaxClasses((items) =>
            items.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    const removeTaxClass = (id) => {
        setTaxClasses((items) =>
            items.filter((item) => item.id !== id)
        );
    };

    const addTaxClass = () => {
        setTaxClasses((items) => [
            ...items,
            {
                id: Date.now(),
                name: "",
                rate: "0.00",
            },
        ]);
    };

    const saveTaxConfiguration = useSaveAction(async () => {
        if (!settings.storeId) {
            alert("Open Currency & Taxes from a store before saving.");
            return;
        }

        if (!currency) {
            alert("Please select a currency.");
            return;
        }

        if (taxEnabled && !defaultTaxRate) {
            alert("Please enter the default tax rate.");
            return;
        }

        if (taxEnabled && taxClasses.some((item) => !item.name.trim())) {
            alert("Each tax class needs a name.");
            return;
        }

        setSaving(true);

        try {
            const payload = currencyTaxPayload({
                currency,
                rounding,
                decimalPlaces,
                taxEnabled,
                defaultTaxRate,
                taxCalculation,
                taxClasses,
            });
            const record = savedId.current
                ? await updatePosCurrencyTax(settings.storeId, payload)
                : await createPosCurrencyTax(settings.storeId, payload);
            applyCurrencyTax(record);
            return true;
        } finally {
            setSaving(false);
        }
    });

    return (
        <div className="pos-panel currency-tax-panel">

            {/* =================================================
                HEADER
            ================================================= */}

            <ConfigHeader />


            {/* =================================================
                TWO COLUMN CONFIGURATION
            ================================================= */}

            <div className="currency-tax-grid">

                {/* =================================================
                    CURRENCY SETTINGS
                ================================================= */}

                <div className="currency-tax-card">

                    <div className="currency-tax-card-header">

                        <h3>
                            Currency Settings
                        </h3>

                    </div>


                    {/* CURRENCY */}

                    <div className="currency-tax-field">

                        <label>
                            Currency
                            <span className="required">*</span>
                        </label>

                        <div className="currency-tax-input-wrap">

                            <select
                                value={currency}
                                onChange={(event) =>
                                    setCurrency(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="USD">
                                    USD - US Dollar
                                </option>

                                <option value="INR">
                                    INR - Indian Rupee
                                </option>

                                <option value="EUR">
                                    EUR - Euro
                                </option>

                                <option value="GBP">
                                    GBP - British Pound
                                </option>

                                <option value="CAD">
                                    CAD - Canadian Dollar
                                </option>

                                <option value="AUD">
                                    AUD - Australian Dollar
                                </option>
                            </select>

                            <i className="bi bi-chevron-down" />

                        </div>

                    </div>


                    {/* ROUNDING */}

                    <div className="currency-tax-field">

                        <label>
                            Rounding
                        </label>

                        <div className="currency-tax-input-wrap">

                            <select
                                value={rounding}
                                onChange={(event) =>
                                    setRounding(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="nearest-cent">
                                    Round to nearest cent (0.01)
                                </option>

                                <option value="nearest-dollar">
                                    Round to nearest dollar (1.00)
                                </option>

                                <option value="down">
                                    Always round down
                                </option>

                                <option value="up">
                                    Always round up
                                </option>
                            </select>

                            <i className="bi bi-chevron-down" />

                        </div>

                    </div>


                    {/* DECIMAL PLACES */}

                    <div className="currency-tax-field">

                        <label>
                            Decimal Places
                        </label>

                        <input
                            type="number"
                            min="0"
                            max="4"
                            value={decimalPlaces}
                            onChange={(event) =>
                                setDecimalPlaces(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    TAX CONFIGURATION
                ================================================= */}

                <div className="currency-tax-card">

                    <div className="currency-tax-card-header">

                        <h3>
                            Tax Configuration
                        </h3>

                    </div>


                    {/* ENABLE TAX */}

                    <div className="tax-enable-row">

                        <label>
                            Enable Taxes
                        </label>

                        <button
                            type="button"
                            className={`tax-switch ${
                                taxEnabled
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setTaxEnabled(
                                    (value) => !value
                                )
                            }
                            aria-pressed={taxEnabled}
                        >
                            <span />
                        </button>

                    </div>


                    {taxEnabled && (
                        <>

                            {/* DEFAULT RATE + CALCULATION */}

                            <div className="tax-top-fields">

                                <div className="currency-tax-field">

                                    <label>
                                        Default Tax Rate (%)
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            defaultTaxRate
                                        }
                                        onChange={(event) =>
                                            setDefaultTaxRate(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                    />

                                </div>


                                <div className="currency-tax-field">

                                    <label>
                                        Tax Calculation
                                    </label>

                                    <div className="currency-tax-input-wrap">

                                        <select
                                            value={
                                                taxCalculation
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setTaxCalculation(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="item-price">
                                                Calculate Tax on Item Price
                                            </option>

                                            <option value="subtotal">
                                                Calculate Tax on Subtotal
                                            </option>

                                            <option value="total">
                                                Calculate Tax on Total
                                            </option>
                                        </select>

                                        <i className="bi bi-chevron-down" />

                                    </div>

                                </div>

                            </div>


                            {/* TAX CLASSES */}

                            <div className="tax-class-section">

                                <div className="tax-class-heading">

                                    <h4>
                                        Tax Classes Mapping
                                    </h4>

                                </div>


                                <div className="tax-class-table">

                                    {taxClasses.map(
                                        (taxClass) => (

                                            <div
                                                className="tax-class-row"
                                                key={
                                                    taxClass.id
                                                }
                                            >

                                                <div className="tax-class-name">

                                                    <input
                                                        type="text"
                                                        value={
                                                            taxClass.name
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateTaxClass(
                                                                taxClass.id,
                                                                "name",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Tax class name"
                                                    />

                                                </div>


                                                <div className="tax-class-rate">

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            taxClass.rate
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateTaxClass(
                                                                taxClass.id,
                                                                "rate",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />

                                                </div>

                                                <span className="tax-percent">
                                                    %
                                                </span>


                                                <button
                                                    type="button"
                                                    className="tax-class-delete"
                                                    onClick={() =>
                                                        removeTaxClass(
                                                            taxClass.id
                                                        )
                                                    }
                                                    aria-label={`Remove ${taxClass.name || "tax class"}`}
                                                >
                                                    <i className="bi bi-trash3" />
                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>


                                {/* ADD TAX CLASS */}

                                <button
                                    type="button"
                                    className="add-tax-class-button"
                                    onClick={addTaxClass}
                                >
                                    <i className="bi bi-plus-lg" />
                                    Add Tax Class
                                </button>

                            </div>

                        </>
                    )}

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="currency-tax-actions pos-form-actions">

                <button
                    type="button"
                    className="currency-tax-back-button"
                    onClick={() => settings.requestLeave(null)}
                >Cancel</button>

                <button
                    type="button"
                    className="currency-tax-save-button"
                    onClick={saveTaxConfiguration}
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Changes"}
                </button>

            </div>

        </div>
    );
}

/* =========================================================
   CASHBACK
========================================================= */

function cashbackPayload(values) {
    return {
        enabled: values.enabled,
        ...(values.maxCashback === "" ? {} : { maxCashback: Number(values.maxCashback) }),
        tiers: values.tiers
            .filter((item) => item.from !== "" && item.to !== "" && item.fee !== "")
            .map((item) => ({
                ...(typeof item.id === "string" && serverTaxClassId.test(item.id) ? { id: item.id } : {}),
                from: Number(item.from),
                to: Number(item.to),
                fee: Number(item.fee),
            })),
    };
}

function CashbackSettings() {
    const settings = usePosSettings();
    const savedId = useRef(null);
    const currency = settings.currency;
    
    const [enabled, setEnabled] = useConfigState("enabled", false);

    const [maxCashback, setMaxCashback] =
        useConfigState("maxCashback", "");

    const [tiers, setTiers] = useConfigState("tiers", [
        {
            id: 1,
            from: "1",
            to: "9.9",
            fee: "1",
        },
        {
            id: 2,
            from: "10",
            to: "1000",
            fee: "10",
        },
    ]);

    const addTier = () => {
        setTiers((items) => [
            ...items,
            {
                id: Date.now(),
                from: "",
                to: "",
                fee: "",
            },
        ]);
    };

    const updateTier = (id, field, value) => {
        setTiers((items) =>
            items.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    const removeTier = (id) => {
        setTiers((items) =>
            items.filter((item) => item.id !== id)
        );
    };

    const applyCashback = (record) => {
        savedId.current = record.id;
        setEnabled(Boolean(record.enabled));
        setMaxCashback(record.maxCashback === null || record.maxCashback === undefined ? "" : String(record.maxCashback));
        setTiers((record.tiers || []).map((item) => ({
            id: item.id,
            from: String(item.from),
            to: String(item.to),
            fee: String(item.fee),
        })));
        settings.session.baseline = { ...settings.session.draft };
    };

    useEffect(() => {
        if (!settings.storeId) return undefined;
        let active = true;
        getPosCashback(settings.storeId)
            .then((record) => {
                if (active && record?.id) applyCashback(record);
            })
            .catch((error) => {
                if (error instanceof ApiError && error.status === 404) return;
                if (active) alert(error?.message || "Unable to load cashback settings.");
            });
        return () => { active = false; };
    }, [settings.storeId]);

    const saveCashbackSettings = useSaveAction(async () => {
        if (!settings.storeId) {
            alert("Open Cashback Settings from a store before saving.");
            return;
        }

        if (enabled && maxCashback === "") {
            alert("Please enter the maximum cashback limit.");
            return;
        }

        if (enabled && tiers.some((item) => item.from === "" || item.to === "" || item.fee === "")) {
            alert("Each cashback tier needs a from, to, and fee.");
            return;
        }

        const payload = cashbackPayload({ enabled, maxCashback, tiers });
        const record = savedId.current
            ? await updatePosCashback(settings.storeId, payload)
            : await createPosCashback(settings.storeId, payload);
        applyCashback(record);
        return true;
    });

    return (
        <div className="pos-panel cashback-panel">

            {/* =================================================
                HEADER
            ================================================= */}

            <ConfigHeader />


            {/* =================================================
                GENERAL SETTINGS
            ================================================= */}

            <div className="cashback-card">

                <div className="cashback-card-header">

                    {/* <div className="cashback-section-icon">
                        <i className="bi bi-gear" />
                    </div>

                    <div>
                        <h3>General Settings</h3>

                        <p>
                            Enable cashback and configure
                            the maximum allowed amount.
                        </p>
                    </div> */}

                </div>


                <div className="cashback-general-grid">

                    {/* ENABLE CASHBACK */}

                    <div className="cashback-setting">

                        <label>
                            Enable Cash Back
                        </label>

                        <button
                            type="button"
                            className={`cashback-switch ${
                                enabled ? "active" : ""
                            }`}
                            onClick={() =>
                                setEnabled(
                                    (value) => !value
                                )
                            }
                            aria-pressed={enabled}
                        >
                            <span />
                        </button>

                    </div>


                    {/* MAX LIMIT */}

                    <div className="cashback-setting cashback-limit-setting">

                        <label>
                            Max Cash Back Limit ({currency})
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={maxCashback}
                            onChange={(event) =>
                                setMaxCashback(
                                    event.target.value
                                )
                            }
                            placeholder="Enter maximum cashback limit"
                        />

                    </div>

                </div>

            </div>


            {/* =================================================
                CASHBACK FEE TIERS
            ================================================= */}

            <div className="cashback-card cashback-tiers-card">

                <div className="cashback-card-header">

                    <div className="cashback-section-icon purple">
                        <i className="bi bi-list-ul" />
                    </div>

                    <div>

                        <h3>
                            Cash Back Fee Tiers
                        </h3>

                        <p>
                            Configure cashback fee tiers
                            based on the cashback amount.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="cashback-add-button"
                        onClick={addTier}
                    >
                        <i className="bi bi-plus-lg" />
                        Add Tier
                    </button>

                </div>


                {/* TABLE */}

                <div className="cashback-table-wrapper">

                    <table className="cashback-table">

                        <thead>

                            <tr>

                                <th>
                                    From ({currency})
                                </th>

                                <th>
                                    To ({currency})
                                </th>

                                <th>
                                    Fee ({currency})
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {tiers.map((tier) => (

                                <tr key={tier.id}>

                                    {/* FROM */}

                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={tier.from}
                                            placeholder="From"
                                            onChange={(event) =>
                                                updateTier(
                                                    tier.id,
                                                    "from",
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* TO */}

                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={tier.to}
                                            placeholder="To"
                                            onChange={(event) =>
                                                updateTier(
                                                    tier.id,
                                                    "to",
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* FEE */}

                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={tier.fee}
                                            placeholder="Fee"
                                            onChange={(event) =>
                                                updateTier(
                                                    tier.id,
                                                    "fee",
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* ACTIONS */}

                                    <td>

                                        <div className="cashback-actions">

                                            <button
                                                type="button"
                                                className="cashback-edit"
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>

                                            <button
                                                type="button"
                                                className="cashback-delete"
                                                title="Remove"
                                                onClick={() =>
                                                    removeTier(
                                                        tier.id
                                                    )
                                                }
                                            >
                                                <i className="bi bi-trash3" />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>


                {/* TABLE FOOTER */}

                <div className="cashback-table-footer">

                    <span>
                        Showing 1 to {tiers.length} of{" "}
                        {tiers.length} entries
                    </span>

                    <div className="cashback-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            <i className="bi bi-chevron-left" />
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            1
                        </button>

                        <button type="button">
                            <i className="bi bi-chevron-right" />
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="cashback-page-actions pos-form-actions">

                <button
                    type="button"
                    className="cashback-cancel-button"
                 onClick={() => settings.requestLeave(null)}>
                    Cancel
                </button>

                <button
                    type="button"
                    className="cashback-save-button"
                    onClick={saveCashbackSettings}
                >
                    Save Changes
                </button>

            </div>

        </div>
    );
}

/* =========================================================
   SERVICE CHARGE
========================================================= */

function serviceChargePayload(values) {
    return {
        enabled: values.enabled,
        applyTo: values.applyTo,
        defaultType: values.defaultType,
        maxLimit: Number(values.maxLimit),
        tiers: values.tiers
            .filter((item) => item.from.trim() && item.to.trim() && item.fee.trim())
            .map((item) => ({
                ...(typeof item.id === "string" && serverTaxClassId.test(item.id) ? { id: item.id } : {}),
                from: item.from.trim(),
                to: item.to.trim(),
                fee: item.fee.trim(),
                feeType: item.feeType,
                appliesTo: item.appliesTo,
            })),
    };
}

function ServiceChargeSettings() {
    const settings = usePosSettings();
    const savedId = useRef(null);
    const currency = settings.currency;
    const currencySymbol = settings.currencySymbol;
    const [enabled, setEnabled] = useConfigState("enabled", true);

    const [applyTo, setApplyTo] = useConfigState("applyTo", "order-total");

    const [defaultType, setDefaultType] =
        useConfigState("defaultType", "percentage");

    const [maxLimit, setMaxLimit] = useConfigState("maxLimit", "10");

    const [tiers, setTiers] = useConfigState("tiers", [
        {
            id: 1,
            from: "0",
            to: "100",
            fee: "5",
            feeType: "Percentage",
            appliesTo: "Dine-In",
        },
        {
            id: 2,
            from: "101",
            to: "500",
            fee: "8",
            feeType: "Percentage",
            appliesTo: "Delivery",
        },
        {
            id: 3,
            from: "501+",
            to: "50",
            fee: "Fixed",
            feeType: "Fixed",
            appliesTo: "Takeaway",
        },
    ]);

    const addTier = () => {
        setTiers((items) => [
            ...items,
            {
                id: Date.now(),
                from: "",
                to: "",
                fee: "",
                feeType: "Percentage",
                appliesTo: "Dine-In",
            },
        ]);
    };

    const removeTier = (id) => {
        setTiers((items) =>
            items.filter((item) => item.id !== id)
        );
    };

    const updateTier = (id, field, value) => {
        setTiers((items) =>
            items.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            )
        );
    };

    const applyServiceCharge = (record) => {
        savedId.current = record.id;
        setEnabled(Boolean(record.enabled));
        setApplyTo(record.applyTo);
        setDefaultType(record.defaultType);
        setMaxLimit(record.maxLimit === null || record.maxLimit === undefined ? "" : String(record.maxLimit));
        setTiers((record.tiers || []).map((item) => ({
            id: item.id,
            from: item.from,
            to: item.to,
            fee: item.fee,
            feeType: item.feeType,
            appliesTo: item.appliesTo,
        })));
        settings.session.baseline = { ...settings.session.draft };
    };

    useEffect(() => {
        if (!settings.storeId) return undefined;
        let active = true;
        getPosServiceCharges(settings.storeId)
            .then((record) => {
                if (active && record?.id) applyServiceCharge(record);
            })
            .catch((error) => {
                if (error instanceof ApiError && error.status === 404) return;
                if (active) alert(error?.message || "Unable to load service charge settings.");
            });
        return () => { active = false; };
    }, [settings.storeId]);

    const saveServiceChargeSettings = useSaveAction(async () => {
        if (!settings.storeId) {
            alert("Open Service Charges from a store before saving.");
            return;
        }

        if (!applyTo) {
            alert("Please select Apply To.");
            return;
        }

        if (!defaultType) {
            alert("Please select Default Charge Type.");
            return;
        }

        if (!maxLimit) {
            alert(
                "Please enter Maximum Service Charge Limit."
            );
            return;
        }

        if (enabled && tiers.some((item) => !item.from.trim() || !item.to.trim() || !item.fee.trim())) {
            alert("Each service charge tier needs a from, to, and fee.");
            return;
        }

        const payload = serviceChargePayload({
            enabled,
            applyTo,
            defaultType,
            maxLimit,
            tiers,
        });
        const record = savedId.current
            ? await updatePosServiceCharges(settings.storeId, payload)
            : await createPosServiceCharges(settings.storeId, payload);
        applyServiceCharge(record);
        return true;
    });

    return (
        <div className="pos-panel service-charge-panel">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <ConfigHeader />


            {/* =================================================
                GENERAL SETTINGS
            ================================================= */}

            <div className="service-charge-card">


                <div className="service-charge-general-grid">

                    {/* ENABLE */}

                    <div className="service-charge-setting">

                        <label>
                            Enable Service Charge
                        </label>

                        <button
                            type="button"
                            className={`service-charge-switch ${
                                enabled ? "active" : ""
                            }`}
                            onClick={() =>
                                setEnabled(
                                    (value) => !value
                                )
                            }
                            aria-pressed={enabled}
                        >
                            <span />
                        </button>

                    </div>


                    {/* APPLY TO */}

                    <div className="service-charge-setting">

                        <label>
                            Apply To
                        </label>

                        <div className="service-charge-select">

                            <select
                                value={applyTo}
                                onChange={(event) =>
                                    setApplyTo(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="order-total">
                                    Order Total
                                </option>

                                <option value="line-item">
                                    Each Line Item
                                </option>
                            </select>

                            <i className="bi bi-chevron-down" />

                        </div>

                    </div>


                    {/* DEFAULT CHARGE TYPE */}

                    <div className="service-charge-setting">

                        <label>
                            Default Charge Type
                        </label>

                        <div className="service-charge-select">

                            <select
                                value={defaultType}
                                onChange={(event) =>
                                    setDefaultType(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="percentage">
                                    Percentage
                                </option>

                                <option value="fixed">
                                    Fixed
                                </option>
                            </select>

                            <i className="bi bi-chevron-down" />

                        </div>

                    </div>


                    {/* MAXIMUM LIMIT */}

                    <div className="service-charge-setting">

                        <label>
                            Maximum Service Charge Limit
                        </label>

                        <div className="service-charge-limit-input">

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={maxLimit}
                                onChange={(event) =>
                                    setMaxLimit(
                                        event.target.value
                                    )
                                }
                            />

                            <span>{defaultType === "percentage" ? "%" : currencySymbol}</span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                SERVICE CHARGE TIERS
            ================================================= */}

            <div className="service-charge-card service-charge-tiers-card">

                <div className="service-charge-card-header">

                    <div className="service-charge-section-icon purple">
                        <i className="bi bi-list-ul" />
                    </div>

                    <div>

                        <h3>
                            Service Charge Tiers
                        </h3>

                        <p>
                            Configure tier-wise service charge
                            rules.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="service-charge-add-button"
                        onClick={addTier}
                    >
                        <i className="bi bi-plus-lg" />
                        Add Tier
                    </button>

                </div>


                {/* TABLE */}

                <div className="service-charge-table-wrapper">

                    <table className="service-charge-table">

                        <thead>

                            <tr>

                                <th>
                                    From ({currency})
                                </th>

                                <th>
                                    To ({currency})
                                </th>

                                <th>
                                    Fee
                                </th>

                                <th>
                                    Fee Type
                                </th>

                                <th>
                                    Applies To
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {tiers.map((tier) => (

                                <tr key={tier.id}>

                                    {/* FROM */}

                                    <td>

                                        <input
                                            type="text"
                                            value={tier.from}
                                            placeholder="From"
                                            onChange={(event) =>
                                                updateTier(
                                                    tier.id,
                                                    "from",
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* TO */}

                                    <td>

                                        <input
                                            type="text"
                                            value={tier.to}
                                            placeholder="To"
                                            onChange={(event) =>
                                                updateTier(
                                                    tier.id,
                                                    "to",
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </td>


                                    {/* FEE */}

                                    <td>

                                        <div className="service-charge-fee-input">

                                            <input
                                                type="text"
                                                value={tier.fee}
                                                placeholder="Fee"
                                                onChange={(event) =>
                                                    updateTier(
                                                        tier.id,
                                                        "fee",
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <span>{tier.feeType === "Percentage" ? "%" : currencySymbol}</span>

                                        </div>

                                    </td>


                                    {/* FEE TYPE */}

                                    <td>

                                        <div className="service-charge-table-select">

                                            <select
                                                value={
                                                    tier.feeType
                                                }
                                                onChange={(event) =>
                                                    updateTier(
                                                        tier.id,
                                                        "feeType",
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Percentage">
                                                    Percentage
                                                </option>

                                                <option value="Fixed">
                                                    Fixed
                                                </option>
                                            </select>

                                            <i className="bi bi-chevron-down" />

                                        </div>

                                    </td>


                                    {/* APPLIES TO */}

                                    <td>

                                        <div className="service-charge-table-select">

                                            <select
                                                value={
                                                    tier.appliesTo
                                                }
                                                onChange={(event) =>
                                                    updateTier(
                                                        tier.id,
                                                        "appliesTo",
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Dine-In">
                                                    Dine-In
                                                </option>

                                                <option value="Delivery">
                                                    Delivery
                                                </option>

                                                <option value="Takeaway">
                                                    Takeaway
                                                </option>

                                                <option value="All">
                                                    All
                                                </option>
                                            </select>

                                            <i className="bi bi-chevron-down" />

                                        </div>

                                    </td>


                                    {/* ACTIONS */}

                                    <td>

                                        <div className="service-charge-actions">

                                            <button
                                                type="button"
                                                className="service-charge-edit"
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>

                                            <button
                                                type="button"
                                                className="service-charge-delete"
                                                title="Delete"
                                                onClick={() =>
                                                    removeTier(
                                                        tier.id
                                                    )
                                                }
                                            >
                                                <i className="bi bi-trash3" />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>


                {/* FOOTER */}

                <div className="service-charge-table-footer">

                    <span>
                        Showing 1 to {tiers.length} of{" "}
                        {tiers.length} entries
                    </span>

                    <div className="service-charge-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            <i className="bi bi-chevron-left" />
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            1
                        </button>

                        <button type="button">
                            <i className="bi bi-chevron-right" />
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                PAGE ACTIONS
            ================================================= */}

            <div className="service-charge-page-actions pos-form-actions">

                <button
                    type="button"
                    className="service-charge-cancel-button"
                 onClick={() => settings.requestLeave(null)}>
                    Cancel
                </button>

                <button
                    type="button"
                    className="service-charge-save-button"
                    onClick={saveServiceChargeSettings}
                >
                    Save Changes
                </button>

            </div>

        </div>
    );
}


function readDenominationFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The image could not be read. Please try again."));
        reader.readAsDataURL(file);
    });
}

function denominationRows(items) {
    return (items || []).map((item) => ({
        id: item.id,
        amount: String(item.amount),
        image: item.imageData,
        imageName: item.imageName,
        file: null,
    }));
}

function DenominationSettings() {
    const settings = usePosSettings();
    const savedId = useRef(null);
    
    
    

    

    

    

    

    

    

    /* ---------------------------------------------------------
       EMPTY LISTS
    --------------------------------------------------------- */

    const [cashDenominations, setCashDenominations] =
        useConfigState("cashDenominations", []);

    const [coinDenominations, setCoinDenominations] =
        useConfigState("coinDenominations", []);

    const applyDenominations = (record) => {
        savedId.current = record.id;
        setCashDenominations(denominationRows(record.cashDenominations));
        setCoinDenominations(denominationRows(record.coinDenominations));
        settings.session.baseline = { ...settings.session.draft };
    };

    useEffect(() => {
        if (!settings.storeId) return undefined;
        let active = true;
        getPosCashDenominations(settings.storeId)
            .then((record) => {
                if (active && record?.id) applyDenominations(record);
            })
            .catch((error) => {
                if (error instanceof ApiError && error.status === 404) return;
                if (active) alert(error?.message || "Unable to load cash denominations.");
            });
        return () => { active = false; };
    }, [settings.storeId]);

    

    

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

    

    /* ---------------------------------------------------------
       SAVE
    --------------------------------------------------------- */

    const saveDenominations = useSaveAction(async () => {
        if (!settings.storeId) {
            alert("Open Cash Denominations from a store before saving.");
            return;
        }

        const allDenominations = [...cashDenominations, ...coinDenominations];

        const invalidAmount =
            allDenominations.some(
                (item) => !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0
            );

        const invalidImage =
            allDenominations.some(
                (item) => !item.image && !item.file
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

        const oversized = allDenominations.some((item) => item.file && item.file.size > 1024 * 1024);
        if (oversized) {
            alert("Each denomination image must be 1 MB or smaller.");
            return;
        }

        const toItem = async (item) => {
            const imageData = item.file ? await readDenominationFile(item.file) : item.image;
            if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
                throw new Error("Please select a PNG, JPG, or WEBP image for every denomination.");
            }
            return {
                ...(typeof item.id === "string" && serverTaxClassId.test(item.id) ? { id: item.id } : {}),
                amount: Number(item.amount),
                imageName: item.imageName || "denomination",
                imageData,
            };
        };

        const payload = {
            cashDenominations: await Promise.all(cashDenominations.map(toItem)),
            coinDenominations: await Promise.all(coinDenominations.map(toItem)),
        };
        const record = savedId.current
            ? await updatePosCashDenominations(settings.storeId, payload)
            : await createPosCashDenominations(settings.storeId, payload);
        applyDenominations(record);
        return true;
    });

    return (
        <div className="pos-panel opening-denominations-panel denomination-split-panel cash-settings-panel">
            {/* =================================================
                HEADER
            ================================================= */}

            <ConfigHeader />

            {/* =================================================
                GENERAL SETTINGS
            ================================================= */}

            

            <div className="denomination-config-grid">
                <>
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


                    </>
            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="settings-actions pos-form-actions">
                <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
<button
                    type="button"
                    className="pos-primary-button"
                    onClick={saveDenominations}
                >
                    {"Save Changes"}
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   PAYMENTS
========================================================= */

function PaymentSettings() {
    const settings = usePosSettings();
    
    
    const [provider, setProvider] = useConfigState("provider", "Kickback");

    const [deviceId, setDeviceId] = useConfigState("deviceId", "");
    const [merchantId, setMerchantId] = useConfigState("merchantId", "");
    const [terminalId, setTerminalId] = useConfigState("terminalId", "");
    const [secretKey, setSecretKey] = useConfigState("secretKey", "");
    const [webhookUrl, setWebhookUrl] = useConfigState("webhookUrl", "");

    const handleProviderChange = (value) => {
        setProvider(value);

        if (value !== "Payroc") {
            setTerminalId("");
        }
    };

    const savePaymentSettings = useSaveAction(() => {
        /* API integration will be added here. */

        if (!provider) {
            alert("Please select a payment gateway provider.");
            return;
        }

        if (!deviceId.trim()) {
            alert("Please enter Device ID.");
            return;
        }

        if (!merchantId.trim()) {
            alert("Please enter Merchant ID.");
            return;
        }

        if (provider === "Payroc" && !terminalId.trim()) {
            alert("Please enter Terminal ID.");
            return;
        }

        if (!secretKey.trim()) {
            alert("Please enter Secret Key.");
            return;
        }

        if (!webhookUrl.trim()) {
            alert("Please enter Webhook URL.");
            return;
        }

        return true;
    });

    return (
        <div className="pos-panel card-payment-panel">
            <ConfigHeader />

            <div className="settings-form">

                {/* PAYMENT GATEWAY PROVIDER */}

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
                                        provider === "Kickback"
                                    }
                                    onChange={(event) =>
                                        handleProviderChange(
                                            event.target.value
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
                                        provider === "Payroc"
                                    }
                                    onChange={(event) =>
                                        handleProviderChange(
                                            event.target.value
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


                {/* DEVICE ID */}

                <SettingInput
                    label="Device ID"
                    value={deviceId}
                    onChange={setDeviceId}
                    placeholder="Enter device ID"
                />


                {/* MERCHANT ID */}

                <SettingInput
                    label="Merchant ID"
                    value={merchantId}
                    onChange={setMerchantId}
                    placeholder="Enter merchant ID"
                />


                {/* TERMINAL ID - PAYROC ONLY */}

                {provider === "Payroc" && (
                    <SettingInput
                        label="Terminal ID"
                        value={terminalId}
                        onChange={setTerminalId}
                        placeholder="Enter terminal ID"
                    />
                )}


                {/* SECRET KEY */}

                <SettingInput
                    label="Secret Key"
                    value={secretKey}
                    onChange={setSecretKey}
                    placeholder="Enter secret key"
                    type="password"
                />


                {/* WEBHOOK URL */}

                <SettingInput
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={setWebhookUrl}
                    placeholder="Enter webhook URL"
                />


                {/* SAVE */}

                <div className="settings-actions pos-form-actions">
                    <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
<button
                        type="button"
                        className="pos-primary-button"
                        onClick={savePaymentSettings}
                    >
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

// These sample records are editable. Replace them with API data in production.
const initialRegisters = [
    { id: "reg-1", name: "REG-01", pos: "SUNMI-D3-001", maxCash: "500", safeDrop: true, status: "Active" },
    { id: "reg-2", name: "REG-02", pos: "SUNMI-D3-002", maxCash: "500", safeDrop: true, status: "Active" },
    { id: "reg-3", name: "REG-03", pos: "SUNMI-D3-003", maxCash: "300", safeDrop: false, status: "Inactive" },
];
const initialMappings = initialRegisters.map((register, index) => ({
    id: `mapping-${index + 1}`, registerId: register.id,
    terminal: index < 2 ? `LANE3000-00${index + 1}` : "",
    printer: `STAR-0${index + 1}`, drawer: `DRAWER-0${index + 1}`,
    status: index < 2 ? "Active" : "Setup",
}));
const initialSafeSettings = {
    enabled: true, primarySafe: "SAFE-01", dropEnabled: true,
    threshold: "400", minimum: "100", maximum: "1000", managerApproval: true,
    cashierInitiated: true, reasonRequired: true, tubeSize: "", tubes: [], drops: [],
};
let recordSequence = 0;
const newRecordId = () => globalThis.crypto?.randomUUID?.() || `pos-${Date.now()}-${++recordSequence}`;
const normalized = (value) => value.trim().toLowerCase();
const validMoney = (value, allowZero = false) =>
    /^\d+(\.\d{1,2})?$/.test(String(value)) && Number.isFinite(Number(value)) &&
    (allowZero ? Number(value) >= 0 : Number(value) > 0);

function ConfigField({ label, children }) {
    return <label className="pc-field"><span>{label}</span>{children}</label>;
}
function ConfigSwitch({ label, checked, onChange, disabled = false }) {
    return <label className={`pc-switch-field ${disabled ? "pc-muted" : ""}`}>
        <span>{label}</span>
        <input type="checkbox" role="switch" checked={checked} disabled={disabled}
            onChange={(event) => onChange(event.target.checked)} />
        <span className="pc-switch-track" aria-hidden="true" />
    </label>;
}
function CashRegisterIcon() {
    return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M4 12h16v9H4zM7 12V5h10v7M10 5V2h4v3M7 17h10M10 20h4" />
        <path d="M10 8h4M7 14h1m3 0h1m3 0h1" />
    </svg>;
}
function ConfigHeader({ icon, title, description, children }) {
    const settings = usePosSettings();
    icon = icon || settings.card.icon;
    title = title || settings.card.title;
    description = description || settings.card.description;
    return <header className="pc-heading"><div className="pc-heading-title">
        <span className="pc-icon">{icon === "cash-register" ? <CashRegisterIcon /> : icon === "gear" ? <SettingsGearIcon /> : <i className={`bi bi-${icon}`} aria-hidden="true" />}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
    </div>{children}</header>;
}
function ConfigFooter({ onBack, onSave, disabled, message }) {
    return <footer className="pc-footer pos-form-actions"><p role="status">{message || "Changes are saved for this session. API integration is required for permanent storage."}</p>
        <button type="button" className="pc-button" onClick={onBack}>Cancel</button>
        <button type="button" className="pc-button pc-primary" disabled={disabled} onClick={onSave}>Save Changes</button>
    </footer>;
}
function ConfigBadge({ children }) {
    return <span className={`pc-badge pc-${children.toLowerCase()}`}>{children}</span>;
}

function RegisterConfiguration({ value, mappings, onSave, onBack }) {
    const settings = usePosSettings();
    const currency = settings.currency;
    
    const [rows, setRows] = useConfigState("rows", () => value.map((row) => ({ ...row })));
    const [editor, setEditor] = useConfigEditor();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const update = (field, next) => setEditor((row) => ({ ...row, [field]: next }));
    const openEditor = (row) => { setEditor({ ...row }); setError(""); setMessage(""); };
    const apply = (event) => {
        event?.preventDefault();
        const row = { ...editor, name: editor.name.trim(), pos: editor.pos.trim() };
        if (!row.name || !row.pos || !validMoney(row.maxCash)) {
            setError("Enter a register name, assigned POS and a positive maximum cash amount (up to two decimal places)."); return;
        }
        if (rows.some((other) => other.id !== row.id &&
            (normalized(other.name) === normalized(row.name) || normalized(other.pos) === normalized(row.pos)))) {
            setError("Register names and assigned POS devices must be unique."); return;
        }
        if (row.status === "Inactive" && mappings.some((mapping) => mapping.registerId === row.id && mapping.status === "Active")) {
            setError("Set this register's active mapping to Inactive or Setup before deactivating the register."); return;
        }
        const nextRows = rows.some((item) => item.id === row.id)
            ? rows.map((item) => item.id === row.id ? row : item) : [...rows, row];
        setRows(nextRows);
        setEditor(null); setError(""); setMessage("Register updated in the draft. Save Changes to keep it for this session.");
        return nextRows;
    };
    const remove = (row) => {
        if (mappings.some((mapping) => mapping.registerId === row.id)) {
            setError("Remove this register's terminal mapping before deleting the register."); return;
        }
        setRows((current) => current.filter((item) => item.id !== row.id));
        setError(""); setMessage("Register removed from the draft. Save Changes to keep this change.");
    };

    const saveChanges = useSaveAction(() => {
        const nextRows = editor ? apply() : rows;
        if (!nextRows) return false;
        onSave(nextRows);
        return true;
    });
    return <section className="pc-screen">
        <ConfigHeader icon="cash-register" title="Cash Register Settings" description="Configure registers, assigned POS devices and cash limits.">
            <button type="button" className="pc-button pc-primary" disabled={!!editor}
                onClick={() => openEditor({ id: newRecordId(), name: "", pos: "", maxCash: "", safeDrop: true, status: "Active" })}>+ Add Register</button>
        </ConfigHeader>
        {editor && <form className="pc-editor" onSubmit={apply}>
            <h3>{rows.some((row) => row.id === editor.id) ? "Edit Register" : "Add Register"}</h3>
            <div className="pc-form-grid">
                <ConfigField label="Register"><input autoFocus required value={editor.name} onChange={(e) => update("name", e.target.value)} placeholder="REG-04" /></ConfigField>
                <ConfigField label="Assigned POS"><input required value={editor.pos} onChange={(e) => update("pos", e.target.value)} placeholder="SUNMI-D3-004" /></ConfigField>
                <ConfigField label={`Maximum Cash (${currency})`}><input required type="number" min="0.01" step="0.01" value={editor.maxCash} onChange={(e) => update("maxCash", e.target.value)} /></ConfigField>
                <ConfigField label="Status"><select value={editor.status} onChange={(e) => update("status", e.target.value)}><option>Active</option><option>Inactive</option></select></ConfigField>
                <ConfigSwitch label="Safe Drop Enabled" checked={editor.safeDrop} onChange={(next) => update("safeDrop", next)} />
            </div>
            <div className="pc-editor-actions pos-form-actions"><button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button><button className="pc-button pc-primary" type="submit">Apply Register</button></div>
        </form>}
        {error && <p className="pc-error" role="alert">{error}</p>}
        <div className="pc-table-wrap"><table className="pc-table"><caption className="pc-sr-only">Configured cash registers</caption>
            <thead><tr>{["Register", "Assigned POS", "Max Cash", "Safe Drop", "Status", "Actions"].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><th scope="row">{row.name}</th><td>{row.pos}</td><td>{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(row.maxCash))}</td><td>{row.safeDrop ? "Enabled" : "Disabled"}</td><td><ConfigBadge>{row.status}</ConfigBadge></td><td><div className="pc-row-actions"><button type="button" disabled={!!editor} aria-label={`Edit ${row.name}`} onClick={() => openEditor(row)}>Edit</button><button type="button" disabled={!!editor} className="pc-danger" aria-label={`Remove ${row.name}`} onClick={() => remove(row)}>Remove</button></div></td></tr>)}
            {!rows.length && <tr><td colSpan="6" className="pc-empty">No registers yet. Add your first register.</td></tr>}</tbody>
        </table></div>
        <ConfigFooter onBack={onBack} message={message} onSave={saveChanges} />
    </section>;
}

function MappingConfiguration({ value, registers, onSave, onBack, onManageRegisters }) {
    const settings = usePosSettings();
    
    
    const [rows, setRows] = useConfigState("rows", () => value.map((row) => ({ ...row })));
    const [editor, setEditor] = useConfigEditor();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const update = (field, next) => setEditor((row) => ({ ...row, [field]: next }));
    const apply = (event) => {
        event?.preventDefault();
        const row = { ...editor, terminal: editor.terminal.trim(), printer: editor.printer.trim(), drawer: editor.drawer.trim() };
        const register = registers.find((item) => item.id === row.registerId);
        if (!register) { setError("Choose an existing register."); return; }
        if (row.status === "Active" && (register.status !== "Active" || !row.terminal || !row.printer || !row.drawer)) {
            setError("Active mappings require an active register, card terminal, printer and cash drawer. Use Setup for incomplete mappings."); return;
        }
        if (rows.some((other) => other.id !== row.id && (other.registerId === row.registerId ||
            (row.terminal && normalized(other.terminal) === normalized(row.terminal)) ||
            (row.drawer && normalized(other.drawer) === normalized(row.drawer))))) {
            setError("A register, card terminal or cash drawer cannot be assigned to more than one mapping."); return;
        }
        const nextRows = rows.some((item) => item.id === row.id)
            ? rows.map((item) => item.id === row.id ? row : item) : [...rows, row];
        setRows(nextRows);
        setEditor(null); setError(""); setMessage("Mapping applied to the draft. Save Changes to keep it for this session.");
        return nextRows;
    };

    const saveChanges = useSaveAction(() => {
        const nextRows = editor ? apply() : rows;
        if (!nextRows) return false;
        onSave(nextRows);
        return true;
    });
    return <section className="pc-screen">
        <ConfigHeader icon="display" title="Terminals & Registers" description="Map POS devices and peripherals to registers.">
            <button type="button" className="pc-button pc-primary" disabled={!!editor}
                onClick={() => { setEditor({ id: newRecordId(), registerId: registers.find((register) => !rows.some((row) => row.registerId === register.id))?.id || "", terminal: "", printer: "", drawer: "", status: "Setup" }); setError(""); setMessage(""); }}>+ Add Mapping</button>
        </ConfigHeader>
        <p className="pc-help">POS devices come from Cash Register Settings. Add a register there before mapping its peripherals.</p>
        {editor && <form className="pc-editor" onSubmit={apply}><h3>{rows.some((row) => row.id === editor.id) ? "Edit Mapping" : "Add Mapping"}</h3>
            {!registers.some((register) => !rows.some((row) => row.id !== editor.id && row.registerId === register.id)) && <div className="pc-mapping-notice" role="status">
                <p>{registers.length ? "All registers already have a mapping. Cancel to edit an existing mapping, or add and save a new register first." : "Add and save a register before creating its device mapping."}</p>
                <button type="button" className="pc-button" onClick={onManageRegisters}>Open Cash Register Settings</button>
            </div>}
           <div className="pc-form-grid">
  {/* Device Name */}
  <ConfigField label="Device Name">
    <input
      value={editor.deviceName}
      onChange={(e) => update("deviceName", e.target.value)}
      placeholder="POS Terminal 01"
      required
    />
  </ConfigField>

  {/* Device Type */}
  <ConfigField label="Device Type">
    <select
      value={editor.deviceType}
      onChange={(e) => update("deviceType", e.target.value)}
      required
    >
      <option value="">Select Device Type</option>
      <option value="POS Terminal">POS Terminal</option>
      <option value="Barcode Scanner">Barcode Scanner</option>
      <option value="Kitchen Display">Kitchen Display</option>
      <option value="Customer Display">Customer Display</option>
      <option value="Receipt Printer">Receipt Printer</option>
    </select>
  </ConfigField>

  {/* Device ID */}
  <ConfigField label="Device ID">
    <input
      value={editor.deviceId}
      onChange={(e) => update("deviceId", e.target.value)}
      placeholder="POS-001"
    />
  </ConfigField>

  {/* Serial Number */}
  <ConfigField label="Device Serial Number">
    <input
      value={editor.serialNumber}
      onChange={(e) => update("serialNumber", e.target.value)}
      placeholder="SN-POS-001"
    />
  </ConfigField>

  {/* Finger Print */}
  <ConfigField label="Device Finger Print">
    <input
      value={editor.fingerPrint}
      onChange={(e) => update("fingerPrint", e.target.value)}
      placeholder="FP-POS-001"
    />
  </ConfigField>

  {/* Quantity */}
  <ConfigField label="Quantity">
    <input
      type="number"
      min="1"
      value={editor.quantity}
      onChange={(e) => update("quantity", e.target.value)}
      placeholder="1"
      required
    />
  </ConfigField>

  {/* Status */}
  <ConfigField label="Status">
    <select
      value={editor.status}
      onChange={(e) => update("status", e.target.value)}
      required
    >
      <option>Active</option>
      <option>Inactive</option>
      <option>Setup</option>
    </select>
  </ConfigField>
</div>
        <div className="pc-editor-actions pos-form-actions"><button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button><button type="submit" className="pc-button pc-primary" disabled={!editor.registerId}>Apply Mapping</button></div></form>}
        {error && <p className="pc-error" role="alert">{error}</p>}
        <div className="pc-table-wrap"><table className="pc-table"><caption className="pc-sr-only">Terminal and register mappings</caption><thead><tr>{["Register", "POS Device", "Card Terminal", "Printer", "Cash Drawer", "Status", "Actions"].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>
            {rows.map((row) => { const register = registers.find((item) => item.id === row.registerId); return <tr key={row.id}><th scope="row">{register?.name || "Missing register"}</th><td>{register?.pos || "—"}</td><td>{row.terminal || "—"}</td><td>{row.printer || "—"}</td><td>{row.drawer || "—"}</td><td><ConfigBadge>{row.status}</ConfigBadge></td><td><div className="pc-row-actions"><button type="button" disabled={!!editor} aria-label={`Edit mapping for ${register?.name}`} onClick={() => { setEditor({ ...row }); setError(""); setMessage(""); }}>Edit</button><button type="button" disabled={!!editor} className="pc-danger" aria-label={`Remove mapping for ${register?.name}`} onClick={() => { setRows((current) => current.filter((item) => item.id !== row.id)); setError(""); setMessage("Mapping removed from the draft. Save Changes to keep this change."); }}>Remove</button></div></td></tr>; })}
            {!rows.length && <tr><td colSpan="7" className="pc-empty">No mappings yet. Add a mapping to connect your devices.</td></tr>}
        </tbody></table></div>
        <ConfigFooter onBack={onBack} message={message} onSave={saveChanges} />
    </section>;
}

function SafeConfiguration({ value, onSave, onBack }) {
    const settings = usePosSettings();
    const currency = settings.currency;
    
    const [draft, setDraft] = useConfigState("draft", () => ({ ...value, tubes: value.tubes.map((row) => ({ ...row })), drops: value.drops.map((row) => ({ ...row })) }));
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [uploads, setUploads] = useState(0);
    const update = (field, next) => { setDraft((current) => ({ ...current, [field]: next })); setMessage(""); setError(""); };
    const updateRow = (list, id, patch) => {
        setDraft((current) => ({ ...current, [list]: current[list].map((row) => row.id === id ? { ...row, ...patch } : row) })); setMessage("");
    };
    const upload = (id, file) => {
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setError("Select a PNG, JPG or WEBP image smaller than 2 MB."); return;
        }
        setUploads((count) => count + 1); setError("");
        const reader = new FileReader();
        reader.onload = () => updateRow("drops", id, { image: reader.result, imageName: file.name });
        reader.onerror = () => setError("The image could not be read. Please try again.");
        reader.onloadend = () => setUploads((count) => count - 1);
        reader.readAsDataURL(file);
    };
    const save = useSaveAction(() => {
        if (draft.enabled && !draft.primarySafe.trim()) { setError("Enter a primary safe."); return; }
        if (draft.enabled && draft.dropEnabled && (![draft.threshold, draft.minimum, draft.maximum].every((amount) => validMoney(amount)) || Number(draft.minimum) > Number(draft.maximum))) {
            setError("Enter positive drop amounts with up to two decimal places. Minimum drop must not exceed maximum drop."); return;
        }
        if (draft.tubeSize && (!Number.isSafeInteger(Number(draft.tubeSize)) || Number(draft.tubeSize) <= 0)) { setError("Tube size must be a positive whole number."); return; }
        if (draft.tubes.some((row) => !validMoney(row.amount) || !Number.isSafeInteger(Number(row.quantity)) || Number(row.quantity) <= 0)) { setError("Every tube needs a positive amount and a positive whole-number quantity."); return; }
        if (draft.drops.some((row) => !validMoney(row.amount) || !row.image)) { setError("Every safe-drop denomination needs a positive amount and an image."); return; }
        if ([draft.tubes, draft.drops].some((list) => new Set(list.map((row) => Number(row.amount))).size !== list.length)) { setError("Denomination amounts must be unique within each list."); return; }
        if (uploads > 0) { setError("Please wait for the image upload to finish."); return false; }
        onSave({ ...draft, primarySafe: draft.primarySafe.trim(), dropEnabled: draft.enabled && draft.dropEnabled }); setError(""); return true;
    });
    const moneyField = (label, field) => <ConfigField label={`${label} (${currency})`}><input type="number" min="0.01" step="0.01" value={draft[field]} onChange={(e) => update(field, e.target.value)} /></ConfigField>;
    return <section className="pc-screen">
        <ConfigHeader icon="safe" title="Safe & Safe Drop" description="Manage your safe, drop rules and cash-handling denominations." />
        <div className="pc-safe-grid">
            <section className="pc-card"><h3>Safe Management</h3><ConfigSwitch label="Safe Enabled" checked={draft.enabled} onChange={(next) => { setDraft((current) => ({ ...current, enabled: next, dropEnabled: next ? current.dropEnabled : false })); setMessage(""); }} />
                <fieldset disabled={!draft.enabled}><ConfigField label="Primary Safe"><input value={draft.primarySafe} placeholder="SAFE-01" onChange={(e) => update("primarySafe", e.target.value)} /></ConfigField></fieldset>
                <ConfigField label="Currency"><select value={currency} disabled aria-label="Store currency (managed in Currency & Taxes)"><option value={currency}>{currency}</option></select></ConfigField>
            </section>
            <section className="pc-card"><h3>Safe Drop</h3><ConfigSwitch label="Safe Drop Enabled" checked={draft.dropEnabled} disabled={!draft.enabled} onChange={(next) => update("dropEnabled", next)} />
                <fieldset disabled={!draft.enabled || !draft.dropEnabled}>{moneyField("Trigger Threshold", "threshold")}{moneyField("Minimum Drop", "minimum")}{moneyField("Maximum Drop", "maximum")}</fieldset>
            </section>
            <section className="pc-card"><h3>Approval & Permissions</h3><fieldset disabled={!draft.enabled || !draft.dropEnabled}>
                <ConfigSwitch label="Manager Approval Required" checked={draft.managerApproval} onChange={(next) => update("managerApproval", next)} />
                <ConfigSwitch label="Cashier Can Initiate" checked={draft.cashierInitiated} onChange={(next) => update("cashierInitiated", next)} />
                <ConfigSwitch label="Reason Required" checked={draft.reasonRequired} onChange={(next) => update("reasonRequired", next)} />
            </fieldset><p className="pc-help">Drop controls are available when the safe and safe drop are enabled.</p></section>
        </div>
        <section className="pc-card pc-spaced"><h3>Tube Settings</h3><div className="pc-form-grid">
            <ConfigField label="Safe Drop Tube Size"><input type="number" min="1" step="1" value={draft.tubeSize} placeholder="Enter tube size" onChange={(e) => update("tubeSize", e.target.value)} /></ConfigField>
        </div></section>
        <section className="pc-card pc-spaced"><div className="pc-section-heading"><div><h3>Manage Tube Denominations</h3><p>Set the amount and quantity for each tube denomination.</p></div><button type="button" className="pc-button" onClick={() => update("tubes", [...draft.tubes, { id: newRecordId(), amount: "", quantity: "" }])}>+ Add Denomination</button></div>
            <div className="pc-table-wrap"><table className="pc-table"><caption className="pc-sr-only">Tube denominations</caption><thead><tr>{["Currency", "Amount", "Quantity", "Actions"].map((text) => <th key={text} scope="col">{text}</th>)}</tr></thead><tbody>{draft.tubes.map((row, index) => <tr key={row.id}><td>{currency}</td><td><input aria-label={`Tube ${index + 1} amount`} type="number" min="0.01" step="0.01" value={row.amount} onChange={(e) => updateRow("tubes", row.id, { amount: e.target.value })} /></td><td><input aria-label={`Tube ${index + 1} quantity`} type="number" min="1" step="1" value={row.quantity} onChange={(e) => updateRow("tubes", row.id, { quantity: e.target.value })} /></td><td><button type="button" className="pc-button pc-danger" aria-label={`Remove tube ${index + 1}`} onClick={() => update("tubes", draft.tubes.filter((item) => item.id !== row.id))}>Remove</button></td></tr>)}{!draft.tubes.length && <tr><td colSpan="4" className="pc-empty">No tube denominations added yet.</td></tr>}</tbody></table></div>
        </section>
        <section className="pc-card pc-spaced"><div className="pc-section-heading"><div><h3>Manage Safe Drop Denominations</h3><p>Add amounts and denomination images for safe drops.</p></div><button type="button" className="pc-button" onClick={() => update("drops", [...draft.drops, { id: newRecordId(), amount: "", image: "", imageName: "" }])}>+ Add Denomination</button></div>
            {!draft.drops.length && <p className="pc-empty">No safe-drop denominations added yet.</p>}
            {draft.drops.map((row, index) => <div className="pc-denomination" key={row.id}><ConfigField label={`Amount (${currency})`}><input type="number" min="0.01" step="0.01" value={row.amount} onChange={(e) => updateRow("drops", row.id, { amount: e.target.value })} /></ConfigField><div className="pc-upload">{row.image && <img src={row.image} alt={`Safe-drop denomination ${row.amount}`} />}<ConfigField label="Denomination Image"><input type="file" disabled={uploads > 0} accept="image/png,image/jpeg,image/webp" onChange={(e) => { upload(row.id, e.target.files?.[0]); e.target.value = ""; }} /><small>{row.imageName || "PNG, JPG or WEBP · Up to 2 MB"}</small></ConfigField></div><button type="button" className="pc-button pc-danger" aria-label={`Remove safe-drop denomination ${index + 1}`} onClick={() => update("drops", draft.drops.filter((item) => item.id !== row.id))}>Remove</button></div>)}
        </section>
        {error && <p role="alert" className="pc-error">{error}</p>}
        <ConfigFooter onBack={onBack} onSave={save} disabled={uploads > 0} message={uploads > 0 ? "Reading denomination image…" : message} />
    </section>;
}


export default function PosConfiguration({ merchantId, storeId, store } = {}) {
    const [registers, setRegisters] = useState(initialRegisters);
    const [mappings, setMappings] = useState(initialMappings);
    const [safeSettings, setSafeSettings] = useState(initialSafeSettings);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");


    const [storeCurrency, setStoreCurrency] = useState(store?.currency || "USD");
    const savedScreens = useRef({});
    const [pendingLeave, setPendingLeave] = useState(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const saveLock = useRef(false);
    const session = useMemo(() => ({ saved: savedScreens.current[selectedConfig] || {}, baseline: {}, draft: {}, resets: {}, save: null, editorDirty: null, resetEditor: null }), [selectedConfig]);
    const isDirty = () => snapshotKey(session.draft) !== snapshotKey(session.baseline) || !!session.editorDirty?.();
    const leave = (target) => { setPendingLeave(null); setNotice(""); setSelectedConfig(target); };
    const discardChanges = () => {
        session.draft = { ...session.baseline };
        Object.values(session.resets).forEach((reset) => reset());
        session.resetEditor?.();
        setPendingLeave(null);
        setNotice("Unsaved changes discarded.");
    };
    const requestLeave = (target = null) => {
        if (saveLock.current) return;
        if (isDirty()) setPendingLeave({ target });
        else leave(target);
    };
    const saveChanges = async () => {
        if (saveLock.current || !session.save) return;
        saveLock.current = true; setBusy(true);
        try {
            if (await session.save() !== true) { setPendingLeave(null); return; }
            // Newer screens already save through their existing parent setters.
            if (!["cash-register", "terminal-mapping", "safe-drop"].includes(selectedConfig)) savedScreens.current[selectedConfig] = { ...session.draft };
            if (selectedConfig === "tax") setStoreCurrency(session.draft.currency);
            session.baseline = { ...session.draft };
            setPendingLeave(null);
            setNotice("Changes are updated.");
        } catch (error) {
            setPendingLeave(null);
            alert(error?.message || "Unable to save changes. Please try again.");
        } finally { saveLock.current = false; setBusy(false); }
    };
    useEffect(() => {
        const preventLoss = (event) => { if (isDirty() || saveLock.current) { event.preventDefault(); event.returnValue = ""; } };
        window.addEventListener("beforeunload", preventLoss);
        return () => window.removeEventListener("beforeunload", preventLoss);
    }, [session]);
    const currencySymbol = new Intl.NumberFormat("en", { style: "currency", currency: storeCurrency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency").value;
    const settings = { session, currency: storeCurrency, currencySymbol, merchantId, storeId, requestLeave, saveChanges, clearNotice: () => setNotice(""), card: configurationCards.find((card) => card.component === selectedConfig) };

    const filteredCards = configurationCards.filter((card) => {
        const search = searchQuery.trim().toLowerCase();

        if (!search) {
            return true;
        }

        return (
            card.title.toLowerCase().includes(search) ||
            card.description.toLowerCase().includes(search)
        );
    });

    const renderSelectedContent = () => {
        switch (selectedConfig) {
            case "tax":
                return <TaxConfiguration />;

            case "service":
                return <ServiceChargeSettings />;

            case "cashback":
                return <CashbackSettings />;

            case "opening-balance":
                return <OpeningBalanceSettings />;

            case "cash-denominations":
                return <DenominationSettings key="cash" section="cash" />;

            case "safe-drop":
                return <SafeConfiguration value={safeSettings} onSave={setSafeSettings} onBack={() => requestLeave(null)} />;

            case "payments":
                return <PaymentSettings />;

            case "cash-register":
                return <RegisterConfiguration value={registers} mappings={mappings} onSave={setRegisters} onBack={() => requestLeave(null)} />;

            case "terminal-mapping":
                return <MappingConfiguration value={mappings} registers={registers} onSave={setMappings} onBack={() => requestLeave(null)} onManageRegisters={() => requestLeave("cash-register")} />;

            default:
                return null;
        }
    };

    if (selectedConfig) {
    return (
        <PosSettingsContext.Provider value={settings}>
        <div className="page-content pos-page-content">

            <div className="pos-config-detail-header">

                <button
                    type="button"
                    className="pos-back-button"
                    onClick={() => requestLeave(null)}
                >
                    <i className="bi bi-arrow-left" />
                    <span>Back to POS Configuration</span>
                </button>

            </div>

            <div className="pos-config-detail-card">
                <fieldset className="pos-screen-lock" disabled={busy} aria-busy={busy}>{renderSelectedContent()}</fieldset>
            </div>
            {notice && <div className="pos-update-notice" role="status">{notice}</div>}

        </div>
        {pendingLeave && <SettingsChangeDialog busy={busy} onSave={saveChanges} onDiscard={discardChanges} onStay={() => setPendingLeave(null)} />}
        </PosSettingsContext.Provider>
    );
}

    return (
        <div className="page-content pos-page-content">
            <div className="page-header pos-config-page-header">
                <div>
                    <h1>POS Configuration</h1>
                    <p>
                        Configure point-of-sale settings for your merchant stores.
                    </p>
                </div>

                <div className="pos-config-search">
                    <i className="bi bi-search" />

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) =>
                            setSearchQuery(event.target.value)
                        }
                        placeholder="Search configuration..."
                        aria-label="Search configuration"
                    />
                </div>
            </div>

            <div className="pos-config-card pos-config-cards-container">
                <div className="pos-config-cards-grid">
                    {filteredCards.map((card) => (
                        <button
                            key={card.id}
                            type="button"
                            disabled={!card.enabled}
                            className={`pos-config-option-card ${
                                card.enabled ? "" : "disabled"
                            }`}
                            onClick={() => {
                                if (card.enabled) {
                                    setSelectedConfig(card.component);
                                }
                            }}
                        >
                            <div
                                className={`pos-config-option-icon ${card.iconClass}`}
                            >
                                {card.icon === "cash-register" ? <CashRegisterIcon /> : <i className={`bi bi-${card.icon}`} />}
                            </div>

                            <div className="pos-config-option-content">
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                            </div>

                            <i className="bi bi-chevron-right pos-config-option-arrow" />
                        </button>
                    ))}
                </div>

                {filteredCards.length === 0 && (
                    <div className="pos-config-no-results">
                        <i className="bi bi-search" />
                        <h3>No configuration found</h3>
                        <p>
                            Try searching with a different configuration name.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
