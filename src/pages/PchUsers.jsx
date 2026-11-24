import { useEffect, useMemo, useRef, useState } from "react";
import { createPchUser, disablePchUser, enablePchUser, listPchUsers, updatePchUser } from "../api/pchUsers";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import FilterDropdown from "../components/FilterDropdown";
import ListActions from "../components/ListActions";
import Pagination from "../components/Pagination";
import { useAuth } from "../auth/AuthContext";
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
  const { user: signedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneDialCode, setPhoneDialCode] = useState("91");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [enablingId, setEnablingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [noticeType, setNoticeType] = useState("success");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    listPchUsers().then((rows) => { if (active) setUsers(rows); })
      .catch((error) => { if (active) setLoadError(error.message || "Unable to load PCH users."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => (!statusFilter || user.status === statusFilter) && [
      user.username,
      user.firstName,
      user.lastName,
      user.email,
      user.phoneNumber,
      user.role,
      user.status,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [search, statusFilter, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const visibleUsers = filteredUsers.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (saving) return;
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
    setNoticeType("success");
    try {
      const { confirmPassword, ...payload } = form;
      const saved = editingUser
        ? await updatePchUser(editingUser.id, payload)
        : await createPchUser(payload);
      setUsers((current) => editingUser
        ? current.map((user) => user.id === saved.id ? saved : user)
        : [saved, ...current]);
      setForm(EMPTY_FORM);
      setAdding(false);
      setEditingUser(null);
      setCurrentPage(1);
      setNoticeType("success");
      setNotice(editingUser ? "PCH user updated." : "PCH user created.");
    } catch (error) {
      setNoticeType("error");
      setNotice(error.message || "Unable to save PCH user.");
    } finally {
      setSaving(false);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setPhoneDialCode("91");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotice("");
    setNoticeType("success");
    setAdding(true);
    setEditingUser(null);
  };

  const openEditForm = (user) => {
    setForm({
      firstName: user.firstName || "", lastName: user.lastName || "",
      username: user.username || "", phoneNumber: user.phoneNumber || "",
      email: user.email || "", role: user.role || "",
      password: user.actualPassword || "", confirmPassword: user.actualPassword || "",
    });
    setNotice("");
    setNoticeType("success");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUser(user);
    setAdding(false);
  };

  const handleDisableUser = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const saved = await disablePchUser(deleteTarget.id);
      setUsers((current) => current.map((user) => user.id === saved.id ? saved : user));
      setDeleteTarget(null);
      setNotice("PCH user deactivated. Their sessions have been revoked.");
      setNoticeType("success");
    } catch (error) {
      setNoticeType("error");
      setDeleteError(error.message || "Unable to deactivate PCH user.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEnableUser = async (user) => {
    if (enablingId) return;
    setEnablingId(user.id);
    setNotice("");
    try {
      const saved = await enablePchUser(user.id);
      setUsers((current) => current.map((item) => item.id === saved.id ? saved : item));
      setNoticeType("success");
      setNotice(`${saved.username || saved.email} enabled.`);
    } catch (error) {
      setNoticeType("error");
      setNotice(error.message || "Unable to enable PCH user.");
    } finally {
      setEnablingId(null);
    }
  };

  const closeAddForm = () => {
    setForm(EMPTY_FORM);
    setPhoneDialCode("91");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotice("");
    setAdding(false);
    setEditingUser(null);
  };

  if (adding || editingUser) {
    return <main className="page-content pch-users-page">
      <header className="page-header pch-users-header">
        <div>
          <button type="button" className="pch-users-back" onClick={closeAddForm}>
            <i className="bi bi-arrow-left" /> PCH Users
          </button>
          <h1>{editingUser ? "Edit PCH User" : "Add PCH User"}</h1>
          <p>{editingUser ? "Update this PCH platform account." : "Create a user account for the PCH platform."}</p>
        </div>
      </header>

      <form className="pch-user-form" onSubmit={handleSaveUser} autoComplete="off">
        {notice && <div className={`alert pch-users-notice ${noticeType}`} role={noticeType === "error" ? "alert" : "status"}>{notice}</div>}
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
            <div><h2>Login Details</h2><p>{editingUser ? "Change the password here if needed." : "Set a password for the new account."}</p></div>
          </div>
          <div className="pch-user-fields">
            <label>Password<span className="pch-user-password-field"><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={form.password} onChange={(event) => { setField("password", event.target.value); setField("confirmPassword", ""); }} placeholder="Create a password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" /></button></span></label>
            <label>Confirm Password<span className="pch-user-password-field"><input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} placeholder="Confirm password" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword}><i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" /></button></span></label>
          </div>
        </section>

        <div className="pch-user-actions">
          <button type="button" className="pch-user-cancel" onClick={closeAddForm}>Cancel</button>
          <button type="submit" className="pch-user-primary" disabled={saving}>{saving ? "Saving…" : editingUser ? "Save Changes" : "Add PCH User"}</button>
        </div>
      </form>
    </main>;
  }

  return <main className="page-content pch-users-page">
    {notice && <div className={`alert pch-users-notice ${noticeType}`} role={noticeType === "error" ? "alert" : "status"}>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><i className="bi bi-x-lg" /></button></div>}
    {loadError && <div className="alert pch-users-notice error" role="alert">{loadError} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
    <header className="page-header pch-users-header">
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
          <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search PCH users..." aria-label="Search PCH users" />
        </div>
        <div className="pch-users-toolbar-actions">
          <FilterDropdown aria-label="PCH user status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}><option value="">All Status</option><option value="ACTIVE">Active</option><option value="DISABLED">Inactive</option></FilterDropdown>
          <button type="button" className="pch-users-reset" onClick={() => { setSearch(""); setStatusFilter(""); setCurrentPage(1); }}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Reset</button>
          <span className="pch-users-count">{filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}</span>
        </div>
      </div>

      <div className="pch-users-table-wrap">
        <table className="pch-users-table">
          <thead><tr><th>User</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleUsers.length ? visibleUsers.map((user) => <tr key={user.id || user.email}>
                <td><strong>{user.username || "—"}</strong></td>
                <td>{`${user.firstName} ${user.lastName}`.trim() || "—"}</td>
                <td><span className="pch-user-role">{PCH_ROLES.find(([value]) => value === user.role)?.[1] || user.role}</span></td>
                <td>{user.email || "—"}</td>
                <td>{user.phoneNumber || "—"}</td>
                <td><span className={`pch-user-status ${user.status === "DISABLED" ? "inactive" : String(user.status || "").toLowerCase()}`}>{user.status === "DISABLED" ? "Inactive" : user.status === "ACTIVE" ? "Active" : user.status || "—"}</span></td>
                <td className="pch-users-actions-cell"><ListActions onEdit={() => openEditForm(user)} onActivate={user.status === "DISABLED" ? () => handleEnableUser(user) : undefined} activateDisabled={Boolean(enablingId)} onDelete={user.status === "DISABLED" || user.id === signedInUser?.id ? undefined : () => { setDeleteError(""); setDeleteTarget(user); }} editLabel={`Edit ${user.username}`} activateLabel={`Enable ${user.username}`} deleteLabel={`Deactivate ${user.username}`} /></td>
              </tr>)
                : <tr><td className="pch-users-table-message" colSpan={7}>{loading ? "Loading PCH users…" : loadError ? "Unable to load PCH users." : search || statusFilter ? "No users match your filters." : "No PCH users to display yet."}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={visiblePage} totalPages={totalPages} totalItems={filteredUsers.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} itemLabel="users" showWhenEmpty />
    </section>
    <DeleteConfirmationDialog isOpen={Boolean(deleteTarget)} title="Deactivate PCH user?" message={deleteTarget ? `${deleteTarget.username} will lose access, but their user record will remain.` : ""} confirmLabel="Deactivate" busyLabel="Deactivating…" busy={deleting} error={deleteError} onCancel={() => { setDeleteTarget(null); setDeleteError(""); }} onConfirm={handleDisableUser} />
  </main>;
}
