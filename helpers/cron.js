// @ts-check

const nodeCron = require('node-cron');
const { NODE_ENV } = require('../config/config')

/**
 * Creación del cron
 * 
 * @param {{schedule: string; scheduled: boolean; process: Function; args: Array<any>}} task 
 * @returns 
 */
function createCron({ schedule, scheduled, process, args }) {
    if (!nodeCron.validate(schedule))
        throw new Error('Invalid schedule format')

    return nodeCron.schedule(schedule, _ => {
        if (this['is_running'])
            return;

        this['is_running'] = true;
        process(...args).then(_ => this['is_running'] = false);
    }, {
        scheduled: NODE_ENV === 'production' ? scheduled : false,
        timezone: 'America/Lima'
    });
}

module.exports = {
    createCron,
}
