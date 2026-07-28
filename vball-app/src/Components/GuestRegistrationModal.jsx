function GuestRegistrationModal({ onClose }) {
    return (
        <div className="modal-overlay">
            <div className="guest-registration-modal">

                <button
                    type="button"
                    className="modal-close-button"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2>Guest Registration</h2>

                <form className="guest-registration-form">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="Enter your first name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Enter your last name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerDate">Date Registering For</label>
                        <input
                            type="date"
                            id="registerDate"
                            name="registerDate"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="experienceLevel">Experience Level</label>
                        <select
                            id="experienceLevel"
                            name="experienceLevel"
                            defaultValue=""
                            required
                        >
                            <option value="" disabled>
                                Select your experience level
                            </option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="professional">Professional</option>
                        </select>
                    </div>

                    <button type="submit" className="submit-button">
                        Register
                    </button>
                </form>

            </div>
        </div>
    );
}

export default GuestRegistrationModal;