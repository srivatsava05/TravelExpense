import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import TripForm from './components/TripForm';
import ExpenseForm from './components/ExpenseForm';
import SettlementDashboard from './components/SettlementDashboard';
import ExpenseSummary from './components/ExpenseSummary';
import CurrencyConverter from './components/CurrencyConverter';
import MemberEditor from './components/MemberEditor';
import FeedbackModal from './components/FeedbackModal';
import AdminPage from './components/AdminPage';
import axios from 'axios';
import './App.css';

// -- AI and PDF Components -- (keeping your existing components)

function AIChatbot() {
  return (
    <div className="side-section">
      <h3>
        AI Chatbot <span className="coming-soon">Coming Soon</span>
      </h3>
      <p>Chat with our AI assistant about trip planning, expenses, and more! (Launching soon)</p>
    </div>
  );
}

function ExpenseTips() {
  return (
    <div className="side-section">
      <h3>Smart Spending Suggestions</h3>
      <ul>
        <li>Share rides or carpool for airport transfers.</li>
        <li>Plan meals at affordable, local restaurants.</li>
        <li>Use daily spending limits to track expenses.</li>
      </ul>
    </div>
  );
}

function PlacesRecommender() {
  return (
    <div className="side-section">
      <h3>Recommended Places to Visit</h3>
      <ul>
        <li>
          <strong>City Museum</strong> – Explore local history. <em>2 km from center</em>
        </li>
        <li>
          <strong>Riverside Park</strong> – Enjoy nature and peaceful vibes.
        </li>
      </ul>
      <span className="coming-soon">AI-enhanced recommendations soon</span>
    </div>
  );
}

function RecommendTab({ type }) {
  const data = {
    hotel: [
      { name: 'Hotel Comfort', info: '3-star, central, ₹3500/night' },
      { name: 'Budget Stay', info: 'Near station, ₹1400/night' },
    ],
    vehicle: [
      { name: 'ZoomCar', info: 'Self-drive ₹1200/day' },
      { name: 'Ola/Uber', info: 'Book per ride' },
    ],
    restaurant: [
      { name: 'Spice Palace', info: 'Local, ₹250/meal' },
      { name: 'Urban Grill', info: 'Multi-cuisine, ₹400/meal' },
    ],
  };
  return (
    <div className="side-section">
      <h3>
        {type.charAt(0).toUpperCase() + type.slice(1)} Recommender{' '}
        <span className="coming-soon">Demo</span>
      </h3>
      <ul>
        {data[type].map((item, idx) => (
          <li key={idx}>
            <strong>{item.name}</strong> – {item.info}
          </li>
        ))}
      </ul>
      <span className="coming-soon">AI matching soon!</span>
    </div>
  );
}

function SidePanel({ open, onClose }) {
  const [tab, setTab] = useState('chatbot');

  return (
    <div className={`ai-side-panel${open ? ' open' : ''}`}>
      <button className="close-btn" onClick={onClose} title="Close">
        &times;
      </button>
      <div className="side-tabs">
        <button onClick={() => setTab('chatbot')} className={tab === 'chatbot' ? 'active' : ''}>
          Chatbot
        </button>
        <button onClick={() => setTab('tips')} className={tab === 'tips' ? 'active' : ''}>
          Expense Tips
        </button>
        <button onClick={() => setTab('places')} className={tab === 'places' ? 'active' : ''}>
          Places
        </button>
        <button onClick={() => setTab('hotel')} className={tab === 'hotel' ? 'active' : ''}>
          Hotels
        </button>
        <button onClick={() => setTab('vehicle')} className={tab === 'vehicle' ? 'active' : ''}>
          Vehicles
        </button>
        <button onClick={() => setTab('restaurant')} className={tab === 'restaurant' ? 'active' : ''}>
          Restaurants
        </button>
      </div>
      <div className="side-content">
        {tab === 'chatbot' && <AIChatbot />}
        {tab === 'tips' && <ExpenseTips />}
        {tab === 'places' && <PlacesRecommender />}
        {['hotel', 'vehicle', 'restaurant'].includes(tab) && <RecommendTab type={tab} />}
      </div>
    </div>
  );
}

function ExportPDFButton({ selectedTrip, token }) {
  const handleExport = async () => {
    if (!selectedTrip || !selectedTrip._id) {
      alert('No trip selected');
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/trips/${selectedTrip._id}/expenses/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTrip.name?.replace(/\s+/g, '_') || 'expenses_report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to download PDF');
    }
  };

  return (
    <button
      className="pdf-export-btn"
      onClick={handleExport}
      title="Export all trip details as PDF"
      style={{ marginTop: '2rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
    >
      Export Expenses as PDF
    </button>
  );
}

// ========== MAIN APP ==========
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/trips', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((ts) => setTrips(ts))
        .catch(() => setTrips([]));
    }
  }, [token, reloadKey]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  const handleLogout = () => {
    setToken('');
    setIsAdmin(false);
    localStorage.clear();
    setSelectedTrip(null);
    setShowAdmin(false);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Delete this trip?')) return;
    await fetch(`http://localhost:5000/api/trips/${tripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setTrips(trips.filter((t) => (t._id || t.id) !== tripId));
    if (selectedTrip && (selectedTrip._id || selectedTrip.id) === tripId) setSelectedTrip(null);
    setReloadKey((k) => k + 1);
  };

  // If showing admin page, render only the admin page
  if (showAdmin) {
    return <AdminPage setShowAdmin={setShowAdmin} />;
  }

  return (
    <div>
      <header className="main-header">
        <span className="app-logo">✈️</span>
        <span className="app-title-gradient">
          Travel <span style={{ fontWeight: 600 }}>Expense</span> Manager
        </span>
        {token && (
          <div
            style={{
              position: 'absolute',
              right: 32,
              top: 26,
              zIndex: 2,
              textAlign: 'right',
            }}
          >
            {isAdmin && (
              <button 
                onClick={() => setShowAdmin(true)}
                style={{
                  padding: '8px 15px',
                  marginRight: '10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        )}
      </header>

      {!token ? (
        <div
          className="auth-bg"
          style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="centerbox">
            {showRegister ? (
              <Register setShowRegister={setShowRegister} />
            ) : (
              <Login setToken={setToken} setIsAdmin={setIsAdmin} setShowRegister={setShowRegister} />
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-root">
          <div className="main-column">
            {/* FEEDBACK BUTTON */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowFeedbackForm(true)}
                style={{ 
                  padding: '10px 15px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Feedback
              </button>
            </div>

            <TripForm token={token} onTripCreated={(t) => setTrips([...trips, t])} />
            <h3>Your Trips</h3>
            <div className="trip-list">
              {trips.map((trip) => (
                <div
                  key={trip._id || trip.id}
                  className={`trip-item${
                    selectedTrip && (selectedTrip._id || selectedTrip.id) === (trip._id || trip.id) ? ' active' : ''
                  }`}
                >
                  <span onClick={() => setSelectedTrip(trip)}>{trip.name}</span>
                  <button className="delete-btn" onClick={() => handleDeleteTrip(trip._id || trip.id)}>
                    🗑
                  </button>
                </div>
              ))}
            </div>
            {selectedTrip && (
              <>
                <MemberEditor
                  trip={selectedTrip}
                  token={token}
                  setSelectedTrip={setSelectedTrip}
                  tripId={selectedTrip._id || selectedTrip.id}
                />
                <ExpenseForm
                  tripId={selectedTrip._id || selectedTrip.id}
                  token={token}
                  selectedTrip={selectedTrip}
                  onExpenseChange={() => setReloadKey((k) => k + 1)}
                />
                <ExpenseSummary
                  tripId={selectedTrip._id || selectedTrip.id}
                  token={token}
                  selectedTrip={selectedTrip}
                  reloadKey={reloadKey}
                />
                <SettlementDashboard
                  tripId={selectedTrip._id || selectedTrip.id}
                  token={token}
                  selectedTrip={selectedTrip}
                  reloadKey={reloadKey}
                />
                <ExportPDFButton selectedTrip={selectedTrip} token={token} />
              </>
            )}
          </div>
          <div className="sidebar">
            <div className="currency-converter">
              <CurrencyConverter token={token} selectedTrip={selectedTrip} />
            </div>
          </div>

          {/* AI BUTTON */}
          <button
            className="ai-panel-trigger-bottom"
            onClick={() => setPanelOpen(true)}
            title="Show AI Features"
          >
            <span style={{ fontSize: '1.3em', verticalAlign: 'middle' }}>🤖</span> &nbsp; AI Features
          </button>
          
          {/* AI PANEL */}
          <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)} />

          {/* FEEDBACK MODAL */}
          {showFeedbackForm && (
            <FeedbackModal 
              token={token}
              onClose={() => setShowFeedbackForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
