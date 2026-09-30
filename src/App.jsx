import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Modal from "./components/Modal";
import Button from "./components/Button";
import {
  initialCustomers,
  initialTransactions,
  initialShopInfo,
  COUNTRY_CODES,
} from "./data/dummyData";
import { initialSuppliers, initialSupplierTransactions } from "./data/supplierData";
import {
  getActiveSession,
  clearSession,
  initOwnerCredentials,
} from "./services/authService";
import {
  generateUniqueReceiptNumber,
  isReceiptNumberUnique,
} from "./utils/receiptUtils";
import { exportTransactionReceiptPDF } from "./services/exportService";


export default function App() {
  // Session check on load: if authenticated, stay logged in across page reloads
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const activeSession = getActiveSession();
      return !!activeSession;
    } catch {
      return false;
    }
  });

  // Page persistence: remember current page (e.g. Customers) across refreshes
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const activeSession = getActiveSession();
      if (!activeSession) return "login";
      const savedPage = localStorage.getItem("hisabkitab_currentPage");
      return savedPage && savedPage !== "login" ? savedPage : "dashboard";
    } catch {
      return "dashboard";
    }
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    try {
      return localStorage.getItem("hisabkitab_selectedCustomerId") || null;
    } catch {
      return null;
    }
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState(() => {
    try {
      return localStorage.getItem("hisabkitab_selectedSupplierId") || null;
    } catch {
      return null;
    }
  });

  const [shopInfo, setShopInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("hisabkitab_shopInfo");
      return saved ? JSON.parse(saved) : initialShopInfo;
    } catch {
      return initialShopInfo;
    }
  });

  const handleUpdateShopInfo = (updatedInfo) => {
    setShopInfo(updatedInfo);
    try {
      localStorage.setItem("hisabkitab_shopInfo", JSON.stringify(updatedInfo));
    } catch (err) {
      console.error("Failed to persist shop info to localStorage", err);
    }
    toast.success("Profile & Store Settings Saved!", {
      description: `${updatedInfo.name} settings and profile updated successfully.`,
    });
  };

  useEffect(() => {
    initOwnerCredentials();
  }, []);

  const [customers, setCustomers] = useState(initialCustomers);
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem("hisabkitab_suppliers");
      return saved ? JSON.parse(saved) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  });
  const [supplierTransactions, setSupplierTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("hisabkitab_supplierTxns");
      return saved ? JSON.parse(saved) : initialSupplierTransactions;
    } catch {
      return initialSupplierTransactions;
    }
  });
  const [transactions, setTransactions] = useState(initialTransactions);

  // Helper: persist supplier txns
  const persistSupplierTxns = (updated) => {
    try {
      localStorage.setItem("hisabkitab_supplierTxns", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist supplier transactions", err);
    }
  };

  // Helper: persist suppliers
  const persistSuppliers = (updated) => {
    try {
      localStorage.setItem("hisabkitab_suppliers", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist suppliers", err);
    }
  };

  // Supplier CRUD Operations
  const handleAddSupplier = (newSupplierData) => {
    const openBal = Number(newSupplierData.openingBalance) || 0;
    const newId = `s${Date.now()}`;
    const newSupplier = {
      ...newSupplierData,
      id: newId,
      currentBalance: openBal,
      totalPurchases: openBal,
      totalPaid: 0,
      status: newSupplierData.status || "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setSuppliers((prev) => {
      const updated = [newSupplier, ...prev];
      persistSuppliers(updated);
      return updated;
    });

    // If opening balance > 0, add an opening balance transaction
    if (openBal > 0) {
      const openTxn = {
        id: `st-${Date.now()}`,
        supplierId: newId,
        supplierName: newSupplier.name,
        type: "Opening Balance",
        date: new Date().toISOString().split("T")[0],
        reference: `OB-${newId.toUpperCase()}`,
        description: "Opening payable balance brought forward",
        debit: openBal,
        credit: 0,
        paymentMethod: null,
        item: null,
        quantity: null,
        purchasePrice: null,
        totalAmount: null,
        amountPaid: null,
        remainingAmount: null,
        paymentStatus: null,
        notes: "Initial balance",
      };
      setSupplierTransactions((prev) => {
        const updated = [openTxn, ...prev];
        persistSupplierTxns(updated);
        return updated;
      });
    }

    toast.success(`Supplier Added: ${newSupplier.name}`, {
      description: `Account created with ${shopInfo.currency} ${openBal.toLocaleString()} initial balance.`,
    });
  };

  const handleUpdateSupplier = (supplierId, updatedData) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === supplierId) {
          const isOpeningBalSameAsCurr =
            Number(s.currentBalance) === Number(s.openingBalance);
          return {
            ...s,
            ...updatedData,
            currentBalance: isOpeningBalSameAsCurr
              ? Number(updatedData.openingBalance) || 0
              : s.currentBalance,
          };
        }
        return s;
      });
      persistSuppliers(updated);
      return updated;
    });

    toast.success("Supplier Updated", {
      description: `${updatedData.name} records saved successfully.`,
    });
  };

  const handleDeleteSupplier = (supplierId) => {
    const target = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => {
      const updated = prev.filter((s) => s.id !== supplierId);
      persistSuppliers(updated);
      return updated;
    });
    // Also delete their transactions
    setSupplierTransactions((prev) => {
      const updated = prev.filter((t) => t.supplierId !== supplierId);
      persistSupplierTxns(updated);
      return updated;
    });

    if (selectedSupplierId === supplierId) {
      setSelectedSupplierId(null);
      try {
        localStorage.removeItem("hisabkitab_selectedSupplierId");
      } catch (err) {
        console.error("Failed to remove selected supplier id", err);
      }
      handleNavigate("suppliers");
    }

    toast.info("Supplier Deleted", {
      description: `Supplier "${target?.name || supplierId}" has been removed from directory.`,
    });
  };

  const handleToggleSupplierStatus = (supplierId) => {
    let nextStatus = "Active";
    let name = "";
    setSuppliers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === supplierId) {
          nextStatus = s.status === "Active" ? "Inactive" : "Active";
          name = s.name;
          return { ...s, status: nextStatus };
        }
        return s;
      });
      persistSuppliers(updated);
      return updated;
    });

    toast.success(`Supplier Status Updated`, {
      description: `${name} is now marked as ${nextStatus}.`,
    });
  };

  // Record a Purchase
  const handleRecordPurchase = (purchaseTxn, meta) => {
    // Add the transaction
    setSupplierTransactions((prev) => {
      const updated = [purchaseTxn, ...prev];
      persistSupplierTxns(updated);
      return updated;
    });

    // Update supplier: currentBalance += (totalAmount - amountPaid), totalPurchases += totalAmount, totalPaid += amountPaid
    setSuppliers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === meta.supplierId) {
          const newTotal = (Number(s.totalPurchases) || 0) + Number(meta.totalAmount);
          const newPaid = (Number(s.totalPaid) || 0) + Number(meta.amountPaid);
          const newBalance = (Number(s.currentBalance) || 0) + Number(meta.remaining);
          return {
            ...s,
            totalPurchases: newTotal,
            totalPaid: newPaid,
            currentBalance: newBalance,
          };
        }
        return s;
      });
      persistSuppliers(updated);
      return updated;
    });

    const supplier = suppliers.find((s) => s.id === meta.supplierId);
    toast.success(`Purchase Recorded: ${shopInfo.currency} ${Number(meta.totalAmount).toLocaleString()}`, {
      description: `For ${supplier?.name || "Supplier"}. Remaining: ${shopInfo.currency} ${Number(meta.remaining).toLocaleString()}`,
    });
  };

  // Make a Payment to Supplier
  const handleMakePayment = (paymentTxn, meta) => {
    // Add the transaction
    setSupplierTransactions((prev) => {
      const updated = [paymentTxn, ...prev];
      persistSupplierTxns(updated);
      return updated;
    });

    // Update supplier: currentBalance -= amountPaid, totalPaid += amountPaid
    setSuppliers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === meta.supplierId) {
          const newPaid = (Number(s.totalPaid) || 0) + Number(meta.amountPaid);
          const newBalance = Math.max(0, (Number(s.currentBalance) || 0) - Number(meta.amountPaid));
          return {
            ...s,
            totalPaid: newPaid,
            currentBalance: newBalance,
          };
        }
        return s;
      });
      persistSuppliers(updated);
      return updated;
    });

    const supplier = suppliers.find((s) => s.id === meta.supplierId);
    toast.success(`Payment Recorded: ${shopInfo.currency} ${Number(meta.amountPaid).toLocaleString()}`, {
      description: `Payment sent to ${supplier?.name || "Supplier"} successfully.`,
    });
  };

  // Modal State: Add Transaction
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({
    customerId: "",
    type: "Udhaar",
    amount: "",
    description: "",
    paymentMethod: "Cash",
    billNumber: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Modal State: Add Customer
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [custForm, setCustForm] = useState({
    name: "",
    countryCode: "+92",
    phone: "",
    address: "",
    openingBalance: "",
  });

  const [activeTxnFilter, setActiveTxnFilter] = useState("all");
  const [activeCustFilter, setActiveCustFilter] = useState("all");

  // Navigation Helper with Page Persistence and Filter Parameters
  const handleNavigate = (page, targetOrFilter = null) => {
    setCurrentPage(page);

    if (page === "transactions") {
      if (typeof targetOrFilter === "object" && targetOrFilter?.typeFilter) {
        setActiveTxnFilter(targetOrFilter.typeFilter);
      } else if (typeof targetOrFilter === "string" && ["all", "Udhaar", "Jama"].includes(targetOrFilter)) {
        setActiveTxnFilter(targetOrFilter);
      } else {
        setActiveTxnFilter("all");
      }
    }

    if (page === "customers") {
      if (typeof targetOrFilter === "object" && targetOrFilter?.statusFilter) {
        setActiveCustFilter(targetOrFilter.statusFilter);
      } else if (typeof targetOrFilter === "string" && ["all", "pending", "cleared"].includes(targetOrFilter)) {
        setActiveCustFilter(targetOrFilter);
      } else {
        setActiveCustFilter("all");
      }
    }

    try {
      localStorage.setItem("hisabkitab_currentPage", page);
      if (page === "customer-details") {
        const id = typeof targetOrFilter === "string" ? targetOrFilter : targetOrFilter?.id;
        if (id) {
          setSelectedCustomerId(id);
          localStorage.setItem("hisabkitab_selectedCustomerId", id);
        }
      } else {
        setSelectedCustomerId(null);
        localStorage.removeItem("hisabkitab_selectedCustomerId");
      }

      if (page === "supplier-details") {
        const id = typeof targetOrFilter === "string" ? targetOrFilter : targetOrFilter?.id;
        if (id) {
          setSelectedSupplierId(id);
          localStorage.setItem("hisabkitab_selectedSupplierId", id);
        }
      } else {
        setSelectedSupplierId(null);
        localStorage.removeItem("hisabkitab_selectedSupplierId");
      }
    } catch (err) {
      console.error("Failed to persist current page", err);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Add Transaction Modal
  const handleOpenAddTransaction = (type = "Udhaar", customerId = null) => {
    const defaultCust = customerId || (customers[0] ? customers[0].id : "");
    const generatedSlip = generateUniqueReceiptNumber(transactions, type);
    setTxnForm({
      customerId: defaultCust,
      type: type,
      amount: "",
      description: "",
      paymentMethod: type === "Udhaar" ? "Khata Credit" : "Cash",
      billNumber: generatedSlip,
      date: new Date().toISOString().split("T")[0],
    });
    setTxnModalOpen(true);
  };

  // Submit New Transaction
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    if (!txnForm.customerId) {
      toast.error("Please select a customer for this entry.");
      return;
    }
    if (!txnForm.amount || Number(txnForm.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }

    let candidateBillNumber = (txnForm.billNumber || "").trim();

    // If billNumber is empty, automatically generate a guaranteed unique one
    if (!candidateBillNumber) {
      candidateBillNumber = generateUniqueReceiptNumber(transactions, txnForm.type);
    } else {
      // Validate uniqueness against all existing transactions in the system
      const isUnique = isReceiptNumberUnique(candidateBillNumber, transactions);
      if (!isUnique) {
        const freshUniqueNumber = generateUniqueReceiptNumber(transactions, txnForm.type);
        toast.error("Duplicate Receipt Number!", {
          description: `"${candidateBillNumber}" already exists in records. Assigned new unique receipt: ${freshUniqueNumber}`,
        });
        setTxnForm((prev) => ({ ...prev, billNumber: freshUniqueNumber }));
        return;
      }
    }

    const targetCustomer = customers.find((c) => c.id === txnForm.customerId);
    const customerName = targetCustomer ? targetCustomer.name : "Customer";
    const amountNum = Number(txnForm.amount);

    const newTxn = {
      id: `tx-${Date.now()}`,
      customerId: txnForm.customerId,
      customerName,
      type: txnForm.type,
      amount: amountNum,
      date: txnForm.date || new Date().toISOString().split("T")[0],
      description: txnForm.description || (txnForm.type === "Udhaar" ? "General goods" : "Account payment"),
      paymentMethod: txnForm.paymentMethod,
      billNumber: candidateBillNumber,
    };

    // Update transactions list
    setTransactions((prev) => [newTxn, ...prev]);

    // Update customer balances
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === txnForm.customerId) {
          const isUdhaar = txnForm.type === "Udhaar";
          const newUdhaar = (cust.totalUdhaar || 0) + (isUdhaar ? amountNum : 0);
          const newJama = (cust.totalJama || 0) + (!isUdhaar ? amountNum : 0);
          const newBalance = newUdhaar - newJama;
          return {
            ...cust,
            totalUdhaar: newUdhaar,
            totalJama: newJama,
            balance: newBalance,
            status: newBalance > 0 ? "Active" : "Clear",
            lastTransactionDate: newTxn.date,
          };
        }
        return cust;
      })
    );

    setTxnModalOpen(false);

    if (txnForm.type === "Udhaar") {
      toast.warning(`Udhaar Recorded: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Debited to ${customerName} (Unique Receipt: ${newTxn.billNumber})`,
        action: {
          label: "Print Receipt",
          onClick: () => exportTransactionReceiptPDF(newTxn, targetCustomer, shopInfo),
        },
      });
    } else {
      toast.success(`Jama Payment: ${shopInfo.currency} ${amountNum.toLocaleString()}`, {
        description: `Received from ${customerName} (Unique Receipt: ${newTxn.billNumber})`,
        action: {
          label: "Print Receipt",
          onClick: () => exportTransactionReceiptPDF(newTxn, targetCustomer, shopInfo),
        },
      });
    }
  };

  // Open Add Customer Modal
  const handleOpenAddCustomer = () => {
    setCustForm({
      name: "",
      countryCode: shopInfo?.countryCode || "+92",
      phone: "",
      address: "",
      openingBalance: "",
    });
    setCustModalOpen(true);
  };

  // Submit New Customer
  const handleSaveCustomer = (e) => {
    e.preventDefault();
    const cleanName = custForm.name.trim();
    if (!cleanName) {
      toast.error("Customer name is required.");
      return;
    }

    // Strictly enforce alphabets and spaces only for customer name
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      toast.error("Invalid Customer Name", {
        description: "Customer name must only contain alphabetic letters and spaces (no numbers allowed).",
      });
      return;
    }

    if (!custForm.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    const newId = `c${Date.now()}`;
    const openBal = Number(custForm.openingBalance || 0);
    const fullPhone = `${custForm.countryCode || "+92"} ${custForm.phone.trim()}`;

    const newCustomer = {
      id: newId,
      name: cleanName,
      phone: fullPhone,
      address: custForm.address.trim() || "Local Customer",
      totalUdhaar: openBal > 0 ? openBal : 0,
      totalJama: 0,
      balance: openBal,
      status: openBal > 0 ? "Active" : "Clear",
      lastTransactionDate: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    // If opening balance > 0, create an initial transaction entry with a guaranteed unique receipt number
    if (openBal > 0) {
      const openReceiptNo = generateUniqueReceiptNumber(transactions, "Opening");
      const initialTxn = {
        id: `tx-${Date.now()}`,
        customerId: newId,
        customerName: newCustomer.name,
        type: "Udhaar",
        amount: openBal,
        date: new Date().toISOString().split("T")[0],
        description: "Opening Previous Udhaar Balance",
        paymentMethod: "Khata Credit",
        billNumber: openReceiptNo,
      };
      setTransactions((prev) => [initialTxn, ...prev]);
    }

    setCustModalOpen(false);
    toast.success(`Customer Added: ${newCustomer.name}`, {
      description: `Khata account created with ${shopInfo.currency} ${openBal.toLocaleString()} initial balance.`,
    });
  };

  const handleLogin = (loginData) => {
    setIsAuthenticated(true);
    let targetPage = "dashboard";
    try {
      const savedPage = localStorage.getItem("hisabkitab_currentPage");
      if (savedPage && savedPage !== "login") {
        targetPage = savedPage;
      } else {
        localStorage.setItem("hisabkitab_currentPage", "dashboard");
      }
    } catch {
      targetPage = "dashboard";
    }
    setCurrentPage(targetPage);
    if (loginData?.shopInfo) {
      handleUpdateShopInfo({
        ...shopInfo,
        ...loginData.shopInfo,
      });
    }
    toast.success("Welcome Back to HisabKitab!", {
      description: `Signed in as ${loginData?.user?.name || shopInfo.owner}.`,
    });
  };

  const handleLogout = () => {
    clearSession();
    try {
      localStorage.removeItem("hisabkitab_currentPage");
      localStorage.removeItem("hisabkitab_selectedCustomerId");
      localStorage.removeItem("hisabkitab_selectedSupplierId");
    } catch (err) {
      console.error("Failed to clear navigation persistence", err);
    }
    setIsAuthenticated(false);
    setCurrentPage("login");
    toast.info("Logged Out", {
      description: "You have signed out of your khata account.",
    });
  };

  if (!isAuthenticated || currentPage === "login") {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <Login onLogin={handleLogin} shopInfo={shopInfo} />
      </>
    );
  }

  // Titles for Header
  const pageTitles = {
    dashboard: {
      title: "Khata Dashboard",
    },
    customers: {
      title: "Customers Directory",
    },
    "customer-details": {
      title: "Customer Khata Ledger",
    },
    suppliers: {
      title: "Suppliers Directory",
    },
    "supplier-details": {
      title: "Supplier Details & Info",
    },
    transactions: {
      title: "Transaction Ledger",
    },
    reports: {
      title: "Financial Analytics & Reports",
    },
    settings: {
      title: "Profile & Store Settings",
    },
  };

  const currentHeaderInfo = pageTitles[currentPage] || pageTitles.dashboard;
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <DashboardLayout
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
        shopInfo={shopInfo}
        onLogout={handleLogout}
        title={currentHeaderInfo.title}
        subtitle={currentHeaderInfo.subtitle}
        onQuickAddTransaction={() => handleOpenAddTransaction("Udhaar")}
      >
        {currentPage === "dashboard" && (
          <Dashboard
            customers={customers}
            transactions={transactions}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            onNavigate={handleNavigate}
            onOpenAddTransaction={handleOpenAddTransaction}
            onOpenAddCustomer={handleOpenAddCustomer}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "customers" && (
          <Customers
            customers={customers}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onOpenAddCustomer={handleOpenAddCustomer}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
            initialStatusFilter={activeCustFilter}
          />
        )}

        {currentPage === "customer-details" && (
          <CustomerDetails
            customer={activeCustomer}
            transactions={transactions}
            onBack={() => handleNavigate("customers")}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
            shopInfo={shopInfo}
          />
        )}

        {currentPage === "suppliers" && (
          <Suppliers
            suppliers={suppliers}
            onSelectSupplier={(id) => handleNavigate("supplier-details", id)}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onToggleSupplierStatus={handleToggleSupplierStatus}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "supplier-details" && (
          <SupplierDetails
            supplier={activeSupplier}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            onBack={() => handleNavigate("suppliers")}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onToggleSupplierStatus={handleToggleSupplierStatus}
            onRecordPurchase={handleRecordPurchase}
            onMakePayment={handleMakePayment}
            currency={shopInfo.currency}
          />
        )}

        {currentPage === "transactions" && (
          <Transactions
            transactions={transactions}
            customers={customers}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            shopInfo={shopInfo}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onSelectSupplier={(id) => handleNavigate("supplier-details", id)}
            onOpenAddTransaction={handleOpenAddTransaction}
            currency={shopInfo.currency}
            initialTypeFilter={activeTxnFilter}
          />
        )}

        {currentPage === "reports" && (
          <Reports
            customers={customers}
            transactions={transactions}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            currency={shopInfo.currency}
            shopInfo={shopInfo}
            onSelectCustomer={(id) => handleNavigate("customer-details", id)}
            onSelectSupplier={(id) => handleNavigate("supplier-details", id)}
          />
        )}

        {currentPage === "settings" && (
          <Settings
            shopInfo={shopInfo}
            onUpdateShopInfo={handleUpdateShopInfo}
          />
        )}
      </DashboardLayout>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        title={
          txnForm.type === "Udhaar"
            ? "Record Udhaar (Credit Given)"
            : "Record Jama (Payment Received)"
        }
      >
        <form onSubmit={handleSaveTransaction} className="modal-form">
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-toggle-btn type-udhaar ${
                  txnForm.type === "Udhaar" ? "active" : ""
                }`}
                onClick={() =>
                  setTxnForm((prev) => ({
                    ...prev,
                    type: "Udhaar",
                    paymentMethod: "Khata Credit",
                    billNumber: generateUniqueReceiptNumber(transactions, "Udhaar"),
                  }))
                }
              >
                Udhaar (Debit)
              </button>
              <button
                type="button"
                className={`type-toggle-btn type-jama ${
                  txnForm.type === "Jama" ? "active" : ""
                }`}
                onClick={() =>
                  setTxnForm((prev) => ({
                    ...prev,
                    type: "Jama",
                    paymentMethod: "Cash",
                    billNumber: generateUniqueReceiptNumber(transactions, "Jama"),
                  }))
                }
              >
                Jama (Credit)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-cust">
              Select Customer *
            </label>
            <select
              id="txn-cust"
              className="form-input"
              value={txnForm.customerId}
              onChange={(e) =>
                setTxnForm((prev) => ({ ...prev, customerId: e.target.value }))
              }
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: {shopInfo.currency} {c.balance})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-amount">
                Amount ({shopInfo.currency}) *
              </label>
              <input
                id="txn-amount"
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="e.g. 2500"
                value={txnForm.amount}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-date">
                Date
              </label>
              <input
                id="txn-date"
                type="date"
                className="form-input"
                value={txnForm.date}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-method">
                Payment Channel
              </label>
              <select
                id="txn-method"
                className="form-input"
                value={txnForm.paymentMethod}
                onChange={(e) =>
                  setTxnForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                <option value="Cash">Cash at Counter</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Khata Credit">Khata Credit</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" htmlFor="txn-bill" style={{ margin: 0 }}>
                  Bill / Receipt No.
                </label>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "0 2px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onClick={() => {
                    const freshSlip = generateUniqueReceiptNumber(transactions, txnForm.type);
                    setTxnForm((prev) => ({ ...prev, billNumber: freshSlip }));
                  }}
                  title="Regenerate a guaranteed unique receipt number"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Generate Unique
                </button>
              </div>
              <input
                id="txn-bill"
                type="text"
                className="form-input"
                placeholder="e.g. REC-2042"
                value={txnForm.billNumber}
                onChange={(e) =>
                  setTxnForm((prev) => ({ ...prev, billNumber: e.target.value }))
                }
                style={
                  txnForm.billNumber && !isReceiptNumberUnique(txnForm.billNumber, transactions)
                    ? { borderColor: "#ef4444", background: "#fef2f2" }
                    : {}
                }
              />
              {txnForm.billNumber && !isReceiptNumberUnique(txnForm.billNumber, transactions) ? (
                <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", fontWeight: "600" }}>
                  ⚠ Receipt #{txnForm.billNumber} is already used! Each receipt must be strictly unique.
                </div>
              ) : txnForm.billNumber ? (
                <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>
                  ✓ Guaranteed unique receipt number
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-desc">
              Description / Item Notes
            </label>
            <input
              id="txn-desc"
              type="text"
              className="form-input"
              placeholder="e.g. 5kg Sugar, 2L Cooking Oil"
              value={txnForm.description}
              onChange={(e) =>
                setTxnForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTxnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={txnForm.type === "Udhaar" ? "danger" : "success"}
            >
              Save {txnForm.type} Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={custModalOpen}
        onClose={() => setCustModalOpen(false)}
        title="Add New Customer Khata"
      >
        <form onSubmit={handleSaveCustomer} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="cust-name">
              Full Customer Name (Letters Only) *
            </label>
            <input
              id="cust-name"
              type="text"
              className="form-input"
              placeholder="e.g. Tariq Mehmood"
              value={custForm.name}
              onChange={(e) => {
                const rawVal = e.target.value;
                const alphabetsOnly = rawVal.replace(/[^a-zA-Z\s]/g, "");
                setCustForm((prev) => ({ ...prev, name: alphabetsOnly }));
                if (rawVal !== alphabetsOnly) {
                  toast.warning("Numbers Not Allowed", {
                    description: "Customer name can only contain alphabetic letters and spaces.",
                  });
                }
              }}
              required
            />
            <span className="field-hint">Numbers and digits are not permitted.</span>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-phone">
                Country Code & Phone Number *
              </label>
              <div className="phone-input-group">
                <select
                  className="country-code-select"
                  value={custForm.countryCode || "+92"}
                  onChange={(e) =>
                    setCustForm((prev) => ({ ...prev, countryCode: e.target.value }))
                  }
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <input
                  id="cust-phone"
                  type="tel"
                  className="form-input phone-number-input"
                  placeholder="300-1234567"
                  value={custForm.phone}
                  onChange={(e) =>
                    setCustForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cust-opening">
                Opening Balance ({shopInfo.currency})
              </label>
              <input
                id="cust-opening"
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="0 if new account"
                value={custForm.openingBalance}
                onChange={(e) =>
                  setCustForm((prev) => ({
                    ...prev,
                    openingBalance: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cust-address">
              Shop / Home Address (Optional)
            </label>
            <input
              id="cust-address"
              type="text"
              className="form-input"
              placeholder="e.g. Street 4, Sector G-8, Islamabad"
              value={custForm.address}
              onChange={(e) =>
                setCustForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer Account
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}