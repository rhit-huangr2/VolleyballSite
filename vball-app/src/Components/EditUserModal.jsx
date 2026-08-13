function EditUserModal({
    user,
    editData,
    onChange,
    onSave,
    onClose
}) {
    if (!user) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card">

                <div className="modal-header">
                    <h2>Edit User</h2>

                    <button
                        type="button"
                        className="modal-close-button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="admin-edit-form">

                    <label>
                        Name
                        <input
                            type="text"
                            name="name"
                            value={editData.name}
                            onChange={onChange}
                        />
                    </label>

                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={onChange}
                        />
                    </label>

                    <label>
                        Rating
                        <input
                            type="number"
                            name="rating"
                            value={editData.rating}
                            onChange={onChange}
                        />
                    </label>

                    <label>
                        Role
                        <select
                            name="role"
                            value={editData.role}
                            onChange={onChange}
                        >
                            <option value="member">
                                Member
                            </option>

                            <option value="admin">
                                Admin
                            </option>
                        </select>
                    </label>

                </div>

                <div className="admin-edit-actions">

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                    >
                        Save
                    </button>

                </div>

            </div>
        </div>
    );
}

export default EditUserModal;