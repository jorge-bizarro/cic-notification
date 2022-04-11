// @ts-check

const nodeCron = require('node-cron');
const { CRON_START } = require('../config/config')

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
        scheduled: CRON_START === 'true' ? scheduled : false,
        timezone: 'America/Lima'
    });
}

module.exports = {
    createCron,
}
