// @ts-check

const nodeCron = require('node-cron');

class NodeCron {

    /**
     * Creación del cron
     * 
     * @param {{schedule: string; scheduled: boolean; process: Function; args: Array<any>}} task 
     * @returns 
     */
    constructor({ schedule, scheduled, process, args }) {
        if (!nodeCron.validate(schedule))
            throw new Error('Invalid schedule format');

        console.log(`processName: ${process.name} ${scheduled && global.isProduction() ? '' : 'not '}scheduled`);

        this.job = nodeCron.schedule(schedule, () => {
            if (this['is_running'])
                return;

            this['is_running'] = true;
            process(...args).then(() => this['is_running'] = false);
        }, {
            scheduled: global.isProduction() ? scheduled : false,
            timezone: 'America/Lima'
        });
    }

}

module.exports = NodeCron;
