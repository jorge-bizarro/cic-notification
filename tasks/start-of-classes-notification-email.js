// @ts-check

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const mssql = require('mssql');
const templatePath = path.join(process.cwd(), 'template', 'start-of-classes-notification-email.ejs');
const templateString = fs.readFileSync(templatePath, 'utf-8').toString();
const { getConnectionPool } = require('../utils/db');
const Logger = require('../utils/logger');
const { MAIL_ACCOUNT, MAIL_CC1 } = require('../config/config');
const { sendMail } = require('../utils/mail');

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
    .execute('CIC.sp_EnvioCorreoRecordatorioInicio');


/**
 * Inicio de ciclo para las clases
 * * Envío de correo a estudiantes
 * 
 * @param {string[]} charCodesOfSection 
 * @param {number} daysAdd 
 * @returns 
 */
async function startOfClassesNotificationEmail(charCodesOfSection, daysAdd) {

    let pool;

    try {
        pool = await getConnectionPool();
        const listPromises = charCodesOfSection.map(char => getData(pool, daysAdd, char));
        const dataNotification = (await Promise.all(listPromises)).map(x => x.recordset).flat();
        const studentIdList = Array.from(new Set(dataNotification.map(x => x.studentId)));

        for (const studentId of studentIdList) {
            const info = dataNotification.filter(x => x.studentId === studentId);

            const studentInfo = info.map(({
                studentId, studentEmail, studentLastname, studentName, teacherLastname, teacherName, startDate, cancelDate, paymentExpirationDate, period, schoolName, schoolModality, section, cycle, LUN, MAR, MIE, JUE, VIE, SAB, DOM,
            }) => ({
                studentId, studentEmail, studentLastname, studentName, teacherLastname, teacherName, startDate, cancelDate, paymentExpirationDate, period, schoolName, schoolModality, section, cycle, LUN, MAR, MIE, JUE, VIE, SAB, DOM,
            }))[0];

            const paymentInfo = info.map(({
                paymentDescription, paymentCharge
            }) => ({
                paymentDescription, paymentCharge
            }))

            const templateHtml = ejs.render(templateString, {
                studentInfo,
                paymentInfo,
            })

            const mailResponse = await sendMail({
                from: `Centro de Idiomas Continental <${MAIL_ACCOUNT}>`,
                to: studentInfo.studentEmail,
                cc: MAIL_CC1,
                subject: `Recordatorio de inicio de ciclo ${studentInfo.cycle}° - ${studentInfo.schoolName} - ${studentInfo.schoolModality}`.toUpperCase(),
                html: templateHtml,
            })

            Logger.writeLog('startOfClassesNotificationEmail', JSON.stringify(mailResponse, null, '\t'), Logger.Severity.Info);
        }

    } catch (error) {
        Logger.writeLog('startOfClassesNotificationEmail', error, Logger.Severity.Error);
    } finally {
        if (pool && pool.connected) {
            pool.close();
        }
    }

}

module.exports = {
    startOfClassesNotificationEmail,
}

