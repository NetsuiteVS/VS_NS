/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_send_approval_mail_ss2.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Send email about list of txns waiting for approval
 * 
 * Date:        15/04/2021
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/
    define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task', 'N/email', 'N/url', 'N/https'],
    /**
     * @param {record} record
     * @param {search} search
     */

        function (record, search, render, format, runtime, task, email, url, https) {

            /**
              * @param {Object} scriptContext
              * @param {string} scriptContext.type
              * @Since 2018.2
              */

            //************************** EXECUTE *****************************

            var TEST_MODE = false;
            var RESCHEDULE_LIMIT = 150;
            var normalApproval;
            var hodApproval;
            var rescheduled = false;

            function execute(scriptContext) {
                try {

                    log.debug("execute", "Started");

                    var internalId
                    var subsidiary;
                    var matrixData;

                    var customrecord_tsa_vs_approval_mailSearchObj = search.create({
                        type: "customrecord_tsa_vs_approval_mail",
                        filters: [["custrecord_vs_processed_date", "isempty", ""]],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_tsa_vs_subsidiary_app_mail", label: "Subsidiary" }),
                                search.createColumn({ name: "custrecord_tsa_vs_matrix_data", label: "Matrix Data" }),
                                search.createColumn({ name: "custrecord_vs_processed_date", label: "Processed Date" }),
                                search.createColumn({ name: "internalid", label: "internalid" })
                            ]
                    });
                    var approvalSearchCount = customrecord_tsa_vs_approval_mailSearchObj.runPaged().count;

                    if (approvalSearchCount == 0) {
                        log.debug("execute", "All customrecord_tsa_vs_approval_mail record is processed.");
                        return true;
                    }
                    log.debug("execute", "approvalSearchCount=" + approvalSearchCount);

                    customrecord_tsa_vs_approval_mailSearchObj.run().each(function (result) {
                        internalId = result.getValue({ name: 'internalid' });
                        subsidiary = result.getValue({ name: 'custrecord_tsa_vs_subsidiary_app_mail' });
                        matrixData = result.getValue({ name: 'custrecord_tsa_vs_matrix_data' });
                        return false;
                    });

                    log.debug("execute", "internalId=" + internalId + ", subsidiary=" + subsidiary + ", matrixData=" + JSON.stringify(JSON.parse(matrixData)));

                    if (matrixData) {
                        var approvalJSON = JSON.parse(matrixData);
                        sendMail(approvalJSON.normalApproval, true);
                        sendMail(approvalJSON.hodApproval, false);
                    }

                    if (!TEST_MODE) {
                        //Update processed date
                        var approvalMailToUpdate = record.load({ type: 'customrecord_tsa_vs_approval_mail', id: internalId, isDynamic: true });
                        approvalMailToUpdate.setValue({ fieldId: "custrecord_vs_processed_date", value: new Date(), ignoreFieldChange: false });
                        approvalMailToUpdate.save({ enableSourcing: false, ignoreMandatoryFields: true });

                        //Recall itself if neccessary
                        var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                        scheduledScriptTask.scriptId = "customscript_tsa_vs_send_appr_mail_ss2";
                        scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_send_appr_mail_ss2";
                        scheduledScriptTask.submit();
                    }

                    log.debug("execute", "Finished");
                }
                catch (e) {
                    log.error("execute - ERROR", e.message);
                }
                finally {
                }

            }

            function sendMail(mailToUserList, isNormalApprovals) {

                var accountId = runtime.accountId.replace("_", "-");
                var mailContents = {};
                var author = 17677;//Netsuite System user. SB3: 17677, PRODUCTION:21053
                //var emailSubject = (isNormalApprovals ? "" : "HOD Review. ") + "Transaction is waiting for approve.";
                var emailSubject = (isNormalApprovals ? "Netsuite - Summary of Transactions are waiting for approval." : "Netsuite - Summary of Transactions are waiting for HOD Review.");

                var emailBody = "Dear Budget Holder,<br/><br/>" +
                    'This is a system generated email listing transactions waiting for approval or HOD review.<br/>' +
                    'Please click on the View link to navigate to the transaction in Netsuite.<br/><br/><br/>' +
                    '<font size="2" face="Courier New" >' +
                    '<table> <tr> <th style="padding-right:20px">View</th> <th style="padding-right:20px">Type</th> <th style="padding-right:20px">Date</th><th style="padding-right:20px">Document Nr</th> <th style="padding-right:20px">Name</th> <th style="padding-right:20px">Memo</th><th style="padding-right:20px">Amount</th> <th style="padding-right:20px">Status</th> </tr>';

                //Get transaction list per user
                Object.keys(mailToUserList).forEach(function (key) {

                    var type = mailToUserList[key].type;
                    var tranId = mailToUserList[key].tranId;
                    var internalId = key;                    
                    var trandate = mailToUserList[key].trandate;
                    var entity = mailToUserList[key].entity;
                    var memo = mailToUserList[key].memo;
                    var total = mailToUserList[key].total;
                    var status = mailToUserList[key].status;
                    var userIds = mailToUserList[key].userIds;
                    log.debug("execute", "internalId=" + internalId + ", tranId=" + tranId + ", type=" + type + ", trandate=" + trandate + ", entity=" + entity + ", memo=" + memo);
                    log.debug("execute", "total=" + total + ", status=" + status + ", userIds=" + userIds );

                    var txnLink = '<a href="https://' + accountId + '.app.netsuite.com/app/accounting/transactions/transaction.nl?id=' + internalId + '">' + tranId + '</a>';

                    log.debug("execute", "txnLink=" + txnLink);

                    for (var i = 0; i < userIds.length; i++) {

                        if (!mailContents[userIds[i]]) {
                            mailContents[userIds[i]] = emailBody;
                        }

                        mailContents[userIds[i]] += '<tr> <td style="padding-right:20px">' + txnLink + '</td> <td style="padding-right:20px">' + type + '</td> <td style="padding-right:20px">' + trandate + '</td> <td style="padding-right:20px">' +
                            tranId + '</td> <td style="padding-right:20px">' + (entity == "- None -" ? "" : entity) + '</td> <td style="padding-right:20px">' + (memo ? memo : "") + '</td> <td style="padding-right:20px">' +
                            total + '</td> <td style="padding-right:20px">' + status + '</td> </tr>';
                        //log.debug("sendMail", 'i= ' + i + ", userIds[i]=" + userIds[i] + ", mailContents[userIds[i]]=" + mailContents[userIds[i]]);
                    }
                });

                if (!TEST_MODE) {
                    //Send mails
                    Object.keys(mailContents).forEach(function (key) {
                        log.debug("onAction", 'author= ' + author + ", emailRecepient=" + key + ", emailSubject=" + emailSubject + ", emailBody=" + mailContents[key]);
                        email.send({ author: author, recipients: key, subject: emailSubject, body: mailContents[key] });
                    });
                }
            }

            return {
                execute: execute
            };

        });