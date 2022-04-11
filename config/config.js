// @ts-check

require('dotenv').config();

const {
    EMAIL_DEV,
    EMAIL_CC,
    NODE_ENV,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    API_SEND_MAIL_URL,
    API_SEND_MAIL_ACCESS_TOKEN,
    CRON_START,
} = process.env;

module.exports = {
    EMAIL_DEV,
    EMAIL_CC,
    NODE_ENV,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    API_SEND_MAIL_URL,
    API_SEND_MAIL_ACCESS_TOKEN,
    CRON_START,
}
