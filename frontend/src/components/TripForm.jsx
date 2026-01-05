import React, { useState } from 'react';
import axios from 'axios';

// Map countries to currency codes for future use
const countryCurrencyMap = {
  India: "INR",
  "United States": "USD",
  "United Kingdom": "GBP",
  France: "EUR",
  Japan: "JPY",
  Germany: "EUR",
  Canada: "CAD",
  Australia: "AUD"
  // Add more as needed
};

export default function TripForm({ token, onTripCreated }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [country, setCountry] = useState('');
  const [budget, setBudget] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const response = await axios.post(
        "http://localhost:5000/api/trips",
        {
          name,
          memberUsernames: members.split(',').map(m => m.trim()).filter(Boolean),
          country,
          budget: budget ? +budget : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      onTripCreated(response.data);
      setName('');
      setMembers('');
      setCountry('');
      setBudget('');
      setMsg('Trip created!');
    } catch {
      setMsg('Failed to create trip.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h4>Create Trip</h4>
      <input
        placeholder="Trip Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        placeholder="Members (comma separated usernames)"
        value={members}
        onChange={e => setMembers(e.target.value)}
        required
      />
      <select
        value={country}
        onChange={e => setCountry(e.target.value)}
        required
      >
        <option value="">Select Country</option>
        {Object.keys(countryCurrencyMap).map(cntry => (
          <option value={cntry} key={cntry}>{cntry}</option>
        ))}
      </select>
      <input
        placeholder="Budget (number)"
        type="number"
        min="0"
        value={budget}
        onChange={e => setBudget(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary">Create</button>
      {msg && (
        <div className={msg.startsWith('Trip created') ? "success" : "error"}>
          {msg}
        </div>
      )}
    </form>
  );
}
