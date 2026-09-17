require('dotenv').config({
    path: __dirname + '/.env'
});

const {
    readUsers,
    readLists,
    writeLists
} = require('./data/jsonCrud');

const {
    sendEmailToOptedInUsers
} = require('./emailService');

const {
    registrationOpenEmail
} = require('./emailTemplates');


async function clearPlayerLists() {
    const lists = await readLists();

    lists['registered-users'] = [];
    lists['waitlist-users'] = [];

    await writeLists(lists);

    console.log('Weekly player lists cleared.');
}


async function saveRegistrationMessageId(messageId) {
    const lists = await readLists();

    if (!lists['email-metadata']) {
        lists['email-metadata'] = {};
    }

    lists['email-metadata']['registration-message-id'] = messageId;

    await writeLists(lists);
}


async function runSaturdayAutomation() {
    console.log('Running Saturday volleyball automation...');

    try {
        const users = await readUsers();

        await clearPlayerLists();

        const lists = await readLists();

        if (!lists['email-metadata']) {
            lists['email-metadata'] = {};
        }

        lists['email-metadata']['registration-full-email-sent'] = false;

        await writeLists(lists);

        const emailInfo = await sendEmailToOptedInUsers(
            users,
            registrationOpenEmail
        );

        console.log(
            'Registration email Message-ID:',
            emailInfo?.messageId
        );

        if (emailInfo?.messageId) {
            await saveRegistrationMessageId(
                emailInfo.messageId
            );
        }

        console.log(
            'Saturday volleyball automation completed.'
        );

    } catch (error) {
        console.error(
            'Saturday automation failed:',
            error
        );
    }
}


module.exports = {
    runSaturdayAutomation
};