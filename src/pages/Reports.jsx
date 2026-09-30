import { useState, useMemo } from "react";
import { toast } from "sonner";
import StatCard from "../components/StatCard";
import Button from "../components/Button";
import Table from "../components/Table";
import { monthlyReportData, categoryBreakdown } from "../data/dummyData";
import {
  exportOverallExcel,
  exportCustomerExcel,
  exportOverallPDF,
  exportCustomerPDF,
} from "../services/exportService";

export default function Reports({
  customers = [],
  transactions = [],
  currency = "Rs.",
  shopInfo = {},
  onSelectCustomer,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");

  const totalUdhaar = transactions
    .filter((t) => t.type === "Udhaar")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalJama = transactions
    .filter((t) => t.type === "Jama")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalUdhaar - totalJama;

  const recoveryRate =
    totalUdhaar > 0 ? Math.round((totalJama / totalUdhaar) * 100) : 100;

  const maxMonthlyVal = Math.max(
    ...monthlyReportData.map((d) => Math.max(d.udhaar, d.jama)),
    100000
  );

  // Filter customers for the individual statements directory table
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = customerSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, customerSearch]);

  // Main Export handler (from top banner or individual rows)
  const handleExport = (type, targetCustomer = null) => {
    if (targetCustomer) {
      if (type === "PDF") {
        exportCustomerPDF(targetCustomer, transactions, shopInfo);
        toast.success(`PDF Statement: ${targetCustomer.name}`, {
          description: "Customer statement PDF downloaded automatically.",
        });
      } else {
        exportCustomerExcel(targetCustomer, transactions, shopInfo);
        toast.success(`Excel Statement: ${targetCustomer.name}`, {
          description: "Customer statement downloaded as formatted Excel (.xls).",
        });
      }
      return;
    }

    // Export based on top toolbar selection
    if (selectedCustomerId === "all") {
      if (type === "PDF") {
        exportOverallPDF(customers, transactions, shopInfo, selectedPeriod, monthlyReportData);
        toast.success("Business PDF Report Downloaded", {
          description: "Full financial report PDF downloaded automatically.",
        });
      } else {
        exportOverallExcel(customers, transactions, shopInfo, selectedPeriod);
        toast.success("Business Excel Report Downloaded", {
          description: "Comprehensive financial ledger exported as formatted Excel (.xls).",
        });
      }
    } else {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (!cust) return;
      if (type === "PDF") {
        exportCustomerPDF(cust, transactions, shopInfo);
        toast.success(`PDF Statement: ${cust.name}`, {
          description: "Customer statement PDF downloaded automatically.",
        });
      } else {
        exportCustomerExcel(cust, transactions, shopInfo);
        toast.success(`Excel Statement: ${cust.name}`, {
          description: "Customer statement downloaded as formatted Excel (.xls).",
        });
      }
    }
  };

  const customerColumns = [
    {
      header: "Customer",
      key: "name",
      render: (c) => (
        <div className="table-customer-cell">
          <div className="avatar-circle">{c.name.charAt(0)}</div>
          <div>
            <span className="customer-name-bold">{c.name}</span>
            <span className="customer-meta-sub">{c.address || "Local Customer"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Phone Number",
      key: "phone",
      render: (c) => (
        <span className="customer-phone-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          {c.phone}
        </span>
      ),
    },
    {
      header: "Total Udhaar",
      key: "totalUdhaar",
      align: "right",
      render: (c) => (
        <span className="text-danger font-medium">
          {currency} {(c.totalUdhaar || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Total Jama",
      key: "totalJama",
      align: "right",
      render: (c) => (
        <span className="text-success font-medium">
          {currency} {(c.totalJama || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Balance Owed",
      key: "balance",
      align: "right",
      render: (c) => {
        const bal = c.balance || 0;
        return (
          <span className={`balance-badge ${bal > 0 ? "balance-due" : "balance-cleared"}`}>
            {bal > 0 ? `Owes ${currency} ${bal.toLocaleString()}` : "Cleared"}
          </span>
        );
      },
    },
    {
      header: "Export Actions",
      key: "actions",
      align: "center",
      render: (c) => (
        <div className="table-action-btns" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("PDF", c)}
            title={`Export ${c.name} Statement as PDF`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("Excel", c)}
            title={`Export ${c.name} Statement as Excel CSV`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10"></path>
              <path d="M12 20V4"></path>
              <path d="M6 20v-6"></path>
            </svg>
            <span>Excel</span>
          </Button>
          {onSelectCustomer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectCustomer(c.id)}
              title="View full khata ledger"
            >
              Khata →
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-reports">
      {/* Top Export Bar */}
      <div className="reports-top-bar" style={{ justifyContent: "flex-end" }}>
        <div className="reports-export-group">
          {/* Target Customer Dropdown */}
          <select
            className="filter-select customer-export-select"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            title="Choose target report (All customers or specific customer statement)"
          >
            <option value="all">📊 All Customers (Full Business)</option>
            <optgroup label="Individual Customer Statements">
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} ({(c.balance || 0) > 0 ? `Due: ${currency} ${(c.balance || 0).toLocaleString()}` : "Cleared"})
                </option>
              ))}
            </optgroup>
          </select>

          {/* Period Dropdown */}
          <select
            className="filter-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Current Financial Year</option>
            <option value="all">All Time History</option>
          </select>

          {/* Functional Export PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("PDF")}
            title="Generate and save statement as PDF"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Export PDF</span>
          </Button>

          {/* Functional Export Excel Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("Excel")}
            title="Download formatted spreadsheet for Microsoft Excel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10"></path>
              <path d="M12 20V4"></path>
              <path d="M6 20v-6"></path>
            </svg>
            <span>Export CSV / Excel</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards (No Subtitles) */}
      <section className="dashboard-stats-grid">
        <StatCard
          title="Overall Recovery Rate"
          value={`${recoveryRate}%`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          }
          variant="success"
          trend={{ direction: "up", label: "+4% vs last month" }}
        />

        <StatCard
          title="Total Credit Extended"
          value={`${currency} ${totalUdhaar.toLocaleString()}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          }
          variant="danger"
          trend={{ direction: "up", label: "Credit" }}
        />

        <StatCard
          title="Total Cash Collected"
          value={`${currency} ${totalJama.toLocaleString()}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          }
          variant="primary"
          trend={{ direction: "up", label: "Collected" }}
        />

        <StatCard
          title="Active Khata Customers"
          value={customers.filter((c) => (c.balance || 0) > 0).length}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
          variant="warning"
          trend={{ direction: "up", label: "Pending Due" }}
        />
      </section>

      {/* Individual Customer Khata Statements Export Directory */}
      <div className="dashboard-card customer-export-directory-card" style={{ marginBottom: "24px" }}>
        <div className="card-header-flex">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 className="card-heading">Customer Khata Statements (Export Separately)</h3>
            <span className="badge-pill badge-primary">{customers.length} Accounts</span>
          </div>

          <div className="toolbar-search-box" style={{ maxWidth: "280px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={{ padding: "6px 10px 6px 32px", fontSize: "13px" }}
            />
            {customerSearch && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setCustomerSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-table-scroll-wrap" style={{ marginTop: "12px" }}>
          <Table
            columns={customerColumns}
            data={filteredCustomers}
            keyField="id"
            emptyMessage="No matching customer accounts found."
          />
        </div>
      </div>

      {/* Monthly Udhaar vs Jama Comparison Chart (No Subtitle) */}
      <div className="dashboard-card reports-chart-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-heading">Monthly Udhaar vs. Jama Comparison</h3>
          </div>

          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color legend-udhaar"></span> Udhaar (Credit)
            </span>
            <span className="legend-item">
              <span className="legend-color legend-jama"></span> Jama (Payment)
            </span>
          </div>
        </div>

        <div className="bar-chart-container">
          <div className="bar-chart-bars">
            {monthlyReportData.map((item, index) => {
              const udhaarHeight = Math.round((item.udhaar / maxMonthlyVal) * 100);
              const jamaHeight = Math.round((item.jama / maxMonthlyVal) * 100);

              return (
                <div key={index} className="chart-bar-group">
                  <div className="bars-pair">
                    <div
                      className="bar-fill bar-udhaar"
                      style={{ height: `${udhaarHeight}%` }}
                      title={`Udhaar: ${currency} ${item.udhaar.toLocaleString()}`}
                    >
                      <span className="bar-tooltip">
                        {currency} {(item.udhaar / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div
                      className="bar-fill bar-jama"
                      style={{ height: `${jamaHeight}%` }}
                      title={`Jama: ${currency} ${item.jama.toLocaleString()}`}
                    >
                      <span className="bar-tooltip">
                        {currency} {(item.jama / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                  <span className="chart-bar-label">{item.month}</span>
                  <span className="chart-bar-rate">{item.collectionRate}% rec.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Monthly Performance Summary (No Subtitles) */}
      <div className="reports-analytics-split">
        {/* Category Breakdown */}
        <div className="dashboard-card category-breakdown-card">
          <h3 className="card-heading">Top Udhaar Categories</h3>

          <div className="category-progress-list" style={{ marginTop: "14px" }}>
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="category-progress-item">
                <div className="category-item-header">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-amount">
                    {currency} {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor:
                        idx === 0
                          ? "#2563eb"
                          : idx === 1
                          ? "#16a34a"
                          : idx === 2
                          ? "#d97706"
                          : "#7c3aed",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Recovery Snapshot Table */}
        <div className="dashboard-card recovery-velocity-card">
          <h3 className="card-heading">Recovery Velocity</h3>

          <div className="report-summary-table-wrap" style={{ marginTop: "14px" }}>
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Udhaar</th>
                  <th>Jama</th>
                  <th style={{ textAlign: "right" }}>Rec. %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReportData.slice(-4).map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{row.month}</td>
                    <td className="text-danger font-medium">{currency} {(row.udhaar / 1000).toFixed(0)}k</td>
                    <td className="text-success font-medium">{currency} {(row.jama / 1000).toFixed(0)}k</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`badge-pill ${row.collectionRate >= 80 ? "badge-jama" : "badge-udhaar"}`}>
                        <span className="badge-dot"></span>
                        {row.collectionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
