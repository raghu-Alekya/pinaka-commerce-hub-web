import React from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/device-view.css";

export default function DeviceNavigation({ title, onBack }) {
  return (
    <nav className="device-view-topbar" aria-label="Device navigation">
      <button type="button" className="device-view-back-link" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Devices
      </button>
      <span aria-hidden="true">/</span>
      <strong aria-current="page">{title}</strong>
    </nav>
  );
}
