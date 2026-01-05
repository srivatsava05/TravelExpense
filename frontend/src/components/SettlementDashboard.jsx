import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Enhanced currency mapping with more countries
const countryCurrencyMap = {
  "India": "INR",
  "United States": "USD", 
  "United Kingdom": "GBP",
  "France": "EUR",
  "Japan": "JPY",
  "Germany": "EUR",
  "Canada": "CAD",
  "Australia": "AUD"
};

const currencySymbolMap = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", JPY: "¥", 
  CAD: "C$", AUD: "A$"
};

export default function SettlementDashboard({ tripId, token, selectedTrip, reloadKey }) {
  const [settlement, setSettlement] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Get currency info
  let currencyCode = "USD", currencySymbol = "$";
  if (selectedTrip?.country) {
    currencyCode = countryCurrencyMap[selectedTrip.country] || "USD";
    currencySymbol = currencySymbolMap[currencyCode] || currencyCode;
  }

  useEffect(() => {
    const fetchSettlement = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(
          `http://localhost:5000/api/trips/${tripId}/settlements`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSettlement(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load settlements.");
      } finally {
        setLoading(false);
      }
    };

    if (tripId && token) {
      fetchSettlement();
    }
  }, [tripId, token, reloadKey]);

  // Loading state
  if (loading) {
    return (
      <div className="settlement-card loading">
        <div className="loading-spinner"></div>
        <p>Loading settlement data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="settlement-card error-state">
        <div className="error-icon">⚠️</div>
        <h4>Settlement Error</h4>
        <p>{error}</p>
        <button 
          className="btn-secondary btn-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!settlement) return null;

  // Calculate additional metrics
  const hasBudget = selectedTrip && typeof selectedTrip.budget === 'number';
  const budgetPercentage = hasBudget ? (settlement.total / selectedTrip.budget) * 100 : 0;
  const isOverBudget = hasBudget && settlement.total > selectedTrip.budget;
  const memberCount = Object.keys(settlement.paid).length;
  const averageSpent = settlement.total / memberCount;

  // Sort users by net amount for better visualization
  const sortedUsers = Object.keys(settlement.paid).sort((a, b) => 
    settlement.net[b] - settlement.net[a]
  );

  return (
    <div className="settlement-card">
      {/* Header Section */}
      <div className="settlement-header">
        <div className="header-content">
          <h3>Settlement Summary</h3>
          <div className="trip-stats">
            <span className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value total-amount">
                {currencySymbol}{settlement.total.toLocaleString()}
              </span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Members:</span>
              <span className="stat-value">{memberCount}</span>
            </span>
          </div>
        </div>
        
        <button 
          className={`toggle-details-btn ${showDetails ? 'details-shown' : 'details-hidden'}`}
          onClick={() => setShowDetails(!showDetails)}
          title={showDetails ? "Hide details" : "Show details"}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Budget Section */}
      {hasBudget && showDetails && (
        <div className={`budget-section ${isOverBudget ? 'over-budget' : 'within-budget'}`}>
          <div className="budget-header">
            <span className="budget-label">Budget Tracking</span>
            <span className="budget-status">
              {isOverBudget ? "Over Budget 😬" : "Within Budget 🎉"}
            </span>
          </div>
          
          <div className="budget-bar">
            <div 
              className="budget-progress"
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
            {budgetPercentage > 100 && (
              <div 
                className="budget-overflow"
                style={{ width: `${Math.min(budgetPercentage - 100, 100)}%` }}
              ></div>
            )}
          </div>
          
          <div className="budget-details">
            <span>{currencySymbol}{settlement.total.toLocaleString()} / {currencySymbol}{selectedTrip.budget.toLocaleString()}</span>
            <span className="budget-percentage">
              {budgetPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Member Contributions */}
      <div className="members-section">
        <h4>Member Contributions</h4>
        <div className="members-grid">
          {sortedUsers.map(user => {
            const netAmount = settlement.net[user];
            const paidAmount = settlement.paid[user];
            const isCreditor = netAmount > 0;
            
            return (
              <div key={user} className={`member-card ${isCreditor ? 'creditor' : 'debtor'}`}>
                <div className="member-info">
                  <span className="member-name">{user}</span>
                  <div className="member-amounts">
                    <div className="amount-row">
                      <span className="amount-label">Paid:</span>
                      <span className="amount-value paid">
                        {currencySymbol}{paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="amount-row">
                      <span className="amount-label">Net:</span>
                      <span className={`amount-value net ${isCreditor ? 'positive' : 'negative'}`}>
                        {netAmount >= 0 ? '+' : ''}{currencySymbol}{Math.abs(netAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="member-status">
                  {isCreditor ? "💰" : "💳"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement Transactions */}
      <div className="settlements-section">
        <h4>Required Transactions</h4>
        {settlement.settlements.length === 0 ? (
          <div className="all-settled">
            <div className="settled-icon">🎉</div>
            <h5>All Settled Up!</h5>
            <p>No transactions needed - everyone is even.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {settlement.settlements.map((tx, i) => (
              <div key={i} className="transaction-item">
                <div className="transaction-flow">
                  <span className="payer">{tx.from}</span>
                  <div className="flow-arrow">
                    <span className="arrow">→</span>
                  </div>
                  <span className="payee">{tx.to}</span>
                </div>
                <div className="transaction-amount">
                  {currencySymbol}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Details (Expandable) */}
      {showDetails && (
        <div className="additional-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Average per person:</span>
              <span className="detail-value">
                {currencySymbol}{averageSpent.toLocaleString()}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Currency:</span>
              <span className="detail-value">{currencyCode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Transactions needed:</span>
              <span className="detail-value">{settlement.settlements.length}</span>
            </div>
            {hasBudget && (
              <div className="detail-item">
                <span className="detail-label">
                  {isOverBudget ? "Over budget by:" : "Under budget by:"}
                </span>
                <span className={`detail-value ${isOverBudget ? 'negative' : 'positive'}`}>
                  {currencySymbol}{Math.abs(settlement.total - selectedTrip.budget).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
