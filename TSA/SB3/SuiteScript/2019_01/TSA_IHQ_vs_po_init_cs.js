/****************************************************************************************
 * 
 * Script Type:	2.0 Client
 *
 * Author:		Viktor Schumann		19/02/2019
 *
 * Notes:		PO, Initiate item/expense line fields in transactions
 *

Issue:		Item lines: Using the standard tax engine on the purchase order or invoice line item when 
			a Non-Recoverable tax code is used, the user needs to select the expense account 
			to re-code the tax element otherwise the expense account defaults to the tax code 
			setup.
			
			Expense Lines: Using the standard tax engine on the purchase order or invoice expense line when 
			a Non-Recoverable tax code is used, the user needs to select the expense account 
			to re-code the tax element otherwise the expense account defaults to the tax code 
			setup.

Requirement: Item Lines: Default Expense account entry on line item entry to the expense account on the 
			 item record selected in the line (This updates the GL impact of the transaction) 
			 when the Non-Recoverable tax code is defaulted or selected on the line.
			
			 Expense Lines: Default Expense account entry on line entry to the account on the selected in 
			 the expense line (This updates the GL impact of the transaction) when the 
			 Non-Recoverable VAT tax code is selected.
 
 ****************************************************************************************/
// expenseaccount


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

		var currentRecord = scriptContext.currentRecord;
		// console.log(JSON.stringify(currentRecord)); // currentrecord object example: {"id":42138,"type":"purchaseorder","isDynamic":true}
		
		// ************ Item Line **********
		if(scriptContext.sublistId=="item" && scriptContext.fieldId=="taxcode"){	
			var taxcode = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "taxcode" });
			console.log("taxcode="+taxcode);
			var item = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "item" });
			if(!item || item=="") return;
			
			var itemtype = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "itemtype" }); 			
			//var currentscript = runtime.getCurrentScript();
			//console.log("script obj="+JSON.stringify(currentscript));			
			
			var taxcode_to_check = runtime.getCurrentScript().getParameter({name : 'custscript_ihq_non_recoverable_tax_code'});
			console.log("checked tax_code="+taxcode_to_check);
			//= ctx.getSetting("SCRIPT", "custscript_ihq_non_recoverable_tax_code");
			if(taxcode==taxcode_to_check){
				console.log("checked tax_code=taxcode");
				var item_lookup= search.lookupFields({
					type: "item",
					id: item,
					columns: ['expenseaccount']
				});
				var expense_account=item_lookup.expenseaccount[0].value;
				console.log("item_lookup="+JSON.stringify(item_lookup)+" expense_account value="+expense_account+" description="+item_lookup.expenseaccount[0].text);
				//var quoteStatusObject = quoteLookup.custrecord_ar_zms_quote_status[0];
				//var quoteStatus = quoteStatusObject.value;
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: expense_account
				});
			}
			else{
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: null
				});
			}
		}
		
		// *************** Expense Line **************
		if(scriptContext.sublistId=="expense" && scriptContext.fieldId=="taxcode"){
			var taxcode = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "taxcode" });
			console.log("1. expense - taxcode="+taxcode);

			var category = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category" });
            var account = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
			if(!account || account=="") return;
          
			var taxcode_to_check = runtime.getCurrentScript().getParameter({name : 'custscript_ihq_non_recoverable_tax_code'});
			console.log("2. expense - checked tax_code="+taxcode_to_check);
			
			if(taxcode==taxcode_to_check){
				console.log("3. expense - checked tax_code=taxcode");
				//var account = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
				
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: account //expense_account
				});

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
