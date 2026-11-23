import { useEffect, useMemo, useState } from "react";
import { createPchUser, listPchUsers } from "../api/pchUsers";
import PhoneInputModule from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../styles/pch-users.css";

const PhoneInput = PhoneInputModule.default || PhoneInputModule;

const PCH_ROLES = [
  ["ADMIN", "Admin"], ["OWNER", "Owner"],
  ["SUPER_ADMIN", "Super-admin"], ["AGENT", "Agent"],
];
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  username: "",
  phoneNumber: "",
  email: "",
  role: "",
  password: "",
  confirmPassword: "",
};

export default function PchUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneDialCode, setPhoneDialCode] = useState("91");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    listPchUsers().then((rows) => { if (active) setUsers(rows); })
      .catch((error) => { if (active) setNotice(error.message || "Unable to load PCH users."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => [
      user.username,
      user.firstName,
      user.lastName,
      user.email,
      user.phoneNumber,
      user.role,
      user.status,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [search, users]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleAddUser = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    if (form.phoneNumber.replace(/\D/g, "").length <= phoneDialCode.length) {
      setNotice("Enter a phone number after the country code.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const { confirmPassword, ...payload } = form;
      const created = await createPchUser(payload);
      setUsers((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setAdding(false);
      setNotice("PCH user created.");
    } catch (error) {
      setNotice(error.message || "Unable to create PCH user.");
    } finally {
      setSaving(false);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setPhoneDialCode("91");
    setNotice("");
    setAdding(true);
  };

  const closeAddForm = () => {
    setForm(EMPTY_FORM);
    setPhoneDialCode("91");
    setNotice("");
    setAdding(false);
  };

  if (adding) {
    return <main className="pch-users-page">
      <header className="pch-users-header">
        <div>
          <button type="button" className="pch-users-back" onClick={closeAddForm}>
            <i className="bi bi-arrow-left" /> PCH Users
          </button>
          <h1>Add PCH User</h1>
          <p>Create a user account for the PCH platform.</p>
        </div>
      </header>

      <form className="pch-user-form" onSubmit={handleAddUser} autoComplete="off">
        {notice && <p className="pch-user-notice" role="status">{notice}</p>}
        <section className="pch-user-card">
          <div className="pch-user-card-heading">
            <span><i className="bi bi-person-vcard" /></span>
            <div><h2>Personal Details</h2><p>Enter the new user's identity and contact details.</p></div>
          </div>
          <div className="pch-user-fields">
            <label>First Name<input autoComplete="given-name" maxLength={100} required value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} placeholder="Enter first name" /></label>
            <label>Last Name<input autoComplete="family-name" maxLength={100} required value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} placeholder="Enter last name" /></label>
            <label>Username<input autoComplete="username" maxLength={100} required value={form.username} onChange={(event) => setField("username", event.target.value)} placeholder="Choose a username" /></label>
            <label className="pch-user-phone">Phone Number
              <PhoneInput country="in" enableSearch countryCodeEditable={false} autoFormat
                value={form.phoneNumber}
                onChange={(value, country) => {
                  setPhoneDialCode(String(country?.dialCode || ""));
                  setField("phoneNumber", value ? `+${value.replace(/\D/g, "")}` : "");
                }}
                inputProps={{ name: "phoneNumber", required: true, autoComplete: "tel", "aria-label": "Phone number with country code" }} />
            </label>
            <label>Email Address<input type="email" autoComplete="email" maxLength={255} required value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="name@example.com" /></label>
            <label>Role<select required value={form.role} onChange={(event) => setField("role", event.target.value)}><option value="" disabled>Select a role</option>{PCH_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </section>

        <section className="pch-user-card">
          <div className="pch-user-card-heading">
            <span><i className="bi bi-shield-lock" /></span>
            <div><h2>Login Details</h2><p>Set a password for the new account.</p></div>
          </div>
          <div className="pch-user-fields">
            <label>Password<input type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(event) => setField("password", event.target.value)} placeholder="Create a password" /></label>
            <label>Confirm Password<input type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} placeholder="Confirm password" /></label>
          </div>
        </section>

        <div className="pch-user-actions">
          <button type="button" className="pch-user-cancel" onClick={closeAddForm}>Cancel</button>
          <button type="submit" className="pch-user-primary" disabled={saving}>{saving ? "Adding…" : "Add PCH User"}</button>
        </div>
      </form>
    </main>;
  }

  return <main className="pch-users-page">
    {notice && <p className="pch-user-notice" role="status">{notice}</p>}
    <header className="pch-users-header">
      <div>
        <h1>PCH Users</h1>
        <p>Manage user accounts for the PCH platform.</p>
      </div>
      <button type="button" className="pch-user-primary" onClick={openAddForm}>
        <i className="bi bi-plus-lg" /> Add PCH User
      </button>
    </header>

    <section className="pch-users-list-card">
      <div className="pch-users-toolbar">
        <div className="pch-users-search">
          <i className="bi bi-search" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PCH users..." aria-label="Search PCH users" />
        </div>
        <span className="pch-users-count">{filteredUsers.length} users</span>
      </div>

      <div className="pch-users-table-wrap">
        <table className="pch-users-table">
          <thead><tr><th>User</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {filteredUsers.length ? filteredUsers.map((user) => <tr key={user.id || user.email}>
                <td><strong>{user.username || "—"}</strong></td>
                <td>{`${user.firstName} ${user.lastName}`.trim() || "—"}</td>
                <td><span className="pch-user-role">{PCH_ROLES.find(([value]) => value === user.role)?.[1] || user.role}</span></td>
                <td>{user.email || "—"}</td>
                <td>{user.phoneNumber || "—"}</td>
                <td><span className={`pch-user-status ${user.status.toLowerCase()}`}>{user.status}</span></td>
              </tr>)
                : <tr><td className="pch-users-table-message" colSpan={6}>{loading ? "Loading PCH users…" : "No PCH users to display yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </main>;
}
