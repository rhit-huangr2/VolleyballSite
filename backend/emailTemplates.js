function getNextMonday() {
    const today = new Date();

    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    return nextMonday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
}

function registrationOpenEmail() {
    const mondayDate = getNextMonday();

    return {
        subject: 'PLEASE REPLY- Volleyball Monday <> @7PM',
        html: `
            <div style="font-family: Arial, sans-serif; font-size: 14.67px; line-height: 1.656; color: #000000;">

                <p>Hello Everyone!</p>

                <p>
                    This coming <span>Monday night, ${mondayDate},</span>
                    we are on for <b>Volleyball</b> at CEMC gym facility
                    (Chuang Hall) from <b>7pm-10pm.</b>
                </p>

                <p>
                    If you would like to play,
                    <span style="color: red; font-weight: bold;">
                        please respond within 24 hours
                    </span>
                    of this email being sent out
                    <span style="color: red; font-weight: bold;">
                        ONLY if you are attending
                    </span>.
                </p>

                <p style="color: red; font-weight: bold;">
                    If you want to invite ONE authorized guest you must respond
                    that you are coming and provide the name &amp; e-mail of the
                    authorized guest
                    <u>(please run your guests by leaders)</u>.
                    You can reach out to your authorized guest but let them know
                    it's not a guarantee until a separate email is sent to guests
                    the next day after confirming how many members can attend
                    <span style="color: #000000; font-weight: normal;">
                        (please review guideline summary later in this email).
                    </span>
                </p>

                <p>
                    If we do not have 12 players on Monday we will cancel by 4pm.
                </p>

                <p>
                    If we're on, we highly recommend warming up your body before
                    any intense play. Please take the necessary time to perform
                    stretches or drills for yourself. This will help prevent
                    injuries. Games will start at 7:30pm, no later.
                </p>

                <p>Stay safe!</p>

                <p>In Christ,</p>

                <p>CVG</p>

                <p style="color: red; font-weight: bold;">
                    <u>IMPORTANT</u>: Please see below summary of the
                    points/guidelines:
                </p>

                <p>
                    <strong>Mission</strong><br>
                    Fellowship with CEMC youth/young adults from Towaco and
                    sister churches &amp; evangelism
                </p>

                <p>
                    <strong>Guest Policy</strong>
                </p>

                <ol>
                    <li>
                        <i>Members are asked first if they're playing Mondays</i>

                        <ol type="a">
                            <li>
                                Members are defined as believers who consistently
                                attend their respective CEMC church worship service
                                and fellowship
                            </li>
                        </ol>
                    </li>

                    <li>
                        <i>
                            If there are not enough members available, an invite
                            is extended to the members’ authorized guest (each
                            member is allowed ONE authorized guest)
                        </i>

                        <ol type="a">
                            <li>
                                Members are to use wisdom in their selection for
                                an authorized guest

                                <ol type="i">
                                    <li>
                                        Non-Christians who we can evangelize to
                                    </li>

                                    <li>
                                        Christians who do not have a spiritual home
                                        and are open to making CEMC their spiritual home
                                    </li>

                                    <li>
                                        We want to refrain from inviting friends
                                        who already have a spiritual home so we do
                                        not risk the perception of “stealing sheep”
                                    </li>
                                </ol>
                            </li>
                        </ol>
                    </li>

                    <li>
                        <i>
                            An authorized guest is allowed to bring ONE additional guest
                        </i>

                        <ol type="a">
                            <li>
                                Authorized guests’ additional guest must fill out
                                the
                                <a href="https://forms.gle/qW6yBG83arMbVNX39"
                                   style="color: #4285f4;">
                                    google form
                                </a>
                                prior in order to play
                            </li>

                            <li>
                                Members should explain the guidelines to their
                                authorized guests
                            </li>

                            <li>
                                Authorized guests can change from one week to the
                                next (new authorized guest would swap places with
                                prior authorized guest so prior authorized guest
                                would not receive the email)
                            </li>
                        </ol>
                    </li>

                    <li>
                        <i>
                            Guests who would like to come watch but not play are
                            welcome, but please let the leaders know ahead of time
                        </i>
                    </li>

                    <li>
                        <i>Players are typically 18+</i>

                        <ol type="a">
                            <li>All players must fill out the waiver form</li>

                            <li>
                                Players age 15-18 are allowed with parents' &amp;
                                leaders’ approval
                            </li>
                        </ol>
                    </li>

                    <li>
                        <i>
                            Any questions or concerns about the guest policy should
                            be addressed with the volleyball ministry leaders
                            (Matt Wing, Stephen Tam)
                        </i>
                    </li>
                </ol>

                <p>
                    <strong>Other Points to Keep in Mind</strong>
                </p>

                <ol>
                    <li>
                        Be kind to other players as this is family-friendly-
                        competitive play
                    </li>

                    <li>
                        Do not leave your belongings on the bench so that players
                        can sit on the benches when not playing a game
                    </li>

                    <li>
                        To reinforce our primary mission of the volleyball
                        ministry, please make sure to talk to people you typically
                        wouldn’t talk to during breaks within games (whether it’s
                        within your team or outside)
                    </li>

                    <li>
                        Please help clean-up at the end
                    </li>
                </ol>

            </div>
        `
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