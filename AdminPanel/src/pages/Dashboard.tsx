import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { ref, onValue, remove, DataSnapshot, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import './Dashboard.css';

interface Article {
  id: string;
  title?: string;
  description: string;
  category: string;
  timestamp: number;
  authorId?: string;
  authorEmail?: string;
  authorName?: string;
}

interface Podcast {
  id: string;
  title: string;
  description: string;
  category: string;
  timestamp: number;
  authorId?: string;
  authorEmail?: string;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  date?: string;
  month?: string;
  category?: string;
  timestamp?: number;
  authorId?: string;
  authorEmail?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'articles' | 'podcasts' | 'events'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Note: Admin access is checked in App.tsx, so we don't need to check again here
  // This prevents redirect loops

  // Fetch pending author requests count
  useEffect(() => {
    const requestsRef = ref(database, 'authorRequests');
    const unsubscribe = onValue(requestsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.values(data) as any[];
        const pending = requests.filter((req: any) => !req.status || req.status === 'pending').length;
        setPendingRequests(pending);
      } else {
        setPendingRequests(0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch articles
    const articlesRef = ref(database, 'articles');
    const unsubscribeArticles = onValue(articlesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const articlesList: Article[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setArticles(articlesList);
      } else {
        setArticles([]);
      }
      setLoading(false);
    });

    // Fetch podcasts
    const podcastsRef = ref(database, 'podcasts');
    const unsubscribePodcasts = onValue(podcastsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const podcastsList: Podcast[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPodcasts(podcastsList);
      } else {
        setPodcasts([]);
      }
    });

    // Fetch live events
    const eventsRef = ref(database, 'liveEvents');
    const unsubscribeEvents = onValue(eventsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsList: LiveEvent[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setEvents(eventsList);
      } else {
        setEvents([]);
      }
    });

    return () => {
      unsubscribeArticles();
      unsubscribePodcasts();
      unsubscribeEvents();
    };
  }, []);

  const handleDelete = async (type: 'articles' | 'podcasts' | 'liveEvents', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'articles' ? 'article' : type === 'podcasts' ? 'podcast' : 'event'}?`)) {
      return;
    }

    try {
      const itemRef = ref(database, `${type}/${id}`);
      await remove(itemRef);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Admin Panel</h1>
          <div className="header-actions">
            <button 
              className={`nav-button ${pendingRequests > 0 ? 'nav-button-glow' : ''}`}
              onClick={() => navigate('/author-requests')}
            >
              Author Requests
              {pendingRequests > 0 && (
                <span className="request-badge">{pendingRequests}</span>
              )}
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'articles' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Articles ({articles.length})
          </button>
          <button
            className={`tab ${activeTab === 'podcasts' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('podcasts')}
          >
            Podcasts ({podcasts.length})
          </button>
          <button
            className={`tab ${activeTab === 'events' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Live Events ({events.length})
          </button>
        </div>

        <div className="content-area">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'articles' && (
                <div className="items-list">
                  {articles.length === 0 ? (
                    <div className="empty-state">No articles found.</div>
                  ) : (
                    articles.map((article) => (
                      <div key={article.id} className="item-card">
                        <div className="item-content">
                          <div className="item-header">
                            <span className="item-category">{article.category}</span>
                            <span className="item-date">
                              {article.timestamp ? formatDate(article.timestamp) : 'No date'}
                            </span>
                          </div>
                          <h3 className="item-title">{article.title || 'Untitled Article'}</h3>
                          <p className="item-description">
                            {truncateText(article.description)}
                          </p>
                          {(article.authorName || article.authorEmail) && (
                            <p className="item-author">
                              Author:{' '}
                              {article.authorName ||
                                article.authorEmail?.split('@')[0] ||
                                'Unknown'}
                            </p>
                          )}
                        </div>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete('articles', article.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'podcasts' && (
                <div className="items-list">
                  {podcasts.length === 0 ? (
                    <div className="empty-state">No podcasts found.</div>
                  ) : (
                    podcasts.map((podcast) => (
                      <div key={podcast.id} className="item-card">
                        <div className="item-content">
                          <div className="item-header">
                            <span className="item-category">{podcast.category}</span>
                            <span className="item-date">
                              {formatDate(podcast.timestamp)}
                            </span>
                          </div>
                          <h3 className="item-title">{podcast.title}</h3>
                          <p className="item-description">
                            {truncateText(podcast.description)}
                          </p>
                          {podcast.authorEmail && (
                            <p className="item-author">Author: {podcast.authorEmail}</p>
                          )}
                        </div>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete('podcasts', podcast.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="items-list">
                  {events.length === 0 ? (
                    <div className="empty-state">No live events found.</div>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="item-card">
                        <div className="item-content">
                          <div className="item-header">
                            <span className="item-category">{event.category || 'Event'}</span>
                            <span className="item-date">
                              {event.timestamp ? formatDate(event.timestamp) : 
                               event.date && event.month ? `${event.date} ${event.month}` : 'No date'}
                            </span>
                          </div>
                          <h3 className="item-title">{event.title}</h3>
                          <p className="item-description">
                            {truncateText(event.description)}
                          </p>
                          {event.authorEmail && (
                            <p className="item-author">Author: {event.authorEmail}</p>
                          )}
                        </div>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete('liveEvents', event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

