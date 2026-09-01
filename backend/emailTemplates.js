function registrationOpenEmail() {
    return {
        subject: 'CEMC Volleyball Registration',
        text: `Hello Everyone!

This coming Monday night, we are on for Volleyball at CEMC gym facility (Chuang Hall) from 7pm-10pm.

If you would like to play, please respond within 24 hours of this email being sent out ONLY if you are attending.

Stay safe!

In Christ,

CVG`
    };
}

function registrationEmail(name) {
    return {
        subject: 'CEMC Volleyball Registration',
        text: `Hi ${name},

You have successfully registered for CEMC Volleyball.

Thank you!`
    };
}

function waitlistEmail(name) {
    return {
        subject: 'CEMC Volleyball Waitlist',
        text: `Hi ${name},

You have been added to the CEMC Volleyball waitlist.

We will notify you if a spot becomes available.`
    };
}

function promotionEmail(name) {
    return {
        subject: 'CEMC Volleyball Registration Confirmed',
        text: `Hi ${name},

A spot has opened and you have been moved from the waitlist to the registered player list.

See you at volleyball!`
    };
}

module.exports = {
    registrationOpenEmail,
    registrationEmail,
    waitlistEmail,
    promotionEmail
};