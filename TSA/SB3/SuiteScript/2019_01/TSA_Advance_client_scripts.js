/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	19/12/2018 - Viktor Schumann
	
	1. Client Scripts to call the Expense form with an Advance record id parameter
 
 */
/*
require(['N/currentRecord'], function (currentRecord){
var record = currentRecord.get();
var count = record.getLineCount({ sublistId: 'item' });
console.log(count)
}
*/
 
define(['N/url', 'N/record', 'N/log', 'N/runtime','N/currentRecord', 'N/search'],
  function(url, record, log, runtime, currentRecord, search) {
	  
    function pageInit(scriptContext) {
		console.log("pageinit fired");
		var userObj = runtime.getCurrentUser();
      	//var role = search.lookupFields({type: "role", id: userObj.role , columns: "custrecord_tsa_role_category"}); 
      	//**** lookup would need new permission for every role ***** currently we use the scriptId of the role. It should contain the word "cashier" !!!
      	var role={};
      	role.custrecord_tsa_role_category=-1;
      	if(String(userObj.roleId).indexOf("cashier")>-1){ role.custrecord_tsa_role_category=5; } //cashier=5
		console.log("Internal ID of current user role: " + userObj.roleId+" - "+ userObj.role+", role.custrecord_tsa_role_category="+role.custrecord_tsa_role_category); //indexOf(searchTerm);
		if(role.custrecord_tsa_role_category!=5){ window.nlapiDisableLineItemField("line","account",true); }
		//line_buttons
		var rec=scriptContext.currentRecord;
		var line_num = rec.selectLine({ sublistId: 'line', line: 0 });

		//jQuery('#line_buttons').hide();
		//jQuery('#line_remove').hide();
		//jQuery('#line_insert').hide();		
		//jQuery('.machineButtonRow').hide();
		//jQuery('.uir-machine-row-even').hide();
		
		jQuery('.uir-copy').hide();
		jQuery('#tbl_line_insert').hide();
		jQuery('#tbl_line_remove').hide();
      	jQuery('#tbl_line_clear').hide();
		//jQuery('.uir-addedit').hide();

    }


     /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
		
		console.log("*** line init triggered - sublist="+scriptContext.sublistId+" | linenum="+scriptContext.linenum);
		var rec=scriptContext.currentRecord;
		var line_nr = rec.getCurrentSublistIndex({ sublistId: "line" });
		console.log(" line_nr="+line_nr);
      
		var userObj = runtime.getCurrentUser();
      	//var role = search.lookupFields({type: "role", id: userObj.role , columns: "custrecord_tsa_role_category"}); 
      	//**** lookup would need new permission for every role ***** currently we use the scriptId of the role. It should contain the word "cashier" !!!
      	var role={};
      	role.custrecord_tsa_role_category=-1;
      	if(String(userObj.roleId).indexOf("cashier")>-1){ role.custrecord_tsa_role_category=5; } //cashier=5
		console.log("Internal ID of current user role: " + userObj.roleId+" - "+ userObj.role+", role.custrecord_tsa_role_category="+role.custrecord_tsa_role_category); //indexOf(searchTerm);
      
		if(line_nr>0){
			window.nlapiDisableLineItemField("line","amount",true);
			window.nlapiDisableLineItemField("line","account",true);
			jQuery('.uir-addedit').hide();
          	jQuery('#tbl_line_clear').show();

//			rec.cancelLine({ sublistId: 'line' });
//			$("div").clearQueue();
		}
		else{
          try{
			console.log("scriptContext.type="+scriptContext.type);
			var advance_status=rec.getValue("custbody_tsa_vs_status_value");
			var userObj = runtime.getCurrentUser();			
			var created_by=rec.getValue("custbody_tsa_vs_created_by");
          
			window.nlapiDisableLineItemField("line","amount",true); 
			window.nlapiDisableLineItemField("line","account",true);

            //Pending Submission=D | Advance Rejected=G | HOD Rejected=P | HOD Reviewed=S
			if( (userObj.id==created_by && (advance_status=="D" || advance_status=="G" || advance_status=="P" || advance_status=="S") ) || ( role.custrecord_tsa_role_category==5 && (advance_status=="D" || advance_status=="G" || advance_status=="P" || advance_status=="S") ) || !nlapiGetFieldValue("id") ){ //  Workflow locks the records when needed
				window.nlapiDisableLineItemField("line","amount",false); 
				if( role.custrecord_tsa_role_category==5) window.nlapiDisableLineItemField("line","account",false);
			}
			else{
				if( role.custrecord_tsa_role_category==5) window.nlapiDisableLineItemField("line","account",false);
			}
			
			jQuery('.uir-addedit').show();
            jQuery('#tbl_line_clear').hide();
			//jQuery('.uir-machine-row-even').hide();
          }
		   catch(e){
             log.debug("",JSON.stringify(e))
          }
		}

		jQuery('.uir-copy').hide();
		jQuery('#tbl_line_insert').hide();
		jQuery('#tbl_line_remove').hide();
		
		
		//alert('debug01');
		//jQuery('.machineButtonRow').hide();
		//jQuery('.uir-machine-row-even').hide();
		//jQuery('.uir-machine-row-even').hide();

		//jQuery('#line_buttons').hide();
		//jQuery('#line_remove').hide();
		//jQuery('#line_insert').hide();
    }
  
    function call_expense_form(context) {
		var scheme = 'https://';
		var host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
		var url_x = url.resolveRecord({ recordType: 'expensereport', recordId: null, isEditMode: true });
		
		//console.log(context);
		//console.log(currentRecord);
		var rec=currentRecord.get();
		
		var id=rec.getValue("id");
		
		console.log("full url="+scheme+host+url_x+" expense form called...almost... id="+id);
		window.open(url_x+"&adv="+id);
    }

   /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
		console.log("*** Field Change triggered - sublist="+scriptContext.sublistId+" | linenum="+scriptContext.lineNum);
		var rec=scriptContext.currentRecord;
		var line_nr = rec.getCurrentSublistIndex({ sublistId: "line" });
		console.log(" Field Changed: line_nr="+line_nr);
		if(line_nr>0){
			rec.cancelLine({ sublistId: 'line' });
			//rec.removeLine({ sublistId: 'line', line: 1, ignoreRecalc: true });
			// $("div").clearQueue();
		}
    }

    function validateField(scriptContext) {
		
		console.log("*** Validate Field triggered - sublist="+scriptContext.sublistId+" | linenum="+scriptContext.line);
      	if(scriptContext.line>=0){
			var rec=scriptContext.currentRecord;
			var line_nr = rec.getCurrentSublistIndex({ sublistId: "line" });
			console.log(" Validate Field: line_nr="+line_nr);
			var account = rec.getCurrentSublistText({ sublistId:scriptContext.sublistId, fieldId:"account", line:line_nr });
			console.log(" Validate Field: account="+account);
			if(account){
				if ( account.substring(0,3)=="161" || account.substring(0,3)=="163" || account.substring(0,3)=="165"){
					console.log("account ok");
					return true;
				}
				else{
					console.log("account prohibited");
					return false;
				}
			}
        }
		return true;
    }

	
    return {
		pageInit: pageInit,
		lineInit: lineInit,
		fieldChanged: fieldChanged,
		validateField: validateField,
		call_expense_form: call_expense_form

    	//validateLine: validateLine,
    	//saveRecord: saveRecord
		
/*      pageInit: pageInit,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
*/
	  
    };
});