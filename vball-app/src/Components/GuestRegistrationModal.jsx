import React, { useState } from 'react';

function GuestRegistrationModal({ onClose }) {

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        experienceLevel: ''
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/guest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || 'Unable to register guest.'
                );
            }

            // Successfully registered
            onClose();

            // Refresh the lists
            window.location.reload();

        } catch (error) {
            console.error('Guest registration error:', error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

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

                <form
                    className="guest-registration-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">
                        <label htmlFor="firstName">
                            First Name
                        </label>

                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="Enter first name"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="lastName">
                            Last Name
                        </label>

                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Enter last name"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="experienceLevel">
                            Experience Level
                        </label>

                        <select
                            id="experienceLevel"
                            name="experienceLevel"
                            value={formData.experienceLevel}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>
                                Select your experience level
                            </option>

                            <option value="beginner">
                                Beginner
                            </option>

                            <option value="intermediate">
                                Intermediate
                            </option>

                            <option value="advanced">
                                Advanced
                            </option>

                            <option value="professional">
                                Professional
                            </option>
                        </select>
                    </div>


                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default GuestRegistrationModal;