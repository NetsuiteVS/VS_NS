/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script (TSA_VS_trigger_interunit_approval_or_reject.js)
 *
 * Script Type:	Workflow Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Triggers InterUnit Approval or Reject
 *
 * Date:        09/08/2021
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
              	log.debug("",JSON.stringify(newRecord));

				var document_id=newRecord.getValue('transactionnumber');
				var tranid=newRecord.getValue('tranid');
              	var id=newRecord.id;
				var linked_txn_id=newRecord.getValue('custbody_linked_ic_trans');
				var next_status=runtime.getCurrentScript().getParameter({ name: "custscript_next_status" });
				if(linked_txn_id){
                    var txn = record.load({ type: "customtransaction_tsa_unit_intracompany", id: linked_txn_id, isDynamic: false });              
                    var status=txn.getValue("transtatus");
                    if(status=="E" || 1==1){
                        if(next_status=="approve") txn.setValue({ fieldId: "transtatus", value: "C", ignoreFieldChange: true, fireSlavingSync: false });
                        if(next_status=="reject") txn.setValue({ fieldId: "transtatus", value: "D", ignoreFieldChange: true, fireSlavingSync: false });
                        txn.save();
                    }
                }
                return true;
            }
            catch (e) {
                log.error("", e);
            }

        }

        //#endregion

        return {
            onAction: onAction
        };

    });




