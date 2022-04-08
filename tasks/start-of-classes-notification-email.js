// @ts-check

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const mssql = require('mssql');
const templatePath = path.join(process.cwd(), 'template', 'start-of-classes-notification-email.ejs');
const templateString = fs.readFileSync(templatePath, 'utf-8').toString();
const { getConnectionPool } = require('../helpers/db');
const Logger = require('../helpers/logger');
const { API_SEND_MAIL_URL, API_SEND_MAIL_ACCESS_TOKEN, EMAIL_DEV, EMAIL_CC } = require('../config/config');

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
 * Envío de correo
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

        const jsonDataToSendList = studentIdList.map(studentId => {
            const info = dataNotification.filter(x => x.studentId === studentId);
            const studentInfo = info.map(({
                studentId, studentLastname, studentName, teacherLastname, teacherName, startDate, cancelDate, paymentExpirationDate, period, schoolName, schoolModality, section, cycle, LUN, MAR, MIE, JUE, VIE, SAB, DOM,
            }) => ({
                studentId, studentLastname, studentName, teacherLastname, teacherName, startDate, cancelDate, paymentExpirationDate, period, schoolName, schoolModality, section, cycle, LUN, MAR, MIE, JUE, VIE, SAB, DOM,
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

            return {
                from: 'Notificaciones - Centro de Idiomas',
                to: [`${String(studentInfo.studentId).toLowerCase()}@continental.edu.pe`],
                subject: `Recordatorio de inicio de ciclo ${studentInfo.cycle}° - ${studentInfo.schoolName} - ${studentInfo.schoolModality}`.toUpperCase(),
                body: templateHtml,
                files: [],
                replyTo: [],
                cc: [EMAIL_CC],
                cco: [],
                emailDev: EMAIL_DEV,
            }
        })

        for (const jsonDataToSend of jsonDataToSendList) {
            try {
                const result = await axios.default({
                    url: `${API_SEND_MAIL_URL}/mail/send`,
                    method: 'POST',
                    headers: {
                        'x-token': API_SEND_MAIL_ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    data: jsonDataToSend
                })

                const resultToJson = {
                    requestHeaders: result.config.headers,
                    requestUrl: result.config.url,
                    requestMethod: result.config.method,
                    // requestData: result.config.data,
                    responseStatus: result.status,
                    responseStatusText: result.statusText,
                    responseHeaders: result.headers,
                    responsedata: result.data,
                }

                Logger.writeLog('startOfClassesNotificationEmail', JSON.stringify(resultToJson, null, '\t'), Logger.Severity.Debug);
            } catch (error) {
                if (error.isAxiosError) {
                    const { response } = error;

                    const errorToJson = {
                        requestHeaders: response.config.headers,
                        requestUrl: response.config.url,
                        requestMethod: response.config.method,
                        requestData: response.config.data,
                        responseStatus: response.status,
                        responseStatusText: response.statusText,
                        responseHeaders: response.headers,
                        responsedata: response.data,
                    };

                    Logger.writeLog('startOfClassesNotificationEmail', JSON.stringify(errorToJson, null, '\t'), Logger.Severity.Error);
                    continue;
                }

                Logger.writeLog('startOfClassesNotificationEmail', error, Logger.Severity.Error);
            }
        }
    } catch (error) {
        Logger.writeLog('startOfClassesNotificationEmail', error, Logger.Severity.Fatal);
    } finally {
        if (pool && pool.connected) {
            pool.close();
        }
    }

}

module.exports = {
    startOfClassesNotificationEmail,
}

