const nodemailer = require('nodemailer');

require('dotenv').config();

const {
    registrationOpenEmail,
    waitlistEmail,
    promotionEmail
} = require('./emailTemplates');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function sendEmail(
    to,
    subject,
    html,
    bcc,
    inReplyTo = null,
    references = null
) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        bcc,
        subject,
        html,
        inReplyTo,
        references
    });
}

async function sendEmailToOptedInUsers(
    users,
    emailTemplate,
    inReplyTo = null
) {
    const recipients = users.filter(
        user => user.emailOptIn === true
    );

    console.log(`Found ${recipients.length} opted-in users.`);

    if (recipients.length === 0) {
        console.log('No opted-in users to email.');
        return null;
    }

    const email = emailTemplate();

    const info = await sendEmail(
        process.env.EMAIL_USER,
        email.subject,
        email.html,
        recipients.map(user => user.email),
        inReplyTo,
        inReplyTo
    );

    console.log(`Sent email to ${recipients.length} users.`);

    return info;
}

module.exports = {
    sendEmail,
    sendEmailToOptedInUsers,
};