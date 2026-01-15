var fbAuthManager = null;


function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}


class LoginPageController {
	constructor() {
		// Wire up the create-account and log-in buttons to use email/password auth
		const createBtn = document.querySelector("#createAccountButton");
		const loginBtn = document.querySelector("#logInButton");
		const emailInput = document.querySelector("#inputEmail");
		const passwordInput = document.querySelector("#inputPassword");

		if (createBtn) {
			createBtn.onclick = (event) => {
				// 	const email = emailInput && emailInput.value;
				// 	const password = passwordInput && passwordInput.value;
				// 	if (!email || !password) {
				// 		alert('Please enter email and password to create an account.');
				// 		return;
				// 	}
				// 	fbAuthManager.createAccount(email, password);
				console.log("createBtn found");
				window.location.href = "/create_account.html";
			};
		}

		if (loginBtn) {
			loginBtn.onclick = (event) => {
				const email = emailInput && emailInput.value;
				const password = passwordInput && passwordInput.value;
				if (!email || !password) {
					alert('Please enter email and password to sign in.');
					return;
				}
				fbAuthManager.signIn(email, password);
			};
		}
	}
}

class CreateAccountController {
	constructor() {
		const createBtn = document.querySelector("#createAccountButton");
		const loginBtn = document.querySelector("#logInButton");
		const emailInput = document.querySelector("#inputEmail");
		const passwordInput = document.querySelector("#inputPassword");
		const displayNameInput = document.querySelector("#inputDisplayName");
		const passwordConfirmInput = document.querySelector("#inputPasswordConfirm");

		if (createBtn) {
			createBtn.onclick = (event) => {
				console.log("Create account clicked");
				const email = emailInput && emailInput.value;
				const password = passwordInput && passwordInput.value;
				const displayName = displayNameInput && displayNameInput.value;
				const confirm = passwordConfirmInput && passwordConfirmInput.value;

				if (!email || !password || !confirm) {
					alert('Please enter email and both password fields.');
					return;
				}

				if (!displayName) {
					alert('Please enter a display name.');
					return;
				}
				if (password !== confirm) {
					alert('Passwords do not match.');
					return;
				}
				if (password.length < 6) {
					alert('Password should be at least 6 characters.');
					return;
				}

				// Create account, set displayName and create Firestore user doc, then redirect
				fbAuthManager.createAccount(email, password, displayName)
					.then(() => {
						window.location.href = "/";
					})
					.catch((err) => {
						console.error('Create account flow failed', err);
						alert('Create account failed: ' + (err && err.message ? err.message : err));
					});
			};
		}

		if (loginBtn) {
			loginBtn.onclick = () => {
				console.log("Login button clicked");
				window.location.href = "/";
			};
		}
	}
}

class FbAuthManager {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
			
		});
	}
	// Sign in using email & password
	signIn(email, password) {
		firebase.auth().signInWithEmailAndPassword(email, password)
			.catch((error) => {
				console.error('Sign-in error', error.code, error.message);
				alert('Sign-in failed: ' + error.message);
			});
	}

	// Create a new account using email & password and set display name
	createAccount(email, password, displayName) {
		// Return a promise that resolves when account creation, profile update,
		// and Firestore user doc creation have completed.
		return firebase.auth().createUserWithEmailAndPassword(email, password)
			.then((userCredential) => {
				const user = userCredential.user;
				// Update display name if provided
				let p = Promise.resolve();
				if (user && displayName) {
					p = user.updateProfile({ displayName: displayName });
				}
				return p.then(() => {
					// Create Users collection document if it doesn't exist
					if (user && window.firebase && firebase.firestore) {
						const db = firebase.firestore();
						const userRef = db.collection('Users').doc(user.uid);
						return userRef.get().then((snap) => {
							if (!snap.exists) {
								return userRef.set({
									name: displayName || "",
									email: user.email || "",
									rating: 5,
									createdAt: firebase.firestore.FieldValue.serverTimestamp(),
								});
							}
							return null;
						});
					}
					return null;
				});
			})
			.catch((error) => {
				console.error('Create account error', error.code, error.message);
				throw error;
			});
	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid
	}
}

function checkForRedirects() {
	if (document.querySelector("#loginPage") && fbAuthManager.isSignedIn) {
		window.location.href = "/register.html";
	}

	if (!document.querySelector("#loginPage") && !document.querySelector("#createAccountPage") && !fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}

};

function initializePage() {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		console.log("you are on the login page.");
		new LoginPageController();
	}
	if (document.querySelector("#createAccountPage")) {
		console.log("you are on the create account page.");
		new CreateAccountController();
	}
}

/* Main */
function main() {
	console.log("Ready");
	fbAuthManager = new FbAuthManager();
	fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", fbAuthManager.isSignedIn);

		checkForRedirects();

		initializePage();
	});
}

main();