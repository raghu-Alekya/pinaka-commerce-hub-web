import { Fragment, useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http";
import { useAuth } from "../../../auth/AuthContext";
import { ConfigHeader, usePosSettings } from "../shared";
import { getEmailSettings, saveEmailSettings, sendTestEmail } from "./api";
import "./email-settings.css";

const initialNotifications = [
    {
        id: "new-order", name: "New order", enabled: true, contentType: "text/html",
        recipients: "store@example.com", subject: "[{site_title}]: You've got a new order: #{order_number}",
        heading: "New order: #{order_number}", additionalContent: "Congratulations on the sale!", emailType: "HTML",
        storeNameDisplay: "{site_title}", introText: "You’ve received a new order from John Doe.", summaryHeading: "Order summary",
        textAlignment: "center",
    },
    {
        id: "new-user-registration", name: "New user registration", enabled: true, contentType: "text/html",
        recipients: "store@example.com", subject: "[{site_title}]: A new user has registered", heading: "Welcome to {site_title}",
        additionalContent: "A new customer has registered on your store.", emailType: "HTML",
        storeNameDisplay: "{site_title}", introText: "A new user has registered on {site_title}.", summaryHeading: "Order summary",
        textAlignment: "center",
    },
];

function sanitizeRichHtml(value = "") {
    const parsed = new DOMParser().parseFromString(String(value), "text/html");
    const output = document.createElement("div");
    const allowedTags = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "SPAN"]);
    const copyNode = (node, parent) => {
        if (node.nodeType === Node.TEXT_NODE) {
            parent.appendChild(document.createTextNode(node.nodeValue || ""));
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toUpperCase();
        if (!allowedTags.has(tag)) {
            [...node.childNodes].forEach((child) => copyNode(child, parent));
            return;
        }
        const safeTag = tag === "DIV" ? "p" : tag.toLowerCase();
        const element = document.createElement(safeTag);
        if (tag === "SPAN") {
            const size = node.style.fontSize.match(/^(\d{1,2})px$/)?.[1];
            if (size && Number(size) >= 10 && Number(size) <= 48) element.style.fontSize = `${size}px`;
        }
        [...node.childNodes].forEach((child) => copyNode(child, element));
        parent.appendChild(element);
    };
    [...parsed.body.childNodes].forEach((node) => copyNode(node, output));
    return output.innerHTML;
}

function fromApiSettings(settings = {}, defaults = {}) {
    const enabledValue = settings.enabled;
    const emailType = String(settings.email_type ?? settings.emailType ?? "HTML").toLowerCase();
    const additionalContent = settings.additional_content ?? settings.additionalContent ?? "";
    return {
        enabled: enabledValue === undefined ? true : ![false, 0, "0", "false", "off", ""].includes(typeof enabledValue === "string" ? enabledValue.toLowerCase() : enabledValue),
        recipients: settings.recipients ?? "",
        subject: settings.subject ?? "",
        heading: settings.heading ?? "",
        additionalContent: String(additionalContent).replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>"),
        storeNameDisplay: settings.store_name_display ?? defaults.storeNameDisplay ?? "{site_title}",
        introText: settings.intro_text ?? defaults.introText ?? "",
        summaryHeading: settings.summary_heading ?? defaults.summaryHeading ?? "Order summary",
        textAlignment: settings.text_alignment === "left" ? "left" : "center",
        emailType: emailType === "plain" || emailType === "text/plain" || emailType === "plain text" ? "Plain text" : "HTML",
    };
}

function toApiSettings(notification, { storeName, renderForTest = false } = {}) {
    const renderTitle = (value) => renderForTest && storeName
        ? value.replace(/\{site_title\}/g, storeName)
        : value;
    return {
        template_id: notification.id,
        enabled: Boolean(notification.enabled),
        recipients: notification.recipients.trim(),
        subject: renderTitle(notification.subject),
        heading: renderTitle(sanitizeRichHtml(notification.heading)),
        additional_content: sanitizeRichHtml(notification.additionalContent),
        store_name_display: renderTitle(notification.storeNameDisplay || "{site_title}"),
        intro_text: renderTitle(notification.introText || ""),
        summary_heading: renderTitle(notification.summaryHeading || ""),
        text_alignment: notification.textAlignment === "left" ? "left" : "center",
        email_type: notification.emailType === "HTML" ? "html" : "plain",
    };
}

export default function EmailSettings() {
    const settings = usePosSettings();
    const { user } = useAuth();
    const storeName = settings?.store?.storeName || settings?.store?.store_name || settings?.store?.name || settings?.store?.storeCode || "Store";
    const senderEmail = user?.email || user?.emailAddress || user?.email_address || "Signed-in user";
    const [notifications, setNotifications] = useState(initialNotifications);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [device, setDevice] = useState("desktop");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(settings?.storeId));
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const headingRef = useRef(null);
    const storeNameRef = useRef(null);
    const additionalContentRef = useRef(null);
    const headingSelection = useRef(null);
    const storeNameSelection = useRef(null);
    const additionalContentSelection = useRef(null);
    const editing = editingId ? draft : null;

    useEffect(() => {
        if (headingRef.current && editing) {
            headingRef.current.innerHTML = sanitizeRichHtml(editing.heading);
        }
        if (storeNameRef.current && editing) {
            storeNameRef.current.innerHTML = sanitizeRichHtml(editing.storeNameDisplay || "{site_title}");
        }
        if (additionalContentRef.current && editing) {
            additionalContentRef.current.innerHTML = sanitizeRichHtml(editing.additionalContent);
        }
    }, [editingId]);

    useEffect(() => {
        if (!settings?.storeId) {
            setLoading(false);
            return undefined;
        }
        let active = true;
        setLoading(true);
        setError("");
        Promise.allSettled(initialNotifications.map(async (notification) => {
            try {
                const record = await getEmailSettings(settings.merchantId, settings.storeId, notification.id);
                return { id: notification.id, settings: fromApiSettings(record || {}, notification) };
            } catch (cause) {
                if (cause instanceof ApiError && cause.status === 404) return { id: notification.id, settings: null };
                throw cause;
            }
        }))
            .then((results) => {
                if (!active) return;
                const records = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
                const failed = results.find((result) => result.status === "rejected");
                setNotifications((current) => current.map((notification) => {
                    const result = records.find((item) => item.id === notification.id);
                    return result?.settings ? {
                        ...notification,
                        ...result.settings,
                        contentType: result.settings.emailType === "HTML" ? "text/html" : "text/plain",
                    } : notification;
                }));
                if (failed) setError(failed.reason?.message || "Unable to load email settings.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [settings?.merchantId, settings?.storeId]);

    const updateEditing = (field, value) => {
        setDraft((current) => current ? {
            ...current,
            [field]: value,
            ...(field === "emailType" ? { contentType: value === "HTML" ? "text/html" : "text/plain" } : {}),
        } : current);
        setNotice("");
        setError("");
    };

    const formatEmailText = (field, format) => {
        const editor = field === "heading" ? headingRef.current : field === "storeNameDisplay" ? storeNameRef.current : additionalContentRef.current;
        if (!editor || !editing) return;
        editor.focus();
        document.execCommand(format === "normal" ? "removeFormat" : "bold");
        updateEditing(field, sanitizeRichHtml(editor.innerHTML));
    };

    const setEmailTextSize = (field, size) => {
        const editor = field === "heading" ? headingRef.current : field === "storeNameDisplay" ? storeNameRef.current : additionalContentRef.current;
        const savedSelection = field === "heading" ? headingSelection : field === "storeNameDisplay" ? storeNameSelection : additionalContentSelection;
        const selection = window.getSelection();
        if (!editor || !selection) return;
        let range = selection.rangeCount ? selection.getRangeAt(0) : null;
        if (!range || !editor.contains(range.commonAncestorContainer)) range = savedSelection.current;
        if (!range || range.collapsed || !editor.contains(range.commonAncestorContainer)) return;
        selection.removeAllRanges();
        selection.addRange(range);
        editor.focus();
        selection.removeAllRanges();
        selection.addRange(range);
        const wrapper = document.createElement("span");
        wrapper.style.fontSize = `${size}px`;
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.addRange(newRange);
        updateEditing(field, sanitizeRichHtml(editor.innerHTML));
    };

    const renderFormattingToolbar = (field) => {
        const selectionRef = field === "heading" ? headingSelection : field === "storeNameDisplay" ? storeNameSelection : additionalContentSelection;
        const captureSelection = () => {
            const selection = window.getSelection();
            selectionRef.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
        };
        const fieldLabel = field === "heading" ? "Heading" : field === "storeNameDisplay" ? "Store name" : "Email body";
        return <div className="email-format-toolbar" role="toolbar" aria-label={`${fieldLabel} text formatting`}>
            <button type="button" aria-label="Make selected text bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => formatEmailText(field, "bold")}><strong>B</strong></button>
            <button type="button" aria-label="Make selected text normal" title="Normal text" onMouseDown={(event) => event.preventDefault()} onClick={() => formatEmailText(field, "normal")}>Normal</button>
            <label htmlFor={`email-font-size-${field}`}>Size</label>
            <select id={`email-font-size-${field}`} aria-label="Font size" defaultValue="16" onMouseDown={captureSelection} onChange={(event) => setEmailTextSize(field, event.target.value)}>
                <option value="12">12 px</option><option value="14">14 px</option><option value="16">16 px</option><option value="18">18 px</option><option value="20">20 px</option><option value="24">24 px</option><option value="28">28 px</option><option value="32">32 px</option>
            </select>
            <span>Select text, then choose a format.</span>
        </div>;
    };

    const persist = async (notification) => {
        if (!settings?.storeId || !settings?.merchantId) {
            setError("Open Email Settings from a store before saving.");
            return false;
        }
        await saveEmailSettings(settings.merchantId, settings.storeId, toApiSettings(notification));
        const saved = {
            ...notification,
            contentType: notification.emailType === "HTML" ? "text/html" : "text/plain",
        };
        setNotifications((current) => current.map((item) => item.id === notification.id ? saved : item));
        return true;
    };

    const saveChanges = async () => {
        if (!editing || saving) return;
        setSaving(true);
        setError("");
        setNotice("");
        try {
            if (await persist(editing)) setNotice("Email settings saved.");
        } catch (cause) {
            setError(cause?.message || "Unable to save email settings.");
        } finally {
            setSaving(false);
        }
    };

    const testEmail = async () => {
        if (!settings?.storeId || !settings?.merchantId) {
            setError("Open Email Settings from a store before sending a test email.");
            return;
        }
        const recipient = (editing?.recipients || "").split(",").map((email) => email.trim()).find(Boolean) || "";
        if (!recipient) {
            setError("Enter a recipient email address before sending a test email.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            setError("Enter a valid recipient email address before sending a test email.");
            return;
        }
        setSendingTest(true);
        setError("");
        setNotice("");
        try {
            // Testing uses this draft only; it does not save settings.
            await sendTestEmail(settings.merchantId, settings.storeId, toApiSettings(editing, { storeName, renderForTest: true }), recipient);
            setNotice(`Test email sent to ${recipient}.`);
        } catch (cause) {
            const message = cause?.message || "Unable to send test email.";
            setError(/RESEND_API_KEY|SMTP_HOST/.test(message)
                ? `Email delivery is not configured, so the test to ${recipient} could not be sent. Configure SMTP settings or RESEND_API_KEY on the email service.`
                : message);
        } finally {
            setSendingTest(false);
        }
    };

    const renderStoreName = (value = "") => value.replace(/\{site_title\}/g, storeName);
    const renderPreviewValue = (value = "") => renderStoreName(value).replace(/\{order_number\}/g, "12345");
    const editorContent = editing ? (
            <div className="email-settings email-settings-editor">
                <header className="pc-heading email-editor-header"><div className="pc-heading-title"><span className="pc-icon"><i className="bi bi-envelope" aria-hidden="true" /></span><div><h2>{editing.name}</h2><p>{editing.id === "new-order" ? "Receive an email notification every time a new order is placed" : "Receive an email notification when a new user registers"}</p></div></div></header>
                {error && <p className="email-editor-notice error" role="alert">{error}</p>}
                <section className="email-editor-card">
                    <fieldset className="email-editor-fieldset" disabled={saving || sendingTest}>
                    <div className="email-editor-fields">
                        <div className="email-editor-field"><label>Enable/Disable</label><div><label className="email-enable-control"><input type="checkbox" checked={editing.enabled} onChange={(event) => updateEditing("enabled", event.target.checked)} /><span>Enable this email notification</span></label></div></div>
                        <div className="email-editor-field"><label htmlFor="email-recipients">Recipient(s) <span className="email-help" title="Enter one or more email addresses, separated by commas.">?</span></label><div><input id="email-recipients" value={editing.recipients} onChange={(event) => updateEditing("recipients", event.target.value)} /></div></div>
                        <div className="email-editor-field"><label htmlFor="email-subject">Subject <span className="email-help" title="Available placeholders are shown in braces.">?</span></label><div><input id="email-subject" value={editing.subject} onChange={(event) => updateEditing("subject", event.target.value)} /></div></div>
                        <div className="email-editor-field"><label htmlFor="email-text-alignment">Text alignment</label><div><select id="email-text-alignment" value={editing.textAlignment || "center"} onChange={(event) => updateEditing("textAlignment", event.target.value)}><option value="left">Left</option><option value="center">Middle</option></select></div></div>
                        <div className="email-editor-field"><label htmlFor="email-heading">Email heading <span className="email-help" title="Shown at the top of the email. Select text to apply formatting.">?</span></label><div className="email-rich-editor">{renderFormattingToolbar("heading")}<div ref={headingRef} id="email-heading" className="email-body-editor email-heading-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Email heading" onInput={(event) => updateEditing("heading", sanitizeRichHtml(event.currentTarget.innerHTML))} onMouseUp={() => { const selection = window.getSelection(); headingSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} onKeyUp={() => { const selection = window.getSelection(); headingSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} /></div></div>
                        <div className="email-editor-field"><label htmlFor="email-store-name-display">Store name in email</label><div className="email-rich-editor">{renderFormattingToolbar("storeNameDisplay")}<div ref={storeNameRef} id="email-store-name-display" className="email-body-editor email-store-name-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Store name in email" onInput={(event) => updateEditing("storeNameDisplay", sanitizeRichHtml(event.currentTarget.innerHTML))} onMouseUp={() => { const selection = window.getSelection(); storeNameSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} onKeyUp={() => { const selection = window.getSelection(); storeNameSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} /></div></div>
                        <div className="email-editor-field"><label htmlFor="email-intro-text">Intro message</label><div><input id="email-intro-text" value={editing.introText || ""} onChange={(event) => updateEditing("introText", event.target.value)} /></div></div>
                        {editing.id === "new-order" && <div className="email-editor-field"><label htmlFor="email-summary-heading">Order summary heading</label><div><input id="email-summary-heading" value={editing.summaryHeading || ""} onChange={(event) => updateEditing("summaryHeading", event.target.value)} /></div></div>}
                        <div className="email-editor-field"><label htmlFor="email-additional-content">Email body content <span className="email-help" title="Edit the message shown in the preview. Select text to apply formatting.">?</span></label><div className="email-rich-editor">{renderFormattingToolbar("additionalContent")}<div ref={additionalContentRef} id="email-additional-content" className="email-body-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Email body content" onInput={(event) => updateEditing("additionalContent", sanitizeRichHtml(event.currentTarget.innerHTML))} onMouseUp={() => { const selection = window.getSelection(); additionalContentSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} onKeyUp={() => { const selection = window.getSelection(); additionalContentSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; }} /></div></div>
                        <div className="email-editor-field"><label htmlFor="email-type">Email type <span className="email-help" title="Choose HTML or plain text formatting.">?</span></label><div><select id="email-type" value={editing.emailType} onChange={(event) => updateEditing("emailType", event.target.value)}><option>HTML</option><option>Plain text</option></select></div></div>
                    </div>
                    </fieldset>
                </section>
                <section className="email-preview-section">
                    <h3>Email preview</h3>
                    <p>Preview your email template. You can also test on different devices and send yourself a test email.</p>
                    <div className="email-preview-frame">
                        <div className="email-preview-toolbar">
                            <div className="email-device-switch" aria-label="Preview device">
                                <button type="button" className={device === "desktop" ? "active" : ""} aria-label="Desktop preview" onClick={() => setDevice("desktop")}><i className="bi bi-laptop" /></button>
                                <button type="button" className={device === "mobile" ? "active" : ""} aria-label="Mobile preview" onClick={() => setDevice("mobile")}><i className="bi bi-phone" /></button>
                            </div>
                            <button type="button" className="email-orange-button" disabled={sendingTest || saving} onClick={testEmail}>{sendingTest ? "Sending…" : "Send a test email"}</button>
                        </div>
                        <article className={`email-preview-message ${device}`}>
                            <h4>{renderPreviewValue(editing.subject)}</h4>
                            <div className="email-preview-sender"><span><i className="bi bi-person" /></span><small>&lt;{senderEmail}&gt;</small></div>
                            <div className="email-preview-body" style={{ textAlign: editing.textAlignment === "left" ? "left" : "center" }}>
                                <p className="email-preview-store-name" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderPreviewValue(editing.storeNameDisplay) || storeName) }} />
                                <h3 dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderPreviewValue(editing.heading) || `<strong>${editing.id === "new-order" ? "New order: #12345" : "New user registration"}</strong>`) }} />
                                {editing.id === "new-order" ? <>
                                    <p className="email-preview-customer">{renderPreviewValue(editing.introText)}</p>
                                    <h4 className="email-preview-summary-title">{renderPreviewValue(editing.summaryHeading)}</h4>
                                    <p className="email-preview-order-date">Order #12345 · {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                                    <table className="email-preview-order-table"><thead><tr><th>Product</th><th>Quantity</th><th>Price</th></tr></thead><tbody>
                                        <tr><td>Dummy Product</td><td>×2</td><td>$50.00</td></tr>
                                        <tr><td>Dummy Product Variation</td><td>×1</td><td>$20.00</td></tr>
                                        <tr><td>Dummy Downloadable Product</td><td>×1</td><td>$15.00</td></tr>
                                    </tbody></table>
                                    <div className="email-preview-order-totals"><p>Subtotal: <span>$85.00</span></p><p>Discount: <span>−$10.00</span></p><p>Shipping: Flat rate <span>$5.00</span></p><p>Tax: <span>$0.00</span></p><strong>Total: <span>$80.00</span></strong><p>Payment method: <span>Direct bank transfer</span></p></div>
                                </> : <p className="email-preview-customer">{renderPreviewValue(editing.introText)}</p>}
                                <div className="email-preview-custom-content" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(editing.additionalContent) }} />
                                <footer>{storeName}<br />{settings?.store?.country || settings?.store?.address?.country || ""}</footer>
                            </div>
                        </article>
                    </div>
                </section>
                {notice && <p className="email-editor-notice" role="status">{notice}</p>}
                <div className="email-editor-footer"><button type="button" className="email-save-button" disabled={saving || sendingTest || loading} onClick={saveChanges}>{saving ? "Saving…" : "Save changes"}</button></div>
            </div>
        ) : null;

    return (
        <main className="email-settings pos-panel">
            <ConfigHeader title="Email Settings" description="Manage email notifications sent from this store." />
            {error && !editing && <p className="email-editor-notice error" role="alert">{error}</p>}
            {notice && !editing && <p className="email-editor-notice" role="status">{notice}</p>}
            <section className="email-list-card"><div className="email-settings-table-wrap"><table className="email-settings-table">
                <thead><tr><th scope="col">Status</th><th scope="col">Email</th><th scope="col">Content type</th><th scope="col">Recipient(s)</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{loading ? <tr><td colSpan="5" role="status">Loading email settings…</td></tr> : notifications.map((notification) => <Fragment key={notification.id}><tr>
                    <td><span className={`email-status ${notification.enabled ? "enabled" : "disabled"}`} aria-label={`${notification.name} email ${notification.enabled ? "enabled" : "disabled"}`}><i className={`bi ${notification.enabled ? "bi-check-lg" : "bi-x-lg"}`} /></span></td>
                    <td><strong>{notification.name}</strong></td><td>{notification.contentType}</td><td>{notification.recipients}</td>
                    <td><button type="button" disabled={loading || saving} className={`email-manage-button${editingId === notification.id ? " is-expanded" : ""}`} aria-label={`${editingId === notification.id ? "Close" : "Open"} ${notification.name} email settings`} aria-expanded={editingId === notification.id} aria-controls={editingId === notification.id ? `email-editor-${notification.id}` : undefined} title={`${editingId === notification.id ? "Close" : "Open"} ${notification.name} email settings`} onClick={() => { if (editingId === notification.id) { setEditingId(null); setDraft(null); setNotice(""); setError(""); return; } const heading = /<(strong|b|span)[ >]/i.test(notification.heading) ? notification.heading : `<strong>${notification.heading}</strong>`; setDraft({ ...notification, heading }); setEditingId(notification.id); setDevice("desktop"); setNotice(""); setError(""); }}><i className={`bi ${editingId === notification.id ? "bi-chevron-down" : "bi-chevron-right"}`} aria-hidden="true" /></button></td>
                </tr>{editingId === notification.id && <tr className="email-expanded-row" id={`email-editor-${notification.id}`}><td colSpan="5">{editorContent}</td></tr>}</Fragment>)}</tbody>
            </table></div></section>
        </main>
    );
}
