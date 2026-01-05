import React, { useState } from 'react';

// Static exchange rates (as of July 2025, update as needed)
const rates = {
  USD: { USD: 1, INR: 83.2, EUR: 0.92, GBP: 0.78, JPY: 157.01 },
  INR: { USD: 0.012, INR: 1, EUR: 0.011, GBP: 0.0094, JPY: 1.89 },
  EUR: { USD: 1.09, INR: 90.6, EUR: 1, GBP: 0.85, JPY: 170.73 },
  GBP: { USD: 1.28, INR: 106.25, EUR: 1.18, GBP: 1, JPY: 200.98 },
  JPY: { USD: 0.0064, INR: 0.53, EUR: 0.0058, GBP: 0.0050, JPY: 1 }
};

function convertCurrency(amount, from, to) {
  if (rates[from] && rates[from][to]) {
    return amount * rates[from][to];
  } else if (rates[to] && rates[to][from]) {
    return amount / rates[to][from];
  } else {
    return null;
  }
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [result, setResult] = useState('');

  const handleConvert = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      setResult('Enter a valid amount.');
      return;
    }
    if (from === to) {
      setResult(`${amt} ${from} = ${amt} ${to}`);
      return;
    }
    const converted = convertCurrency(amt, from, to);
    if (converted === null) {
      setResult('Conversion rate not defined!');
    } else {
      setResult(`${amt} ${from} = ${converted.toFixed(2)} ${to}`);
    }
  };

  return (
    <div className="card" style={{maxWidth:380, margin:'32px auto'}}>
      <h4>Currency Converter (Offline)</h4>
      <form onSubmit={handleConvert}>
        <input
          type="number"
          value={amount}
          placeholder="Amount"
          min="0"
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <select value={from} onChange={e => setFrom(e.target.value)} style={{ flex: 1 }}>
            <option value="USD">US Dollar</option>
            <option value="INR">Indian Rupee</option>
            <option value="EUR">Euro</option>
            <option value="GBP">British Pound</option>
            <option value="JPY">Japanese Yen</option>
          </select>
          <span style={{ alignSelf: 'center' }}>→</span>
          <select value={to} onChange={e => setTo(e.target.value)} style={{ flex: 1 }}>
            <option value="INR">Indian Rupee</option>
            <option value="USD">US Dollar</option>
            <option value="EUR">Euro</option>
            <option value="GBP">British Pound</option>
            <option value="JPY">Japanese Yen</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Convert</button>
      </form>
      {result && <div style={{ marginTop: 15, fontWeight: 500 }}>{result}</div>}
    </div>
  );
}
