import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Info,
  LoaderCircle,
  Pencil,
} from "lucide-react";
import "../styles/reviewSubscribe.css";

function DetailRow({ label, children }) {
  return (
    <div className="rs-detail-row">
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function Card({ title, editLabel, onEdit, children, className = "" }) {
  return (
    <section className={`rs-card ${className}`} aria-label={title}>
      <div className="rs-card-heading">
        <h2>{title}</h2>

        {onEdit && (
          <button
            className="rs-edit"
            type="button"
            onClick={onEdit}
            aria-label={editLabel}
          >
            <Pencil size={18} strokeWidth={2.1} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="rs-card-body">{children}</div>
    </section>
  );
}

export default function ReviewSubscribe({
  merchantDetails,
  selectedPlan,
  onSubscribe,
  onEditMerchant,
  onEditPlan,
  onBack,
  onBackToMerchants,
  paymentMethod: controlledPaymentMethod,
  onPaymentMethodChange,
  isSubmitting = false,
  externalError = "",
  isEditing = false,
  merchantsPath = "/merchants",
  merchantDetailsPath = "/merchants/add",
  choosePlanPath = "/merchants/add/choose-plan",
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};

  // Data comes only from props or router state.
  const merchant = merchantDetails || state.merchantDetails || state.merchant;
  const plan = selectedPlan || state.selectedPlan || state.plan;

  const [localPaymentMethod, setLocalPaymentMethod] = useState("card");
  const paymentMethod =
    controlledPaymentMethod ?? localPaymentMethod;

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const number =
    Number(String(plan?.price ?? 0).replace(/[^\d.-]/g, "")) || 0;

  const taxRate = Number(plan?.taxRate ?? 0);
  const safeTaxRate = Number.isFinite(taxRate)
    ? taxRate > 1 ? taxRate / 100 : taxRate
    : 0;

  const currency = plan?.currency || "USD";

  const money = useMemo(() => {
    try {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });

      return (value) => formatter.format(value);
    } catch {
      return (value) => `$${value.toFixed(2)}`;
    }
  }, [currency]);

  const tax =
    Math.round((number * safeTaxRate + Number.EPSILON) * 100) / 100;

  const total = number + tax;

  const cycle = /annual|year/i.test(plan?.billingFrequency || "")
    ? "Yearly"
    : "Monthly";

  const goToStep = (path) =>
    navigate(path, {
      state: {
        ...state,
        merchantDetails: merchant,
        selectedPlan: plan,
      },
    });

  const changePaymentMethod = (method) => {
    setLocalPaymentMethod(method);
    onPaymentMethodChange?.(method);
    setMessage("");
  };

  const goBackToMerchants = () =>
    onBackToMerchants
      ? onBackToMerchants()
      : navigate(merchantsPath);

  const editMerchant = () =>
    onEditMerchant
      ? onEditMerchant()
      : goToStep(merchantDetailsPath);

  const editPlan = () =>
    onEditPlan
      ? onEditPlan()
      : goToStep(choosePlanPath);

  const back = () =>
    onBack
      ? onBack()
      : editPlan();

  async function handleSubscribe() {
    setMessage("");

    if (!onSubscribe) {
      setMessage(
        "Subscription and payment processing will be available once the service is connected."
      );
      return;
    }

    try {
      setSubmitting(true);

      await onSubscribe({
        merchantDetails: merchant,
        selectedPlan: plan,
        paymentMethod,
        total,
      });
    } catch (error) {
      setMessage(
        error?.message ||
          "Subscription could not be completed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rs-page">
      <header className="rs-breadcrumb-bar">
        <nav className="rs-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={goBackToMerchants}>
            <ArrowLeft size={17} /> Merchants
          </button>
          <span className="rs-breadcrumb-divider" aria-hidden="true">/</span>
          <span>Review &amp; Subscribe</span>
        </nav>
        <span className="rs-new-badge">{isEditing ? "Subscription update" : "New subscription"}</span>
      </header>

      <div className="rs-workspace">
        <aside className="rs-step-panel" aria-label="Checkout progress">
          <p className="rs-step-eyebrow">Merchant setup</p>
          <div className="rs-step rs-step-complete">
            <span className="rs-step-circle"><Check size={17} /></span>
            <span><strong>Merchant details</strong><small>Business and primary contact</small></span>
          </div>
          <div className="rs-step rs-step-complete">
            <span className="rs-step-circle"><Check size={17} /></span>
            <span><strong>Choose plan</strong><small>Plan and billing cycle</small></span>
          </div>
          <div className="rs-step rs-step-current" aria-current="step">
            <span className="rs-step-circle">3</span>
            <span><strong>Review &amp; Subscribe</strong><small>Confirm subscription details</small></span>
          </div>
        </aside>

        <main className="rs-content-column">
          <div className="rs-content">
            <div className="rs-intro">
              <div className="rs-title-block">
                <span className="rs-overline">Final review</span>
                <h1>Review &amp; Subscribe</h1>
                <p>Check the merchant and plan information before continuing.</p>
              </div>
              <div className="rs-info-banner">
                <span className="rs-info-icon"><Info size={18} /></span>
                <p>Payment details are not collected here. Subscription activation depends on the connected billing service.</p>
              </div>
            </div>

            {(!merchant || !plan?.name) && (
              <div className="rs-feedback" role="alert">Merchant or plan details are missing. Go back and choose an available plan.</div>
            )}

            <div className="rs-card-grid">
              <Card title="Merchant Details" editLabel="Edit merchant details" onEdit={editMerchant} className="rs-details-card">
                <dl className="rs-detail-list">
                  <DetailRow label="Business">{merchant?.businessName || merchant?.name}</DetailRow>
                  <DetailRow label="Merchant code">{merchant?.merchantCode}</DetailRow>
                  <DetailRow label="Primary contact">{merchant?.contactName}</DetailRow>
                  <DetailRow label="Email">{merchant?.email}</DetailRow>
                  <DetailRow label="Phone">{merchant?.phone}</DetailRow>
                  <DetailRow label="Address">{merchant?.address}</DetailRow>
                </dl>
              </Card>

              <Card title="Plan Details" editLabel="Change plan" onEdit={editPlan} className="rs-details-card">
                <dl className="rs-detail-list rs-plan-list">
                  <DetailRow label="Plan">{plan?.name}</DetailRow>
                  <DetailRow label="Store type">{plan?.storeType}</DetailRow>
                  <DetailRow label="Billing cycle">{cycle}</DetailRow>
                  <DetailRow label="Included limits">
                    <span className="rs-limit-lines">
                      <span>{plan?.stores ?? "Custom"} stores</span>
                      <span>{plan?.devices ?? "Custom"} devices</span>
                      <span>{plan?.employees ?? "Custom"} employees</span>
                    </span>
                  </DetailRow>
                  <DetailRow label="Start date">{plan?.startDate}</DetailRow>
                  <DetailRow label="Renewal date">{plan?.renewalDate}</DetailRow>
                </dl>
              </Card>

              <Card title="Billing Summary" className="rs-billing-card">
                <div className="rs-billing-line"><span>Plan amount</span><strong>{money(number)}</strong></div>
                {safeTaxRate > 0 && <div className="rs-billing-line"><span>Tax ({(safeTaxRate * 100).toFixed(2)}%)</span><strong>{money(tax)}</strong></div>}
                <div className="rs-billing-total"><strong>Total due</strong><strong>{money(total)}</strong></div>
              </Card>

              <Card title="Payment Method" className="rs-payment-card">
                <fieldset className="rs-payment-options">
                  <legend className="rs-sr-only">Select a payment method</legend>
                  <label><input type="radio" name="payment-method" value="card" checked={paymentMethod === "card"} onChange={() => changePaymentMethod("card")} /><CreditCard size={17} /> Card</label>
                  <label><input type="radio" name="payment-method" value="ach" checked={paymentMethod === "ach"} onChange={() => changePaymentMethod("ach")} /> Bank transfer</label>
                </fieldset>
                <p className="rs-preview-note">Your selection will be passed to the subscription service. No payment information is entered on this screen.</p>
                <button className="rs-subscribe" type="button" onClick={handleSubscribe} disabled={isSubmitting || submitting || !merchant || !plan?.name}>
                  {isSubmitting || submitting ? <><LoaderCircle className="rs-spinner" size={17} /> Saving…</> : <><Check size={17} /> {isEditing ? "Save Subscription" : "Subscribe"}</>}
                </button>
                {(message || externalError) && <p className="rs-feedback" role="alert">{externalError || message}</p>}
              </Card>
            </div>
          </div>

          <footer className="rs-footer">
            <button className="rs-outline-button" type="button" onClick={back}><ArrowLeft size={16} /> Back to plan</button>
            <button className="rs-outline-button" type="button" onClick={goBackToMerchants}>Cancel</button>
          </footer>
        </main>
      </div>
    </div>
  );
}
