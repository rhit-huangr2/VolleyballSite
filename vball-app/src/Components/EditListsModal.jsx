import React, { useState, useEffect } from 'react';

function EditListsModal({ playerLists, onClose }) {

    const [registeredUsers, setRegisteredUsers] = useState(
        [...playerLists.registeredUsers]
    );

    const [waitlistUsers, setWaitlistUsers] = useState(
        [...playerLists.waitlistUsers]
    );

    const [allUsers, setAllUsers] = useState([]);
    const [unregisteredUsers, setUnregisteredUsers] = useState([]);

    const [draggedPlayer, setDraggedPlayer] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch('/api/admin/users');

                if (!response.ok) {
                    throw new Error('Unable to load users.');
                }

                const users = await response.json();

                // Keep a copy of the original users list
                setAllUsers([...users]);

                const registeredEmails = new Set(
                    playerLists.registeredUsers.map(
                        user => user.email.toLowerCase()
                    )
                );

                const waitlistEmails = new Set(
                    playerLists.waitlistUsers.map(
                        user => user.email.toLowerCase()
                    )
                );

                const unregistered = users.filter(user => {
                    const email = user.email.toLowerCase();

                    return (
                        !registeredEmails.has(email) &&
                        !waitlistEmails.has(email)
                    );
                });

                setUnregisteredUsers([...unregistered]);

            } catch (error) {
                console.error(
                    'Failed to load users:',
                    error
                );

                alert('Unable to load users.');
            }
        }

        loadUsers();
    }, [playerLists]);

    function handleDragStart(event, player, sourceList) {
        setDraggedPlayer({
            player,
            sourceList
        });
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(destinationList) {
        if (!draggedPlayer) {
            return;
        }

        const {
            player,
            sourceList
        } = draggedPlayer;

        // Don't do anything if dropped into the same list
        if (sourceList === destinationList) {
            setDraggedPlayer(null);
            return;
        }

        // Remove from source list
        if (sourceList === 'registered') {
            setRegisteredUsers(prev =>
                prev.filter(
                    user => user.email !== player.email
                )
            );
        }

        if (sourceList === 'waitlist') {
            setWaitlistUsers(prev =>
                prev.filter(
                    user => user.email !== player.email
                )
            );
        }

        if (sourceList === 'unregistered') {
            setUnregisteredUsers(prev =>
                prev.filter(
                    user => user.email !== player.email
                )
            );
        }

        // Add to destination list
        if (destinationList === 'registered') {
            setRegisteredUsers(prev => [
                ...prev,
                player
            ]);
        }

        if (destinationList === 'waitlist') {
            setWaitlistUsers(prev => [
                ...prev,
                player
            ]);
        }

        if (destinationList === 'unregistered') {
            // Get the original user from allUsers
            const originalUser = allUsers.find(
                user => user.email === player.email
            );

            if (originalUser) {
                setUnregisteredUsers(prev => [
                    ...prev,
                    originalUser
                ]);
            }
        }

        setDraggedPlayer(null);
    }

    function renderPlayer(player, sourceList) {
        const isGuest = player.guestOf !== undefined;

        return (
            <li
                key={player.email}
                className={
                    isGuest
                        ? 'edit-player-item guest-item'
                        : 'edit-player-item'
                }
                draggable
                onDragStart={(event) =>
                    handleDragStart(
                        event,
                        player,
                        sourceList
                    )
                }
            >
                <div>
                    <strong>
                        {player.name}
                        {isGuest &&
                            ` (Guest of ${player.guestOf})`}
                    </strong>

                    {/* <span>
                        {player.email}
                    </span> */}
                </div>
            </li>
        );
    }

    async function handleSave() {
        try {
            setSaving(true);

            const response = await fetch('/api/admin/lists', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    registeredUsers,
                    waitlistUsers
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Unable to save changes.');
                return;
            }

            alert('Lists updated successfully.');
            window.location.reload();

            onClose();
        } catch (error) {
            console.error('Failed to save lists:', error);
            alert('Unable to save changes.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay">

            <div className="edit-lists-modal">

                <div className="edit-lists-header">
                    <h2>Edit Lists</h2>

                    <button
                        type="button"
                        className="modal-close-button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="edit-lists-container">

                    {/* REGISTERED */}
                    <section
                        className="edit-list-section"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop('registered')}
                    >
                        <div className="edit-list-header">
                            <h3>Registered Players</h3>
                            <span>{registeredUsers.length}</span>
                        </div>

                        <div className="edit-player-list-container">
                            <ul className="edit-player-list">
                                {registeredUsers.map(player =>
                                    renderPlayer(player, 'registered')
                                )}
                            </ul>
                        </div>
                    </section>

                    {/* WAITLIST */}
                    <section
                        className="edit-list-section"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop('waitlist')}
                    >
                        <div className="edit-list-header">
                            <h3>Waitlisted Players</h3>
                            <span>{waitlistUsers.length}</span>
                        </div>

                        <div className="edit-player-list-container">
                            <ul className="edit-player-list">
                                {waitlistUsers.map(player =>
                                    renderPlayer(player, 'waitlist')
                                )}
                            </ul>
                        </div>
                    </section>

                    {/* UNREGISTERED */}
                    <section
                        className="edit-list-section"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop('unregistered')}
                    >
                        <div className="edit-list-header">
                            <h3>Unregistered Users</h3>
                            <span>{unregisteredUsers.length}</span>
                        </div>

                        <div className="edit-player-list-container">
                            <ul className="edit-player-list">
                                {unregisteredUsers.map(user =>
                                    renderPlayer(user, 'unregistered')
                                )}
                            </ul>
                        </div>
                    </section>

                </div>

                <div className="edit-lists-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cancel-button"
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="register-button"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>

        </div>
    );
}

export default EditListsModal;