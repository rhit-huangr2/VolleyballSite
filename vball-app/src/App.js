import { useEffect, useState } from 'react';
import SignedInListsPage from './SignedInListsPage';
import './App.css';
import AuthForm from './Components/AuthForm';


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
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
      } finally {
        setIsCheckingSession(false);
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

    return (
      <AuthForm
        activeView={activeView}
        formData={formData}
        status={status}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={
          activeView === 'signin'
            ? handleSignInSubmit
            : handleSubmit
        }
        renderButtons={renderButtons}
      />
    );
  }

  if (isCheckingSession) {
    return null;
  }

  return (
    <div className="app-shell">
      <main className="registration-layout">
        <section className="hero-panel">
          {renderHeroCopy()}
        </section>

        {renderForm()}
      </main>
    </div>
  );
}

export default App;
