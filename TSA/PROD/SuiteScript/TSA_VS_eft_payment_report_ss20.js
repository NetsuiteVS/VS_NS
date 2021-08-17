/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_eft_payment_report_ss20.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     
 * 
 * Date:         06/08/2020
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/

define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task', 'N/file', 'N/email'],
    /**
     * @param {record} record
     * @param {search} search
     */

    function (record, search, render, format, runtime, task, file, email) {

        /**
          * @param {Object} scriptContext
          * @param {string} scriptContext.type
          * @Since 2018.2
          */

        //************************** EXECUTE *****************************

        function execute(scriptContext) {

            var testingMode = false; // if true PDF is saved into file but not sent

            var curday = function (sp) {
                today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1; //As January is 0.
                var yyyy = today.getFullYear();

                if (dd < 10) dd = '0' + dd;
                if (mm < 10) mm = '0' + mm;
                return (dd + sp + mm + sp + yyyy);
            };

            log.debug("eft_payment_report::execute", "Started");

            var paymentFileId;
            var paymentRecordId;
            var savedSearchId;
            var advancedPdfTemplateId;
            var emailRecepient;
            var ccEmailRecepients;
          	var pdf_email_status;
          	var current_user;
          	var resend = false;
            try {

                paymentRecordId = runtime.getCurrentScript().getParameter({ name: "custscript_payment_file_id" });
                savedSearchId = runtime.getCurrentScript().getParameter({ name: "custscript_saved_search_id" });
                advancedPdfTemplateId = runtime.getCurrentScript().getParameter({ name: "custscript_adv_pdf_template_id" });
                emailRecepient = runtime.getCurrentScript().getParameter({ name: "custscript_email_recepient" });
                ccEmailRecepients = runtime.getCurrentScript().getParameter({ name: "custscript_email_cc__recipients" });
              	pdf_email_status = runtime.getCurrentScript().getParameter({ name: "custscript_pdf_email_status" });
              	
                log.debug("eft_payment_report::execute", "paymentRecordId="+paymentRecordId+", pdf_email_status="+pdf_email_status+", savedSearchId="+savedSearchId);
                log.debug("eft_payment_report::execute", "advancedPdfTemplateId=" + advancedPdfTemplateId);
                log.debug("eft_payment_report::execute", "emailRecepient=" + emailRecepient+", ccEmailRecepients:"+ccEmailRecepients);

                var objSearch = search.load({ id: savedSearchId });
                var defaultFilters = objSearch.filters;
                defaultFilters.push(search.createFilter({ name: "name", join: "CUSTBODY_9997_PFA_RECORD", operator: search.Operator.IS, values: paymentRecordId }));
                objSearch.filters = defaultFilters;
                var results = objSearch.run().getRange(0, 1000);

                var searchResultCount = objSearch.runPaged().count;
                log.debug("eft_payment_report::execute", "searchResultCount:" + searchResultCount);
                log.debug("eft_payment_report::execute", JSON.stringify(results));
                
                //var nsFile = file.load({ id: advancedPdfTemplateId });
                //var nsFileContents = nsFile.getContents();       
                var renderer = render.create();
                //renderer.templateContent = nsFileContents;
                renderer.setTemplateByScriptId(advancedPdfTemplateId);
                renderer.addSearchResults({ templateName: 'results', searchResult: results });
                //Find legal_name based on bank account and add to the template
                var bankAccount = results[0].getValue({ name: 'custrecord_2663_bank_account', join: "CUSTBODY_9997_PFA_RECORD" });
                renderer.addRecord('bankaccount', record.load({ type: "customrecord_2663_bank_details", id: bankAccount }));
                var xmlStr = renderer.renderAsString();
                //log.debug("eft_payment_report::execute", "xmlStr:" + renderer.renderAsString());
                //log.debug("eft_payment_report::execute", "xmlStr:" + xmlStr);
                //var pdfFile = render.xmlToPdf({ xmlString: xmlStr });
                var pdfFile = renderer.renderAsPdf();

                //Get Payment file
                log.debug("eft_payment_report::execute", "parseInt(paymentRecordId, 10):" + parseInt(paymentRecordId, 10));
                var paymentToSend = record.load({ type: 'customrecord_2663_file_admin', id: parseInt(paymentRecordId, 10), isDynamic: true });
                var paymentFileId = paymentToSend.getValue({ fieldId: "custrecord_2663_file_ref" });
                var process_user = paymentToSend.getText({ fieldId: "custrecord_8858_process_user" });
                var process_user_value = paymentToSend.getValue({ fieldId: "custrecord_8858_process_user" });
                var bank_account = paymentToSend.getText({ fieldId: "custrecord_2663_bank_account" });
                var name = paymentToSend.getValue({ fieldId: "name" });
                //var process_date = paymentToSend.getValue({ fieldId: "custrecord_2663_process_date" });
                var process_date = curday("/");


                log.debug("eft_payment_report::execute", "paymentFileId:" + paymentFileId);

                var paymentFile = file.load({ id: paymentFileId });

                //Send e-mail
                var userId = process_user_value; //runtime.getCurrentUser().id;
                if (userId<1) {
                    userId = 19587; //IHQ Accounts
                }
              
                if (testingMode) {
                    pdfFile.folder = 40798;
                    pdfFile.save();
                    log.debug("eft_payment_report::execute", "PDF was only saved to file and it wasn't sent in email.");
                    return;
                }

                log.debug("eft_payment_report::execute", "emailRecepient:" + emailRecepient);
                log.debug("eft_payment_report::execute", "userId:" + userId);
                var ccEmailRecepientsArray
                if (ccEmailRecepients) ccEmailRecepientsArray = ccEmailRecepients.split(",");
                log.debug("eft_payment_report::execute", "ccEmailRecepientsArray:" + JSON.stringify(ccEmailRecepientsArray));
                var attachmentArray = new Array();
                attachmentArray.push(pdfFile);
                attachmentArray.push(paymentFile);
                log.debug("eft_payment_report::execute", "attachmentArray:" + JSON.stringify(attachmentArray));
                if (pdf_email_status == "Resend Initiated") {
                    emailRecepient = 19587;
                  	ccEmailRecepientsArray = [];
                  	resend=true;
                  	userId = runtime.getCurrentUser().id;
                	log.debug("eft_payment_report::execute", "Resend Initiated, email will be sent to Accounts user (id=19587)");
                }
                email.send({
                    author: userId,
                    recipients: emailRecepient,
                    subject: "IHQ Payment Report| " + bank_account + " - " + name + " / " + process_date,
                    body: "Please see the attached payment file and report generated by " + process_user,
                    attachments: attachmentArray,
                    cc: ccEmailRecepientsArray
                });

                //paymentToSend.setValue({ fieldId: "custrecord_pdf_email_status", value: "sent", ignoreFieldChange: false });
                //paymentToSend.save({ enableSourcing: false, ignoreMandatoryFields: true });
                record.submitFields({
                    type: "customrecord_2663_file_admin",
                    id: parseInt(paymentRecordId, 10),
                    values: { custrecord_pdf_email_status: (resend?"Resent":"sent") },
                    options: { enableSourcing: true, ignoreMandatoryFields: true }
                });


                log.debug("eft_payment_report::execute", "Finished");
            }
            catch (e) {
                log.debug("eft_payment_report::Execute - Error", e);
                try {
                    //var paymentToSend = record.load({ type: 'customrecord_2663_file_admin', id: parseInt(paymentFileId, 10), isDynamic: true });
                    //paymentToSend.setValue({ fieldId: "custrecord_pdf_email_status", value: "error", ignoreFieldChange: false });
                    //paymentToSend.save({ enableSourcing: false, ignoreMandatoryFields: true });

                    record.submitFields({
                        type: 'customrecord_2663_file_admin',
                        id: parseInt(paymentRecordId, 10),
                        values: { custrecord_pdf_email_status: "error" },
                        options: { enableSourcing: true, ignoreMandatoryFields: true }
                    });


                }
                catch (e) { }
            }
            finally {
            }

        }

        return {
            execute: execute
        };

    });
