import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestRegistrationModal from '../Components/GuestRegistrationModal';
import EditListsModal from '../Components/EditListsModal';

function SignedInListsPage({
	signedInUser,
	playerLists,
	status,
	onRegisterPlayer,
	onSignOut,
    isRegistered,
    checkRegistration,
    setIsRegistered,
    onRefreshPostgresLists
}) {

    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showEditListsModal, setShowEditListsModal] = useState(false);
    const [registered, setRegistered] = useState(
        playerLists.registeredUsers
    );

    const [waitlist, setWaitlist] = useState(
        playerLists.waitlistUsers
    );
    const [emailOptIn, setEmailOptIn] = useState(
        signedInUser?.emailOptIn ?? true
    );

    const navigate = useNavigate();

    useEffect(() => {
        checkRegistration();
    }, []);
    // checkRegistration(); // Call the function to check registration status
    // console.log('Is Registered:', isRegistered); // Debugging log

    async function handleRegister(event) {
        event.preventDefault();

        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                window.location.reload();
            } else {
                alert('Error registering player: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Unable to register. Please try again.');
        }
    }

    async function handleWithdraw(event) {
        event.preventDefault();
        console.log('handleWithdraw called with signedInUser:', signedInUser); // Debugging log
        try {
            const response = await fetch('/api/withdraw', {
                method: 'POST'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Unable to withdraw.');
            }

            console.log(data.message);

            // Update the UI after successful withdrawal
            setIsRegistered(false);
            window.location.reload(); // Refresh the page to show updated lists

        } catch (error) {
            console.error('Withdrawal error:', error);
        }
    }

    async function handleEmailPreferenceChange() {
        try {
            const response = await fetch('/api/email-preference', {
                method: 'PUT'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || 'Unable to update email preference.'
                );
            }

            console.log('Email opt-in:', result.emailOptIn);

            setEmailOptIn(result.emailOptIn);

        } catch (error) {
            console.error('Email preference update failed:', error);
        }
    }

    function renderPlayerList(title, players) {
        return (
            <section className="list-card">

                <div className="list-card-header">
                    <div>
                        <h3>{title}</h3>

                        <p>
                            {players.length} player
                            {players.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                {players.length ? (
                    <ul className="player-list">

                        {players.map((player) => {
                            const isGuest = player.isGuest === true;
                            return (
                                <li
                                    key={player.email}
                                    className={
                                        isGuest
                                            ? "player-list-item guest-item"
                                            : "player-list-item"
                                        }
                                >
                                    <div>
                                        <strong>
                                            {player.name}
                                            {isGuest && " (Guest of " + player.guestOf + ")"}
                                        </strong>

                                        <span>
                                            {player.email}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}

                    </ul>
                ) : (
                    <p className="empty-state">
                        No players yet.
                    </p>
                )}

            </section>
        );
    }

    function RenderDashboard(){
        return (
            <div>
                <div className = "dashboard-grid" >
                    { renderPlayerList('Registered players', playerLists.registeredUsers)}
                    { renderPlayerList('Waitlisted players', playerLists.waitlistUsers) }
                </div >
                <div className="dashboard-actions">
                    {isRegistered ? (
                        <button
                            type="button"
                            className="register-button view-toggle-button active"
                            onClick={handleWithdraw}
                        >
                            Withdraw
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="register-button view-toggle-button active"
                            onClick={handleRegister}
                        >
                            Register
                        </button>
                    )}
                    <button
                        type="button"
                        className="register-button view-toggle-button active"
                        onClick={() => setShowGuestModal(true)}
                        
                    >
                        Guest Registration
                    </button>

                    {showGuestModal && (
                        <GuestRegistrationModal
                            onClose={() => setShowGuestModal(false)}
                        />
                    )}
                </div>
            </div>
        );
    }

	return (
        <div>
            <div className="button-panel">
                {signedInUser?.role === 'admin' && (
                    <button
                        type="button"
                        className="admin-button view-toggle-button active"
                        onClick={() => navigate('/admin')}
                    >
                        Admin Menu
                    </button>
                )}
                <button type="button" className="signout-button view-toggle-button active" onClick={onSignOut}>
                    Sign out
                </button>
            </div>
            <div className="dashboard-info">
                <p>CEMC Volleyball runs from 7:30 to 10:00 PM. Once 24 registered players are reached, newly registered players go to the wait list.</p>
                {signedInUser?.role === 'admin' && (

                    <button
                        type="button"
                        className="register-button view-toggle-button active"
                        onClick={async () => {
                            try {
                                await onRefreshPostgresLists();
                                setShowEditListsModal(true);
                            } catch (error) {
                                console.error('Failed to load PostgreSQL lists:', error);
                                alert('Unable to load PostgreSQL lists.');
                            }
                        }}
                    >
                        Edit Lists
                    </button>
                    
                )}
                {showEditListsModal && (
                    <EditListsModal
                        playerLists={playerLists}
                        onClose={() => setShowEditListsModal(false)}
                />
                )}
            </div>
            <div className="email-preferences">
                <label>
                    <input
                        type="checkbox"
                        checked={emailOptIn}
                        onChange={handleEmailPreferenceChange}
                    />

                    <span>Receive email updates</span>
                </label>
            </div>

            {RenderDashboard()}
            
        </div>
	);
    
}

export default SignedInListsPage;