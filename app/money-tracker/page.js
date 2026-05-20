"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MoneyTracker() {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [budgetLimit, setBudgetLimit] = useState(50000);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [tempBudget, setTempBudget] = useState("");
  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    category: "",
    amount: "",
    description: ""
  });

  useEffect(() => {
    setIsClient(true);
    try {
      // Load transactions
      const saved = localStorage.getItem("money_tracker");
      if (saved && saved !== "undefined") {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTransactions(parsed);
      }

      // Load budget limit
      const savedBudget = localStorage.getItem("budget_limit");
      if (savedBudget) setBudgetLimit(parseFloat(savedBudget));

      // Auto daily ₦500 savings
      const today = new Date().toDateString();
      const lastSaved = localStorage.getItem("last_savings_date");
      if (lastSaved !== today) {
        const savedTx = localStorage.getItem("money_tracker");
        const existing = savedTx ? JSON.parse(savedTx) : [];
        const savingsTx = {
          id: Date.now(),
          type: "savings",
          category: "Daily Savings",
          amount: 500,
          description: "Auto ₦500 daily savings",
          date: new Date().toLocaleDateString()
        };
        const updated = [...existing, savingsTx];
        localStorage.setItem("money_tracker", JSON.stringify(updated));
        localStorage.setItem("last_savings_date", today);
        setTransactions(updated);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    if (isClient && transactions.length > 0) {
      localStorage.setItem("money_tracker", JSON.stringify(transactions));
    }
  }, [transactions, isClient]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = transactions.filter(t => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Budget warning
  const budgetUsed = (totalExpense / budgetLimit) * 100;
  const budgetWarning = budgetUsed >= 80 && budgetUsed < 100;
  const budgetExceeded = budgetUsed >= 100;

  // Category chart data
  const expenseByCategory = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const maxCategoryAmount = Math.max(...Object.values(expenseByCategory), 1);

  // This month transactions
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const thisMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((sum, t) => sum + t.amount, 0);

  const addTransaction = () => {
    if (!newTransaction.category || !newTransaction.amount) {
      alert("Please fill in category and amount");
      return;
    }
    const updated = [...transactions, {
      ...newTransaction,
      id: Date.now(),
      amount: parseFloat(newTransaction.amount),
      date: new Date().toLocaleDateString()
    }];
    setTransactions(updated);
    localStorage.setItem("money_tracker", JSON.stringify(updated));
    setNewTransaction({ type: "expense", category: "", amount: "", description: "" });
    setShowForm(false);
  };

  const deleteTransaction = (id) => {
    if (confirm("Delete this transaction?")) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem("money_tracker", JSON.stringify(updated));
    }
  };

  const saveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!val || val <= 0) return alert("Enter a valid budget amount");
    setBudgetLimit(val);
    localStorage.setItem("budget_limit", val.toString());
    setShowBudgetEdit(false);
  };

  const quickAdd = (category, amount) => {
    const updated = [...transactions, {
      id: Date.now(),
      type: "expense",
      category,
      amount,
      description: `Quick add - ${category}`,
      date: new Date().toLocaleDateString()
    }];
    setTransactions(updated);
    localStorage.setItem("money_tracker", JSON.stringify(updated));
  };

  const categories = {
    expense: ["Food", "Transport", "Data/Airtime", "Books", "Entertainment", "Other"],
    income: ["Allowance", "Freelance", "Gift", "Salary", "Other"]
  };

  const categoryColors = {
    Food: "bg-orange-400",
    Transport: "bg-blue-400",
    "Data/Airtime": "bg-purple-400",
    Books: "bg-yellow-400",
    Entertainment: "bg-pink-400",
    Other: "bg-gray-400"
  };

  if (!isClient) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4 text-white">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">💰 Money Tracker</h1>
          <Link href="/dashboard">
            <button className="text-gray-300 text-sm">← Dashboard</button>
          </Link>
        </div>

        {/* Budget Warning Banner */}
        {budgetExceeded && (
          <div className="mb-4 p-3 bg-red-500/30 border border-red-500 rounded-xl text-center animate-pulse">
            <p className="text-red-300 font-bold">🚨 Budget Exceeded! You've spent ₦{totalExpense.toLocaleString()} of your ₦{budgetLimit.toLocaleString()} budget!</p>
          </div>
        )}
        {budgetWarning && !budgetExceeded && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-xl text-center">
            <p className="text-yellow-300 font-bold">⚠️ Warning! You've used {budgetUsed.toFixed(0)}% of your ₦{budgetLimit.toLocaleString()} monthly budget!</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-green-400 text-xs mb-1">Total Income</p>
            <p className="text-white font-bold text-lg">₦{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-red-400 text-xs mb-1">Total Expenses</p>
            <p className="text-white font-bold text-lg">₦{totalExpense.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${balance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <p className="text-gray-300 text-xs mb-1">Balance</p>
            <p className={`font-bold text-lg ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₦{balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-500/20 rounded-xl p-3 text-center">
            <p className="text-yellow-400 text-xs mb-1">💰 Total Saved</p>
            <p className="text-yellow-300 font-bold text-lg">₦{totalSavings.toLocaleString()}</p>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white font-semibold">Monthly Budget</p>
            <button onClick={() => { setTempBudget(budgetLimit.toString()); setShowBudgetEdit(!showBudgetEdit); }}
              className="text-blue-400 text-sm">✏️ Edit</button>
          </div>
          {showBudgetEdit && (
            <div className="flex gap-2 mb-3">
              <input type="number" placeholder="Set budget (₦)" value={tempBudget}
                onChange={e => setTempBudget(e.target.value)}
                className="flex-1 p-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 text-sm" />
              <button onClick={saveBudget} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Save</button>
            </div>
          )}
          <div className="w-full bg-white/20 rounded-full h-4 mb-1">
            <div
              className={`h-4 rounded-full transition-all ${budgetExceeded ? 'bg-red-500' : budgetWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₦{totalExpense.toLocaleString()} spent</span>
            <span>{budgetUsed.toFixed(0)}% of ₦{budgetLimit.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["overview", "chart", "transactions"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}>
              {tab === "overview" ? "📊 Overview" : tab === "chart" ? "📈 Chart" : "📋 Transactions"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Daily Savings Info */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-yellow-300 font-bold">🐷 Daily Savings Pot</p>
                  <p className="text-gray-400 text-sm">₦500 saved automatically every day</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-300 font-bold text-xl">₦{totalSavings.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">{totalSavings / 500} days saved</p>
                </div>
              </div>
            </div>

            {/* This Month Summary */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white font-bold mb-3">📅 This Month</p>
              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Spent</p>
                  <p className="text-red-400 font-bold">₦{thisMonthExpenses.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Remaining Budget</p>
                  <p className={`font-bold ${budgetLimit - thisMonthExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₦{(budgetLimit - thisMonthExpenses).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Transactions</p>
                  <p className="text-white font-bold">{transactions.filter(t => t.type === "expense").length}</p>
                </div>
              </div>
            </div>

            {/* Quick Add */}
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white font-bold mb-3">⚡ Quick Add Expense</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "🍔 Food", cat: "Food", amt: 500 },
                  { label: "🚌 Transport", cat: "Transport", amt: 200 },
                  { label: "📱 Data", cat: "Data/Airtime", amt: 1000 },
                  { label: "📚 Books", cat: "Books", amt: 2000 },
                  { label: "🎮 Fun", cat: "Entertainment", amt: 1000 },
                  { label: "➕ Custom", cat: null, amt: null },
                ].map((item, i) => (
                  <button key={i}
                    onClick={() => item.cat ? quickAdd(item.cat, item.amt) : setShowForm(true)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition">
                    {item.label}<br />
                    {item.amt && <span className="text-gray-400">₦{item.amt}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart Tab */}
        {activeTab === "chart" && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white font-bold mb-4">📈 Spending by Category</p>
            {Object.keys(expenseByCategory).length === 0 ? (
              <p className="text-gray-400 text-center py-8">No expense data yet. Add some transactions!</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{cat}</span>
                      <span className="text-gray-300">₦{amt.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-6">
                      <div
                        className={`h-6 rounded-full flex items-center justify-end pr-2 transition-all ${categoryColors[cat] || 'bg-blue-400'}`}
                        style={{ width: `${(amt / maxCategoryAmount) * 100}%` }}>
                        <span className="text-white text-xs font-bold">
                          {((amt / totalExpense) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Savings vs Spending comparison */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-white font-bold mb-3">💰 Savings vs Spending</p>
              <div className="flex gap-4">
                <div className="flex-1 bg-red-500/20 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xs">Total Spent</p>
                  <p className="text-red-300 font-bold text-lg">₦{totalExpense.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-yellow-500/20 rounded-xl p-3 text-center">
                  <p className="text-yellow-400 text-xs">Total Saved</p>
                  <p className="text-yellow-300 font-bold text-lg">₦{totalSavings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white font-bold mb-3">📋 All Transactions ({transactions.length})</p>
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet!</p>
            ) : (
              [...transactions].reverse().map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 border-b border-white/10">
                  <div>
                    <p className="text-white font-semibold">{t.category}</p>
                    <p className="text-gray-400 text-xs">{t.description} • {t.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={
                      t.type === "income" ? "text-green-400 font-bold" :
                      t.type === "savings" ? "text-yellow-400 font-bold" :
                      "text-red-400 font-bold"
                    }>
                      {t.type === "income" ? "+" : t.type === "savings" ? "🐷" : "-"}₦{t.amount.toLocaleString()}
                    </span>
                    {t.type !== "savings" && (
                      <button onClick={() => deleteTransaction(t.id)}
                        className="text-red-400 text-sm px-2 py-1 bg-red-500/20 rounded-lg">
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Transaction Button */}
        <button onClick={() => setShowForm(!showForm)}
          className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold">
          + Add Transaction
        </button>

        {/* Add Transaction Form */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4 border border-white/20">
            <h3 className="text-white font-bold mb-3">Add Transaction</h3>
            <select value={newTransaction.type}
              onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: "" })}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <option value="expense" style={{ backgroundColor: '#1e1b4b' }}>Expense</option>
              <option value="income" style={{ backgroundColor: '#1e1b4b' }}>Income</option>
            </select>
            <select value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <option value="" style={{ backgroundColor: '#1e1b4b' }}>Select Category</option>
              {categories[newTransaction.type].map(cat => (
                <option key={cat} style={{ backgroundColor: '#1e1b4b' }}>{cat}</option>
              ))}
            </select>
            <input type="number" placeholder="Amount (₦)" value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <input type="text" placeholder="Description (optional)" value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg mb-3 text-white placeholder-gray-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="flex gap-3">
              <button onClick={addTransaction} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <p className="text-green-300 text-sm"> Data saved locally • 🐷 ₦500 auto-saved daily</p>
        </div>
      </div>
    </div>
  );
}