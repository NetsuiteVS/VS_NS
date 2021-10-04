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
              	log.debug("WF record",JSON.stringify(newRecord));

				var document_id=newRecord.getValue('transactionnumber');
				var tranid=newRecord.getValue('tranid');
              	var id=newRecord.id;
              	var linked_txn_id=newRecord.getValue('custbody_linked_ic_trans');

				var transactionSearchObj = search.create({
				   type: "transaction",
				   filters:
				   [
					  ["mainline","is","T"], 
					  "AND", 
					  ["internalidnumber","equalto",linked_txn_id]
				   ],
				   columns:
				   [
					  search.createColumn({name: "trandate", label: "Date"}),
					  search.createColumn({name: "datecreated", label: "Date Created"}),
					  search.createColumn({name: "type", label: "Type"}),
					  search.createColumn({name: "tranid", label: "Document Number"})
				   ]
				});
				var txn_type_srch="";
				var searchResultCount = transactionSearchObj.runPaged().count;
				log.debug("transactionSearchObj result count",searchResultCount);

				transactionSearchObj.run().each(function(result){
				   txn_type_srch=result.getText("type");
				   var tranid=result.getValue("tranid");
				   log.debug("linked txn search result","txn_type_srch="+txn_type_srch+", tranid="+tranid);
				   return true;
				});

				var txn_type="journal";
				if(txn_type_srch=="TSA Interunit") txn_type="customtransaction_tsa_unit_intracompany";
				
				var next_status=runtime.getCurrentScript().getParameter({ name: "custscript_next_status" });
				if(linked_txn_id){
                    var txn = record.load({ type: txn_type, id: linked_txn_id, isDynamic: false });
					log.debug("linked txn record",JSON.stringify(txn));					
                    var status=txn.getValue("transtatus");
					var approvalstatus=txn.getValue("approvalstatus"); 
                    if(status=="E" || approvalstatus=="1"){
                        if(next_status=="approve"){
							log.debug("","approve");
							if(txn_type=="customtransaction_tsa_unit_intracompany") txn.setValue({ fieldId: "transtatus", value: "C", ignoreFieldChange: true, fireSlavingSync: false });
							if(txn_type=="journal") txn.setValue({ fieldId: "approvalstatus", value: "2", ignoreFieldChange: true, fireSlavingSync: false });
						}
                        if(next_status=="reject"){
							log.debug("","reject");
							if(txn_type=="customtransaction_tsa_unit_intracompany") txn.setValue({ fieldId: "transtatus", value: "D", ignoreFieldChange: true, fireSlavingSync: false });
							if(txn_type=="journal") txn.setValue({ fieldId: "approvalstatus", value: "3", ignoreFieldChange: true, fireSlavingSync: false });
						}
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




