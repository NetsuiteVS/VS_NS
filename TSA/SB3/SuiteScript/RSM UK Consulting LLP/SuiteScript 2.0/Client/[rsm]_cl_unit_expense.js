/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_cl_unit_expense.js)
 * 
 * Script Type:		Client
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 21/05/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Automates various processes within Intracompany Expense.
 * 
 * Notes:			Modified by Viktor Schumann 06/04/2020 

				custcol_tsa_account_type, 

 * 
 * Dependencies:	Library.FHL.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['../../Library.FHL.2.0', 'N/search', 'N/record', 'N/runtime', 'N/log', 'N/ui/dialog', '../../../vs_lib', 'N/translation'], function (Library, Search, Record, Runtime, log, dialog, vs_lib, translation)
{
	'use strict';
	
	var ACCOUNT			= 'account';
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var AMOUNT			= 'custbody_bank_amt';
	var BANK			= 'custbody_bank_chkbx';
	var BANKACCOUNT		= 'custbody_bank_acct';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var DEPARTMENT		= 'department';
	var EXPENSETYPE		= 'custcol_expense_type';
	var LINE			= 'line';
	var MEMO			= 'memo';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var TSAPAYTYPE		= 'custcol_pay_type';
	var TRANSTYPE 		= 'custbody_ic_trans_type';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	

function pageInit(context){
  lineInit(context);
}


function lineInit(context){
	var lineCount = context.currentRecord.getLineCount({ sublistId: LINE });
	var currIndex = context.currentRecord.getCurrentSublistIndex({ sublistId: LINE });
	
	if(currIndex == 0){
		window.nlapiSetLineItemDisabled("line","debit",true);
		window.nlapiSetLineItemDisabled("line","credit",true);
		window.nlapiSetLineItemDisabled("line","custcol_expense_type",true);
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
        window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code", true);
      	window.nlapiSetLineItemDisabled("line","account", true);

      	//document.getElementById('line_copy').style.display = '';
      	//document.getElementById('line_insert').style.display = 'none';
      	//document.getElementById('line_remove').style.display = 'none';

		//jQuery('#tbl_line_addedit').show();
        jQuery('#tbl_line_copy').hide();
        jQuery('#tbl_line_insert').hide();
        jQuery('#tbl_line_remove').hide();
      
		//window.nlapiSetLineItemDisabled("line","custcol_pay_type",true);
	}
	else{
		//jQuery('#tbl_line_addedit').show();
        jQuery('#tbl_line_copy').show();
        jQuery('#tbl_line_insert').show();
        jQuery('#tbl_line_remove').show();
      
      	//document.getElementById('line_copy').style.display = '';
      	//document.getElementById('line_insert').style.display = '';
      	//document.getElementById('line_remove').style.display = '';
      
      	if(currIndex == 1) jQuery('#tbl_line_copy').hide();
          //jQuery('#line_copy').remove();//line_copy
		window.nlapiSetLineItemDisabled("line","debit",false);
		window.nlapiSetLineItemDisabled("line","credit",true);
		window.nlapiSetLineItemDisabled("line","custcol_expense_type",false);
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", false);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", false);      
        window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code", false);
//      	window.nlapiSetLineItemDisabled("line","account", true);
      
		//window.nlapiSetLineItemDisabled("line","custcol_pay_type",false);
	}
}

//***************************************** FIELD CHANGED ************************************
	function fieldChanged(context){
		try{
            var bankCashAmount = context.currentRecord.getValue({ fieldId: AMOUNT });
            var bankCB = true //context.currentRecord.getValue({ fieldId: BANK });
            var bankAccount = context.currentRecord.getValue({ fieldId: BANKACCOUNT });
            var lineCount = context.currentRecord.getLineCount({ sublistId: LINE });

			//log.debug({title: 'fieldChanged', details: context});
			switch (context.fieldId){
                case AMOUNT:
                    if (!bankCashAmount || !bankAccount) { //Do not create new record, only update if exits
                        updateTransactionLineIfExits(context.currentRecord);
                        break;
                    }  

                    setTransactionLines(context.currentRecord);
                    break;
                case BANKACCOUNT:
                    if (lineCount > 0) {
                        updateTransactionLineIfExits(context.currentRecord);
                        break;
                    }
                    
					//if (bankCashAmount && bankCashAmount > 0 && bankCB && bankAccount && bankAccount.length > 0) {
                    if (bankCashAmount && bankCashAmount > 0 && bankAccount && bankAccount.length > 0) {
                        setTransactionLines(context.currentRecord);
                    }
                    break;
				case EXPENSETYPE:
					setCurrentExpenseLine(context);
					break;
			    //case BANK:
                //             if (!bankCB && bankCashAmount && bankCashAmount > 0) {
                //                 setTransactionLines(context.currentRecord);
                //                 break;
                //             }

                //             resetTransactionLines(context.currentRecord);
                //             break;
				case PARTY:
					relatedPartyChanged(context.currentRecord);
					break;
			}
		}
		catch(e){
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type);
			Library.errorHandler('fieldChanged', e);
		}
	}
	
	/**
	 * Checks for any inactive accounts used before saving the record.
	 * 
	 * @since 1.0.0
	 * @param {Object} context
	 * @returns {Boolean} saveRecord
	 */
	function saveRecord(context)
	{
		var account			= null;
		var accountID		= 0;
		var currentRecord	= null;
		var isInactive		= '';
		var lineCount		= 0;
		var saveRecord		= true;
		
		try{
			currentRecord	= context.currentRecord;
			lineCount		= currentRecord.getLineCount({sublistId : LINE});
			
			for (var i = 0; i < lineCount; i++){
				accountID	= currentRecord.getSublistValue({sublistId : LINE, fieldId : ACCOUNT, line : i});
				account		= Record.load({type : 'ACCOUNT', id : accountID});
				isInactive	= account.getValue({fieldId : 'isinactive'});
				
				if (isInactive == true){ saveRecord = false; }
			}
			
            if (saveRecord == false) {
                var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'NO_ACTIVE_GL_ACCOUNT', locale: translation.Locale.CURRENT })();
                alert(alertMessage);
			}
		}
		catch(e)
		{
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type);
			Library.errorHandler('saveRecord', e);
		}
		
		return saveRecord;
	}

	/**
	 * Calls the reset function if the Purchase check box is unchecked.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function relatedPartyChanged(currentRecord){
		try{
			if (currentRecord.getValue({fieldId : PURCHASE}) == false){
				resetTransactionLines(currentRecord);
			}
		}
		catch(e){
			Library.errorHandler('relatedPartyChanged', e);
		}
	}
	
	/**
	 * Removes all lines when the transaction type is changed.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function resetTransactionLines(currentRecord, type){
		var lineCount = 0;
		try{
			lineCount = currentRecord.getLineCount({sublistId : LINE});
			if (lineCount > 0){
				for (var i = lineCount - 1; i >= 0; i--){
					currentRecord.removeLine({sublistId : LINE, line : i, ignoreRecalc : true});
				}
			}
			if (type != 'amount'){
				currentRecord.setValue({fieldId : AMOUNT, value : '', ignoreFieldChange : true});
			}
		}
		catch(e){
			Library.errorHandler('resetTransactionLines', e);
		}
	}

	function setFirstTransactionLine(currentRecord, type){
		var lineCount	= 0;
		
		try{
			lineCount = currentRecord.getLineCount({sublistId : LINE});
			if (lineCount > 0){
				currentRecord.selectLine({sublistId : LINE, line : i });
				currentRecord.setValue({fieldId : AMOUNT, value : 0, ignoreFieldChange : true});
			}
		}
		catch(e){
			Library.errorHandler('resetTransactionLines', e);
		}
	}

	
	/**
	 * Sets the current purchase line (except for the first line)
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setCurrentExpenseLine(context){
		var chartOfAccounts	= null;
		var currentRecord	= context.currentRecord;
		
		try{
			if (context.sublistId == LINE && context.line > 0){	
				chartOfAccounts	= Record.load({type : ACTIVITYTYPE, id : currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : EXPENSETYPE})}).getValue({fieldId : 'custrecord_uat_glaccount'});
				
				if (currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : MEMO}) == ''){
					currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO})});
				}				
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : chartOfAccounts});
			}
		}
		catch(e){
			Library.errorHandler('setCurrentExpenseLine', e);
		}
	}
	

	/**
	 * Sets the first line for if the Purchase pay type is selected.
	 * 
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setUnitExpenseLines(currentRecord){
		var accountID		= 0;
		var accountResult	= null;
		var accountSearch	= null;

		try{
			currentRecord.selectNewLine({sublistId : LINE});
			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : ""}); // Cash pay type = 1 
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : CREDIT, value : currentRecord.getValue({fieldId : AMOUNT})});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO})});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT})});
			
			/*
			{
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;

				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID}); // Undeposited Funds account
			}
			*/

			currentRecord.commitLine({sublistId : LINE});
			currentRecord.selectNewLine({sublistId : LINE});

		}
		catch(e){
			Library.errorHandler('setUnitExpenseLines', e);
		}
	}

	/**
	 * Calls functions that sets the first two transaction lines based
	 * on which transaction type is selected.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setTransactionLines(currentRecord){
		try{
            if (updateTransactionLineIfExits(currentRecord)) {
                return true;
            }            
			//resetTransactionLines(currentRecord, 'amount');
			setUnitExpenseLines(currentRecord);
		}
		catch(e){
			Library.errorHandler('setTransactionLines', e);
		}
    }

    /**
    * When first transaction line is exits, do not delete and recreate it, only update amount and bank account fields.
    * 
    * @since 1.0.0
    * @param {Object} currentRecord
    * @returns {Void}
    */
    function updateTransactionLineIfExits(currentRecord) {
        try {
            var lineCount = currentRecord.getLineCount({ sublistId: LINE });
            
            if (lineCount == 0) {
                return false;
            }           

            currentRecord.selectLine({ sublistId: LINE, line: 0 });

            //currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: CREDIT, value: currentRecord.getValue({ fieldId: AMOUNT }) });


			var bankAccount = currentRecord.getValue({ fieldId: BANKACCOUNT });
			var amount = currentRecord.getValue({ fieldId: AMOUNT });
			if (!bankAccount || bankAccount.length == 0) { return true; }
			currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: ACCOUNT, value: bankAccount });
			currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: CREDIT, value: amount });

			/*
            else {
                accountSearch = Search.create({
                    type: Search.Type.ACCOUNT,
                    filters: [{ name: 'number', operator: 'is', values: '149401' }]
                });

                accountResult = accountSearch.run().getRange({ start: 0, end: 1000 });
                accountID = accountResult[0].id;

                currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: ACCOUNT, value: accountID }); // Undeposited Funds account
            }
			*/

            currentRecord.commitLine({ sublistId: LINE });
            
            return true;
        }
        catch (e) {
            Library.errorHandler('setTransactionLines', e);
        }
    }
	
	
	return {
		fieldChanged : fieldChanged,
		saveRecord	 : saveRecord,
		pageInit 	 : pageInit,      
		lineInit	 : lineInit
	}
});