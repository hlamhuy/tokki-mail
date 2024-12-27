const { ImapFlow } = require('imapflow');

const getHost = (domain) => {
    switch (domain) {
        case 'yahoo.com':
            return 'imap.mail.yahoo.com';
        case 'hotmail.com':
        case 'outlook.com':
            return 'imap-mail.outlook.com';
        case 'gmail.com':
            return 'imap.gmail.com';
        case 'icloud.com':
            return 'imap.mail.me.com';
        default:
            throw new Error(`Unsupported email domain: ${domain}`);
    }
};

const syncAccount = async (db, accountId) => {
    const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
    const account = stmt.get(accountId);
    const host = getHost(account.domain);

    const client = new ImapFlow({
        host: host,
        port: 993,
        secure: true,
        auth: {
            user: account.user,
            pass: account.pass,
        },
        //logger: false,
    });

    try {
        await client.connect();
        let lock = await client.getMailboxLock('INBOX', { readOnly: true });
        try {
            // get prev amount from db
            const status = await client.status('INBOX', { messages: true });
            const prevAmount = account.amount;
            const newAmount = status.messages;
            console.log('Current prev amount: ', prevAmount);
            console.log('Current new amount: ', newAmount);
            const start =
                prevAmount === 0 && newAmount > 200
                    ? newAmount - 200
                    : prevAmount + 1;
            console.log('Start point: ', start);

            // fetch new messages
            let messages = await client.fetchAll(`${start}:*`, {
                uid: true,
                envelope: true,
            });

            // insert messages to db
            for (const mail of messages) {
                // check if mail already exists in db, then insert into mails table
                console.log('Mail subject: ', mail.envelope.subject);
                let insertedId = mailInsert(db, mail);

                // insert into origins table
                originInsert(db, insertedId, accountId, mail);

                // update prev amount in accounts table
                db.prepare(
                    'UPDATE accounts SET prev_amount = ? WHERE id = ?'
                ).run(status.messages, accountId);
            }
        } catch (e) {
            console.log('Error when fetching mails: ', e);
        } finally {
            lock.release();
        }
        return 1;
    } catch (e) {
        console.log('Error when connecting to IMAP server: ', e);
        if (e.responseStatus === 'NO') {
            return 0;
        }
    } finally {
        await client.logout();
    }
};

// insert into mails table if not existed and return mail id
const mailInsert = (db, mail) => {
    const existed = db
        .prepare('SELECT id FROM mails WHERE subject = ?')
        .get(mail.envelope.subject);
    const id = existed
        ? existed.id
        : db
              .prepare('INSERT INTO mails (subject, sender) VALUES (?, ?)')
              .run(mail.envelope.subject, mail.envelope.from[0].name)
              .lastInsertRowid;
    return id;
};

// insert into origins table
const originInsert = (db, mailId, accountId, mail) => {
    db.prepare(
        'INSERT OR IGNORE INTO origins (mail_id, account_id, uid, date) VALUES (?, ?, ?, ?)'
    ).run(
        mailId,
        accountId,
        mail.uid,
        Math.floor(mail.envelope.date.getTime() / 1000)
    );
};
module.exports = { syncAccount };
