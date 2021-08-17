/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script (TSA_VS_send_approval_mail_wf2.js)
 *
 * Script Type:	Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Send email about txn waiting for approval
 *
 * Date:        15/04/2021
 *
 ****************************************************************************************/

define(['N/error', 'N/record', 'N/search', 'N/runtime', 'N/url', 'N/https', 'N/email'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, runtime, url, https, email) {

        var TYPE_CONVERSIONS =
            {
                "custom108": "Advance",
                "custom112": "TSA Expense",
                "custom107": "TSA Income",
                "custom115": "TSA Interunit",
                "custom116": "TSA Unit Expense",
                "exprept": "Expense Claim",
                "journal": "Journal",
                "vendbill": "Supplier invoice",
                "vendpymt": "Supplier invoice payment",
                "purchord": "Purchase Order"
            };

        //#region ******************************  ON ACTION  ************************************* 

        /**
         * Definition of the Action script trigger point.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @Since 2016.1
         */
        function onAction(scriptContext) {

            try {

                log.debug("onAction", "Started");

                var newRecord = scriptContext.newRecord;
              	log.debug("newRecord",JSON.stringify(newRecord) );
              	
                var accountId = runtime.accountId.replace("_", "-");
                var normalApproval = {};
                var hodApproval = {};
                var hod_review = paymentRecordId = runtime.getCurrentScript().getParameter({ name: "custscript_tsa_hod_review" });
              	var new_status = paymentRecordId = runtime.getCurrentScript().getParameter({ name: "custscript_new_status" });

                var txnType = newRecord.getValue("type");
                var txn = {
                    tranId: (txnType == "vendpymt" ? newRecord.getValue('transactionnumber') : newRecord.getValue('tranid')),
                    internalId: newRecord.id,
                  	wf_new_status: new_status
                };   
              
                log.debug("onAction", "txn=" + JSON.stringify(txn));

                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_get_appr_users_sl2',
                    deploymentId: 'customdeploy_tsa_vs_get_appr_users_sl2',
                    returnExternalUrl: true,
                    params: { 'txn': JSON.stringify(txn) }
                });
                var response = JSON.parse(https.get({ url: suitletURL }).body); 
                log.debug("execute", "response=" + JSON.stringify(response));  

                var accountId = runtime.accountId.replace("_", "-");
                var txnLink = '<a href="https://' + accountId + '.app.netsuite.com/app/accounting/transactions/transaction.nl?id=' + newRecord.id + '">' + txn.tranId + '</a>';
                var date = JSON.stringify(newRecord.getValue("trandate")).split("T")[0].replace(/"/g, '');
              	var txnType1 = newRecord.getValue("type");
                if (TYPE_CONVERSIONS.hasOwnProperty(txnType.toLowerCase())) {
                    txnType = TYPE_CONVERSIONS[txnType.toLowerCase()];
                }
                var txnMixedStatus = (txnType1.indexOf("custom") > -1) ? newRecord.getText("status") : newRecord.getText("custbody_tsa_cust_aprov_stat");
              	log.debug("execute", "txnType="+txnType+", status=" + newRecord.getText("status") + ", custom status="+newRecord.getText("custbody_tsa_cust_aprov_stat") );
				if (new_status) txnMixedStatus=new_status;
              	var name = (newRecord.getText("entity")||"")+(newRecord.getText("custbody_tsa_iouemp")||"")+(newRecord.getText("custbody_tsa_non_s_exp_payee")||"")+(newRecord.getText("custbody_tsa_payee_fbu")||"");
              //(newRecord.getText("entity")?newRecord.getText("entity"):(newRecord.getText("custbody_tsa_iouemp")||"") )

                var memo = newRecord.getText("memo");
                if (!memo) {
                    memo = newRecord.getText("custbody_tsa_nsipurps");
                    if (!memo) {
                        memo = newRecord.getText("custbody_tsa_advareason") || "";
                    }
                }
              
              	// name has to be dynamically adjusted based on txnType1 
                var emailBody = "Dear Budget Holder,<br/><br/>" +
                    'This is a system generated email listing transactions waiting for approval or HOD review.<br/>' +
                    'Please click on the View link to navigate to the transaction in Netsuite.<br/><br/><br/>' +
                    '<font size="2" face="Courier New" >'+
                    '<table> <tr> <th style="padding-right:20px">View</th> <th style="padding-right:20px">Type</th> <th style="padding-right:20px">Date</th><th style="padding-right:20px">Document Nr</th> <th style="padding-right:20px">Name</th> <th style="padding-right:20px">Memo</th><th style="padding-right:20px">Amount</th> <th style="padding-right:20px">Status</th> </tr>';
                emailBody += '<tr> <td style="padding-right:20px">' + txnLink + '</td> <td style="padding-right:20px">' + txnType + '</td> <td style="padding-right:20px">' + date + '</td> <td style="padding-right:20px">' +
                    txn.tranId + '</td> <td style="padding-right:20px">' + name +
                    '</td> <td style="padding-right:20px">' + memo + '</td> <td style="padding-right:20px">' +
                    newRecord.getValue("total") + '</td> <td style="padding-right:20px">' + txnMixedStatus + '</td> </tr>';

                log.debug("onAction", "emailBody:" + emailBody);

                 if(hod_review) {
                     sendMail(response.hodApproval, false, txn.tranId, emailBody);
                 }
                else{
                     sendMail(response.normalApproval, true, txn.tranId, emailBody);
                 }

                log.debug("onAction", "Finished");

                return true;
            }
            catch (e) {
                log.debug("onAction - ERROR", e);
            }
            finally {
            }
        }

        function sendMail(mailToUserList, isNormalApprovals, document_id, emailBody) {

            var author = 17677;//Netsuite System user. SB3: 17677, PRODUCTION:21053
            var emailSubject = (isNormalApprovals ? "Netsuite - New Transaction is waiting for approval: " : "Netsuite - New Transaction is waiting for HOD Review: ") + document_id;

            var userIdArray = ((JSON.stringify(mailToUserList)).replace(/["\[\]]/g, '')).split(",");
            log.debug("sendMail", 'mailToUserList= ' + userIdArray);

            var emailRecepients = [];
            for (var i = 0; i < userIdArray.length; i++) {
                emailRecepients.push(userIdArray[i]);

                if (emailRecepients.length > 2) {
                    log.debug("sendMail", 'author= ' + author + ", emailRecepients=" + emailRecepients + ", emailSubject = " + emailSubject);
                    email.send({ author: author, recipients: emailRecepients, subject: emailSubject, body: emailBody });
                    emailRecepients = [];
                }
            }

            if (emailRecepients.length > 0) {
                log.debug("sendMail", 'author= ' + author + ", emailRecepients=" + emailRecepients + ", emailSubject = " + emailSubject);
                email.send({ author: author, recipients: emailRecepients, subject: emailSubject, body: emailBody });
            }
        }

        //#endregion

        return {
            onAction: onAction
        };

    });




