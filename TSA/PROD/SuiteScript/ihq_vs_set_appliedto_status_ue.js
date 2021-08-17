/**
  * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 
 /* ********************************************
 *
 * date:11/11/2019		author: Viktor Schumann
 *
 * 	"custcol_ihq_pi_appliedto_po" should be populated with the PO which is appliedtotransaction and 
 *	"custcol_ihq_pi_appliedto_status" should be populated with the "custbody_ihq_status_transapp" from that PO 
 
 *	and no — by the time you bill a PO it should be posted so the approval status won't change after sourcing
 *
 *********************************************** */
 
 // custbody22 = advance id (thx to RSM)
 // custbody_tsa_cust_aprov_stat (1 - Pending Submission,2 - Pending Approval) -> approvalstatus=1 in both cases
 
 
define(['N/error', 'N/record', 'N/search', 'N/runtime'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, runtime) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @Since 2016.1
     */
		
  
    function afterSubmit(scriptContext) {
				
		if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
		
        var currentRecord = scriptContext.newRecord;
        var oldRecord = scriptContext.oldRecord;
      	var type = currentRecord.type;
      	var relatedType = '';
      	var relatedRecord_new = '';
	    var relatedRecord_old = '';
	    var triggerFields = [];
	    var fieldMap = [];
		
		//var itemId = runtime.getCurrentScript().getParameter({ name: "custscript_wf_item_id" });
		var bill_id=currentRecord.id;  //getValue('custbody22');
		
		log.debug('Record Type',currentRecord + ', ' + type+' bill_id='+bill_id);

		var supplierBill = record.load({ type: "vendorbill", id: bill_id, isDynamic: true });
		
		var lineCount = supplierBill.getLineCount({ sublistId: "item" });
		//var payee = currentRecord.getValue({fieldId: ""});
		log.debug("WFA SI populate with PO","line count="+lineCount);
		
		/* this is for Dynamic mode 
		*/
        var prev_po=0;
		for(var i=0;i<lineCount;i++){
			supplierBill.selectLine({ sublistId: "item", line: i });
			var orderid=supplierBill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'orderdoc'});
			var orderLine_id=supplierBill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'orderline'});
			log.debug("WFA SI populat with PO","orderid="+orderid+" ,line id="+orderLine_id);
			var status_transapp;

			if(orderid && orderid!=prev_po){
				prev_po=orderid;
				var searchObj = search.create({
				type: "purchaseorder",
				filters: [ 			["internalidnumber", "equalto", orderid]
							,"AND", ["line", "equalto", orderLine_id] 
						 ],
				columns: [
					search.createColumn({ name: "custbody_ihq_status_transapp" }),
					search.createColumn({ name: "line"})]
				});
                searchObj.run().each(function (result) {
                    status_transapp = result.getValue({ name: "custbody_ihq_status_transapp" });;
                    return true;
                });
				log.debug("WFA SI populate with PO","status_transapp="+status_transapp);				
			}
			supplierBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ihq_pi_appliedto_status', value: status_transapp, ignoreFieldChange: true });
			supplierBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ihq_pi_appliedto_po', value: orderid, ignoreFieldChange: true });
			supplierBill.commitLine("item");
			//not dynamic approach: supplierBill.setSublistValue({ sublistId:'line', fieldId:'entity', line:i, value:payee });

		}

        supplierBill.save({ enableSourcing: false, ignoreMandatoryFields: true });
				
		return;
    }

        return {
            afterSubmit: afterSubmit
        };
    
});



