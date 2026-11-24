import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/http";
import { listMerchants } from "../api/merchants";
import { isPchAgent, isUnrestricted } from "../auth/permissions";
import {
  assignEmployeeRole,
  createMerchantRole,
  deleteMerchantRole,
  getRoleGrants,
  listAccessEmployees,
  listAccessModules,
  listMerchantRoles,
  saveRoleGrants,
  updateMerchantRole,
} from "../api/access";
import "../styles/access-permissions.css";

const emptyRole = { roleCode: "", name: "", description: "" };

function messageOf(error) {
  if (error instanceof ApiError) return error.message;
  return "Unable to save access settings.";
}

export default function AccessPermissions() {
  const { user, can } = useAuth();
  const admin = isUnrestricted(user) || isPchAgent(user);
  const [merchantOptions, setMerchantOptions] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const merchantId = admin ? selectedMerchantId : user?.merchantId;
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(emptyRole);
  const [grants, setGrants] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = roles.find((role) => role.id === selectedId);
  const canEdit = can("access-permissions", "update") || can("access-permissions", "create");

  useEffect(() => {
    if (!admin) return;
    listMerchants()
      .then((rows) => {
        setMerchantOptions(rows);
        if (isPchAgent(user) && rows.length) setSelectedMerchantId((current) => current || rows[0].uuid || rows[0].id);
      })
      .catch((err) => setError(err?.message || "Unable to load merchants."));
  }, [admin, user]);

  const load = async () => {
    if (!merchantId) return;
    const [moduleRows, roleRows, employeeRows] = await Promise.all([
      listAccessModules(merchantId),
      listMerchantRoles(merchantId),
      listAccessEmployees(merchantId),
    ]);
    setModules(moduleRows.modules || []);
    const nextRoles = (roleRows.roles || []).filter((role) => String(role.status || "ACTIVE").toUpperCase() !== "INACTIVE");
    setRoles(nextRoles);
    setEmployees(employeeRows.employees || []);
    setSelectedId((current) => current || nextRoles[0]?.id || "");
  };

  useEffect(() => {
    setModules([]);
    setRoles([]);
    setEmployees([]);
    setSelectedId("");
    setGrants({});
    setError("");
    load().catch((err) => setError(messageOf(err)));
  }, [merchantId]);

  useEffect(() => {
    if (!merchantId || !selectedId) {
      setGrants({});
      setDraft(emptyRole);
      return;
    }
    const role = roles.find((item) => item.id === selectedId);
    setDraft({
      roleCode: role?.roleCode || "",
      name: role?.name || "",
      description: role?.description || "",
    });
    getRoleGrants(merchantId, selectedId)
      .then((result) => {
        const next = {};
        for (const grant of result.grants || []) next[grant.menuKey] = new Set(grant.actions || []);
        setGrants(next);
      })
      .catch((err) => setError(messageOf(err)));
  }, [merchantId, selectedId]);

  const matrix = useMemo(() => modules, [modules]);

  function toggle(menuKey, action) {
    setGrants((current) => {
      const actions = new Set(current[menuKey] || []);
      if (actions.has(action)) actions.delete(action);
      else actions.add(action);
      if ([...actions].some((item) => item !== "view")) actions.add("view");
      return { ...current, [menuKey]: actions };
    });
  }

  function setAll(enabled) {
    const next = {};
    for (const module of matrix) {
      next[module.menuKey] = new Set(enabled ? module.actions : module.menuKey === "dashboard" ? ["view"] : []);
    }
    setGrants(next);
  }

  async function saveRole(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {
        roleCode: draft.roleCode.trim().toUpperCase(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        scopeType: "STORE",
        isCustom: true,
      };
      let roleId = selectedId;
      if (!roleId) {
        const created = await createMerchantRole(merchantId, payload);
        roleId = created.role?.id;
        setSelectedId(roleId);
      } else {
        await updateMerchantRole(merchantId, roleId, { name: payload.name, description: payload.description });
      }
      const saved = Object.entries(grants)
        .filter(([, actions]) => actions?.size)
        .map(([menuKey, actions]) => ({ menuKey, actions: [...actions] }));
      await saveRoleGrants(merchantId, roleId, saved);
      setNotice("Role permissions saved.");
      await load();
      setSelectedId(roleId);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeRole() {
    if (!selectedId) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await deleteMerchantRole(merchantId, selectedId);
      setSelectedId("");
      setNotice("Role deleted.");
      await load();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  async function assign(employee, roleId) {
    setError("");
    setNotice("");
    try {
      await assignEmployeeRole(merchantId, employee.id, roleId, employee.storeId);
      setNotice("Employee role updated. The employee receives the new permissions on the next request.");
      const refreshed = await listAccessEmployees(merchantId);
      setEmployees(refreshed.employees || []);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  if (!merchantId) {
    return (
      <section className="access-page">
        <h1>Access & Permissions</h1>
        {admin ? (
          <label className="access-merchant-picker">Merchant
            <select value={selectedMerchantId} onChange={(event) => setSelectedMerchantId(event.target.value)}>
              <option value="">Select a merchant</option>
              {merchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.uuid || merchant.id}>{merchant.name || merchant.display || merchant.merchantId}</option>
              ))}
            </select>
          </label>
        ) : <p>Merchant context is unavailable.</p>}
        {error ? <div className="access-error">{error}</div> : null}
      </section>
    );
  }

  return (
    <section className="access-page">
      <header className="access-header">
        <div>
          <h1>Access & Permissions</h1>
          <p>Create merchant roles and choose View, Create, Edit, and Delete for each module.</p>
        </div>
        {can("access-permissions", "create") && (
          <button type="button" className="access-primary" onClick={() => { setSelectedId(""); setDraft(emptyRole); setGrants({}); }}>
            New role
          </button>
        )}
      </header>
      {admin && <label className="access-merchant-picker">Merchant
        <select value={selectedMerchantId} onChange={(event) => setSelectedMerchantId(event.target.value)}>
          {merchantOptions.map((merchant) => (
            <option key={merchant.id} value={merchant.uuid || merchant.id}>{merchant.name || merchant.display || merchant.merchantId}</option>
          ))}
        </select>
      </label>}
      {notice ? <div className="access-notice">{notice}</div> : null}
      {error ? <div className="access-error">{error}</div> : null}
      <div className="access-layout">
        <aside className="access-roles">
          {roles.map((role) => (
            <button type="button" key={role.id} className={role.id === selectedId ? "is-selected" : ""} onClick={() => setSelectedId(role.id)}>
              <strong>{role.name}</strong>
              <small>{role.roleCode}</small>
            </button>
          ))}
          {!roles.length ? <p>No custom roles yet.</p> : null}
        </aside>
        <form className="access-editor" onSubmit={saveRole}>
          <div className="access-fields">
            <label>Role name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required disabled={!canEdit} /></label>
            <label>Role code<input value={draft.roleCode} onChange={(event) => setDraft({ ...draft, roleCode: event.target.value })} required disabled={Boolean(selectedId) || !canEdit} /></label>
            <label>Description<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} disabled={!canEdit} /></label>
          </div>
          <div className="access-matrix-actions">
            <button type="button" onClick={() => setAll(true)} disabled={!canEdit}>Select all</button>
            <button type="button" onClick={() => setAll(false)} disabled={!canEdit}>Clear all</button>
          </div>
          <table className="access-matrix">
            <thead>
              <tr>
                <th>Module</th>
                <th>View</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((module) => {
                const actions = grants[module.menuKey] || new Set();
                return (
                  <tr key={module.menuKey}>
                    <td>{module.label}</td>
                    {["view", "create", "update", "delete"].map((action) => (
                      <td key={action}>
                        {module.actions.includes(action) ? (
                          <input
                            type="checkbox"
                            aria-label={`${module.label} ${action}`}
                            checked={actions.has(action)}
                            disabled={!canEdit}
                            onChange={() => toggle(module.menuKey, action)}
                          />
                        ) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {selected ? <p className="access-role-note">Employees currently using {selected.name} are listed below.</p> : null}
          <div className="access-save-row">
            {canEdit ? <button className="access-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save role"}</button> : null}
            {selectedId && can("access-permissions", "delete") ? (
              <button type="button" className="access-danger" onClick={removeRole} disabled={saving}>Delete role</button>
            ) : null}
          </div>
        </form>
      </div>
      <h2>Assign roles</h2>
      <table className="access-matrix">
        <thead>
          <tr><th>Employee</th><th>Store</th><th>Role</th></tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={`${employee.id}-${employee.storeId || "none"}`}>
              <td>{[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.email}</td>
              <td>{employee.storeName || "No store assignment"}</td>
              <td>
                <select
                  aria-label={`Role for ${employee.email || employee.id}`}
                  value={employee.roleId || ""}
                  disabled={!can("employees", "update") && !can("access-permissions", "update")}
                  onChange={(event) => assign(employee, event.target.value)}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {!employees.length ? <tr><td colSpan="3">No employees for this merchant.</td></tr> : null}
        </tbody>
      </table>
    </section>
  );
}
