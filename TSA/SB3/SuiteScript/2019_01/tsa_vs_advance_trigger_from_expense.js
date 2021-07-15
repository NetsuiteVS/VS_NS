/**
 * 
 * Version    Date            	Author          	
 * 1.00       28 March 2019     Viktor Schumann       
 *
 * This script is for triggering the Advance Approval Workflow
 * 
 */

/**
 * @returns {Void} Any or no return value
 */
function trigger_advance_wf() {

	try {
		
		//get data on the record being processed (depends on the deployment)
		var rec = nlapiGetNewRecord();
		rec_id = rec.getId();	
		rec_type = rec.getRecordType();  
		var expense_status = rec.getFieldValue("custbody_tsa_cust_aprov_stat");
      	var xedit_or_edit =  rec.getFieldValue("custscript_tsa_vs_xedit_or_edit");

		var ctx = nlapiGetContext();
		var selectedIOU = ctx.getSetting("SCRIPT", "custscript_tsa_vs_advance_id");
      
     	var current_flag;
     	current_flag = nlapiLookupField('customtransaction_tsa_iou2', selectedIOU, 'custbody_tsa_vs_expense_approved_flag');
      	var new_flag="T";
      	if (current_flag=="T" || current_flag=="T_edit") new_flag="YES"; // this is needed because otherwise testing with the same record - maybe - doesn't trigger the Workflows
      
		nlapiLogExecution("DEBUG", " Advance ID="+selectedIOU+" Expense ID="+rec_id+"Expense Status="+expense_status);
		
      	if(xedit_or_edit=="EDIT"){
      		var rec1= nlapiLoadRecord("customtransaction_tsa_iou2", selectedIOU);
          	rec1.setFieldValue("custbody_tsa_vs_expense_approved_flag", new_flag+"_edit");
      		nlapiSubmitRecord(rec1, true, true);
        }
      	else{
        	nlapiSubmitField("customtransaction_tsa_iou2", selectedIOU,	"custbody_tsa_vs_expense_approved_flag", new_flag);  
        }
		
      	nlapiLogExecution("DEBUG", " Advance record Expense approved flag updated "); 
		
	} catch (mainException) {
		nlapiLogExecution("DEBUG", "Error Updating the flag in Advance record.", mainException);
	}
}


/****** Backup 12/04/2019 - before removing the record loading part and the "Always update" parameter
		//get data on the record being processed (depends on the deployment)
		var rec = nlapiGetNewRecord();
		rec_id = rec.getId();	
		rec_type = rec.getRecordType();  
		var expense_status = rec.getFieldValue("custbody_tsa_cust_aprov_stat");

		var ctx = nlapiGetContext();
		var selectedIOU = ctx.getSetting("SCRIPT", "custscript_tsa_vs_advance_id");
      	var always_update_prm = ctx.getSetting("SCRIPT", "custscript_tsa_always_update");

        var adv_rec;
		var advance_balance;
     	var current_flag;
      
      	if(!always_update_prm){
          adv_rec = nlapiLoadRecord("customtransaction_tsa_iou2", selectedIOU);
          advance_balance = adv_rec.getFieldValue("custbody35");
          current_flag = adv_rec.getFieldValue("custbody_tsa_vs_expense_approved_flag");
        }
      	else{
          current_flag = nlapiLookupField('customtransaction_tsa_iou2', selectedIOU, 'custbody_tsa_vs_expense_approved_flag');
        }
             
      	var new_flag="T";
      	if (current_flag=="T") new_flag="YES"; // this is needed because otherwise testing with the same record - maybe - doesn't trigger the Workflows
      
		nlapiLogExecution("DEBUG", " Advance ID="+selectedIOU+" Expense ID="+rec_id+"Expense Status="+expense_status+" | advance balance="+advance_balance);
		if( (expense_status == "3" && advance_balance <= 0.00) || always_update_prm ) { 
			//nlapiSubmitField("customtransaction_tsa_iou2", selectedIOU,	"transtatus", "J"); // Sets the Advance Status Directly
			
            //adv_rec.setFieldValue("custbody_tsa_vs_expense_approved_flag",new_flag);
            //nlapiSubmitRecord(adv_rec , true, true);
			nlapiSubmitField("customtransaction_tsa_iou2", selectedIOU,	"custbody_tsa_vs_expense_approved_flag", new_flag);
			nlapiLogExecution("DEBUG", " Advance record Expense approved flag updated "); 
		}
*/
