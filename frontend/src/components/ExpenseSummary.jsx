import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Currency mapping
const countryCurrencyMap = {
  India: "INR", "United States": "USD", "United Kingdom": "GBP", France: "EUR", Japan: "JPY", Germany: "EUR", Canada: "CAD", Australia: "AUD"
};
const currencySymbolMap = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", JPY: "¥", CAD: "C$", AUD: "A$"
};

export default function ExpenseSummary({ tripId, token, selectedTrip,reloadKey }) {
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  let currencyCode = "USD", currencySymbol = "$";
  if (selectedTrip?.country) {
    currencyCode = countryCurrencyMap[selectedTrip.country] || "USD";
    currencySymbol = currencySymbolMap[currencyCode] || currencyCode;
  }

  useEffect(() => {
    axios.get(`http://localhost:5000/api/trips/${tripId}/expenses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setExpenses(res.data))
      .catch(() => setError('Failed to load expenses'));
  }, [tripId, token, reloadKey]);

  const total = expenses.reduce((sum, e) => sum + (+e.amount || 0), 0);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3>Trip Expenses Summary</h3>
      {error && <div className="error">{error}</div>}
      <ul className='expense-list'>
        {expenses.length === 0 && <li style={{color:'#999'}}>No expenses yet.</li>}
        {expenses.map((e, i) => (
          <li key={e._id || e.id} style={{cursor:"pointer"}} onClick={() => setOpen(open===i ? null : i)}>
            <div style={{display:'flex',alignItems:'center', justifyContent:'space-between'}}>
              <span style={{fontWeight:500}}>{e.description}</span>
              <span>
                {currencySymbol}{e.amount}
                <span style={{marginLeft:8, fontSize:'0.96em', color:'#888'}}>(by {e.paidBy})</span>
                <span style={{marginLeft:10, fontSize:'1.13em', color:"#18a"}}>{open===i ? "▼" : "▶"}</span>
              </span>
            </div>
            {open === i &&
            <div style={{
              marginTop:8, background:'#f3f7fb', borderRadius:8, padding:'10px 16px', boxShadow:'0 1.5px 6px #bbc9eb1a'
            }}>
              <div><b>Full Description:</b> {e.description}</div>
              <div><b>Paid By:</b> {e.paidBy}</div>
              {e.date && <div><b>Date:</b> {new Date(e.date).toLocaleDateString()}</div>}
              <div><b>Amount:</b> {currencySymbol}{e.amount}</div>
              {/* Add more fields if you wish */}
            </div>}
          </li>
        ))}
      </ul>
      <div style={{
        borderTop: '1.3px solid #e5e8ef', paddingTop: 10,
        fontSize: '1.3em', fontWeight: 700, color: '#1b3c8c'
      }}>
        Total: {currencySymbol}{total}
      </div>
    </div>
  );
}
