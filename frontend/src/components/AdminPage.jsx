// AdminPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

function AdminPage({ setShowAdmin }) {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(response.data);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/feedbacks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFeedbacks(response.data);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      setUsers(users.map(user =>
        user._id === userId ? { ...user, isAdmin: newRole === 'admin' } : user
      ));
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const replyToFeedback = async (feedbackId) => {
    const reply = replyText[feedbackId];
    if (!reply || !reply.trim()) {
      setError('Please enter a reply');
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/admin/feedbacks/${feedbackId}/reply`,
        { reply: reply.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      setFeedbacks(feedbacks.map(feedback =>
        feedback._id === feedbackId 
          ? { ...feedback, adminReply: reply.trim(), repliedAt: new Date() }
          : feedback
      ));
      setReplyText({ ...replyText, [feedbackId]: '' });
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reply');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      fetchFeedbacks();
    }
  }, [activeTab]);

  const handleReplyChange = (feedbackId, value) => {
    setReplyText({ ...replyText, [feedbackId]: value });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Admin Dashboard</h1>
        <button
          onClick={() => setShowAdmin(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to App
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e9ecef' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'users' ? '#007bff' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#007bff',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('feedbacks')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'feedbacks' ? '#007bff' : 'transparent',
            color: activeTab === 'feedbacks' ? 'white' : '#007bff',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer'
          }}
        >
          Feedback Management
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2>User Management</h2>
          {loading ? (
            <div>Loading users...</div>
          ) : users.length === 0 ? (
            <div>No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Username</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{user.username}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: user.isAdmin ? '#d4edda' : '#d1ecf1',
                          color: user.isAdmin ? '#155724' : '#0c5460'
                        }}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => toggleUserRole(user._id, user.isAdmin ? 'admin' : 'user')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: user.isAdmin ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {user.isAdmin ? 'Make User' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedbacks' && (
        <div>
          <h2>Feedback Management</h2>
          {loading ? (
            <div>Loading feedbacks...</div>
          ) : feedbacks.length === 0 ? (
            <div>No feedbacks found.</div>
          ) : (
            <div>
              {feedbacks.map((feedback) => (
                <div key={feedback._id} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>From: </strong>{feedback.username}
                    <span style={{ marginLeft: '20px', color: '#6c757d', fontSize: '14px' }}>
                      {new Date(feedback.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '15px'
                  }}>
                    <strong>Feedback:</strong>
                    <div style={{ marginTop: '5px' }}>{feedback.message}</div>
                  </div>

                  {feedback.adminReply && (
                    <div style={{
                      backgroundColor: '#e3f2fd',
                      padding: '15px',
                      borderRadius: '5px',
                      marginBottom: '15px'
                    }}>
                      <strong>Your Reply:</strong>
                      <div style={{ marginTop: '5px' }}>{feedback.adminReply}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                        Replied on: {new Date(feedback.repliedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div>
                    <textarea
                      value={replyText[feedback._id] || ''}
                      onChange={(e) => handleReplyChange(feedback._id, e.target.value)}
                      placeholder={feedback.adminReply ? "Update your reply..." : "Type your reply..."}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '5px',
                        resize: 'vertical',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      onClick={() => replyToFeedback(feedback._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      {feedback.adminReply ? 'Update Reply' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

AdminPage.propTypes = {
  setShowAdmin: PropTypes.func.isRequired,
};

export default AdminPage;
