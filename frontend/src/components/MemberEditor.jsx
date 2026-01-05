import React, { useState } from 'react';
import axios from 'axios';

export default function MemberEditor({ trip, token, setSelectedTrip, tripId }) {
  const [newMember, setNewMember] = useState('');
  const [removeMember, setRemoveMember] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Reloads the trip from the backend after any change
  const reloadTrip = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/trips/${tripId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTrip(data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setSelectedTrip(null);
        setMsg("You are no longer a member of this trip or the trip was deleted.");
      } else {
        setMsg("Failed to reload trip data.");
      }
      setLoading(false);
    }
  };

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post(
        `http://localhost:5000/api/trips/${tripId}/add-member`,
        { username: newMember },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Added!');
      setNewMember('');
      reloadTrip();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Add failed');
    }
  };

  // Remove member
  const handleRemoveMember = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!removeMember) {
      setMsg('Please select a member to remove.');
      return;
    }
    try {
      await axios.post(
        `http://localhost:5000/api/trips/${tripId}/remove-member`,
        { username: removeMember },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Removed!');
      setRemoveMember('');
      reloadTrip();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Remove failed');
    }
  };

  return (
    <div className="card">
      <h4>Members</h4>
      {loading ? (
        <div style={{marginBottom: 8, color: "#999"}}>Loading members...</div>
      ) : (
        trip && trip.members && trip.members.length > 0 ? (
          <ul>
            {trip.members.map(u => <li key={u}>{u}</li>)}
          </ul>
        ) : (
          <div style={{ color: "#990000" }}>No members in this trip.</div>
        )
      )}
      <hr />
      <form onSubmit={handleAddMember} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <input
          placeholder="Add member by username"
          value={newMember}
          onChange={e => setNewMember(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>Add</button>
      </form>
      <form onSubmit={handleRemoveMember} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <select
          value={removeMember}
          onChange={e => setRemoveMember(e.target.value)}
          disabled={loading || !(trip && trip.members && trip.members.length > 0)}
          required
        >
          <option value="">-- Select member --</option>
          {trip.members.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary" disabled={loading}>Remove</button>
      </form>
      {msg && <div style={{ marginTop: 6, color: msg.endsWith("!") ? "green" : "red" }}>{msg}</div>}
    </div>
  );
}
