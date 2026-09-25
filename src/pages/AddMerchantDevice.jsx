import React, { useEffect, useMemo, useState } from "react";

import { Plus, Minus, Store, ChevronDown, ArrowLeft, Trash2, Edit3 } from "lucide-react";

import { getMerchant } from "../api/merchants";

import "../styles/add-merchant-device.css";
 
export default function AddMerchantDevice({

  merchantId,

  merchant,

  onBack,

  onSave,

  onViewStores,

}) {

  const [details, setDetails] = useState(merchant || null);

  const [loading, setLoading] = useState(Boolean(merchantId && !merchant));

  const [error, setError] = useState("");

  const [deviceType, setDeviceType] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [devices, setDevices] = useState([]);

  const [saving, setSaving] = useState(false);
 
  useEffect(() => {

    let active = true;
 
    if (!merchantId || merchant) {

      setDetails(merchant || null);

      setLoading(false);

      return () => {

        active = false;

      };

    }
 
    setLoading(true);

    setError("");
 
    getMerchant(merchantId)

      .then((response) => {

        if (!active) return;

        setDetails(response?.raw || response?.data || response);

      })

      .catch((err) => {

        if (active) {

          setError(err?.message || "Unable to load merchant details.");

        }

      })

      .finally(() => {

        if (active) setLoading(false);

      });
 
    return () => {

      active = false;

    };

  }, [merchantId, merchant]);
 
  const merchantData = useMemo(() => {

    const source =

      details?.merchant ||

      details?.data?.merchant ||

      details?.data ||

      details ||

      {};
 
    return {

      id: source.id || source.merchantId || merchantId || "MER-975999",

      name:

        source.businessName ||

        source.legalBusinessName ||

        source.business ||

        source.name ||

        merchant?.name ||

        "Propproperty",

      stores:

        source.stores ||

        source._onboarding?.stores ||

        details?.stores ||

        [],

    };

  }, [details, merchant, merchantId]);
 
  const normalizedStores = useMemo(

    () =>

      (Array.isArray(merchantData.stores) ? merchantData.stores : []).map(

        (store) => ({

          id: String(

            store.id ??

              store.storeId ??

              store.code ??

              store.storeCode ??

              ""

          ),

          name:

            store.name ||

            store.storeName ||

            store.code ||

            store.storeCode ||

            "Store",

        })

      ),

    [merchantData.stores]

  );
 
  const deviceTypes = [

    "POS Terminal",

    "Kitchen Display",

    "Barcode Scanner",

    "Receipt Printer",

    "Customer Display",

  ];
 
  const handleQuantity = (change) => {

    setQuantity((current) => Math.max(1, current + change));

  };
 
  const handleSave = async () => {

    if (!deviceType) {

      setError("Please select a device type.");

      return;

    }
 
    if (typeof onSave !== "function") {

      setDevices((current) => [

        ...current,

        {

          id: Date.now(),

          deviceType,

          quantity,

          assignedStores: 0,

          addedOn: new Date().toLocaleDateString("en-GB"),

        },

      ]);

      setDeviceType("");

      setQuantity(1);

      setError("");

      return;

    }
 
    try {

      setSaving(true);

      setError("");
 
      await onSave({

        merchantId: merchantData.id,

        merchant: merchantData.id,

        deviceType,

        quantity,

        stores: normalizedStores,

      });
 
      setDeviceType("");

      setQuantity(1);

    } catch (err) {

      setError(err?.message || "Unable to save device.");

    } finally {

      setSaving(false);

    }

  };
 
  const handleDelete = (id) => {

    setDevices((current) => current.filter((device) => device.id !== id));

  };
 
  return (
  <div className="merchant-device-page">
    {loading && (
      <div className="merchant-device-message">
        Loading merchant...
      </div>
    )}

    {error && (
      <div className="merchant-device-error" role="alert">
        {error}
      </div>
    )}

    <div className="merchant-device-content">
      <main className="merchant-device-main">
        <section className="devices-panel">
          <div className="devices-panel-header">
            <h2>Devices</h2>

            <button
              type="button"
              className="add-device-button"
              onClick={() =>
                document
                  .querySelector(".add-device-card")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
              }
            >
              <Plus size={18} />
              <span>Add Device</span>
            </button>
          </div>

          <div className="add-device-card">
            <div className="add-device-copy">
            
            </div>

            <div className="add-device-fields">
              <div className="device-form-field device-type-field">
                <label htmlFor="device-type">
                  Device Type <span>*</span>
                </label>

                <div className="device-select">
                  <select
                    id="device-type"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Select device type</option>

                    {deviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={18} />
                </div>
              </div>

              <div className="device-form-field quantity-field">
                <label>
                  Quantity <span>*</span>
                </label>

                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() => handleQuantity(-1)}
                    disabled={quantity <= 1 || saving}
                  >
                    <Minus size={18} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={() => handleQuantity(1)}
                    disabled={saving}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="add-device-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setDeviceType("");
                  setQuantity(1);
                  setError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-button"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>

        <section className="devices-table-card">
          <div className="devices-table">
            <div className="table-header">
              <div>#</div>
              <div>Device Type</div>
              <div>Quantity</div>
              <div>Assigned Stores</div>
              <div>Added On</div>
              <div>Actions</div>
            </div>

            {devices.length === 0 ? (
              <div className="empty-devices">
                <div className="empty-device-icon">
                  <div className="empty-box">
                    <span />
                  </div>
                  <i />
                  <b />
                </div>

                <p>No records provided.</p>
                <span>
                  Add devices to manage merchant hardware.
                </span>
              </div>
            ) : (
              devices.map((device, index) => (
                <div className="table-row" key={device.id}>
                  <div>{index + 1}</div>
                  <div>{device.deviceType}</div>
                  <div>{device.quantity}</div>
                  <div>{device.assignedStores}</div>
                  <div>{device.addedOn}</div>

                  <div className="row-actions">
                    <button type="button" aria-label="Edit device">
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      aria-label="Delete device"
                      onClick={() => handleDelete(device.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  </div>
);

}

 