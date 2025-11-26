import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from './config/firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthorRequests from './pages/AuthorRequests';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      setUser(user);
      
      if (user) {
        // Check if user is admin
        try {
          const userTypeRef = ref(database, `users/${user.uid}/userType`);
          const snapshot = await get(userTypeRef);
          const userType = snapshot.val();
          console.log('App.tsx - User type:', userType, 'for user:', user.uid);
          
          if (isMounted) {
            setIsAdmin(userType === 'Admin');
          }
        } catch (error) {
          console.error('Error checking user type:', error);
          if (isMounted) {
            setIsAdmin(false);
          }
        }
      } else {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user && isAdmin ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={user && isAdmin ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/author-requests" 
          element={user && isAdmin ? <AuthorRequests /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user && isAdmin ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

