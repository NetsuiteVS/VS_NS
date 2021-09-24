/****************************************************************************************
 * 
 * Script Type:	2.0 Client
 *
 * Author:		Viktor Schumann		19/02/2019
 *
 * Notes:		Initiate expense line fields in transactions 
 *
	Issue: 	Using the standard tax engine on the employee expense line when a Non-Recoverable 
			tax code is used, the user needs to select the expense account to re-code the tax 
			element otherwise the expense account defaults to the tax code setup.
		
	Requirement: Default Expense account entry on line entry to the Category expense account 
				 on the selected in the line (This updates the GL impact of the transaction) 
				 when the Non-Recoverable VAT tax code is selected
			 
 ****************************************************************************************/
// expenseaccount
// rec type=expensecategory field=expenseacct


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 
define(['N/https','N/search', 'N/runtime'], function(https, search, runtime) {


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
		console.log("*** line init triggered - sublist="+scriptContext.sublistId);
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
		console.log("*** field change triggered - sublist="+scriptContext.sublistId+" - field="+scriptContext.fieldId+" - line Number="+scriptContext.lineNum);
		

      
		// *** checking user's subsidiary and IHQ subs preferences -- !!!!!!!!!!! You Don't Need this, it's set at Script Deployment !!!!!!!!!!!
		/*
		var userObj = runtime.getCurrentUser();
		var user_sub = userObj.subsidiary;
		console.log("*** current user's roleId=" + userObj.roleId+" | subsidiary="+user_sub);
		var subs_to_check = ","+runtime.getCurrentScript().getParameter({name : 'custscript_tsa_ihq_related_subsidiaries'})+",";
		console.log("*** script parameter (from Company Preferences)=" + subs_to_check+" subs_to_check.indexOf="+subs_to_check.indexOf(","+user_sub+",") );			
		if(subs_to_check.indexOf(","+user_sub+",")==-1) return;  // if current user is not included into the IHQ subsidiaries then return 
		// *** IHQ subs check END 
		*/

		
		// ************ Expense **********
		if(scriptContext.sublistId=="expense" && scriptContext.fieldId=="taxcode"){
			var currentRecord = scriptContext.currentRecord;
			var taxcode = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "taxcode" });
			console.log("taxcode="+taxcode);
			var category = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category" });
			
			//var currentscript = runtime.getCurrentScript();
			//console.log("script obj="+JSON.stringify(currentscript));			
			
			var taxcode_to_check = runtime.getCurrentScript().getParameter({name : 'custscript_ihq_non_recoverable_tax_code'});
			console.log("checked tax_code="+taxcode_to_check);
			//= ctx.getSetting("SCRIPT", "custscript_ihq_non_recoverable_tax_code");
			
			if(taxcode==taxcode_to_check){
              	if(category){
                    console.log("checked tax_code=taxcode");

                    var category_lookup= search.lookupFields({
                        type: "expensecategory",
                        id: category,
                        columns: ['account']
                    });
                    var expense_account=category_lookup.account[0].value;
                    console.log("category_lookup="+JSON.stringify(category_lookup)+" expense_account value="+expense_account+" description="+category_lookup.account[0].text);
                    //var quoteStatusObject = quoteLookup.custrecord_ar_zms_quote_status[0];
                    //var quoteStatus = quoteStatusObject.value;
                    currentRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_nondeductible_account",
                        value: expense_account
                    });
                }

			}
			else{
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: null
				});
			}
		}
		
    }


    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
		console.log("*** page init triggered - mode="+scriptContext.mode);
    }


    return {
    	pageInit: pageInit,
		fieldChanged: fieldChanged,
		lineInit: lineInit
    	//validateLine: validateLine,
    	//saveRecord: saveRecord
		
/*      pageInit: pageInit,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
*/
		
    };
});
