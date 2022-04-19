// @ts-check

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const mssql = require('mssql');
const Excel = require('exceljs');
const templatePath = path.join(process.cwd(), 'template', 'student-list-notification-email.ejs');
const templateString = fs.readFileSync(templatePath, 'utf-8').toString();
const { getConnectionPool } = require('../utils/db');
const { sendMail } = require('../utils/mail');
const Logger = require('../utils/logger');
const { MAIL_ACCOUNT, MAIL_CC1 } = require('../config/config');

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
    .execute('CIC.sp_EnvioCorreoListaEstudiantesXDocente');

/**
 * Lista de estudiantes
 * * Envío de correo a docentes
 * 
 * @param {string[]} charCodesOfSection 
 * @param {number} daysAdd 
 * @returns 
 */
async function studentListByTeacherNotificationEmail(charCodesOfSection, daysAdd) {

    let pool;

    try {
        pool = await getConnectionPool();
        const listPromises = charCodesOfSection.map(char => getData(pool, daysAdd, char));
        const dataNotification = (await Promise.all(listPromises)).map(x => x.recordset).flat();
        const teacherIdList = Array.from(new Set(dataNotification.map(x => x.teacherId)));

        for (const teacherId of teacherIdList) {
            const info = dataNotification.filter(x => x.teacherId === teacherId);

            const teacherInfo = info.map(({
                teacherEmail, teacherFullname, section,
            }) => ({
                teacherEmail, teacherFullname, section,
            }))[0];

            const studentList = info.map(({
                studentId, studentEmail, studentFullname,
            }) => ({
                studentId, studentEmail, studentFullname,
            }))

            const workbook = new Excel.Workbook();
            const worksheet = workbook.addWorksheet('Page 1');

            workbook.creator = 'Centro de Idiomas';
            workbook.lastModifiedBy = 'Centro de Idiomas';
            workbook.properties.date1904 = true;
            worksheet.columns = [
                { header: 'Código del estudiante', key: 'studentId' },
                { header: 'Nombre completo', key: 'studentFullname' },
                { header: 'Correo institucional', key: 'studentEmail' },
            ];
            worksheet.addRows(studentList);

            const workbookBuffer = await workbook.xlsx.writeBuffer();
            const templateHtml = ejs.render(templateString);
            const mailResponse = await sendMail({
                from: `Centro de Idiomas Continental <${MAIL_ACCOUNT}>`,
                to: teacherInfo.teacherEmail,
                cc: MAIL_CC1,
                subject: `Lista de estudiantes - ${teacherInfo.section}`.toUpperCase(),
                html: templateHtml,
                attachments: [{
                    filename: `lista-de-estudiantes-${teacherInfo.section}.xlsx`,
                    content: Buffer.from(workbookBuffer),
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }]
            })

            Logger.writeLog('studentListByTeacherNotificationEmail', JSON.stringify(mailResponse, null, '\t'), Logger.Severity.Info);
        }
    } catch (error) {
        Logger.writeLog('studentListByTeacherNotificationEmail', error, Logger.Severity.Error);
    } finally {
        if (pool && pool.connected) {
            pool.close();
        }
    }
}

module.exports = {
    studentListByTeacherNotificationEmail,
}

