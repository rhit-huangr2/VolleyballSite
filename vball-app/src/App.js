import { useEffect, useState } from 'react';
import SignedInListsPage from './SignedInListsPage';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('signin');
  const [signedInUser, setSignedInUser] = useState(null);
  const [playerLists, setPlayerLists] = useState({
    registeredUsers: [],
    waitlistUsers: []
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  async function refreshPlayerLists() {
    const response = await fetch('/api/lists');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to load player lists.');
    }

    setPlayerLists({
      registeredUsers: result['registered-users'],
      waitlistUsers: result['waitlist-users']
    });
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/me');

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        setSignedInUser(result.user);
        await refreshPlayerLists();
        setActiveView('dashboard');
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }

    checkSession();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to create account.');
      }

      setStatus(
        result.placement === 'waitlist-users'
          ? `${result.user.name} was added to the wait list.`
          : `${result.user.name} was added to the registered players list.`
      );
      setFormData({
        fullName: '',
        email: '',
        password: ''
      });

      if (signedInUser) {
        await refreshPlayerLists();
        setActiveView('dashboard');
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignInSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to sign in.');
      }

      setStatus(`Signed in as ${result.user.email}.`);
      setSignedInUser(result.user);
      await refreshPlayerLists();
      setFormData({
        fullName: '',
        email: '',
        password: ''
      });
      setActiveView('dashboard');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSignUpFromDashboard() {
    setStatus('');
    setActiveView('signup');
    setFormData({ fullName: '', email: '', password: '' });
  }

  async function handleSignOut() {
    try {
      console.log('Signing out user:', signedInUser); // Debugging log
      await fetch('/api/signout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }

    setStatus('');
    setSignedInUser(null);
    setPlayerLists({
      registeredUsers: [],
      waitlistUsers: []
    });
    setActiveView('signin');
    setFormData({
      fullName: '',
      email: '',
      password: ''
    });
  }

  async function checkRegistration() {
    try {
      const response = await fetch('/api/registration-status');

      const data = await response.json();

      setIsRegistered(data.isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  }

  function renderHeroCopy() {

    return (
      <>
        <h1 className="eyebrow">CEMC Volleyball</h1>
      </>
    );
  }

  function renderButtons(){
    return (
      <>
        <div className="view-toggle" role="tablist" aria-label="Authentication views">
          <button
            type="button"
            className={activeView === 'signin' ? 'view-toggle-button active' : 'view-toggle-button'}
            onClick={() => {
              setStatus('');
              setActiveView('signin');
              setSignedInUser(null);
              setFormData({ fullName: '', email: '', password: '' });
            }}
            role="tab"
            aria-selected={activeView === 'signin'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={activeView === 'signup' ? 'view-toggle-button active' : 'view-toggle-button'}
            onClick={() => {
              setStatus('');
              setActiveView('signup');
              setSignedInUser(null);
              setFormData({ fullName: '', email: '', password: '' });
            }}
            role="tab"
            aria-selected={activeView === 'signup'}
            >
            Sign Up
          </button>
        </div>
      </>
    )
  }
  function renderForm() {
    if (activeView === 'dashboard') {
      return (
        <SignedInListsPage
        signedInUser={signedInUser}
        playerLists={playerLists}
        status={status}
        onSignUp={handleSignUpFromDashboard}
        onSignOut={handleSignOut}
        isRegistered={isRegistered}
        checkRegistration={checkRegistration}
        setIsRegistered={setIsRegistered}
        />
      );
    }
    
    
    if (activeView === 'signin') {
      return (
        <section className="form-panel" aria-label="Account sign in form">
          
          <div className="form-card">
            {renderButtons()}
            <h2>Sign In</h2>
            <p className="form-intro">Enter your email and password to continue.</p>

            <form onSubmit={handleSignInSubmit} className="registration-form">
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              {status ? (
                <p className="status-message" aria-live="polite">
                  {status}
                </p>
              ) : null}
            </form>
          </div>
        </section>
      );
    }

    return (
      <section className="form-panel" aria-label="Account registration form">
        <div className="form-card">
          {renderButtons()}
          <h2>Create Account</h2>
          <p className="form-intro">Enter your full name, email, and password to get started.</p>

          <form onSubmit={handleSubmit} className="registration-form">
            <label>
              Full name
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jordan Smith"
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            {status ? (
              <p className="status-message" aria-live="polite">
                {status}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <main className="registration-layout">
        <section className="hero-panel">
          {renderHeroCopy()}

          {/* <div className="view-toggle" role="tablist" aria-label="Authentication views">
            <button
              type="button"
              className={activeView === 'signin' ? 'view-toggle-button active' : 'view-toggle-button'}
              onClick={() => {
                setStatus('');
                setActiveView('signin');
                setSignedInUser(null);
                setFormData({ fullName: '', email: '', password: '' });
              }}
              role="tab"
              aria-selected={activeView === 'signin'}
            >
              Sign In
            </button>
            <button
              type="button"
              className={activeView === 'signup' ? 'view-toggle-button active' : 'view-toggle-button'}
              onClick={() => {
                setStatus('');
                setActiveView('signup');
                setSignedInUser(null);
                setFormData({ fullName: '', email: '', password: '' });
              }}
              role="tab"
              aria-selected={activeView === 'signup'}
            >
              Sign Up
            </button>
          </div> */}
        </section>
        {/* {renderButtons()} */}

        {renderForm()}
      </main>
    </div>
  );
}

export default App;
