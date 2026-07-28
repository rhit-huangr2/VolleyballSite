import { useEffect, useState } from "react";

function AdminMenu() {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadUsers();
    }, []);


    async function loadUsers() {
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        console.log(data);

        setUsers(data);
    }


    async function updateUser(email, updates) {

        await fetch(
            `/api/admin/users/${encodeURIComponent(email)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            }
        );
        // console.log(`Updated user ${email} with`, updates);
        loadUsers();
    }


    return (
        <div>
            <h1>Admin Menu</h1>

            {users.map(user => (
                <div key={user.email}>
                    <h3>{user.name}</h3>

                    <p>Email: {user.email}</p>

                    <p>
                        Rating: {user.rating}
                    </p>

                    <p>
                        Role: {user.role}
                    </p>


                    {user.role === "member" && (
                        <button
                            onClick={() =>
                                updateUser(
                                    user.email,
                                    {
                                        role: "admin"
                                    }
                                )
                            }
                        >
                            Make Admin
                        </button>
                    )}
                    <hr />  


                </div>
            ))}
        </div>
    );
}

export default AdminMenu;