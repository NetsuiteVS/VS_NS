/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_VS_eft_payment_report_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     
 * 
 * Date:         06/08/2020
 *
 ****************************************************************************************/

/* To test the script you could use:
  nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), "custrecord_pdf_email_status",null);
  nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), "custrecord_2663_file_processed",3);
  nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), "custrecord_2663_file_processed",4);
*/
 

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'N/translation', 'N/file', 'N/task'],
    function (url, record, log, search, runtime, http, https, translation, file, task) {

        //#region ******************************  AFTER SUBMIT  ************************************* 

        /**
         * Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

            try {

                log.debug("eft_payment_report::afterSubmit", "*** Started *** type="+scriptContext.type);

                if (scriptContext.type == scriptContext.UserEventType.DELETE
                    || scriptContext.type == scriptContext.UserEventType.VIEW
                    || scriptContext.type.equals("print")) return;

                var oldRecord = scriptContext.oldRecord;
                var newRecord = scriptContext.newRecord;
                var oldRecordFileProcessed = oldRecord.getValue({ fieldId: 'custrecord_2663_file_processed' });
                var newRecordFileProcessed = newRecord.getValue({ fieldId: 'custrecord_2663_file_processed' });
				//var full_rec = record.load({type: "customrecord_2663_file_admin", id: }); //, isDynamic: true	
              
                log.debug("eft_payment_report::afterSubmit", "newRecord.id:" + newRecord.id);

                var data = search.lookupFields({ type: 'customrecord_2663_file_admin', id: newRecord.id, columns: ['name', 'custrecord_pdf_email_status', 'custrecord_2663_bank_account']});
                var paymentId = data.name;
                var pdf_email_status = data.custrecord_pdf_email_status;
                var bank_account1 = data.custrecord_2663_bank_account;
                log.debug("eft_payment_report::afterSubmit", "bank_account1=" + JSON.stringify(bank_account1));
              
              	var bank_account = bank_account1[0].text;
				//var bank_account = newRecord.getText({ fieldId: 'custrecord_2663_bank_account' });
              	var bank_account_value = newRecord.getValue({ fieldId: 'custrecord_2663_bank_account' });
				log.debug("eft_payment_report::afterSubmit", "bank_account:" + JSON.stringify(bank_account)+" ,bank_account_value:"+ bank_account_value+" ,oldRecordFileProcessed="+oldRecordFileProcessed+" ,newRecordFileProcessed="+newRecordFileProcessed+" ,pdf_email_status="+pdf_email_status);
              
                if ( ((oldRecordFileProcessed.equals("15") || oldRecordFileProcessed.equals("3")) && newRecordFileProcessed.equals("4") && paymentId && (!pdf_email_status || pdf_email_status=="")) || pdf_email_status=="Resend Initiated" ) { // || pdf_email_status=="Resend Initiated" ???
					if(bank_account=="RBL Current Account BACS"){
						log.debug("eft_payment_report::afterSubmit", "Script called: customdeploy_tsa_vs_eft_pymnt_rep_ss20");
						var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
						scriptTask.scriptId = 'customscript_tsa_vs_eft_pymnt_rep_ss20';
						scriptTask.deploymentId = 'customdeploy_tsa_vs_eft_pymnt_rep_ss20';
						scriptTask.params = {  'custscript_payment_file_id': paymentId, 'custscript_pdf_email_status': pdf_email_status };
						var scriptTaskId = scriptTask.submit();
					}
					if(bank_account=="SAITCO EUR ODD Account" || bank_account=="SAITCO EURO ODD Account"){
						log.debug("eft_payment_report::afterSubmit", "Script called: customdeploy_tsa_vs_eft_pay_pdf_eur");
						var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
						scriptTask.scriptId = 'customscript_tsa_vs_eft_pymnt_rep_ss20';
						scriptTask.deploymentId = 'customdeploy_tsa_vs_eft_pay_pdf_eur';
						scriptTask.params = {  'custscript_payment_file_id': paymentId, 'custscript_pdf_email_status': pdf_email_status };
						var scriptTaskId = scriptTask.submit();
					}
					if(bank_account.indexOf("RBL Current Account MT103")>-1){
						log.debug("eft_payment_report::afterSubmit", "Script called: customdeploy_tsa_vs_eft_pay_pdf_mt103");
						var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
						scriptTask.scriptId = 'customscript_tsa_vs_eft_pymnt_rep_ss20';
						scriptTask.deploymentId = 'customdeploy_tsa_vs_eft_pay_pdf_mt103';
						scriptTask.params = {  'custscript_payment_file_id': paymentId, 'custscript_pdf_email_status': pdf_email_status };
						var scriptTaskId = scriptTask.submit();
					}
					if(bank_account.indexOf("SAITCO USD ODD Account MT103")>-1 || bank_account=="SAITCO USD ODD Account"){
						log.debug("eft_payment_report::afterSubmit", "Script called: customdeploy_tsa_vs_eft_pay_pdf_usd");
						var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
						scriptTask.scriptId = 'customscript_tsa_vs_eft_pymnt_rep_ss20';
						scriptTask.deploymentId = 'customdeploy_tsa_vs_eft_pay_pdf_usd';
						scriptTask.params = {  'custscript_payment_file_id': paymentId, 'custscript_pdf_email_status': pdf_email_status };
						var scriptTaskId = scriptTask.submit();
					}
					
                }

                log.debug("eft_payment_report::afterSubmit", "Finished");

                return true;
            }
            catch (e) {
                log.debug("eft_payment_report::afterSubmit - ERROR", e);
            }
            finally {
            }            
        }

        //#endregion

        return {
            afterSubmit: afterSubmit
        };

    });
