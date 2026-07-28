import React, { useState, useEffect } from 'react';
import GuestRegistrationModal from './Components/GuestRegistrationModal';
import AdminMenu from './Components/AdminMenu';

function SignedInListsPage({
	signedInUser,
	playerLists,
	status,
	onRegisterPlayer,
	onSignOut,
    isRegistered,
    checkRegistration,
    setIsRegistered
}) {

    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    useEffect(() => {
        checkRegistration();
    }, []);
    // checkRegistration(); // Call the function to check registration status
    // console.log('Is Registered:', isRegistered); // Debugging log

    async function handleRegister(event) {
        event.preventDefault();
        console.log('handleRegister called with signedInUser:', signedInUser); // Debugging log
        // console.log('Is Registered:', isRegistered); // Debugging log
        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "name": signedInUser.name,
                    "email": signedInUser.email,
                    "password": signedInUser.password,
                    "rating": signedInUser.rating
                })
            });

            const result = await response.json();

            if (response.ok) {
                window.location.reload(); // Refresh the page to show updated lists
            }
            else {
                alert('Error registering player: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            // setStatus(error.message);
        } finally {
            // setIsSubmitting(false);
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

	function renderPlayerList(title, players) {
		return (
			<section className="list-card">
				<div className="list-card-header">
					<div>
						<h3>{title}</h3>
						<p>{players.length} player{players.length === 1 ? '' : 's'}</p>
						</div>
					</div>

				{players.length ? (
					<ul className="player-list">
						{players.map((player) => (
							<li key={player.email} className="player-list-item">
								<div>
									<strong>{player.name}</strong>
									<span>{player.email}</span>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="empty-state">No players yet.</p>
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

    function renderAdminMenu() {
        console.log('Admin menu button clicked');
        setShowAdminMenu(true);
    }

	return (
        <div>
            <div className="button-panel">
                {signedInUser?.role === 'admin' && (
                    <button type="button" className="admin-button view-toggle-button active" onClick={renderAdminMenu}>
                        Admin Menu
                    </button>
                )}
                <button type="button" className="signout-button view-toggle-button active" onClick={onSignOut}>
                    Sign out
                </button>
            </div>
            <div className="dashboard-info">
                <p>CEMC Volleyball runs from 7:30 to 10:00 PM. Once 24 registered players are reached, newly registered players go to the wait list.</p>
            </div>
            {showAdminMenu && (
                <AdminMenu />
            )}
            {RenderDashboard()}
            
        </div>
	);
    
}

export default SignedInListsPage;