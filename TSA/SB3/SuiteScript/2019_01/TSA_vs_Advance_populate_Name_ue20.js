/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 *	15/01/2019 Viktor S. 
 *	The beforeload function adds a field to the Income form and also loads the 
	
 *
 
 */
 
define(['N/record', 'N/search', 'N/email', 'N/render', 'N/format', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/vs_lib.js'],
function(record, search, email, render, format, runtime, serverWidget, vs_lib) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
      
      	//if (vs_lib.userSubsidiaryIsIHQ()) return true;
      
      	log.debug("Set Status Vaule beforeload","*** Beforeload Started ***");
		var currentRecord = scriptContext.newRecord;
      	var status = currentRecord.getValue({fieldId: "transtatus"});
      	currentRecord.setValue({ fieldId: "custbody_tsa_vs_status_value", value: status, ignoreFieldChange: true, fireSlavingSync: false });
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    
      	//if (vs_lib.userSubsidiaryIsIHQ()) return true;
      
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
    	
    	var currentRecord = scriptContext.newRecord;
    	//var duedate = currentRecord.getValue({fieldId: 'duedate'});
		
		var lineCount = currentRecord.getLineCount({ sublistId: "line" });
		var payee = currentRecord.getValue({fieldId: "custbody_tsa_iouemp"});
		log.debug("Advance Name Populate beforesubmit","line count="+lineCount+" payee="+payee);
		/* this is for Dynamic mode 
		currentRecord.selectLine({ sublistId: "line", line: 1 });
		objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'name', value: payee, ignoreFieldChange: true });
		objRecord.commitLine("line");
		*/
		currentRecord.setValue({ fieldId: "entity", value: payee, ignoreFieldChange: true, fireSlavingSync: false });

		for(var i=0;i<lineCount;i++){
			currentRecord.setSublistValue({ sublistId:'line', fieldId:'entity', line:i, value:payee });
		}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
      
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
      
      	//if (vs_lib.userSubsidiaryIsIHQ()) return true;
      
		log.debug("Name-Entity update","** Advance Aftersubmit Started **");
    	var currentRecord = scriptContext.newRecord;
		var advance_id = currentRecord.id;
		var payee = currentRecord.getValue({fieldId: "custbody_tsa_iouemp"});
    	//var duedate = currentRecord.getValue({fieldId: 'duedate'});
		log.debug("Name-Entity update"," advance_id="+advance_id);
		if(advance_id){
			log.debug("Name-Entity update","entity update triggered - payee="+payee);
			//var id = record.submitFields({ type: "customtransaction_tsa_iou2", id: advance_id, values: { entity: payee }, options: { enableSourcing: false, ignoreMandatoryFields : true } });
			var rec = record.load({ type: 'customtransaction_tsa_iou2', id: advance_id, isDynamic: false })
			rec.setValue({ fieldId: 'entity', value: payee});
			rec.save({enableSourcing: false, ignoreMandatoryFields: true});
    	}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
}); 