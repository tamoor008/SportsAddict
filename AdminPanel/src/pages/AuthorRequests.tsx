import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { ref, onValue, remove, set, DataSnapshot, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import './AuthorRequests.css';

interface AuthorRequest {
  id: string;
  userId: string;
  fullName: string;
  selectedSport: string;
  socialLinks: string[];
  timestamp: number;
  status?: 'pending' | 'approved' | 'rejected' | 'revoked';
  email?: string;
}

const AuthorRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AuthorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'revoked'>('all');

  // Note: Admin access is checked in App.tsx, so we don't need to check again here
  // This prevents redirect loops

  useEffect(() => {
    // Fetch author requests from Firebase
    // We'll store them in 'authorRequests' path
    const requestsRef = ref(database, 'authorRequests');
    
    const unsubscribe = onValue(requestsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsList: AuthorRequest[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setRequests(requestsList);
      } else {
        setRequests([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading author requests:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleApprove = async (request: AuthorRequest) => {
    if (!window.confirm(`Approve author request for ${request.fullName}?`)) {
      return;
    }

    try {
      // Update request status
      const requestRef = ref(database, `authorRequests/${request.id}`);
      await set(requestRef, {
        ...request,
        status: 'approved',
      });

      // Update user's author status in their profile
      const userRef = ref(database, `users/${request.userId}/isAuthor`);
      await set(userRef, true);

      // Also set author profile data
      const authorProfileRef = ref(database, `users/${request.userId}/authorProfile`);
      await set(authorProfileRef, {
        fullName: request.fullName,
        selectedSport: request.selectedSport,
        socialLinks: request.socialLinks,
        approvedAt: Date.now(),
      });

      alert('Author request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleReject = async (request: AuthorRequest) => {
    if (!window.confirm(`Reject author request for ${request.fullName}?`)) {
      return;
    }

    try {
      const requestRef = ref(database, `authorRequests/${request.id}`);
      await set(requestRef, {
        ...request,
        status: 'rejected',
      });

      // If the user was previously approved, revoke their author access
      if (request.status === 'approved') {
        const userRef = ref(database, `users/${request.userId}/isAuthor`);
        await set(userRef, false);
        
        const authorProfileRef = ref(database, `users/${request.userId}/authorProfile`);
        await remove(authorProfileRef);
      }

      alert('Author request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleRevoke = async (request: AuthorRequest) => {
    if (!window.confirm(`Revoke author access for ${request.fullName}? They will lose their author privileges.`)) {
      return;
    }

    try {
      // Update request status to revoked
      const requestRef = ref(database, `authorRequests/${request.id}`);
      await set(requestRef, {
        ...request,
        status: 'revoked',
      });

      // Remove author status from user
      const userRef = ref(database, `users/${request.userId}/isAuthor`);
      await set(userRef, false);

      // Remove author profile data
      const authorProfileRef = ref(database, `users/${request.userId}/authorProfile`);
      await remove(authorProfileRef);

      alert('Author access revoked successfully. The user will need to request again.');
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access. Please try again.');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const requestRef = ref(database, `authorRequests/${requestId}`);
      await remove(requestRef);
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending' || !r.status).length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const revokedCount = requests.filter(r => r.status === 'revoked').length;

  return (
    <div className="author-requests-container">
      <header className="requests-header">
        <div className="header-content">
          <h1 className="requests-title">Author Requests</h1>
          <div className="header-actions">
            <button 
              className="nav-button"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="requests-content">
        <div className="filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({requests.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'revoked' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('revoked')}
          >
            Revoked ({revokedCount})
          </button>
        </div>

        <div className="requests-list">
          {loading ? (
            <div className="loading">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">No author requests found.</div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-content">
                  <div className="request-header">
                    <div>
                      <h3 className="request-name">{request.fullName}</h3>
                      <p className="request-date">
                        {formatDate(request.timestamp)}
                      </p>
                    </div>
                    <span className={`status-badge status-${request.status || 'pending'}`}>
                      {request.status === 'pending' || !request.status ? 'Pending' : 
                       request.status === 'approved' ? 'Approved' :
                       request.status === 'rejected' ? 'Rejected' :
                       request.status === 'revoked' ? 'Revoked' : request.status}
                    </span>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">Sport:</span>
                      <span className="detail-value">{request.selectedSport}</span>
                    </div>
                    {request.email && (
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{request.email}</span>
                      </div>
                    )}
                    {request.socialLinks && request.socialLinks.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Social Links:</span>
                        <div className="social-links">
                          {request.socialLinks.map((link, index) => (
                            <a 
                              key={index} 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="social-link"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="request-actions">
                  {(!request.status || request.status === 'pending') && (
                    <>
                      <button
                        className="approve-button"
                        onClick={() => handleApprove(request)}
                      >
                        Approve
                      </button>
                      <button
                        className="reject-button"
                        onClick={() => handleReject(request)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <button
                      className="revoke-button"
                      onClick={() => handleRevoke(request)}
                    >
                      Revoke Access
                    </button>
                  )}
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(request.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorRequests;

