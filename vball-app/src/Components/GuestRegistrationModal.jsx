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

                {/* Your form goes here */}

            </div>
        </div>
    );
}

export default GuestRegistrationModal;