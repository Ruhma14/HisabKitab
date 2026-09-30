import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import Table from "../components/Table";
import Button from "../components/Button";
import { exportTransactionReceiptPDF } from "../services/exportService";

export default function Transactions({
  transactions = [],
  customers = [],
  shopInfo = {},
  onSelectCustomer,
  onOpenAddTransaction,
  currency = "Rs.",
  initialTypeFilter = "all",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter); // 'all', 'Udhaar', 'Jama'
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    if (initialTypeFilter) {
      setTypeFilter(initialTypeFilter);
    }
  }, [initialTypeFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        txn.customerName.toLowerCase().includes(q) ||
        (txn.description && txn.description.toLowerCase().includes(q)) ||
        (txn.billNumber && txn.billNumber.toLowerCase().includes(q));

      const matchesType =
        typeFilter === "all" ? true : txn.type === typeFilter;

      const matchesMethod =
        methodFilter === "all" ? true : txn.paymentMethod === methodFilter;

      return matchesSearch && matchesType && matchesMethod;
    });
  }, [transactions, searchQuery, typeFilter, methodFilter]);

  const totalFilteredUdhaar = filteredTransactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalFilteredJama = filteredTransactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const columns = [
    {
      header: "Slip #",
      key: "billNumber",
      width: "110px",
      render: (row) => (
        <span className="font-mono text-muted">{row.billNumber || "—"}</span>
      ),
    },
    {
      header: "Customer",
      key: "customerName",
      render: (row) => (
        <button
          type="button"
          className="customer-link-btn"
          onClick={() => onSelectCustomer && onSelectCustomer(row.customerId)}
        >
          <span className="customer-avatar-mini">
            {row.customerName ? row.customerName.charAt(0) : "C"}
          </span>
          <span className="customer-name-bold">{row.customerName}</span>
        </button>
      ),
    },
    {
      header: "Type",
      key: "type",
      render: (row) => (
        <span className={`badge-pill badge-${row.type.toLowerCase()}`}>
          <span className="badge-dot"></span>
          {row.type}
        </span>
      ),
    },
    {
      header: "Date",
      key: "date",
      render: (row) => <span className="date-cell">{row.date}</span>,
    },
    {
      header: "Description",
      key: "description",
      render: (row) => (
        <span className="txn-desc-cell">{row.description || "N/A"}</span>
      ),
    },
    {
      header: "Payment Method",
      key: "paymentMethod",
      render: (row) => (
        <span className="payment-method-tag">
          {row.paymentMethod || "Cash"}
        </span>
      ),
    },
    {
      header: "Amount",
      key: "amount",
      align: "right",
      render: (row) => (
        <span
          className={`amount-cell ${
            row.type === "Udhaar" ? "text-danger" : "text-success"
          }`}
        >
          {row.type === "Udhaar" ? "-" : "+"} {currency}{" "}
          {Number(row.amount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Receipt",
      key: "receiptAction",
      align: "center",
      width: "90px",
      render: (row) => {
        const targetCust = customers.find((c) => c.id === row.customerId) || { name: row.customerName };
        return (
          <button
            type="button"
            className="btn-print-receipt"
            title="Download unique receipt slip PDF"
            onClick={(e) => {
              e.stopPropagation();
              exportTransactionReceiptPDF(row, targetCust, shopInfo);
              toast.success(`Receipt PDF Downloaded: ${row.billNumber || "Slip"}`, {
                description: `Unique receipt slip downloaded automatically for ${row.customerName}.`,
              });
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        );
      },
    },
  ];

  return (
    <div className="page-transactions">
      {/* Summary Filter Strip */}
      <div className="transactions-summary-strip">
        <div className="summary-pill">
          <span className="summary-pill-label">Total Shown</span>
          <span className="summary-pill-val">{filteredTransactions.length} entries</span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Total Udhaar</span>
          <span className="summary-pill-val text-danger">
            {currency} {totalFilteredUdhaar.toLocaleString()}
          </span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Total Jama</span>
          <span className="summary-pill-val text-success">
            {currency} {totalFilteredJama.toLocaleString()}
          </span>
        </div>
        <div className="summary-pill">
          <span className="summary-pill-label">Net Difference</span>
          <span className="summary-pill-val font-semibold">
            {currency} {(totalFilteredUdhaar - totalFilteredJama).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="section-toolbar">
        <div className="toolbar-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by customer, invoice #, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              All Types
            </button>
            <button
              type="button"
              className={`filter-pill ${typeFilter === "Udhaar" ? "active" : ""}`}
              onClick={() => setTypeFilter("Udhaar")}
            >
              Udhaar
            </button>
            <button
              type="button"
              className={`filter-pill ${typeFilter === "Jama" ? "active" : ""}`}
              onClick={() => setTypeFilter("Jama")}
            >
              Jama
            </button>
          </div>

          <select
            className="filter-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Khata Credit">Khata Credit</option>
          </select>

          <Button
            variant="primary"
            size="md"
            icon="+"
            onClick={() => onOpenAddTransaction("Udhaar")}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="dashboard-card no-padding">
        <Table
          columns={columns}
          data={filteredTransactions}
          keyField="id"
          emptyMessage={
            searchQuery || typeFilter !== "all"
              ? "No transactions match your search filter."
              : "No transactions recorded yet."
          }
        />
      </div>
    </div>
  );
}
