// @ts-check

const nodemailer = require('nodemailer');
const { MAIL_ACCOUNT, MAIL_CLIENT_ID, MAIL_SECRET_KEY, MAIL_REFRESH_TOKEN, MAIL_DEV } = require('../config/config');

/**
 * 
 * @param {nodemailer.SendMailOptions} options
 * @returns 
 */
function sendMail(options) {

    if (!global.isMailEnvironmentProduction()) {
        options.subject = `TO: ${options.to} :: CC: ${options.cc} :: BCC: ${options.bcc} :: REPLY TO: ${options.replyTo} :: SUBJECT: ${options.subject}`
        options.to = MAIL_DEV;
        options.cc = null;
        options.bcc = null;
        options.replyTo = null;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: MAIL_ACCOUNT,
            clientId: MAIL_CLIENT_ID,
            clientSecret: MAIL_SECRET_KEY,
            refreshToken: MAIL_REFRESH_TOKEN,
        }
    });

    return transporter.sendMail(options);
}

module.exports = {
    sendMail,
}
