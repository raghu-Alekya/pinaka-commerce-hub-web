import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function findOverflowingText(target) {
  if (!(target instanceof Element)) return null;

  const cell = target.closest("td, th, [data-pch-table-cell]");
  if (!cell) return null;

  let element = target;

  while (element && cell.contains(element)) {
    const text = element.innerText;

    if (
      text?.trim() &&
      (element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1)
    ) {
      return { element, text };
    }

    if (element === cell) break;
    element = element.parentElement;
  }

  return null;
}

export default function TableOverflowTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const tooltipRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeElementRef = useRef(null);

  useLayoutEffect(() => {
    const element = tooltipRef.current;
    if (!element || !tooltip) return;

    const bounds = element.getBoundingClientRect();
    const margin = 10;
    const gap = 10;
    const x = pointerRef.current.x;
    const y = pointerRef.current.y;
    const left = Math.min(
      Math.max(margin, x - bounds.width / 2),
      window.innerWidth - bounds.width - margin,
    );
    const top = y - bounds.height - gap >= margin
      ? y - bounds.height - gap
      : Math.min(y + gap, window.innerHeight - bounds.height - margin);

    element.style.left = `${left}px`;
    element.style.top = `${Math.max(margin, top)}px`;
  }, [tooltip]);

  useEffect(() => {
    const hide = () => {
      activeElementRef.current = null;
      setTooltip(null);
    };

    const showAtTarget = (target, event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const overflow = findOverflowingText(target);

      if (!overflow || event.pointerType === "touch") {
        hide();
        return;
      }

      activeElementRef.current = overflow.element;
      setTooltip((current) =>
        current?.text === overflow.text ? current : { text: overflow.text },
      );
    };

    const handlePointerOver = (event) => {
      showAtTarget(event.target, event);
    };

    const handlePointerMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const activeElement = activeElementRef.current;

      if (activeElement?.contains(event.target)) {
        const element = tooltipRef.current;
        if (!element) return;

        const bounds = element.getBoundingClientRect();
        const margin = 10;
        const gap = 10;
        const left = Math.min(
          Math.max(margin, event.clientX - bounds.width / 2),
          window.innerWidth - bounds.width - margin,
        );
        const top = event.clientY - bounds.height - gap >= margin
          ? event.clientY - bounds.height - gap
          : Math.min(
              event.clientY + gap,
              window.innerHeight - bounds.height - margin,
            );

        element.style.left = `${left}px`;
        element.style.top = `${Math.max(margin, top)}px`;
      }
    };

    const handlePointerOut = (event) => {
      if (
        activeElementRef.current &&
        event.relatedTarget &&
        activeElementRef.current.contains(event.relatedTarget)
      ) {
        return;
      }

      hide();
    };

    const handleScroll = () => hide();

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  if (!tooltip) return null;

  return createPortal(
    <div ref={tooltipRef} className="pch-table-overflow-tooltip" role="tooltip">
      {tooltip.text}
    </div>,
    document.body,
  );
}