import { signInWithEmailAndPassword } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../config/firebase';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Animation ref
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate card entrance
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transform = 'translateY(20px)';
      
      const timer = setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          cardRef.current.style.opacity = '1';
          cardRef.current.style.transform = 'translateY(0)';
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user type
      const userTypeRef = ref(database, `users/${user.uid}/userType`);
      const snapshot = await get(userTypeRef);
      const userType = snapshot.val();
      
      console.log('User type check:', userType);
      
      if (userType !== 'Admin') {
        await auth.signOut(); // Sign out if not admin
        setError('This panel can only be accessed by admin users.');
        setLoading(false);
        return;
      }
      
      // Successfully authenticated as admin
      // Wait a moment for auth state to propagate, then navigate
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Wrong email or password');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" ref={cardRef}>
        <div className="login-header">
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Sign in to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-container">
            <label className="input-label">Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#323232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="#323232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                className="input-field"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-container">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#323232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#323232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className={`submit-button ${loading ? 'submit-button-disabled' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

