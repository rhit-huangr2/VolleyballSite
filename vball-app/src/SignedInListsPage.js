function SignedInListsPage({
	signedInUser,
	playerLists,
	status,
	onRegisterPlayer,
	onSignOut
}) {
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

	return (
		<section className="dashboard-panel" aria-label="Player dashboard">
			<div className="dashboard-card">
				<div className="dashboard-header">
					<div>
						<p className="eyebrow">Volleyball Site</p>
						<h1>Welcome back, {signedInUser?.name || 'player'}.</h1>
						<p className="hero-copy">
							Review the registered players and wait list, or register another player if you need to
							add someone new.
						</p>
					</div>

					<div className="dashboard-actions">
						<button type="button" className="view-toggle-button active" onClick={onRegisterPlayer}>
							Register player
						</button>
						<button type="button" className="view-toggle-button" onClick={onSignOut}>
							Sign out
						</button>
					</div>
				</div>

				<div className="feature-list">
					<div>
						<span className="feature-label">Court limit</span>
						<p>Once 24 registered players are reached, new users go to the wait list.</p>
					</div>
					<div>
						<span className="feature-label">Registered</span>
						<p>Currently {playerLists.registeredUsers.length} players on the active roster.</p>
					</div>
					<div>
						<span className="feature-label">Wait list</span>
						<p>Currently {playerLists.waitlistUsers.length} players waiting for a spot.</p>
					</div>
				</div>

				<div className="dashboard-grid">
					{renderPlayerList('Registered players', playerLists.registeredUsers)}
					{renderPlayerList('Waitlisted players', playerLists.waitlistUsers)}
				</div>

				{status ? (
					<p className="status-message dashboard-status" aria-live="polite">
						{status}
					</p>
				) : null}
			</div>
		</section>
	);
}

export default SignedInListsPage;