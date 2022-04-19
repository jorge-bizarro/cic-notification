// @ts-check

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const mssql = require('mssql');
const templatePath = path.join(process.cwd(), 'template', 'scheduling-classes-notification-email.ejs');
const templateString = fs.readFileSync(templatePath, 'utf-8').toString();
const { getConnectionPool } = require('../utils/db');
const { sendMail } = require('../utils/mail');
const Logger = require('../utils/logger');
const { MAIL_ACCOUNT, MAIL_CC2 } = require('../config/config');

/**
 * Obtener la data a procesar
 * 
 * @param {mssql.ConnectionPool} pool 
 * @param {number} daysAdd 
 * @param {string} sectionChar
 * @returns 
 */
const getData = (pool, daysAdd, sectionChar) => pool.request()
    .input('p_daysAdd', mssql.TinyInt(), daysAdd)
    .input('p_sectionChar', mssql.Char(1), sectionChar)
    .execute('CIC.sp_EnvioCorreoProgramacionCursoTaller');

/**
 * Programación de curso taller
 * * Envío de correo a docentes
 * 
 * @param {string[]} charCodesOfSection 
 * @param {number} daysAdd 
 * @returns 
 */
async function schedulingCourseNotificationEmail(charCodesOfSection, daysAdd) {

    let pool;

    try {
        pool = await getConnectionPool();
        const listPromises = charCodesOfSection.map(char => getData(pool, daysAdd, char));
        const dataNotification = (await Promise.all(listPromises)).map(x => x.recordset).flat();
        const teacherIdList = Array.from(new Set(dataNotification.map(x => x.teacherId)));

        for (const teacherId of teacherIdList) {
            const info = dataNotification.filter(x => x.teacherId === teacherId);

            const teacherInfo = info.map(({
                startDate, endDate, examDate, deliveryNotesDate, regularEnrollmentDate, paymentExtensionDate, submissionRequestDate, schoolName, teacherFullname, teacherEmail, period, section, cycle, classDay, classSchedule, DOM, LUN, MAR, MIE, JUE, VIE, SAB,
            }) => ({
                startDate, endDate, examDate, deliveryNotesDate, regularEnrollmentDate, paymentExtensionDate, submissionRequestDate, schoolName, teacherFullname, teacherEmail, period, section, cycle, classDay, classSchedule, DOM, LUN, MAR, MIE, JUE, VIE, SAB,
            }))[0];

            const templateHtml = ejs.render(templateString, {
                info: teacherInfo
            });

            const mailResponse = await sendMail({
                from: `Centro de Idiomas Continental <${MAIL_ACCOUNT}>`,
                to: teacherInfo.teacherEmail,
                cc: MAIL_CC2,
                subject: `Programación de curso taller`.toUpperCase(),
                html: templateHtml,
            })

            Logger.writeLog('schedulingCourseNotificationEmail', JSON.stringify(mailResponse, null, '\t'), Logger.Severity.Info);
        }
    } catch (error) {
        Logger.writeLog('schedulingCourseNotificationEmail', error, Logger.Severity.Error);
    } finally {
        if (pool && pool.connected) {
            pool.close();
        }
    }
}

module.exports = {
    schedulingCourseNotificationEmail,
}

