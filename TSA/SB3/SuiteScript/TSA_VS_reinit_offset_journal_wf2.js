/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script (TSA_VS_reinit_offset_journal_wf2.js)
 *
 * Script Type:	Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Process to allow admin to re-initiate offset journal
 *
 * Date:        29/06/2021
 *
 ****************************************************************************************/

define(['N/error', 'N/record', 'N/search', 'N/runtime'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, runtime) {

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
                var recordId = newRecord.id;
                var recordType = newRecord.type;
                log.debug("onAction", "recordType=" + recordType);

                var linkedTransaction;
                var linkedTransactionExits = false;

                if (recordType == "journalentry") {
                    var lineCount = newRecord.getLineCount({ sublistId: "line" });
                    for (var i = 0; i < lineCount; i++) {

                        linkedTransaction = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_linked_ic_trans', line: i });
                        if (linkedTransaction) {
                            linkedTransactionExits = true;
                        }
                    }
                }
                else {
                    linkedTransaction = newRecord.getValue({ fieldId: 'custbody_linked_ic_trans' });
                    if (linkedTransaction) {
                        linkedTransactionExits = true;
                    }
                }

                if (!linkedTransactionExits) {

                    log.debug("onAction", recordType + " update");

                    if (recordType == "journalentry") {
                        var journalRecord = record.load({ type: record.Type.JOURNAL_ENTRY, id: recordId, isDynamic: true });
                        journalRecord.setValue({ fieldId: "approvalstatus", value: 1, ignoreFieldChange: false });
                        journalRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        journalRecord = record.load({ type: record.Type.JOURNAL_ENTRY, id: recordId, isDynamic: true });
                        journalRecord.setValue({ fieldId: "approvalstatus", value: 2, ignoreFieldChange: false });
                        journalRecord.setValue({ fieldId: "custbody_tsa_vs_offs_jrnl_initiated", value: false, ignoreFieldChange: false });
                        journalRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    }
                    else if (recordType == "invoice" || recordType == "cashsale") {

                        var recordToLoad = record.load({ type: (recordType == "invoice" ? record.Type.INVOICE : record.Type.CASH_SALE), id: recordId, isDynamic: true });
                      	recordToLoad.setValue({ fieldId: "custbody_vs_trigger_elim_journal", value: true, ignoreFieldChange: false }); // it's the offsetting jounral that's going to be triggered, Case Sale doesn't have an elimination Journal.
                        recordToLoad.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    }
                    else {
						//TSA Interunit txn
                        var journalRecord = record.load({ type: "customtransaction_tsa_unit_intracompany", id: recordId, isDynamic: true });
                        journalRecord.setValue({ fieldId: "transtatus", value: "B", ignoreFieldChange: false });
                        journalRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        journalRecord = record.load({ type: "customtransaction_tsa_unit_intracompany", id: recordId, isDynamic: true });
                        journalRecord.setValue({ fieldId: "transtatus", value: "C", ignoreFieldChange: false });
                        journalRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    }
                }
              	else{
                  	log.debug("","Linked transaction found in the lines, no new one created.");
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

        //#endregion

        return {
            onAction: onAction
        };

    });




