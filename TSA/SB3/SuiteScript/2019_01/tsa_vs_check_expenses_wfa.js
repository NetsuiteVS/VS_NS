/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
 
 /* ********************************************
 *
 * date:07/03/2019		author: Viktor Schumann
 *
 * The Script checks if there were any unapproved Expenses related to an Advance
 *
 *********************************************** */
 
 // custbody22 = advance id (thx to RSM)
 // custbody_tsa_cust_aprov_stat (1 - Pending Submission,2 - Pending Approval) -> approvalstatus=1 in both cases
 
 
define(['N/error', 'N/record', 'N/search'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */
function(error, record, search) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @Since 2016.1
     */
		
  
    function onAction(scriptContext) {
            
        var newRecord = scriptContext.newRecord;
        var oldRecord = scriptContext.oldRecord;
      	var type = newRecord.type;
      	var relatedType = '';
      	var relatedRecord_new = '';
	    var relatedRecord_old = '';
	    var triggerFields = [];
	    var fieldMap = [];
		
		var advance_id=newRecord.getValue('custbody22');
		
		log.debug('Record Type',newRecord + ', ' + type+' advance_id='+advance_id);
		
		var filter=[
		  ["custbody22","anyof",advance_id], 
		  "AND", 
		  ["approvalstatus","anyof","1"] 
	   ];

		var c_search = search.create({
		  type: 'expensereport',
		  columns: ['internalid'],
		  filters: filter
		});
				
		var expense_found=0;
		c_search.run().each(function(result) {
			expense_found = result.getValue({ 	name: 'internalid' });
			log.debug('Expense Found='+expense_found);
		});
				
		return expense_found;
    }

    return {
        onAction : onAction
    };
    
});



