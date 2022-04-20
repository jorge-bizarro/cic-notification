// @ts-check

require('dotenv').config();

const {
    MAIL_ENV,
    NODE_ENV,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    MAIL_ACCOUNT,
    MAIL_CLIENT_ID,
    MAIL_SECRET_KEY,
    MAIL_REFRESH_TOKEN,
    MAIL_DEV,
    MAIL_CC1,
    MAIL_CC2,
} = process.env;

module.exports = {
    MAIL_ENV,
    NODE_ENV,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    MAIL_ACCOUNT,
    MAIL_CLIENT_ID,
    MAIL_SECRET_KEY,
    MAIL_REFRESH_TOKEN,
    MAIL_DEV,
    MAIL_CC1,
    MAIL_CC2,
}
