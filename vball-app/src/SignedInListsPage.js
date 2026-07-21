function SignedInListsPage({
	signedInUser,
	playerLists,
	status,
	onRegisterPlayer,
	onSignOut
}) {
    async function handleRegister(event) {
        event.preventDefault();
        console.log('handleRegister called with signedInUser:', signedInUser); // Debugging log

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
            window.location.reload(); // Refresh the page to show updated lists
        } catch (error) {
            // setStatus(error.message);
        } finally {
            // setIsSubmitting(false);
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
                    <button type="button" className="register-button view-toggle-button active" onClick={handleRegister}>
                        Register
                    </button>
                    
                </div>
            </div>
        );
    }

	return (
        <div>
            <button type="button" className="signout-button view-toggle-button active" onClick={onSignOut}>
                Sign out
            </button>
            <div className="dashboard-info">
                <p>CEMC Volleyball runs from 7:30 to 10:00 PM. Once 24 registered players are reached, newly registered players go to the wait list.</p>
            </div>
            {RenderDashboard()}
        </div>
	);
    
}

export default SignedInListsPage;