// @ts-check

require('./utils/polyfill');
const { NODE_ENV } = require('./config/config');
const NodeCron = require('./utils/cron');
const { startOfClassesNotificationEmail } = require('./tasks/start-of-classes-notification-email');
const { studentListByTeacherNotificationEmail } = require('./tasks/student-list-notification-email');
const { schedulingCourseNotificationEmail } = require('./tasks/scheduling-classes-notification-email');

global.isProduction = () => NODE_ENV === 'production';

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
}, {
    schedule: '0 30 17 * * *',
    scheduled: true,
    process: studentListByTeacherNotificationEmail,
    args: [['I', 'S'], 1],
}, {
    schedule: '0 0 10 * * *',
    scheduled: true,
    process: studentListByTeacherNotificationEmail,
    args: [['L'], 0],
}, {
    schedule: '0 0 10 * * *',
    scheduled: true,
    process: studentListByTeacherNotificationEmail,
    args: [['R'], 3],
}, {
    schedule: '0 0 10 * * *',
    scheduled: true,
    process: schedulingCourseNotificationEmail,
    args: [['S', 'I', 'L', 'R'], 2],
}]
    .forEach(task => new NodeCron(task))
