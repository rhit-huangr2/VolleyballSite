import { useEffect, useState } from "react";
import EditUserModal from "./EditUserModal";

function AdminMenu() {

    const [users, setUsers] = useState([]);

    const [editingUser, setEditingUser] = useState(null);

    const [editData, setEditData] = useState({});


    useEffect(() => {
        loadUsers();
    }, []);


    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();

            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }


    function startEditing(user) {
        setEditingUser(user);

        setEditData({
            name: user.name,
            email: user.email,
            rating: user.rating,
            role: user.role
        });
    }


    function closeEditModal() {
        setEditingUser(null);
        setEditData({});
    }


    function handleEditChange(event) {
        const { name, value } = event.target;

        setEditData((currentData) => ({
            ...currentData,
            [name]: value
        }));
    }


    async function saveUser() {
        try {
            const response = await fetch(
                `/api/admin/users/${encodeURIComponent(editingUser.email)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(editData)
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update user.');
            }

            await loadUsers();

            closeEditModal();

        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }


    return (
        <>
            <div className="admin-page-container">

                <section className="list-card">

                    <div className="list-card-header">
                        <div>
                            <h3>Users</h3>

                            <p>
                                {users.length} user
                                {users.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>

                    {users.length ? (

                        <ul className="player-list">

                            {users.map((user) => (

                                <li
                                    key={user.email}
                                    className="player-list-item"
                                >

                                    <div>
                                        <strong>
                                            {user.name}
                                        </strong>

                                        <span>
                                            {user.email}
                                        </span>

                                        <span>
                                            Rating: {user.rating}
                                        </span>

                                        <span>
                                            Role: {user.role}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-button"
                                        onClick={() =>
                                            startEditing(user)
                                        }
                                    >
                                        Edit
                                    </button>

                                </li>

                            ))}

                        </ul>

                    ) : (

                        <p className="empty-state">
                            No users yet.
                        </p>

                    )}

                </section>

            </div>

            <EditUserModal
                user={editingUser}
                editData={editData}
                onChange={handleEditChange}
                onSave={saveUser}
                onClose={closeEditModal}
            />
        </>
    );
}

export default AdminMenu;