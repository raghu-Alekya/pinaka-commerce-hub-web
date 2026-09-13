import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersSeed, stores } from "../data/data";

export default function Users({ merchantId, storeId, store }) {
    const nav = useNavigate();

    const [list, setList] = useState(
        () =>
            JSON.parse(localStorage.getItem("pchUsers") || "null") ||
            usersSeed
    );

    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [storeFilter, setStoreFilter] = useState("all");

    /*
     * Use the store selected in Store Configuration.
     * This prevents Users from showing an old store from localStorage.
     */
    const currentStore =
        store ||
        stores.find((s) => String(s.id) === String(storeId)) ||
        stores[0];

    const [form, setForm] = useState({
        username: "",
        role: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        storeId: currentStore?.id || "",
        cashboxAccess: true,
        newPassword: "",
        resetPassword: "",
        loginPin: "",
        payLaterUser: false,
        payLaterUserStoreName: "",
    });

    const photo = useRef();

    /* -------------------------------------------------------
       FILTER USERS
    ------------------------------------------------------- */

    const filtered = useMemo(() => {
        return list.filter((u) => {
            const matchesSearch =
                !q ||
                `${u.username} ${u.firstName} ${u.lastName} ${u.email} ${u.storeName}`
                    .toLowerCase()
                    .includes(q.toLowerCase());

            const matchesRole =
                !roleFilter || u.role === roleFilter;

            const matchesStore =
                storeFilter === "all" ||
                String(u.storeId) === storeFilter;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStore
            );
        });
    }, [list, q, roleFilter, storeFilter]);

    /* -------------------------------------------------------
       SAVE USERS TO LOCAL STORAGE
    ------------------------------------------------------- */

    useEffect(() => {
        localStorage.setItem(
            "pchUsers",
            JSON.stringify(list)
        );
    }, [list]);

    /* -------------------------------------------------------
       START ADD / EDIT
    ------------------------------------------------------- */

    const start = (user = null) => {
        setEditing(user?.id || null);

        if (user) {
            setForm({
                username: user.username || "",
                role: user.role || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                storeId:
                    user.storeId ||
                    currentStore?.id ||
                    "",
                cashboxAccess:
                    user.cashboxAccess ?? true,
                newPassword: "",
                resetPassword: "",
                loginPin: "",
                payLaterUser:
                    user.payLaterUser ?? false,
                payLaterUserStoreName:
                    user.payLaterUserStoreName || "",
            });
        } else {
            setForm({
                username: "",
                role: "",
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                storeId: currentStore?.id || "",
                cashboxAccess: true,
                newPassword: "",
                resetPassword: "",
                loginPin: "",
                payLaterUser: false,
                payLaterUserStoreName: "",
            });
        }

        setAdding(true);
    };

    /* -------------------------------------------------------
       SAVE USER
    ------------------------------------------------------- */

    const save = (event) => {
        event.preventDefault();

        if (
            !form.username ||
            !form.firstName ||
            !form.lastName ||
            !form.role ||
            !form.email ||
            !form.storeId ||
            (!editing && form.newPassword.length < 8) ||
            (!editing && !/^\d{6}$/.test(form.loginPin))
        ) {
            alert(
                "Please complete all required fields. Password must be 8+ characters and PIN exactly 6 digits."
            );
            return;
        }

        if (
            form.resetPassword &&
            form.resetPassword !== form.newPassword
        ) {
            alert(
                "Reset Password must match Set New Password."
            );
            return;
        }

        const selectedStore =
            stores.find(
                (s) => String(s.id) === String(form.storeId)
            ) || currentStore;

        const user = {
            id: editing || `USR-${Date.now()}`,
            storeId: selectedStore.id,
            storeName: selectedStore.name,
            username: form.username,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
            email: form.email,
            phone: form.phone,
            cashboxAccess: form.cashboxAccess,
            payLaterUser: form.payLaterUser,
            payLaterUserStoreName:
                form.payLaterUserStoreName,
            status: "Active",
        };

        setList((previous) =>
            editing
                ? previous.map((item) =>
                    item.id === editing
                        ? { ...item, ...user }
                        : item
                )
                : [...previous, user]
        );

        localStorage.setItem(
            "pchCurrentUser",
            JSON.stringify(user)
        );

        /*
         * Persist immediately as well, so the new user
         * does not disappear when navigation happens.
         */
        const updatedList = editing
            ? list.map((item) =>
                item.id === editing
                    ? { ...item, ...user }
                    : item
            )
            : [...list, user];

        localStorage.setItem(
            "pchUsers",
            JSON.stringify(updatedList)
        );

        setAdding(false);

        nav(
            `/pos-configuration?storeId=${encodeURIComponent(
                selectedStore.id
            )}&userId=${encodeURIComponent(user.id)}`
        );
    };

    /* -------------------------------------------------------
       ADD / EDIT FORM
    ------------------------------------------------------- */

    if (adding) {
        return (
            <UserForm
                form={form}
                setForm={setForm}
                onSubmit={save}
                onCancel={() => setAdding(false)}
                photo={photo}
                onAddAnother={() => start()}
                editing={Boolean(editing)}
                currentStore={currentStore}
            />
        );
    }

    /* -------------------------------------------------------
       USERS LIST
    ------------------------------------------------------- */

    return (
        <div className="page-content users-page">
            <section>
                <div className="page-header users-header">
                    <div>
                        <div className="breadcrumb-area">
                            <button
                                className="link-button"
                                onClick={() =>
                                    nav(
                                        merchantId
                                            ? `/merchants/${merchantId}/stores`
                                            : "/stores"
                                    )
                                }
                            >
                                <i className="bi bi-arrow-left" />
                                Stores
                            </button>

                            <span>/</span>
                            <span>Users</span>
                        </div>

                        <h1>Users</h1>

                        <p>
                            Manage users associated with the
                            selected store.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => start()}
                    >
                        <i className="bi bi-plus-lg" />
                        Add User
                    </button>
                </div>

                {/* SELECTED STORE */}

                <div className="selected-store-card">
                    <div className="selected-store-main">
                        <div className="selected-store-icon">
                            <i className="bi bi-shop" />
                        </div>

                        <div className="selected-store-info">
                            <h3>
                                {currentStore?.name ||
                                    "Selected Store"}
                            </h3>

                            <div className="selected-store-meta">
                                <span>
                                    Store ID:{" "}
                                    {currentStore?.id || "—"}
                                </span>

                                <span className="meta-dot">
                                    •
                                </span>

                                <span>
                                    {currentStore?.type || "—"}
                                </span>

                                <span className="meta-dot">
                                    •
                                </span>

                                <span>
                                    {currentStore?.location ||
                                        "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="selected-store-status">
                        <span className="status-title">
                            Status
                        </span>

                        <span className="store-active-badge">
                            {currentStore?.status ||
                                "Active"}
                        </span>
                    </div>
                </div>

                {/* TOOLBAR */}

                <div className="users-toolbar">
                    <div className="users-toolbar-left">
                        <div className="user-search">
                            <i className="bi bi-search" />

                            <input
                                placeholder="Search users..."
                                value={q}
                                onChange={(event) =>
                                    setQ(event.target.value)
                                }
                            />
                        </div>

                        <select
                            className="store-filter"
                            value={storeFilter}
                            onChange={(event) =>
                                setStoreFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="all">
                                All Stores
                            </option>

                            {stores.map((item) => (
                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <select
                        className="role-filter"
                        value={roleFilter}
                        onChange={(event) =>
                            setRoleFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            All Roles
                        </option>

                        {[
                            "Admin",
                            "Shop manager",
                            "Manager",
                            "Cashier",
                            "Staff",
                        ].map((role) => (
                            <option
                                key={role}
                                value={role}
                            >
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* USERS TABLE */}

                <div className="users-table-card">
                    <div className="table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    {/* <th>Store</th> */}
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Cashdrawer</th>
                                    <th>Pay Later</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {user.firstName?.[0]}
                                                    {user.lastName?.[0]}
                                                </div>

                                                <span className="user-username">
                                                    {user.username}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            {user.firstName}{" "}
                                            {user.lastName}
                                        </td>

                                        <td>
                                            <span className="role-badge">
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* <td>
                                            <div className="store-table-cell">
                                                <i className="bi bi-shop" />
                                                {user.storeName}
                                            </div>
                                        </td> */}

                                        <td>
                                            {user.email}
                                        </td>

                                        <td>
                                            {user.phone}
                                        </td>

                                        <td>
                                            {user.cashboxAccess ? (
                                                <span className="cashbox-enabled">
                                                    Allowed
                                                </span>
                                            ) : (
                                                <span className="cashbox-disabled">
                                                    No Access
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {user.payLaterUser ? (
                                                <span className="cashbox-enabled">
                                                    Enabled
                                                </span>
                                            ) : (
                                                <span className="cashbox-disabled">
                                                    Disabled
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                <span className="status-dot" />
                                                {user.status}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className="table-action"
                                                onClick={() =>
                                                    start(user)
                                                }
                                                title="Edit User"
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* EMPTY STATE */}

                    {filtered.length === 0 && (
                        <div className="empty-users">
                            <div className="empty-icon">
                                <i className="bi bi-people" />
                            </div>

                            <h3>No users found</h3>

                            <p>
                                Add a user to this store to
                                get started.
                            </p>

                            <button
                                className="primary-button"
                                onClick={() => start()}
                            >
                                <i className="bi bi-plus-lg" />
                                Add User
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

/* =========================================================
   USER FORM
========================================================= */

function UserForm({
    form,
    setForm,
    onSubmit,
    onCancel,
    onAddAnother,
    photo,
    editing,
    currentStore,
}) {
    const [showPass, setShowPass] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const set = (key, value) => {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    return (
        <div className="page-content users-page">
            <div className="page-header users-header">
                <div>
                    <div className="breadcrumb-area">
                        <button
                            className="link-button"
                            onClick={onCancel}
                        >
                            <i className="bi bi-arrow-left" />
                            Users
                        </button>

                        <span>/</span>

                        <span>
                            {editing
                                ? "Edit User"
                                : "Add User"}
                        </span>
                    </div>

                    <h1>
                        {editing
                            ? "Edit User"
                            : "Add User"}
                    </h1>

                    <p>
                        Create a user and assign access
                        to the selected store.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={onAddAnother}
                >
                    <i className="bi bi-plus-lg" />
                    Add User
                </button>
            </div>

            <form
                className="user-form"
                onSubmit={onSubmit}
            >
                {/* USER INFORMATION */}

                <Card
                    icon="person"
                    color="purple"
                    title="User Information"
                    sub="Enter the user's account details."
                >
                    <div className="form-grid two-columns">
                        {field(
                            "Username",
                            "username",
                            "Enter username",
                            true,
                            "text",
                            form,
                            set
                        )}

                        <Select
                            label="Role"
                            value={form.role}
                            set={(value) =>
                                set("role", value)
                            }
                            options={[
                                "Admin",
                                "Shop manager",
                                "Manager",
                                "Cashier",
                                "Staff",
                            ]}
                        />

                        {field(
                            "First Name",
                            "firstName",
                            "Enter first name",
                            true,
                            "text",
                            form,
                            set
                        )}

                        {field(
                            "Last Name",
                            "lastName",
                            "Enter last name",
                            true,
                            "text",
                            form,
                            set
                        )}

                        {field(
                            "Email",
                            "email",
                            "name@example.com",
                            true,
                            "email",
                            form,
                            set
                        )}

                        {field(
                            "User Phone",
                            "phone",
                            "Enter phone number",
                            false,
                            "tel",
                            form,
                            set
                        )}
                    </div>
                </Card>

                {/* STORE ACCESS */}

                <Card
                    icon="shop"
                    color="orange"
                    title="Store Access"
                    sub="The user will be assigned to the selected store."
                >
                    <div className="form-grid two-columns">
                        <div className="field">
                            <label>
                                Store Name
                            </label>

                            <input
                                type="text"
                                value={
                                    currentStore?.name ||
                                    ""
                                }
                                readOnly
                            />

                            <small className="field-help">
                                Store is automatically assigned
                                from Store Configuration.
                            </small>
                        </div>

                        <div className="cashbox-access-box">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.cashboxAccess
                                    }
                                    onChange={(event) =>
                                        set(
                                            "cashboxAccess",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span className="custom-checkbox" />

                                <span className="checkbox-text">
                                    <strong>
                                        Cashdrawer Access
                                    </strong>

                                    <small>
                                        Allow this user to
                                        access cashdrawer
                                        operations for this
                                        store.
                                    </small>
                                </span>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* PAY LATER USER */}

                <Card
                    icon="credit-card"
                    color="blue"
                    title="Pay Later User"
                    sub="Configure Pay Later access for this user."
                >
                    <div className="form-grid two-columns">
                        <div className="cashbox-access-box">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.payLaterUser
                                    }
                                    onChange={(event) =>
                                        set(
                                            "payLaterUser",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span className="custom-checkbox" />

                                <span className="checkbox-text">
                                    <strong>
                                        Pay Later User
                                    </strong>

                                    <small>
                                        Allow this user to
                                        use Pay Later
                                        functionality.
                                    </small>
                                </span>
                            </label>
                        </div>

                        <div className="field">
                            <label>
                                Pay Later User Store Name
                            </label>

                            <input
                                type="text"
                                value={
                                    form.payLaterUserStoreName
                                }
                                placeholder="Enter Pay Later store name"
                                onChange={(event) =>
                                    set(
                                        "payLaterUserStoreName",
                                        event.target.value
                                    )
                                }
                            />

                            <small className="field-help">
                                Enter the Pay Later store
                                name manually.
                            </small>
                        </div>
                    </div>
                </Card>

                {/* PROFILE PHOTO */}

                <Card
                    icon="image"
                    color="blue"
                    title="Profile Photo"
                    sub="Upload a profile image for this user."
                >
                    <div className="profile-upload">
                        <div className="profile-preview">
                            <i className="bi bi-person" />
                        </div>

                        <div className="upload-content">
                            <label
                                className="upload-button"
                                htmlFor="profilePhoto"
                            >
                                <i className="bi bi-upload" />
                                Choose Photo
                            </label>

                            <input
                                ref={photo}
                                accept="image/png,image/jpeg,image/webp"
                                id="profilePhoto"
                                type="file"
                            />

                            <span className="file-name">
                                JPG, PNG or WEBP · Recommended
                                200 × 200 px
                            </span>
                        </div>
                    </div>
                </Card>

                {/* PASSWORD */}

                <Card
                    icon="shield-lock"
                    color="green"
                    title="Password & Login PIN"
                    sub="Set credentials for the user."
                >
                    <div className="form-grid two-columns">
                        {passwordField(
                            "Set New Password",
                            "newPassword",
                            "Enter new password",
                            form.newPassword,
                            (value) =>
                                set(
                                    "newPassword",
                                    value
                                ),
                            showPass,
                            () =>
                                setShowPass(
                                    !showPass
                                ),
                            true
                        )}

                        {passwordField(
                            "Reset Password",
                            "resetPassword",
                            "Re-enter password",
                            form.resetPassword,
                            (value) =>
                                set(
                                    "resetPassword",
                                    value
                                ),
                            showPass,
                            () =>
                                setShowPass(
                                    !showPass
                                ),
                            false
                        )}

                        {field(
                            "Login PIN",
                            "loginPin",
                            "Enter 6-digit PIN",
                            true,
                            "text",
                            form,
                            set
                        )}
                    </div>
                </Card>

                {/* FORM ACTIONS */}

                <div className="form-actions">
                    <button
                        className="cancel-btn"
                        type="button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="save-next-btn"
                        type="submit"
                    >
                        Save & Next
                        <i className="bi bi-arrow-right" />
                    </button>
                </div>
            </form>
        </div>
    );
}

/* =========================================================
   FIELD
========================================================= */

function field(
    label,
    key,
    placeholder,
    required = false,
    type = "text",
    form,
    set
) {
    return (
        <div className="field">
            <label>
                {label}

                {required && (
                    <span>*</span>
                )}
            </label>

            <input
                type={type}
                value={form[key] || ""}
                placeholder={placeholder}
                required={required}
                onChange={(event) =>
                    set(
                        key,
                        event.target.value
                    )
                }
            />
        </div>
    );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function passwordField(
    label,
    key,
    placeholder,
    value,
    onChange,
    show,
    toggle,
    required
) {
    return (
        <div className="field">
            <label>
                {label}

                {required && (
                    <span>*</span>
                )}
            </label>

            <div className="input-with-action">
                <input
                    type={
                        show
                            ? "text"
                            : "password"
                    }
                    value={value}
                    placeholder={placeholder}
                    required={required}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                />

                <button
                    className="input-action"
                    type="button"
                    onClick={toggle}
                >
                    <i
                        className={`bi ${show
                            ? "bi-eye-slash"
                            : "bi-eye"
                            }`}
                    />
                </button>
            </div>

            {key === "newPassword" && (
                <small className="field-help">
                    Use at least 8 characters.
                </small>
            )}

            {key === "loginPin" && (
                <small className="field-help">
                    Enter exactly 6 digits.
                </small>
            )}
        </div>
    );
}

/* =========================================================
   SELECT
========================================================= */

function Select({
    label,
    value,
    set,
    options,
}) {
    return (
        <div className="field">
            <label>
                {label} <span>*</span>
            </label>

            <select
                value={value}
                onChange={(event) =>
                    set(event.target.value)
                }
                required
            >
                <option value="">
                    Select{" "}
                    {label.toLowerCase()}
                </option>

                {options.map((option) => (
                    <option
                        value={option}
                        key={option}
                    >
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* =========================================================
   CARD
========================================================= */

function Card({
    icon,
    color,
    title,
    sub,
    children,
}) {
    return (
        <section className="form-card">
            <div className="form-card-header">
                <div
                    className={`section-icon ${color}`}
                >
                    <i
                        className={`bi bi-${icon}`}
                    />
                </div>

                <div>
                    <h2>{title}</h2>
                    <p>{sub}</p>
                </div>
            </div>

            <div className="form-card-body">
                {children}
            </div>
        </section>
    );
}