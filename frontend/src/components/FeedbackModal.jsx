import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FeedbackModal({ token, onClose }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'history'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(
        'http://localhost:5000/api/feedback',
        { message: message.trim() },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage('Thank you for your feedback! We will review it soon.');
      setMessage('');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{
            margin: 0,
            color: '#333',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Feedback
          </h2>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #eee'
        }}>
          <button
            onClick={() => setActiveTab('submit')}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: activeTab === 'submit' ? '#007bff' : 'transparent',
              color: activeTab === 'submit' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Send Feedback
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: activeTab === 'history' ? '#007bff' : 'transparent',
              color: activeTab === 'history' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            My Feedback
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '30px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {activeTab === 'submit' ? (
            <div>
              <p style={{
                color: '#666',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Help us improve your experience. Your feedback is valuable and helps us make our service better for everyone.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think about our service..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '8px',
                      resize: 'vertical',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            </div>
          ) : (
            <UserFeedbackList token={token} />
          )}
        </div>
      </div>
    </div>
  );
}

function UserFeedbackList({ token }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUserFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/user/feedbacks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFeedbacks();
  }, []);

  if (loading) {
    return <div style={{ color: '#6c757d', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#dc3545', fontSize: '14px', textAlign: 'center', padding: '20px' }}>{error}</div>;
  }

  if (feedbacks.length === 0) {
    return (
      <div style={{
        color: '#6c757d',
        fontSize: '14px',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '20px'
      }}>
        No feedback submitted yet. Your feedback will appear here once submitted.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {feedbacks.map((feedback) => (
        <div key={feedback._id} style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            marginBottom: '8px'
          }}>
            {new Date(feedback.createdAt).toLocaleDateString()}
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#212529',
            marginBottom: '8px'
          }}>
            {feedback.message}
          </div>

          {feedback.adminReply && (
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#1565c0'
            }}>
              <strong>Reply:</strong> {feedback.adminReply}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
