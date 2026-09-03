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

async function sendEmail(to, subject, html) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    });
}

async function sendEmailToOptedInUsers(users, emailTemplate) {
    const recipients = users.filter(
        user => user.emailOptIn === true
    );

    console.log(`Found ${recipients.length} opted-in users.`);

    let sentCount = 0;

    for (const user of recipients) {
        try {
            const email = emailTemplate(user.name);

            await sendEmail(
                user.email,
                email.subject,
                email.html
            );

            sentCount++;

        } catch (error) {
            console.error(
                `Failed to send email to ${user.email}:`,
                error
            );
        }
    }

    console.log(`Sent registration emails to ${sentCount} users.`);
}

module.exports = {
    sendEmail,
    sendEmailToOptedInUsers
};