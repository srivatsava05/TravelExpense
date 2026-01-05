import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Currency data
const countryCurrencyMap = {
  India: "INR",
  "United States": "USD",
  "United Kingdom": "GBP",
  France: "EUR",
  Japan: "JPY",
  Germany: "EUR",
  Canada: "CAD",
  Australia: "AUD",
};
const currencySymbolMap = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export default function ExpenseForm({ tripId, token, selectedTrip, onExpenseChange }) {
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [scanResult, setScanResult] = useState("");
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const suggestionsRef = useRef(null);

  let currencyCode = "USD";
  let currencySymbol = "$";
  if (selectedTrip?.country) {
    currencyCode = countryCurrencyMap[selectedTrip.country] || "USD";
    currencySymbol = currencySymbolMap[currencyCode] || currencyCode;
  }

  const handleScanReceipt = async () => {
    if (!receipt) {
      setMsg("Please select a receipt file first.");
      return;
    }
    setScanResult("");
    setMsg("");
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("receipt", receipt);
      const res = await axios.post("http://localhost:5000/api/receipt-scan", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { text, amount: detectedAmount, date: detectedDate } = res.data;

      setScanResult(text);
      setMsg("Auto-scan complete! Please verify results:");

      setAmount(detectedAmount ? detectedAmount.toString() : "");
      setDate(detectedDate || "");
    } catch (err) {
      setMsg("Scan failed: " + (err.response?.data?.error || err.message || "Unknown error"));
    }
    setScanning(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    
    // Validate that paidBy is a valid trip member
    if (!selectedTrip?.members?.includes(paidBy)) {
      setMsg("Error: 'Paid by' must be a valid trip member");
      return;
    }
    
    try {
      await axios.post(
        `http://localhost:5000/api/trips/${tripId}/expenses`,
        {
          amount,
          paidByUsername: paidBy,
          description,
          date,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAmount("");
      setPaidBy("");
      setDescription("");
      setDate("");
      setReceipt(null);
      setScanResult("");
      setMsg("Expense added!");
      if (onExpenseChange) onExpenseChange();
    } catch {
      setMsg("Failed to add expense.");
    }
  };

  // Load trip members for auto-complete
  useEffect(() => {
    if (selectedTrip?.members) {
      setSuggestions(selectedTrip.members);
    }
  }, [selectedTrip]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePaidByChange = (e) => {
    const value = e.target.value;
    setPaidBy(value);
    
    if (value) {
      const filtered = suggestions.filter(member =>
        member.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setPaidBy(suggestion);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h4>Add Expense</h4>
      <input
        type="number"
        placeholder={`Amount (${currencySymbol})`}
        value={amount}
        min="0"
        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
        required
      />
      <div style={{ position: "relative" }} ref={suggestionsRef}>
        <input
          placeholder="Paid by"
          value={paidBy}
          onChange={handlePaidByChange}
          required
          autoComplete="off"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            listStyle: "none",
            padding: 0,
            margin: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: index < filteredSuggestions.length - 1 ? "1px solid #eee" : "none"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="date"
        placeholder="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div style={{ margin: "8px 0 12px 0" }}>
        <label>
          Receipt (optional):{" "}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceipt(e.target.files[0])}
            style={{ marginLeft: 7 }}
          />
        </label>
        {receipt && (
          <button
            type="button"
            onClick={handleScanReceipt}
            disabled={scanning}
            style={{
              marginLeft: 12,
              background: "#ffecd2",
              color: "#4a3",
              border: "1px solid #fde6cc",
              padding: "5px 12px",
              borderRadius: "7px",
              fontSize: "0.98em",
              cursor: scanning ? "not-allowed" : "pointer",
            }}
          >
            {scanning ? "Scanning..." : "Auto-scan Amount/Date"}
          </button>
        )}
      </div>
      {!!scanResult && (
        <div
          style={{
            background: "#f4f7fd",
            border: "1px solid #ecf0f5",
            padding: 7,
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            color: "#234",
          }}
        >
          <b>Scan text:</b>
          <div style={{ fontSize: "0.92em", marginTop: "2px" }}>
            {scanResult.slice(0, 500)}
            {scanResult.length > 500 && "..."}
          </div>
        </div>
      )}
      <button type="submit" className="btn-primary">
        Add Expense
      </button>
      {msg && <div className={msg.startsWith("Expense added") ? "success" : "error"}>{msg}</div>}
    </form>
  );
}
