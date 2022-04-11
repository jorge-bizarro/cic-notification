// @ts-check

const { createCron } = require('./helpers/cron');
const { startOfClassesNotificationEmail } = require('./tasks/start-of-classes-notification-email');

[{
    schedule: '0 30 17 * * *',
    scheduled: true,
    process: startOfClassesNotificationEmail,
    args: [['I', 'S'], 1],
}, {
    schedule: '0 0 10 * * *',
    scheduled: true,
    process: startOfClassesNotificationEmail,
    args: [['L'], 0],
}, {
    schedule: '0 0 10 * * *',
    scheduled: true,
    process: startOfClassesNotificationEmail,
    args: [['R'], 3],
}]
    .forEach(createCron)
