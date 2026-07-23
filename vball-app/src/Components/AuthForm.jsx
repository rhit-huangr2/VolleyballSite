function AuthForm({
    activeView,
    formData,
    status,
    isSubmitting,
    onChange,
    onSubmit,
    renderButtons
}) {
    const isSignIn = activeView === 'signin';
    return (
        <section
            className="form-panel"
            aria-label={
                isSignIn
                    ? 'Account sign in form'
                    : 'Account registration form'
            }
        >
            <div className="form-card">
                {renderButtons()}

                <h2>
                    {isSignIn ? 'Sign In' : 'Create Account'}
                </h2>

                <p className="form-intro">
                    {isSignIn
                        ? 'Enter your email and password to continue.'
                        : 'Enter your full name, email, and password to get started.'
                    }
                </p>

                <form
                    onSubmit={onSubmit}
                    className="registration-form"
                >
                    {!isSignIn && (
                        <label>
                            Full name
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={onChange}
                                placeholder="Jordan Smith"
                                autoComplete="name"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Email address
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={onChange}
                            placeholder={
                                isSignIn
                                    ? 'Enter your password'
                                    : 'Create a password'
                            }
                            autoComplete={
                                isSignIn
                                    ? 'current-password'
                                    : 'new-password'
                            }
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? isSignIn
                                ? 'Signing in...'
                                : 'Creating account...'
                            : isSignIn
                                ? 'Sign In'
                                : 'Create account'
                        }
                    </button>

                    {status && (
                        <p
                            className="status-message"
                            aria-live="polite"
                        >
                            {status}
                        </p>
                    )}
                </form>
            </div>
        </section>
    );
}

export default AuthForm;