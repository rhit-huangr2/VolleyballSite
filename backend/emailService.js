const nodemailer = require('nodemailer');

require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function sendEmail(to, subject, text) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    });
}

async function sendEmailToOptedInUsers(users, subject, text) {
    const recipients = users.filter(
        user => user.emailOptIn === true
    );

    for (const user of recipients) {
        try {
            await sendEmail(
                user.email,
                subject,
                text
            );

            console.log(`Email sent to ${user.email}`);
        } catch (error) {
            console.error(
                `Failed to send email to ${user.email}:`,
                error
            );
        }
    }
}

module.exports = {
    sendEmail,
    sendEmailToOptedInUsers
};