/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 *	15/01/2019 Viktor S. 
 *	The beforeload function adds a field to the Income form and also loads the 
	
 *
 
 */
 
define(['N/runtime'],
function(runtime) {
   
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

        log.debug("Set TSA Created By", "*** BeforeLoad Started *** Type="+scriptContext.type);
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
      	if (scriptContext.type != scriptContext.UserEventType.COPY) return;
      
    	var currentRecord = scriptContext.newRecord;
    	var old_createdby = currentRecord.getValue({fieldId: 'custbody_tsa_vs_created_by'});
		var userObj = runtime.getCurrentUser();
		log.debug("Set TSA Created By", " User ID of old(source) TSA Created By="+old_createdby+"Internal ID of current user="+userObj.id);
		
		currentRecord.setValue({ fieldId: "custbody_tsa_vs_created_by", value: userObj.id });
		//ignoreFieldChange:true, fireSlavingSync:true 

      
/*
      	if (scriptContext.type == scriptContext.UserEventType.VIEW){
          var inject_field = scriptContext.form.addField({
              id: 'custpageinjectcode',
              type: 'INLINEHTML',
              label: 'Inject Code'
          });
		
         //var sentby_cheque = currentRecord.getValue({ fieldId: "subsidiary" }); 
			inject_field.defaultValue = '<script>var sentby_cheque = nlapiGetFieldValue("custbody_tsa_sentbycheque");if(sentby_cheque!="T"){ nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);} </script>';
          	inject_field.defaultValue = "";
          	return;
        }
      
    	if (scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){}
        else {return;}
*/
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
    
      	log.debug("Set TSA Created By", "*** BeforeSubmit Started *** Type="+scriptContext.type);
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
    	if (scriptContext.type != scriptContext.UserEventType.COPY) return;
		
    	var currentRecord = scriptContext.newRecord;
    	var old_createdby = currentRecord.getValue({fieldId: 'custbody_tsa_vs_created_by'});
		var userObj = runtime.getCurrentUser();
		log.debug("Set TSA Created By", " User ID of old(source) TSA Created By="+old_createdby+"Internal ID of current user="+userObj.id);
		
		currentRecord.setValue({ fieldId: "custbody_tsa_vs_created_by", value: userObj.id });
		//ignoreFieldChange:true, fireSlavingSync:true 
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
		
    	var currentRecord = scriptContext.newRecord;
    	//var duedate = currentRecord.getValue({fieldId: 'duedate'});
    }

    return {
        beforeLoad: beforeLoad
        //beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit
    };
    
}); 