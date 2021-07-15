/*
 * SuiteScript 1.00       
 * 
 * 20/05/2019	Viktor S.
 * 
 * Clear Advance in Expense record
 *
 */

/**
 * @returns {Void} Any or no return value
 */
 
function clear_expense(){
	try {
		//get data on the record being processed (depends on the deployment)
		var rec = nlapiGetNewRecord();
		rec_id = rec.getId();	
		rec_type = rec.getRecordType();  
		var expense_status = rec.getFieldValue("custbody_tsa_cust_aprov_stat");

		var ctx = nlapiGetContext();
		var expense_id = rec.getFieldValue("custbody32"); //ctx.getSetting("SCRIPT", "custscript_exp_selected");
		try{
			nlapiSubmitField("expensereport", parseInt(expense_id), ["custbody25","custbody22","custbody33","custbody_tsa_ioutotal","custbody_tsa_iou_currency","custbody_tsa_vs_iou_total_orig_curr"], ["","","","","",""]); //56503
		} 
		catch (exception) {
			nlapiLogExecution("DEBUG", "", "Error removing expense report link from IOU", JSON.stringify(exception) );
		}
		
		//nlapiSubmitField("customtransaction_tsa_iou2", selectedIOU,	"custbody32", nlapiGetRecordId());
      
		nlapiLogExecution("DEBUG", "", " expense ID="+expense_id); 
		
	} catch (mainException) {
		nlapiLogExecution("DEBUG", "", "Error adding Expense Report link to IOU", JSON.stringify(mainException) );
	}
	
	return true;
}


