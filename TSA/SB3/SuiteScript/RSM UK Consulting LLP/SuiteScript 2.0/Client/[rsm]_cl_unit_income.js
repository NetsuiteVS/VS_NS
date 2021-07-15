/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_cl_unit_income.js)
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
 * Purpose:			Automates various processes within Intracompany Income.
 * 
 * Notes:			
 * 
 * Dependencies:	Library.FHL.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['../../Library.FHL.2.0', 'N/search', 'N/record', 'N/runtime', 'N/log','N/ui/dialog','../../../vs_lib','N/translation'], function(Library, Search, Record, Runtime, log, dialog, vs_lib,translation)
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
	var EXPENSETYPE		= 'custcol_income_type';
	var LINE			= 'line';
	var MEMO			= 'memo';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var TSAPAYTYPE		= 'custcol_pay_type';
	var TRANSTYPE 		= 'custbody_ic_trans_type';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';

function pageInit(context)
{
		var cash_x = context.currentRecord.getValue({fieldId : "custbodytsa_sentbycash"});
	    var cheque_x = context.currentRecord.getValue({fieldId : "custbody_tsa_sentbycheque"});
		var bank_x = context.currentRecord.getValue({fieldId : "custbody_tsa_sentbybankcr"});
		console.log("income : PageInit **** started **** ");
		
      	if(!bank_x && !cash_x && !cheque_x){
				console.log("income : PageInit - all Bank-Cash-Cheque are empty ");
				window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
				window.nlapiSetFieldDisplay("custbody_bank_acct",false);
				var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
				chequenum_field.isMandatory = false;          									
        }
		if(bank_x){
				console.log("income : PageInit - Bank ");
				window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
				window.nlapiSetFieldDisplay("custbody_bank_acct",true);					
				var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
				chequenum_field.isMandatory = false;          									
        }
		if(cash_x){
				console.log("income : PageInit - Cash ");
				window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
				window.nlapiSetFieldDisplay("custbody_bank_acct",false);					
				var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
				chequenum_field.isMandatory = false;          					
        }
		if(cheque_x){
				console.log("income : PageInit - Cheque ");
				window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",true);
				window.nlapiSetFieldDisplay("custbody_bank_acct",false);
				var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
				chequenum_field.isMandatory = true;          		
        }
  		lineInit(context);
      
}


function lineInit(context){
	var lineCount = context.currentRecord.getLineCount({ sublistId: LINE });
	var currIndex = context.currentRecord.getCurrentSublistIndex({ sublistId: LINE });
	
	if(currIndex == 0){
		window.nlapiSetLineItemDisabled("line","debit",true);
		window.nlapiSetLineItemDisabled("line","credit",true);
		window.nlapiSetLineItemDisabled("line","custcol_income_type",true);
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
      	window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code_display", true);
      
      
        jQuery('#tbl_line_copy').hide();
        jQuery('#tbl_line_insert').hide();
        jQuery('#tbl_line_remove').hide();

	}
	else{
      
        jQuery('#tbl_line_copy').show();
        jQuery('#tbl_line_insert').show();
        jQuery('#tbl_line_remove').show();
      
      	document.getElementById('line_copy').style.display = '';
      	if(currIndex == 1) document.getElementById('line_copy').style.display = 'none';
          //jQuery('#line_copy').remove();//line_copy      
		window.nlapiSetLineItemDisabled("line","debit",true);
		window.nlapiSetLineItemDisabled("line","credit",false);
		window.nlapiSetLineItemDisabled("line","custcol_income_type",false);
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", false);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", false);
        window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code_display", false);

	}
}
	
	
function postSourcing(context)
{
	try
	{
		console.log("income : postSourcing **** Started **** "+context.fieldId);
		switch (context.fieldId){
			case "currency":
				console.log("currency postsourcing - 1.");
				var field_x=context.currentRecord.getValue("custbodytsa_sentbycash");
				if(field_x){			
					console.log("currency postsourcing - 2.");
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : false, ignoreFieldChange : false});
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : true, ignoreFieldChange : false});
				}
				break;
			case "account":
				console.log("account postsourcing - 1.");
				var v_account=context.currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT})
				if(context.line==0 && v_account){
					//currentRecord.commitLine({sublistId : LINE});
					
					window.nlapiCommitLineItem("line");
					//currentRecord.selectNewLine({sublistId : LINE});
				}
				break;				

		}		
	}
	catch(e)
	{
		console.log('postsourcing error='+e);
		vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type);
		Library.errorHandler('postsourcing', e);
	}
}
	
function fieldChanged(context)
{
	try
	{
		console.log("income : FieldChange **** Started **** "+context.fieldId);
		var bankCashAmount = context.currentRecord.getValue({ fieldId: AMOUNT });
		var bankCB = true; //context.currentRecord.getValue({ fieldId: BANK });
		var bankAccount = context.currentRecord.getValue({ fieldId: BANKACCOUNT });
		var lineCount = context.currentRecord.getLineCount({ sublistId: LINE });

		//log.debug({title: 'fieldChanged', details: context});
		switch (context.fieldId){
			case "custbody_tsa_sentbybankcr":
				var field_x=context.currentRecord.getValue("custbody_tsa_sentbybankcr");
				if(field_x){
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : false, ignoreFieldChange : true});
					context.currentRecord.setValue({fieldId : "custbody_tsa_sentbycheque", value : false, ignoreFieldChange : true});
					window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
					window.nlapiSetFieldDisplay("custbody_bank_acct",true);					
					if (lineCount > 0){
						updateTransactionLineIfExits(context.currentRecord);
						break;
					}

					if (bankCashAmount && bankCashAmount > 0 && bankAccount && bankAccount.length > 0){
						setTransactionLines(context.currentRecord);
					}				
					var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
					chequenum_field.isMandatory = false;          		
				}
				break;
			case "custbodytsa_sentbycash":
				var field_x=context.currentRecord.getValue("custbodytsa_sentbycash");
				if(field_x){			
					context.currentRecord.setValue({fieldId : "custbody_tsa_sentbybankcr", value : false, ignoreFieldChange : true});
					context.currentRecord.setValue({fieldId : "custbody_tsa_sentbycheque", value : false, ignoreFieldChange : true});
					window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
					window.nlapiSetFieldDisplay("custbody_bank_acct",false);
					if (lineCount > 0){
						updateTransactionLineIfExits(context.currentRecord);
						break;
					}
					setTransactionLines(context.currentRecord);
					var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
					chequenum_field.isMandatory = false;          		
				}
				break;
			case "custbody_tsa_sentbycheque":
				var field_x=context.currentRecord.getValue("custbody_tsa_sentbycheque");
				if(field_x){						
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : false, ignoreFieldChange : true});
					context.currentRecord.setValue({fieldId : "custbody_tsa_sentbybankcr", value : false, ignoreFieldChange : true});
					window.nlapiSetFieldDisplay("custbody_tsa_nsichequenum",true);
					window.nlapiSetFieldDisplay("custbody_bank_acct",false);
					if (lineCount > 0){
						updateTransactionLineIfExits(context.currentRecord);
						break;
					}
					setTransactionLines(context.currentRecord);
					var chequenum_field = context.currentRecord.getField("custbody_tsa_nsichequenum");
					chequenum_field.isMandatory = true;          		
				}
				break;					
			case AMOUNT:
				if (!bankCashAmount || !bankAccount) {
					updateTransactionLineIfExits(context.currentRecord);
					break;
				}

				setTransactionLines(context.currentRecord);
				break;
			case BANKACCOUNT:
				if (lineCount > 0){
					updateTransactionLineIfExits(context.currentRecord);
					break;
				}

				//if (bankCashAmount && bankCashAmount > 0 && bankAccount && bankAccount.length > 0){
					setTransactionLines(context.currentRecord);
				//}
				break;
			case "currency":
				/* //moved this to post sourcing !!!
				console.log("currency changed - 1.");
				var field_x=context.currentRecord.getValue("custbodytsa_sentbycash");
				if(field_x){			
					console.log("currency changed - 2.");
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : false, ignoreFieldChange : false});
					context.currentRecord.setValue({fieldId : "custbodytsa_sentbycash", value : true, ignoreFieldChange : false});
				}*/
				break;				
			case EXPENSETYPE:
				setCurrentUnitIncomeLine(context);
				break;
			case BANK:
				if (bankCashAmount && bankCashAmount > 0){
					setTransactionLines(context.currentRecord);
				}
				break;
			case PARTY:
				relatedPartyChanged(context.currentRecord);
				break;
		}
	}
	catch(e)
	{
		console.log('fieldChanged error='+e);
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
		
		try
		{
			currentRecord	= context.currentRecord;
			lineCount		= currentRecord.getLineCount({sublistId : LINE});

			//validating Cheque Number and Bank account
			console.log("***** on Save fired ****");
			var okToSave=true;
			var sentby_cheque = currentRecord.getValue("custbody_tsa_sentbycheque"); //({ fieldId: "id" })
			var sentby_cash = currentRecord.getValue("custbodytsa_sentbycash");
			var sentby_bank = currentRecord.getValue("custbody_tsa_sentbybankcr");
		  
			var chequeNr = currentRecord.getValue("custbody_tsa_nsichequenum");
			var chequeNr_Field = currentRecord.getField('custbody_tsa_nsichequenum');
		  
			var bank_acc = nlapiGetFieldValue("custbody_bank_acct");
			
		  
			if ( !sentby_cheque && !sentby_cash && !sentby_bank ){
					var msg_sentby_not_ticked = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_SENTBY_NOT_TICKED', locale: translation.Locale.CURRENT })();
					alert(msg_sentby_not_ticked);
			  return false;
			}
		  
			if(sentby_cheque){
				console.log("sentby is cheque");
				okToSave= !!chequeNr;
				if(!okToSave){
						var msg_pls_enter_value = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_PLS_ENTER_VALUE', locale: translation.Locale.CURRENT })();
						alert(msg_pls_enter_value+" "+chequeNr_Field.label);
				}  
			}
			else{
				currentRecord.setValue({ fieldId: 'custbody_tsa_nsichequenum', value : '', ignoreFieldChange : true });
			  //nlapiSetFieldValue("custbody_tsa_nsichequenum","",false,false);
			}

			if(sentby_bank){
				console.log("sentby is bank");
				okToSave= !!bank_acc;
				if(!okToSave){
					var msg_pls_enter_value = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_PLS_SELECT_BANK', locale: translation.Locale.CURRENT })();
					alert(msg_pls_enter_value);
				}
			}
			else{ }
 

//*******			
			
			for (var i = 0; i < lineCount; i++)
			{
				accountID	= currentRecord.getSublistValue({sublistId : LINE, fieldId : ACCOUNT, line : i});
				account		= Record.load({type : 'ACCOUNT', id : accountID});
				isInactive	= account.getValue({fieldId : 'isinactive'});
				
				if (isInactive == true)
				{
					saveRecord	= false;
				}
			}
			
			if (saveRecord == false)
            {
                var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'NO_ACTIVE_GL_ACCOUNT', locale: translation.Locale.CURRENT })();
                alert(alertMessage);
			}
		}
		catch(e)
		{
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type);
			Library.errorHandler('saveRecord', e);
		}
		
		if(!saveRecord) okToSave=false;
		return okToSave;
	}
	
	
	/**
	 * Calls the reset function if the Purchase check box is unchecked.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function relatedPartyChanged(currentRecord)
	{
		try
		{
			if (currentRecord.getValue({fieldId : PURCHASE}) == false)
			{
				resetTransactionLines(currentRecord);
			}
		}
		catch(e)
		{
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
	function resetTransactionLines(currentRecord, type)
    {
        log.debug({ title: 'resetTransactionLines', details: "triggered" });
        var lineCount = 0;
		
		try
		{
			lineCount	= currentRecord.getLineCount({sublistId : LINE});
			
			if (lineCount > 0)
			{
				for (var i = lineCount - 1; i >= 0; i--)
				{
					currentRecord.removeLine({sublistId : LINE, line : i, ignoreRecalc : true});
				}
			}
			
			if (type != 'amount')
			{
				currentRecord.setValue({fieldId : AMOUNT, value : '', ignoreFieldChange : true});
			}
		}
		catch(e)
		{
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
	function setCurrentUnitIncomeLine(context)
	{
		var chartOfAccounts	= null;
		var currentRecord	= context.currentRecord;
		
		try
		{
			if (context.sublistId == LINE && context.line > 0)
			{	
				chartOfAccounts	= Record.load({type : ACTIVITYTYPE, id : currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : EXPENSETYPE})}).getValue({fieldId : 'custrecord_uat_glaccount'});
				
				if (currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : MEMO}) == '')
				{
					currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO})});
				}
				
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : chartOfAccounts});
			}
		}
		catch(e)
		{
			Library.errorHandler('setCurrentUnitIncomeLine', e);
		}
	}

	/**
	 * Sets the first line for if the Purchase pay type is selected.
	 * 
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setUnitIncomeLines(currentRecord)
    {
        console.log('setUnitIncomeLines - triggered');
        var accountID = 0;
		var accountResult	= null;
		var accountSearch	= null;

		try{
			var bankCheckbox = currentRecord.getValue({ fieldId: "custbody_tsa_sentbybankcr" });
			//window.nlapiCancelLineItem(LINE);
			
			currentRecord.selectNewLine({sublistId : LINE});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type=1
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT})});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO})});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});

			if(bankCheckbox){
				console.log('setUnitIncomeLines - bank');
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 2}); // Bank pay type
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT}) });
			}
			else{
				console.log('setUnitIncomeLines - undeposited');
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;

				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID}); // Undeposited Funds account
			}

			//currentRecord.commitLine({sublistId : LINE}); // moved this to post Sourcing because NS somhow swallowed it and did not commited the line.
			//window.nlapiCommitLineItem("line");
			//currentRecord.selectNewLine({sublistId : LINE});

		}
		catch(e)
		{
			console.log('setUnitIncomeLines - error='+e);
			Library.errorHandler('setUnitIncomeLines', e);
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
	function setTransactionLines(currentRecord)
	{
		try
        {
            if (updateTransactionLineIfExits(currentRecord)) {
                console.log('setTransactionLines - 1');
                return true;
            }

            console.log('setTransactionLines - 2');

			//resetTransactionLines(currentRecord, 'amount');
			
			setUnitIncomeLines(currentRecord);
		}
		catch(e)
		{
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

        var accountID = 0;
        var accountResult = null;
        var accountSearch = null;

        try {

            var lineCount = currentRecord.getLineCount({ sublistId: LINE });

            if (lineCount == 0) {
                log.debug({ title: 'updateTransactionLineIfExits', details: "No line exists - 0" });
                return false;
            }

            currentRecord.selectLine({ sublistId: LINE, line: 0 });

            currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: DEBIT, value: currentRecord.getValue({ fieldId: AMOUNT }) });

			var bankAccount = currentRecord.getValue({ fieldId: BANKACCOUNT });
			var bankCheckbox = currentRecord.getValue({ fieldId: "custbody_tsa_sentbybankcr" });

			if(bankCheckbox && bankAccount){
				currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: ACCOUNT, value: bankAccount });
			}
            else{
                accountSearch = Search.create({
                    type: Search.Type.ACCOUNT,
                    filters: [{ name: 'number', operator: 'is', values: '149401' }]
                });

                accountResult = accountSearch.run().getRange({ start: 0, end: 1000 });
                accountID = accountResult[0].id;

                currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: ACCOUNT, value: accountID }); // Undeposited Funds account
            }
		
            currentRecord.commitLine({ sublistId: LINE });

            log.debug({ title: 'updateTransactionLineIfExits', details: "2" });
            return true;
        }
        catch (e) {
            Library.errorHandler('setTransactionLines', e);
        }
    }
	
	
	return {
		fieldChanged : fieldChanged,
		saveRecord	 : saveRecord,
      	pageInit	 : pageInit,
		lineInit	 : lineInit,
		postSourcing : postSourcing
	}
});