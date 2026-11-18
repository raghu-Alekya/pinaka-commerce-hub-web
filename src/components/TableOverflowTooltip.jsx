import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TABLE_CELL_SELECTOR = [
  "td",
  "th",
  "[data-pch-table-cell]",
  "[data-truncate]",
  "[data-tooltip]",
  ".plans-row > *",
  ".store-types-row > *",
  ".store-features-row > *",
  ".role-template-row > *",
  "[class*='-cell']",
  "[class*='-chip']",
  ".sf-key-features span",
  ".sf-review-feature-list span",
  ".sm-store-chip",
  ".attribute-terms span",
  ".attribute-terms .more-terms",
  ".store-table-details",
  ".store-cell",
  ".merchant-name-cell",
  ".store-name-info",
  ".store-location",
  ".store-customer-info",
  ".store-customer-email",
  ".fast-key-employee",
  ".store-payment-title-link",
].join(", ");

function isTruncatedByCSS(element) {
  if (!(element instanceof Element)) return false;
  const style = window.getComputedStyle(element);

  // Check for single line ellipsis
  const hasEllipsis =
    style.textOverflow === "ellipsis" &&
    (style.overflow === "hidden" || style.overflowX === "hidden");

  // Check for multi-line line clamp
  const hasLineClamp =
    style.webkitLineClamp &&
    style.webkitLineClamp !== "none" &&
    style.display === "-webkit-box";

  return hasEllipsis || Boolean(hasLineClamp);
}

function getOverflowingText(target) {
  if (!(target instanceof Element)) return null;

  // Ignore form controls, action buttons/bars/icons/menus, status pills, and items explicitly marked no-tooltip
  if (
    target.closest(
      "input, select, textarea, button, a, [role='button'], .list-actions, [class*='actions'], [class*='action-btn'], [class*='table-action'], [class*='btn-action'], button[class*='action'], .pagination-container button, .pch-filter-menu, .pch-filter-dropdown, .pch-filter-trigger, .device-select-wrapper, .device-select-trigger, .device-select-menu, .device-select-option, .role-multi-select-wrapper, .role-multi-select, .role-dropdown, .discount-product-picker, .discount-product-menu, .status-badge, [class*='status-pill'], [class*='badge'], [data-no-tooltip='true']"
    )
  ) {
    return null;
  }

  // Check for explicit data-tooltip attribute
  const tooltipTarget = target.hasAttribute("data-tooltip")
    ? target
    : target.closest("[data-tooltip]");
  if (tooltipTarget) {
    const tooltipText = tooltipTarget.getAttribute("data-tooltip")?.trim();
    if (tooltipText) {
      return {
        element: tooltipTarget,
        text: tooltipText,
      };
    }
  }

  const cell = target.closest(TABLE_CELL_SELECTOR) || target;
  if (!cell) return null;

  // Never treat a row, table or large wrapper as an overflowing cell
  if (
    cell.matches(
      "tr, table, thead, tbody, .plans-row, .store-types-row, .store-features-row, .role-template-row, [class*='-row'], [class*='-table']"
    )
  ) {
    return null;
  }

  let element = target;

  while (element && (cell.contains(element) || element === cell)) {
    if (
      element.matches?.(
        "tr, table, thead, tbody, .plans-row, .store-types-row, .store-features-row, .role-template-row, [class*='-row'], [class*='-table']"
      )
    ) {
      break;
    }

    const text = element.innerText?.trim();

    // Ignore empty/placeholder characters and single words under 5 characters (prevents short prices, codes, badges)
    if (!text || text === "—" || text === "-" || text.length <= 4) {
      if (element === cell) break;
      element = element.parentElement;
      continue;
    }

    const hasScrollOverflow =
      element.scrollWidth > element.clientWidth + 2 ||
      element.scrollHeight > element.clientHeight + 2;

    // Check if the element itself or its parent enforces CSS truncation
    const isTruncated = isTruncatedByCSS(element) || isTruncatedByCSS(element.parentElement);

    if (hasScrollOverflow && isTruncated) {
      return {
        element,
        text,
      };
    }

    if (element === cell) break;
    element = element.parentElement;
  }

  return null;
}

export default function TableOverflowTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const hoveredElementRef = useRef(null);
  const tooltipRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const hideTooltip = useCallback(() => {
    hoveredElementRef.current = null;
    setTooltip(null);
  }, []);

  const updateTooltip = useCallback((x, y) => {
    pointerRef.current = { x, y };

    const target = document.elementFromPoint(x, y);
    const overflow = getOverflowingText(target);

    if (!overflow) {
      hideTooltip();
      return;
    }

    hoveredElementRef.current = overflow.element;

    setTooltip({
      text: overflow.text,
      x,
      y,
    });
  }, [hideTooltip]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      updateTooltip(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      hideTooltip();
    };

    const handleScroll = () => {
      hideTooltip();
    };

    const handleResize = () => {
      hideTooltip();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateTooltip, hideTooltip]);

  if (!tooltip || typeof document === "undefined") {
    return null;
  }

  const tooltipWidth = 360;
  const tooltipHeight = 100;
  const gap = 14;
  const padding = 12;

  const left = Math.max(
    padding,
    Math.min(
      tooltip.x + gap,
      window.innerWidth - tooltipWidth - padding
    )
  );

  const top = Math.max(
    padding,
    Math.min(
      tooltip.y + gap,
      window.innerHeight - tooltipHeight - padding
    )
  );

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className="pch-overflow-tooltip"
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 99999,
        maxWidth: `min(${tooltipWidth}px, calc(100vw - 24px))`,
        pointerEvents: "none",
      }}
    >
      {tooltip.text}
    </div>,
    document.body
  );
}
