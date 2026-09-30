import { useState } from "react";
import Button from "../components/Button";
import SupplierModal from "../components/SupplierModal";
import SupplierConfirmModal from "../components/SupplierConfirmModal";

export default function SupplierDetails({
  supplier,
  onBack,
  onUpdateSupplier,
  onDeleteSupplier,
  onToggleSupplierStatus,
  currency = "Rs.",
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  if (!supplier) {
    return (
      <div className="empty-state-card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <h3>Supplier Not Found</h3>
        <p style={{ color: "var(--text-muted)", margin: "8px 0 20px 0" }}>
          The supplier details you are looking for do not exist or were removed.
        </p>
        <Button variant="primary" onClick={onBack}>
          ← Back to Suppliers
        </Button>
      </div>
    );
  }

  const isActive = supplier.status === "Active";
  const openBal = Number(supplier.openingBalance) || 0;
  const currBal = Number(supplier.currentBalance) || 0;

  const handleSaveEdit = (updatedData) => {
    onUpdateSupplier(supplier.id, updatedData);
    setEditModalOpen(false);
  };

  const handleConfirmDelete = (id) => {
    onDeleteSupplier(id);
    onBack();
  };

  return (
    <div className="page-customer-details">
      {/* Navigation Breadcrumb */}
      <div className="customer-breadcrumb">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back to Suppliers
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{supplier.name} Details</span>
      </div>

      {/* Supplier Profile Header Card */}
      <div className="customer-profile-card">
        <div className="profile-info-row">
          <div className="profile-main-data">
            <div className="avatar-xl">
              {supplier.name ? supplier.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <div className="customer-name-heading">
                <h2>{supplier.name}</h2>
                <span
                  className={`status-pill ${
                    isActive ? "status-cleared" : "status-due"
                  }`}
                  style={
                    !isActive
                      ? { background: "#f1f5f9", color: "#64748b", borderColor: "#cbd5e1" }
                      : {}
                  }
                >
                  {supplier.status || "Active"}
                </span>
              </div>
              <p className="profile-contact-line">
                <span className="contact-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {supplier.phone}
                </span>

                {supplier.email && (
                  <span className="contact-item">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {supplier.email}
                  </span>
                )}

                {supplier.address && (
                  <span className="contact-item">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {supplier.address}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="customer-action-buttons">
            <Button
              variant="outline"
              size="md"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              }
              onClick={() => setEditModalOpen(true)}
            >
              Edit Supplier
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmModalOpen(true)}
            >
              {isActive ? "Deactivate" : "Activate"} / Delete
            </Button>
          </div>
        </div>

        {/* Financial Highlights Strip */}
        <div className="customer-financial-strip">
          <div className="financial-cell">
            <span className="financial-label">Opening Balance</span>
            <span className="financial-val font-semibold text-dark">
              {currency} {openBal.toLocaleString()}
            </span>
          </div>

          <div className="financial-divider"></div>

          <div className="financial-cell">
            <span className="financial-label">Current Payable Balance</span>
            <span
              className={`financial-val ${
                currBal > 0 ? "text-danger font-bold" : "text-success font-bold"
              }`}
            >
              {currency} {currBal.toLocaleString()}
            </span>
          </div>

          <div className="financial-divider"></div>

          <div className="financial-cell">
            <span className="financial-label">Operational Status</span>
            <span
              className={`financial-val ${
                isActive ? "text-success font-semibold" : "text-muted font-semibold"
              }`}
            >
              {isActive ? "Active Partner" : "Inactive / On-Hold"}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Profile & Notes Details Card */}
      <div className="dashboard-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="card-header-flex" style={{ marginBottom: "18px" }}>
          <div>
            <h2 className="card-heading">Supplier Profile & Information</h2>
            <p className="card-subheading">
              Complete contact and business records for this supplier
            </p>
          </div>
          <span className="tag-count">ID: {supplier.id}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Supplier Name
            </span>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-main)" }}>
              {supplier.name}
            </span>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Phone Number
            </span>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
              {supplier.phone}
            </span>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Email Address
            </span>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-main)" }}>
              {supplier.email || "No email registered"}
            </span>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Business / Market Address
            </span>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-main)" }}>
              {supplier.address || "No address provided"}
            </span>
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ marginTop: "12px" }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-main)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Supplier Notes & Terms
          </h4>
          <div
            style={{
              padding: "14px 18px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: "4px solid var(--primary)",
              borderRadius: "6px",
              color: supplier.notes ? "var(--text-main)" : "var(--text-muted)",
              fontSize: "13px",
              lineHeight: "1.6",
              fontStyle: supplier.notes ? "normal" : "italic",
            }}
          >
            {supplier.notes || "No special notes or payment terms recorded for this supplier."}
          </div>
        </div>
      </div>

      {/* Future Purchases & Ledger Notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          color: "#1e40af",
          fontSize: "13px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>
          <strong>Note:</strong> Supplier Purchases, Bills, Payments, and Statement Ledger modules will be integrated in upcoming updates.
        </span>
      </div>

      {/* Edit Modal */}
      <SupplierModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEdit}
        supplier={supplier}
        currency={currency}
      />

      {/* Delete / Deactivate Confirmation Modal */}
      <SupplierConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        supplier={supplier}
        onConfirmDelete={handleConfirmDelete}
        onConfirmToggleStatus={onToggleSupplierStatus}
      />
    </div>
  );
}
