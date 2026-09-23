import { useEffect } from "react";
import "../styles/view-details-modal.css";

export default function ViewDetailsModal({
  open,
  title = "Details",
  subtitle = "",
  data = null,
  fields = [],
  onClose,
}) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Prevent background page scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !data) {
    return null;
  }

  const getValue = (field) => {
    if (typeof field.value === "function") {
      return field.value(data);
    }

    return data[field.key];
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (field.format) {
      return field.format(value, data);
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "—";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  return (
    <div
      className="view-details-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="view-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="view-details-header">
          <div className="view-details-heading">
            <div className="view-details-title-icon">
              <i className="bi bi-eye" />
            </div>

            <div>
              <h2 id="view-details-title">{title}</h2>

              {subtitle ? (
                <p>{subtitle}</p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="view-details-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="view-details-body">
          <div className="view-details-grid">
            {fields.map((field) => {
              const value = getValue(field);

              return (
                <div
                  key={field.key || field.label}
                  className={`view-details-field ${
                    field.fullWidth ? "full-width" : ""
                  }`}
                >
                  <span className="view-details-label">
                    {field.label}
                  </span>

                  <div className="view-details-value">
                    {field.render
                      ? field.render(value, data)
                      : formatValue(value, field)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="view-details-footer">
          <button
            type="button"
            className="view-details-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}