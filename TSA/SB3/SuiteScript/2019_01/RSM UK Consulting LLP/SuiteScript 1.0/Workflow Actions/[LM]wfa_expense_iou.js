/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Feb 2018     Leon Munir       RSM UK CONSULTING LLP
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function iouAction() {

	try {
		
		//get data on the record being processed (depends on the deployment)
		var rec = nlapiGetNewRecord();
		rec_id = rec.getId();	
		rec_type = rec.getRecordType();  
		var expense_status = rec.getFieldValue("custbody_tsa_cust_aprov_stat");

		var ctx = nlapiGetContext();
		var selectedIOU = ctx.getSetting("SCRIPT", "custscript_lm_iou_selected_2");
		var results = nlapiSearchRecord("customtransaction_tsa_iou2", null,
				[ new nlobjSearchFilter('custbody32', null, "anyof",
						nlapiGetRecordId(), null) ], null);
		for ( var x in results) {
			if (results[x].id != selectedIOU) {
				try {
					nlapiSubmitField("customtransaction_tsa_iou2",
							results[x].id, "custbody32", "");
				} catch (exception) {
					nlapiLogExecution("DEBUG", "Error removing expense report link from IOU", exception);
				}
			}
		}
		nlapiSubmitField("customtransaction_tsa_iou2", selectedIOU,	"custbody32", nlapiGetRecordId());
      
		nlapiLogExecution("DEBUG", " Advance ID="+selectedIOU+" Expense ID="+rec_id+"Expense Status="+expense_status); 
		
	} catch (mainException) {
		nlapiLogExecution("DEBUG", "Error adding Expense Report link to IOU", mainException);
	}
}

