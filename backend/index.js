const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const loadAccounts = (filePath) => {
    const accounts = [];
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split('\n');
    for (const line of lines) {
        const [user, pass] = line.split(':');
        if (user && pass) {
            accounts.push({ user, pass });
        }
    }
    return accounts;
};

const getHost = (email) => {
    const domain = email.split('@')[1];
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

const fetchEmails = async (account) => {
    const host = getHost(account.user);
    const client = new ImapFlow({
        host: host,
        port: 993,
        secure: true,
        auth: {
            user: account.user,
            pass: account.pass,
        },
    });

    await client.connect();

    let lock = await client.getMailboxLock('INBOX', { readOnly: true });
    try {
        let list = await client.list();
        console.log('------------- ALL MAILBOXES ---------------\n');
        list.forEach((mailbox) => console.log(mailbox.path));
        console.log('-----------------------------------------------------\n');
        let emails = [];
        for await (let msg of client.fetch('1', {
            uid: true,
            envelope: true,
            source: true,
        })) {
            emails.push(msg);
        }

        for (const mail of emails) {
            console.log(
                '-----------------------------------------------------'
            );
            console.log(`Subject: ${mail.envelope.subject}`);
            console.log(`From: ${mail.envelope.from[0].address}`);
            console.log(`Date: ${mail.envelope.date}`);
        }
    } finally {
        lock.release();
        await client.logout();
    }
};

const main = async () => {
    const accounts = loadAccounts(path.join(__dirname, 'accounts.txt'));
    for (const account of accounts) {
        await fetchEmails(account);
    }
    //const parsed = await simpleParser(lastMsg.source);
    //console.log(`Content:\n${parsed.html}`);
};

main().catch(console.error);