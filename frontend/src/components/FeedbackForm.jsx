// components/FeedbackForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FeedbackForm({ token }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

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
      backgroundColor: '#f8f9fa',
      padding: '40px 0',
      marginTop: '60px',
      borderTop: '1px solid #e9ecef'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '16px'
            }}>
              Send us feedback
            </h3>
            <p style={{
              color: '#6c757d',
              marginBottom: '24px',
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
                    minHeight: '100px',
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
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '16px'
            }}>
              Your Feedback History
            </h3>
            <UserFeedbackList token={token} />
          </div>
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
    return <div style={{ color: '#6c757d', fontSize: '14px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#dc3545', fontSize: '14px' }}>{error}</div>;
  }

  if (feedbacks.length === 0) {
    return (
      <div style={{
        color: '#6c757d',
        fontSize: '14px',
        fontStyle: 'italic'
      }}>
        No feedback submitted yet. Your feedback will appear here once submitted.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {feedbacks.map((feedback) => (
        <div key={feedback._id} style={{
          backgroundColor: 'white',
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
