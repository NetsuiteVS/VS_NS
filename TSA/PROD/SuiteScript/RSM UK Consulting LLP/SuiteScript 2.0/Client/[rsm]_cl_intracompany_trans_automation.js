/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_cl_intracompany_trans_automation.js)
 * 
 * Script Type:		Client
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 10/12/2018 - Initial Development - JD
 * Version:			2.0.0 - 14/05/2019 - Script trigger changed to Submit field
 * 
 * Author:			Jacob Duffell / Viktor Schumann
 * 
 * Script:			customscript_intracompanyTransAutomation
 * Deploy:			customdeploy_intracompanyTransAutomation
 * 
 * Purpose:			Automates various processes within Intracompany Transactions.
 * 
 * Notes:				Modified by Viktor Schumann 08/04/2020
					Payment Type custcol_pay_type - 1-Cash 2-Bank
					Undeposited Funds checkbox - custbody_tsa_undeposited_funds
					custbody_unit_div_shared_key 					
					custbody_relparty_div_shared_key 
					// 2	Centage Paid, 5 Centage Received,  
					1 Grant Paid, 6 Grant Received, 
					3 Other Expense - (was Purchase), 4 Other Income (was Rent)
 * 
 * Dependencies:	Library.FHL.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['../../Library.FHL.2.0', 'N/search', 'N/record', 'N/runtime', 'N/log', 'N/ui/dialog', '../../../vs_lib', 'N/translation','N/url','N/https'], 
function (Library, Search, Record, Runtime, log, dialog, vs_lib, translation, url, https)
{
	'use strict';
	
	var ACCOUNT			= 'account';
	var OFFSETACCOUNT   = 'custcol_rsm_offset_account';
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var AMOUNT			= 'custbody_bank_amt';
	var BANK			= 'custbody_bank_chkbx';
	var BANKACCOUNT		= 'custbody_bank_acct';
	var OFFSETBANKACC   = 'custbody_offset_bank';
	//var OFFSET_CASH_ACC = 'custbody_offset_cash';
	//vehicle sinking funnd reserve = custbody_related_party_vsf_reserve 
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var DEPARTMENT		= 'department';
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	var LINE			= 'line';
	var MEMO			= 'memo';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var TSAPAYTYPE		= 'custcol_pay_type';
	var TRANSTYPE 		= 'custbody_ic_trans_type';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	
	var CUSTUNITTYPE    = 'custrecord_uat_unittype';
    var CUSTRELPARTYP   = 'custrecord_uat_relatedpartytype';
    var CUSTTRANTYP     = 'custrecord_uat_category';
    var CUSTGLACC 		= 'custrecord_uat_glaccount';
    var CUSTICINDI 		= 'custrecord_ic_indicator';



// **************************** PAGE INIT *************************
function pageInit(context){
  console.log("interUnit pageinit - call lineInit")
  
	console.log("pageinit: CLASS");
	var unit_division=context.currentRecord.getValue({ fieldId: "custbody_rsm_uni_division" });
	if(unit_division){
		console.log("pageInit: unit_division="+unit_division);
		var suitletURL = url.resolveScript({
			scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
			deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
			returnExternalUrl: true,
			//params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
			params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': unit_division }
		});

		var response = https.get({
			url: suitletURL
		});

		console.log("shared_key_lookup response=" + JSON.stringify(response))
		console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
		context.currentRecord.setValue({ fieldId: "custbody_unit_div_shared_key" , value: response.body});					
	}
  lineInit(context,1);
}

// **************************** LINE INIT *************************
function validateLine(context){
  var currentRecord=context.currentRecord;
  var accountID	= currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT});
  if(!accountID){
    window.nlapiCancelLineItem("line");
    window.nlapiSelectLineItem("line",1);              
  }
  return true;
}
  
// **************************** LINE INIT *************************
function lineInit(context,pageinit){
	var lineCount = context.currentRecord.getLineCount({ sublistId: LINE });
	var currIndex = context.currentRecord.getCurrentSublistIndex({ sublistId: LINE });
  	var trans_type = context.currentRecord.getValue({ fieldId: "custbody_ic_trans_type" });
  
    var undepositedFund = context.currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
	var payment_type = context.currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});	
	
  	var unitType = context.currentRecord.getValue({fieldId : "custbody_unit_type"});
    var rlPartyType = context.currentRecord.getValue({fieldId : "custbody_rp_type"});
  	var unit = context.currentRecord.getText({fieldId : "class"});
    var relatedParty = context.currentRecord.getText({fieldId : "custbody_cseg_tsa_relatedpar"});

	if (unit) unit=unit.replace('\n','');
  	if (relatedParty) relatedParty=relatedParty.replace('\n', '');

    //var r_party_division = context.currentRecord.getText({fieldId : "custbody_rsm_rp_division"});
  	//var unit_division = context.currentRecord.getText({fieldId : "custbody_rsm_uni_division"});
    var r_party_division = context.currentRecord.getValue({fieldId : "custbody_relparty_div_shared_key"});
  	var unit_division = context.currentRecord.getValue({fieldId : "custbody_unit_div_shared_key"});
	
  	console.log("** lineInit - unitType="+unitType+" , rlPartyType="+rlPartyType+" ,trans_type="+trans_type+" ,currIndex="+currIndex);
  
      window.nlapiSetLineItemDisabled("line","memo", false);
      window.nlapiSetLineItemDisabled("line","department", false);

  
	//window.nlapiSetLineItemDisabled("line","custcol_pay_type",false); //***
	
// 2	Centage Paid, 5 Centage Received,  1 Grant Paid, 6 Grant Received, 3 Other Expense - (was Purchase), 4 Other Income (was Rent)
	
	if(currIndex == 0){
		window.nlapiSetLineItemDisabled("line","debit",true);
		window.nlapiSetLineItemDisabled("line","credit",true);
		window.nlapiSetLineItemDisabled("line","custcol_ic_expense_cat",true);
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
      	window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code", true);
		
		jQuery('#tbl_line_addedit').show();
//	    if(trans_type!=3 && trans_type!=4){ // it's grant or centage (3=Purchase, 4=Rent)
          	//jQuery('#tbl_line_addedit').hide();
        	jQuery('#tbl_line_copy').hide();
            jQuery('#tbl_line_insert').hide();
            jQuery('#tbl_line_remove').hide();
 //       }

		// ***These things should run only in the first 2 lines or with Purchase or Rent - purchase and rent has this onChange ***
		if(!undepositedFund) context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
		console.log("*-3");
		if( r_party_division == unit_division ){ context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_dhq_excl", value : true});  }
		var subStr = false;
		if (unitType == 3 && rlPartyType == 3){
		  if(unit.length > relatedParty.length){
			if(unit.search(relatedParty) != -1) subStr = true;
			console.log('IF subStr='+subStr);
		  }
		  else{
			if(relatedParty.search(unit) != -1) subStr = true;
		  }
		  console.log('ELSE subStr='+subStr);
		  context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_unit_excl", value : subStr});
		}

	}
	else{ // it is not the first line
      	document.getElementById('line_copy').style.display = '';
      	if(currIndex == 1) document.getElementById('line_copy').style.display = 'none';
          //jQuery('#line_copy').remove();//line_copy
		
		if(trans_type!=4){
			window.nlapiSetLineItemDisabled("line","debit",false);
			window.nlapiSetLineItemDisabled("line","credit",true);
		}
		else{
			window.nlapiSetLineItemDisabled("line","debit",true);
			window.nlapiSetLineItemDisabled("line","credit",false);
		}
		
      	window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", false);
        window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", false);
      	window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code", false);
		
      	jQuery('#tbl_line_addedit').show();
		jQuery('#tbl_line_remove').show(); // in case of purchase or rent 
		
			// ***These things should run only in the first 2 lines or with Purchase or Rent - purchase and rent has this onChange ***
		  if(!undepositedFund) context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
		  
		  console.log("*-2");
		  if( r_party_division == unit_division ){ context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_dhq_excl", value : true});  }  	
		  var subStr = false;
		  if (unitType == 3 && rlPartyType == 3){
			console.log('IF unitType=3 & RelatedParty=3 : unit='+unit+" ,relatedParty="+relatedParty);
			if(unit.length > relatedParty.length){
			  if(unit.search(relatedParty) != -1) subStr = true;
			  console.log('IF subStr='+subStr);
			}
			else{
			  if(relatedParty.search(unit) != -1) subStr = true;
			  console.log('ELSE subStr='+subStr);
			}
			console.log('subStr='+subStr);
			context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_unit_excl", value : subStr});
		  }  
		
		if(trans_type!=3 && trans_type!=4){ // grant or centage // 2	Centage Paid, 5 Centage Received,  1 Grant Paid, 6 Grant Received, 3 Purchase, 4 Rent	
          window.nlapiSetLineItemDisabled("line","custcol_ic_expense_cat",true);
		  window.nlapiSetLineItemDisabled("line","debit",true);
		  window.nlapiSetLineItemDisabled("line","credit",true);
		  //window.nlapiCancelLineItem("line");
		  //window.nlapiSelectLineItem("line",1);              
		  jQuery('#tbl_line_copy').hide();
		  jQuery('#tbl_line_insert').hide();
		  jQuery('#tbl_line_remove').hide();
			if(currIndex > 1 ) { // && !pageinit
				jQuery('#tbl_line_addedit').hide();
				console.log("lineInit: index is >1 - cancel line. currIndex="+currIndex);
				window.nlapiSetLineItemDisabled("line","debit",true);
				window.nlapiSetLineItemDisabled("line","credit",true);
				window.nlapiSetLineItemDisabled("line","custcol_ic_expense_cat",true);
				window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
				window.nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
              	window.nlapiSetLineItemDisabled("line","cseg_tsa_act_code", true);
				window.nlapiSetLineItemDisabled("line","memo", true);
				window.nlapiSetLineItemDisabled("line","department", true);
				//window.nlapiCancelLineItem("line");
				//context.currentRecord.selectLine({sublistId: 'line',line: 0});      
				return;
			}
          
        }
        else{
          window.nlapiSetLineItemDisabled("line","custcol_ic_expense_cat",false);
        }
		//window.nlapiSetLineItemDisabled("line","custcol_pay_type",false); 
	}
  
    console.log("** lineInit - r_party_division_shared key="+r_party_division+" , unit_division_shared key="+unit_division);
      
// ***These things should run only in the first 2 lines or with Purchase or Rent ***
/*
  	if(!undepositedFund) context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});

	if( r_party_division == unit_division ){ context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_dhq_excl", value : true});  }  	
    var subStr = false;
	if (unitType == 3 && rlPartyType == 3){
      if(unit.length > relatedParty.length){
        if(unit.search(relatedParty) != -1) subStr = true;
        console.log('IF subStr='+subStr);
      }
      else{
        if(relatedParty.search(unit) != -1) subStr = true;
      }
      console.log('ELSE subStr='+subStr);
      context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_unit_excl", value : subStr});
    }  
*/
  
}


//************************* FIELD CHANGED **************************	
	function fieldChanged(context)
	{
		try
        {
          	//console.log("intraUnit : *** fieldChanged Started *** - field="+context.fieldId);
			var currentRecord = context.currentRecord;
            var bankCashAmount = currentRecord.getValue({ fieldId: AMOUNT });
            var bankCB = true; //not used
            //context.currentRecord.getValue({ fieldId: BANK });
            var bankAccount = currentRecord.getValue({ fieldId: BANKACCOUNT });
			var undepositedFund = currentRecord.getValue({ fieldId: "custbody_tsa_undeposited_funds"});

			var transaction_type = currentRecord.getValue({fieldId : TRANSTYPE});
			var transaction_type_txt = currentRecord.getText({fieldId : TRANSTYPE});
			var lineCount = currentRecord.getLineCount({sublistId : LINE});
			var debit_amount = currentRecord.getCurrentSublistValue({ sublistId : LINE, fieldId : DEBIT });
			var credit_amount = currentRecord.getCurrentSublistValue({ sublistId : LINE, fieldId : CREDIT });
			console.log("fieldChanged : Transaction_type="+transaction_type+" - "+transaction_type_txt+" ,lineCount="+lineCount+" , undepositedFund="+undepositedFund);
						
			//log.debug({title: 'fieldChanged', details: context});
			switch (context.fieldId)
			{
                case EXPENSETYPE: // this is a Line level field change
					console.log("fieldChanged - Line - Expense Type - "+context.fieldId);
					setOffsetReserve(context);
                    setCurrentPurchaseLine(context);
                    break;
                case AMOUNT:
					console.log("fieldChanged - Amount : Main Amount changed");
					if(!debit_amount && !credit_amount) window.nlapiCancelLineItem("line");
                    if (!bankCashAmount || bankCashAmount == "" || bankCashAmount == 0) { // Amount is empty or 0
                        resetTransactionLines(currentRecord);
                        break;
                    }
					console.log("fieldChanged - Amount : Main Amount changed - 2");
                    if ( (!bankAccount || bankAccount.length == 0) && !undepositedFund) { // Amount changed but no Bank Acc or Undeposited set 
                        break;
                    }
					console.log("fieldChanged - Amount  : Main Amount changed -3");
					if( (transaction_type!=3 && transaction_type!=4) || lineCount==0 ){ // Amount changed and it's not (Purchase or Rent) OR no Lines added yet
						resetTransactionLines(currentRecord,'amount'); // keep amount as it is
						setTransactionLines(currentRecord,context);
					}
					else{
/*						if(transaction_type!=3 && transaction_type!=4){ Amount changed and it's not (Purchase or Rent) OR no Lines added yet
							console.log("fieldChanged - Amount : NOT rent or purchase.");
							resetTransactionLines(currentRecord);
							console.log("fieldChanged - Amount : Lines Reseted.");
							setTransactionLines(currentRecord,context);
							console.log("fieldChanged - Amount : New Lines added.");
						} */
						console.log("fieldChanged - Amount : Rent or Purchase - selectline(0)");
						currentRecord.selectLine({ sublistId: LINE, line: 0 });
						//4-Rent
						//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "memo", value : "test1" });
						if(transaction_type==4) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT})});						
						//3-Purchase
						if(transaction_type==3) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : CREDIT, value : currentRecord.getValue({fieldId : AMOUNT})});						
						currentRecord.commitLine({sublistId : LINE});
					}
                    break;
/*					case BANKACCOUNT: // !!!! MOVED THIS TO POST SOURCING !!!!
                    if (bankCashAmount && bankCashAmount > 0 && bankAccount && bankAccount.length > 0) {
						resetTransactionLines(currentRecord,'amount'); // keep amount in header as it is
                        setTransactionLines(context.currentRecord,context);
                    }
                    break;*/
                case "custbody_tsa_undeposited_funds":				
                    if (bankCashAmount && bankCashAmount > 0 && undepositedFund) {
						if(undepositedFund) currentRecord.setValue({ fieldId: BANKACCOUNT, value : null , ignoreFieldChange : true});
						if(transaction_type==5 || transaction_type==6) resetTransactionLines(currentRecord,'amount'); // keep amount as it is
                        setTransactionLines(context.currentRecord,context);
                    }
                    break;
					
				case TRANSTYPE:
					resetTransactionLines(context.currentRecord);
					break;
/*				case PARTY:
				    if(bankCashAmount && (bankAccount || undepositedFund)){
						//relatedPartyChanged(context.currentRecord,context);
						resetTransactionLines(context.currentRecord,"amount");
						setTransactionLines(context.currentRecord,context);
					}
					break;
*/					
			}
		}
		catch(e)
		{
			console.log(e);
			vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('fieldChanged', e);
		}
	}

//************************* POST SOURCING **************************	
	function postSourcing(context)
	{
		try
        {
            var bankCashAmount = context.currentRecord.getValue({ fieldId: AMOUNT });
            var bankCB = true; //not used
            //context.currentRecord.getValue({ fieldId: BANK });
            var bankAccount = context.currentRecord.getValue({ fieldId: BANKACCOUNT });
			var undepositedFund = context.currentRecord.getValue({ fieldId: "custbody_tsa_undeposited_funds"});
			var transaction_type = context.currentRecord.getValue({fieldId : TRANSTYPE});
//			var transaction_type_txt = currentRecord.getText({fieldId : TRANSTYPE});
			
			console.log("0 postSourcing:context.fieldId="+context.fieldId);
			switch (context.fieldId)
			{
                case "custbody_bank_acct":
					console.log("1 postSourcing: context.fieldId="+context.fieldId+" - "+bankCashAmount+" - "+bankAccount);
                    if (bankCashAmount && bankCashAmount > 0 && bankAccount && bankAccount.length > 0) {
						console.log("postSourcing: context.fieldId="+context.fieldId+" before line reset (1)");
						if(transaction_type==3 || transaction_type==4){ 
							//setTransactionLines(context.currentRecord,context);
							resetTransactionLines(context.currentRecord,'refresh'); // keep amount in header as it is and refresh the Payment type
						}
						else{
							resetTransactionLines(context.currentRecord,'amount'); // keep amount in header as it is and delete the lines
						}
					
						console.log("postSourcing: context.fieldId="+context.fieldId+" before set lines (2)");
                        setTransactionLines(context.currentRecord,context);
                    }
                break;
					
                case "class": //custbody_unit_div_shared_key custbody_relparty_div_shared_key , custbody_rsm_uni_division custbody_rsm_rp_division
					console.log("2 postSourcing: CLASS context.fieldId="+context.fieldId);
					var unit_division=context.currentRecord.getValue({ fieldId: "custbody_rsm_uni_division" });
					if(!unit_division) break;
					console.log("postSourcing: unit_division="+unit_division);
					var suitletURL = url.resolveScript({
						scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
						deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
						returnExternalUrl: true,
						//params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
						params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': unit_division }
					});

					var response = https.get({
						url: suitletURL
					});
					console.log("shared_key_lookup response=" + JSON.stringify(response))
					console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
					context.currentRecord.setValue({ fieldId: "custbody_unit_div_shared_key" , value: response.body});					
                break;
                case "custbody_cseg_tsa_relatedpar": //custbody_unit_div_shared_key custbody_relparty_div_shared_key , custbody_rsm_uni_division custbody_rsm_rp_division
					console.log("3 postSourcing: RELPARTY context.fieldId="+context.fieldId);
					var rp_division=context.currentRecord.getValue({ fieldId: "custbody_rsm_rp_division" });
					if(!rp_division) break;
					console.log("postSourcing: rp_division="+rp_division);
					var suitletURL = url.resolveScript({
						scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
						deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
						returnExternalUrl: true,
						//params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
						params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': rp_division }
					});

					var response = https.get({
						url: suitletURL
					});

					console.log("shared_key_lookup response=" + JSON.stringify(response))
					console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
					context.currentRecord.setValue({ fieldId: "custbody_relparty_div_shared_key" , value: response.body});					

				    if(bankCashAmount && (bankAccount || undepositedFund)){
						//relatedPartyChanged(context.currentRecord,context);
						resetTransactionLines(context.currentRecord,"amount");
						setTransactionLines(context.currentRecord,context);
					}

                break;
					
					
/*                case "custcol_ic_expense_cat":
						console.log("postSourcing: context.fieldId="+context.fieldId+" before SOURCING (1)");
						setOffsetReserve(context);
                    break;
*/					
			}
		}
		catch(e)
		{
			console.log(e);
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('fieldChanged', e);
		}
	}


	function setOffsetReserve(context) // and set custcol_tsa_interunit_category,
	{
		var chartOfAccounts	= null;
		var currentRecord	= context.currentRecord;
		//custcol_tsa_offset_reserve
		//custcol_tsa_interunit_cat_sourced
		
		try
		{
			console.log("setOffsetReserve : context.line="+context.line);
			var tsa_interunit_category;
			var transaction_type = currentRecord.getValue({fieldId : TRANSTYPE});
			
			var tsa_category = currentRecord.getCurrentSublistValue({ sublistId : LINE, fieldId : "custcol_ic_expense_cat" });
			console.log("setOffsetReserve : custcol_ic_expense_cat (1st column)="+tsa_category);			
			
			var undepositedFund = context.currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
			var payment_type = context.currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
			var unitType = context.currentRecord.getValue({fieldId : "custbody_unit_type"});
			var rlPartyType = context.currentRecord.getValue({fieldId : "custbody_rp_type"});

			var relatedParty = context.currentRecord.getValue({fieldId : "custbody_cseg_tsa_relatedpar"});
			var unit = context.currentRecord.getValue({fieldId : "class"});

			//custcol_tsa_interunit_category
			var tsa_interunit_category_lookup = Search.lookupFields({
				type:'customrecord_tsa_unit_activity_types',
				id: tsa_category,
				columns: 'custrecord_tsa_uat_iu_cat'
			});
			if(tsa_interunit_category_lookup.custrecord_tsa_uat_iu_cat[0]){
				 tsa_interunit_category = tsa_interunit_category_lookup.custrecord_tsa_uat_iu_cat[0].value;
			}
			console.log("setOffsetReserve : tsa_interunit_category="+tsa_interunit_category);			
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_tsa_interunit_category", value : tsa_interunit_category, ignoreFieldChange : true });
			
			if(transaction_type==3){
				// ******  Call suitelet - Related Party lookup ********* we need to know the Unit's counterpart in Related Party
				var suitletURL = url.resolveScript({
					scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl: true,
					params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': unit } //"3KYA THQ : DIV : Coast : COR : Changamwe"
				});
				var response = https.get({ url: suitletURL });
				console.log("setOffsetReserve : Related_Party_lookup_Call response=" + JSON.stringify(response));
				//log.debug("setOffsetReserve : Related_Party_lookup_Call returned id=" + response.body);
				relatedParty=parseInt(response.body);
				// ******  Call suitelet - Related Party lookup *********
			}
			
			var customrecord_tsa_iu_res_mapSearchObj = Search.create({
			   type: "customrecord_tsa_iu_res_map",
			   filters:
			   [
				  ["custrecord_tsa_iurm_rel_party","anyof",relatedParty], 
				  "AND", 
				  ["custrecord_tsa_iurm_iu_cat","anyof",tsa_interunit_category]
			   ],
			   columns:
			   [
				  Search.createColumn({name: "scriptid", label: "Script ID" }),
				  Search.createColumn({name: "custrecord_tsa_iurm_iu_cat", label: "Interunit Category"}),
				  Search.createColumn({name: "custrecord_tsa_iurm_def_res", label: "Default Reserve"}),
				  Search.createColumn({name: "custrecord_tsa_iurm_rel_party", label: "TSA Related Party"})
			   ]
			});
			var default_reserve;
			var searchResultCount = customrecord_tsa_iu_res_mapSearchObj.runPaged().count;
			//log.debug("customrecord_tsa_iu_res_mapSearchObj result count",searchResultCount);
			customrecord_tsa_iu_res_mapSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   //custrecord_tsa_iurm_def_res			   
			   default_reserve = result.getValue({ name: 'custrecord_tsa_iurm_def_res' });
			   return true;
			});
			
			console.log("setOffsetReserve:: default_reserve ="+default_reserve+" ** ");
          	if(default_reserve){
				if(transaction_type==4){ //	2-Centage Paid, 5-Centage Received, 1-Grant Paid, 6-Grant Received, 3-Other Expense - (was Purchase), 4 Other Income (was Rent)
					currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_cseg_tsa_fundreserv", value : default_reserve, ignoreFieldChange : false });
				}
				else{
					currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_tsa_offset_reserve", value : default_reserve, ignoreFieldChange : true });
				}
            }
			
			return true;
							
		}
		catch(e)
		{
			console.log(e);
			Library.errorHandler('setCurrentPurchaseLine', e);
		}
	}



  
//********************* SAVE RECORD ********************	
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
		var offset_accountID = 0;
		var currentRecord	= null;
		var isInactive		= '';
		var lineCount		= 0;
		var saveRecord		= true;
		console.log("intracompany_trans_automation : saveRecord Started");
		try{
          
			currentRecord	= context.currentRecord;
			lineCount		= currentRecord.getLineCount({sublistId : LINE});
			
			for (var i = 0; i < lineCount; i++){
				
				accountID	= currentRecord.getSublistValue({sublistId : LINE, fieldId : ACCOUNT, line : i});
				offset_accountID = currentRecord.getSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, line : i});
				account		= Record.load({type : 'ACCOUNT', id : accountID});
				isInactive	= account.getValue({fieldId : 'isinactive'});
				
                if (isInactive == true) { 
                    var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'NO_ACTIVE_GL_ACCOUNT', locale: translation.Locale.CURRENT })();
                    alert(alertMessage);
					saveRecord	= false; 	
				}
				
                if (!offset_accountID || offset_accountID == 0) {
                    var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DEFAULT_BANK_OR_CASH_EMPTY', locale: translation.Locale.CURRENT })();
                    alert(alertMessage);
					saveRecord	= false;
				}
				
			}
         console.log("intracompany_trans_automation : saveRecord Finished");
			
		}
		catch(e){
         	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('saveRecord', e);
		}
		
		return saveRecord;
	}

//********* GET RELATED PARTY TYPE *********
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} entity
	 * @returns {String} unitType
	 */
	function getRelatedPartyType(entity){
		var lastLetters		= '';
		var stringLength 	= 0;
		
		try{
			stringLength = entity.length;
			lastLetters = entity.substr(stringLength - 3);
		}
		catch(e){
			Library.errorHandler('getRelatedPartyType', e);
		}

		return lastLetters;
	}
	
	
//**************************** GET ACCOUNT ****************************	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} tranType, unitType, RelPartyType
	 * @returns {String} account
	 */
	function getAccount(tranType, unitType, RelPartyType, undepositedFund,context){
		var accountID		= 0;
		var IcIndicator		= '';
		var accountResult	= null;
		var accountSearch	= null;
		
		
		try{
          
          	console.log('Function getAccount | tranType='+tranType+" | unitType="+unitType+" | RelPartyType="+RelPartyType);
          
			accountSearch = Search.create({
				 type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      //"AND", 
				      //["formulatext: {custrecord_uat_formusage}","is",formUsage],					  
				      "AND", 
				      ["formulatext: {custrecord_uat_unittype}","is",unitType], 
				      "AND", 
				      ["formulatext: {custrecord_uat_relatedpartytype}","is",RelPartyType], 
				      "AND", 
				      ["formulatext: {custrecord_uat_category}","is",tranType]
				   ],
				   columns:
				   [
				      Search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"}),
				      Search.createColumn({name: "custrecord_ic_indicator", label: "IC Indicator"})
				   ]
				});
			
			accountResult    = accountSearch.run().getRange({start: 0, end: 1000});
			accountID        = accountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			IcIndicator      = accountResult[0].getValue({name: 'custrecord_ic_indicator'});						
			
			var retVals = [accountID, IcIndicator];
			console.log('getAccount : accountID 1='+accountID+', IcIndicator='+IcIndicator);
			/*var options = {
	                title: 'accountID 1:',
	                message: accountID
	            };
	        dialog.alert(options);*/
		}
		catch(e){
			vs_lib.createErrorLog(Runtime.getCurrentScript().id, 0/*context.currentRecord.getValue({ fieldId: "id" })*/, e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('fieldChanged', e);
        }

        if (!retVals || retVals.length == 0) {
            var noAccountMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'NO_ACCOUNT_FOUND', locale: translation.Locale.CURRENT })();
            alert(noAccountMessage + ": tranType= " + tranType + ", unitType= " + unitType + ", RelPartyType= " + RelPartyType+" (1)");
        }

		return retVals;
	}


//**************************** GET OFFSET ACCOUNT ****************************	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} formUsage, offsetAccount, unitType, RelPartyType
	 * @returns {String} account
	 */
	function getOffsetAccount(formUsage, init_gl_Account, unitType, RelPartyType,context)
	{
		var offAccount		= 0;
		var offAccountResult	= null;
		var offAccountSearch	= null;
		
      	console.log('Function getOffsetAccount | formUsage='+formUsage+" | initiationg GL Account="+init_gl_Account+" | unitType="+unitType+" | RelPartyType="+RelPartyType);
		try
		{
			offAccountSearch = Search.create({
				 type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      "AND", 
				      ["formulatext: {custrecord_uat_formusage}","is",formUsage], 
				      "AND", 
				      ["custrecord_tsa_ini_gl_account","is",init_gl_Account], 
				      "AND", 
				      ["formulatext: {custrecord_uat_unittype}","is",unitType], 
				      "AND", 
				      ["formulatext: {custrecord_uat_relatedpartytype}","is",RelPartyType]
				   ],
				   columns:
				   [
				      Search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"})
				   ]
				});
			
			offAccountResult = offAccountSearch.run().getRange({start: 0, end: 1000});
            console.log(JSON.stringify(offAccountResult));
            console.log(JSON.stringify(offAccountResult[0]));

            if (offAccountResult.length==0){
              	console.log("no offset account found");
            	var noAccountMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'NO_OFFSET_ACCOUNT_FOUND', locale: translation.Locale.CURRENT })();
                noAccountMessage=noAccountMessage+ ": formUsage= " + formUsage + ", initiating GL Account= " + init_gl_Account + ", unitType= " + unitType + ", RelPartyType= " + RelPartyType+" (2)";
              	alert(noAccountMessage);
                vs_lib.createErrorLog(Runtime.getCurrentScript().id, 0/*context.currentRecord.getValue({ fieldId: "id" })*/, noAccountMessage, Runtime.getCurrentUser().id, context.currentRecord.type,true);
        	}
            else{
                offAccount        = offAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
                var retVals = [offAccount];
                console.log('Result offAccount(2)='+offAccount);              
            }
		}
		catch(e)
		{
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, 0/*context.currentRecord.getValue({ fieldId: "id" })*/, e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('getOffsetAccount', e);
        }


		return retVals;
	}


//**************************** GET OFFSET UNDEPOSITED FUNDS ****************************		
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} tranType, unitType, RelPartyType
	 * @returns {String} account
	 */
	function getOffsetUndepositedFunds (formUsage, offsetAccount,context)
	{
		var unFundAccount		= 0;
		var unFunAccountResult	= null;
		var unFunAccountSearch	= null;
		
		try
		{
			unFunAccountSearch = Search.create({
				 type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      "AND", 
				      ["formulatext: {custrecord_uat_formusage}","is",formUsage], 
				      "AND", 
				      ["custrecord_tsa_ini_gl_account","is",offsetAccount]
				   ],
				   columns:
				   [
				      Search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"})
				   ]
				});
			
			unFunAccountResult    = unFunAccountSearch.run().getRange({start: 0, end: 1000});
			unFundAccount        = unFunAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			var retVals = [unFundAccount];
			console.log('unFundAccount='+unFundAccount);
		}
		catch(e)
		{
          	vs_lib.createErrorLog(Runtime.getCurrentScript().id, 0/*context.currentRecord.getValue({ fieldId: "id" })*/, e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			Library.errorHandler('getOffsetUndepositedFunds', e);
		}

		return retVals;
	}
	
//****** RELATED PARTY CHANGED *******	
	/**
	 * Calls the reset function if the Purchase check box is unchecked.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function relatedPartyChanged(currentRecord,context)
	{
		try
		{	
			if(currentRecord.getValue("custbody_cseg_tsa_relatedpar")){
				console.log("relatedPartyChanged : ***Started***" );
				resetTransactionLines(currentRecord);
			}
		}
		catch(e)
		{
			Library.errorHandler('relatedPartyChanged', e);
		}
	}
	
//**************************** RESET TRANSACTION LINES ****************************	
	/**
	 * Removes all lines when the transaction type is changed.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function resetTransactionLines(currentRecord, subtype){
		console.log("REsetTransactionlines : **** Started **** Subtype="+subtype);
		var lineCount = 0;
		var undepositedFund = currentRecord.getValue({ fieldId: "custbody_tsa_undeposited_funds" });
		var payment_type = currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
		window.nlapiCancelLineItem("line");
		
		try{
			console.log("REsetTransactionlines : inside try-catch");
			lineCount = currentRecord.getLineCount({sublistId : LINE});			
			console.log("REsetTransactionlines : lineCount="+lineCount);
			if( lineCount == 0 ){
				console.log("REsetTransactionlines : No lines added - * Exit *");
				return;
			}
			if (lineCount>0){
				console.log("REsetTransactionlines : lineCount="+lineCount);
				currentRecord.selectLine({ sublistId: LINE, line: 0 });
				for (var i=lineCount-1; i>=0; i--){
					if (subtype=='refresh'){
						currentRecord.selectLine({ sublistId: LINE, line: i });
						if(!undepositedFund){
							console.log("REsetTransactionlines : set line i="+i+" to payment_type="+payment_type);
							currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
						}
						else{
							console.log("REsetTransactionlines : set line i="+i+" to payment_type=null");
							currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : null });
						}
						currentRecord.commitLine({sublistId : LINE});
					}
					else{
						console.log("REsetTransactionlines : remove line i="+i);
						currentRecord.removeLine({sublistId : LINE, line : i, ignoreRecalc : true});
					}
				}
			}
			
			if (subtype!='amount' && subtype!='refresh'){
				currentRecord.setValue({fieldId : AMOUNT, value : '', ignoreFieldChange : true});
			}
          	if(undepositedFund) currentRecord.setValue({ fieldId: BANKACCOUNT, value : null , ignoreFieldChange : true});
          	console.log("REsetTransactionlines : * Finished *");
		}
		catch(e){
			console.log(e);
			Library.errorHandler('resetTransactionLines', e);
		}
		return true;
	}
	
//****************************** SET CURRENT PURCHASE LINE **************************
	/**
	 * Sets the current purchase line (except for the first line)
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setCurrentPurchaseLine(context)
	{
		var chartOfAccounts	= null;
		var currentRecord	= context.currentRecord;
		//custcol_tsa_offset_reserve
		//custcol_tsa_interunit_cat_sourced
		
		try
		{
			console.log("setCurrentPurchaseLine:: *** Started *** context.line="+context.line);
			//var tsa_interunit_cat_sourced = currentRecord.getCurrentSublistValue({ sublistId : LINE, fieldId : "custcol_tsa_interunit_cat_sourced" });
			//console.log("setCurrentPurchaseLine : tsa_interunit_cat_sourced="+tsa_interunit_cat_sourced);			
			
			if (context.sublistId == LINE && context.line > 0)
			{	
				chartOfAccounts	= Record.load({type : ACTIVITYTYPE, id : currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : EXPENSETYPE})}).getValue({fieldId : 'custrecord_uat_glaccount'});
				
				if (currentRecord.getCurrentSublistValue({sublistId : LINE, fieldId : MEMO}) == ''){
					currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
				}
				
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : chartOfAccounts});
				
			// ***These things should run only in the first 2 lines or with Purchase or Rent ***
				var undepositedFund = context.currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
				var payment_type = context.currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
				var unitType = context.currentRecord.getValue({fieldId : "custbody_unit_type"});
				var rlPartyType = context.currentRecord.getValue({fieldId : "custbody_rp_type"});
				var relatedParty = context.currentRecord.getText({fieldId : "custbody_cseg_tsa_relatedpar"});
	
				if(!undepositedFund) context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});

				var offsetReturn = getOffsetAccount('Offset', chartOfAccounts,
						currentRecord.getText({fieldId : UNITTYPE}), 
						currentRecord.getText({fieldId : RELPARTYTYPE}), context);
				var offsetAccountIs = offsetReturn[0];
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : offsetAccountIs});
					
			}
		}
		catch(e)
		{
			Library.errorHandler('setCurrentPurchaseLine', e);
		}
	}
	
//************************** SET PURCHASE LINES **************************
	/**
	 * Sets the first line for if the Purchase pay type is selected.
	 * 
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setPurchaseLines(currentRecord,context)
	{
		var accountID		= 0;
		var accountResult	= null;
		var accountSearch	= null;
		console.log(" setPurchaseLine : **** Started **** ");

		var lineCount = currentRecord.getLineCount({sublistId : LINE});
		console.log(" setPurchaseLine : lineCount="+lineCount);
/*
		if(lineCount>0){
			console.log(" setPurchaseLine : lineCount>0 then EXIT-return.");
			return;
		}
*/								
      	var payment_type = currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
		console.log(" setPurchaseLines : Payment Type="+payment_type);      
		//		  if(!undepositedFund) context.currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
		
		try
		{			
			if(lineCount==0){
				currentRecord.selectNewLine({sublistId : LINE});
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : CREDIT, value : currentRecord.getValue({fieldId : AMOUNT})});
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
			}
			else{
				currentRecord.selectLine({ sublistId: LINE, line: 0 });
			}
			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type
			var undepositedFund = currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
			if(!undepositedFund) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
			
			if(undepositedFund){
				var accountResult	= null;
				var accountSearch	= null;
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});
				//IcIndicator		= "";
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT}) });
			}

				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : OFFSETBANKACC}) });
/*				
			//custbody_offset_cash
			if(payment_type==1){ //1=cash  // || undepositedFund
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : "custbody_offset_cash"}) });
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : OFFSETBANKACC}) });
			}
*/


			if(payment_type=="1"){
				console.log(" setPurchaseLines : Payment Type="+payment_type+" hence set OFFSETACCOUNT to Undeposited Funds.");    
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;
				
				//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});	// Undeposited Funds
				
				var unFundReturn = getOffsetUndepositedFunds('Offset', accountID, context);
				var unFundAccountIs = unFundReturn[0];
				console.log('setPurchaseLine : undeposited_Fund_AccountIs='+unFundAccountIs);
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : unFundAccountIs});
			}

			currentRecord.commitLine({sublistId : LINE});
			currentRecord.selectNewLine({sublistId : LINE});

		}
		catch(e)
		{
			console.log(e);
			Library.errorHandler('setPurchaseLines', e);
		}
	}

//*************************** SET RENT LINES ***************************
	/**
	 * Sets the first line for if the Purchase pay type is selected.
	 * 
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setRentLines(currentRecord,context)
	{
		var accountID		= 0;
		var accountResult	= null;
		var accountSearch	= null;
		console.log(" setRentLines : **** Started **** ");
		var payment_type = currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
      	console.log(" setRentLines : Payment Type="+payment_type);
      
		var lineCount = currentRecord.getLineCount({sublistId : LINE});
/*		console.log(" setRentLines : lineCount="+lineCount);
		if(lineCount>0){
			console.log(" setRentLines : lineCount>0 then EXIT-return.");
			return;
		}
*/		
		try
		{
			if(lineCount==0){
				currentRecord.selectNewLine({sublistId : LINE});
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT}) });
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});				
			}
			else{
				currentRecord.selectLine({ sublistId: LINE, line: 0 });
			}
			
			var undepositedFund = currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
          	if(!undepositedFund) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type
						
			if(undepositedFund){
				var accountResult	= null;
				var accountSearch	= null;
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});
				//IcIndicator		= "";
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT}) });
			}

			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT})});

			//custbody_offset_cash
			if(payment_type==1 || undepositedFund){ //1=cash 
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : "custbody_offset_cash"}) });
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : OFFSETBANKACC}) });
			}

/*
			if(payment_type==1){ //1=cash
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;
				
				//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});	// Undeposited Funds
				
				var unFundReturn = getOffsetUndepositedFunds('Offset', accountID);
				var unFundAccountIs = unFundReturn[0];
				console.log('setRentLines : undeposited_Fund_AccountIs='+unFundAccountIs);
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : unFundAccountIs});
			}
*/
			currentRecord.commitLine({sublistId : LINE});
			currentRecord.selectNewLine({sublistId : LINE});

		}
		catch(e)
		{
			Library.errorHandler('setRentLines', e);
		}
	}


//***************************** SET INCOME LINES ******************************
	/**
	 * Sets the first two lines for if the Levy pay type is selected.
	 * 
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setIncomeLines(currentRecord, revAccount, offsetAccountIs,context)
	{
		var accountID		= 0;
		var accountResult	= null;
		var accountSearch	= null;
      	var undepositedFund = currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
		var payment_type = currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
        //currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
        //if(undepositedFund) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : null}); // Cash pay type = 1
        //
		console.log(" setIncomeLine : **** Started **** ");
      	console.log("undepositedFund ="+undepositedFund);
        console.log(" setRentLines : Payment Type="+payment_type);

		try
		{
			var lineCount = currentRecord.getLineCount({sublistId : LINE});
			console.log(" setIncomeLine : lineCount="+lineCount);
			if(lineCount>0){
				console.log(" setIncomeLine : lineCount>0 then EXIT-return.");
				return;
			}
			
			currentRecord.selectNewLine({sublistId : LINE});
          	if(!undepositedFund) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type
			
			var interunit_trans_type = currentRecord.getValue({fieldId : "custbody_ic_trans_type"}); 

			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT}) });
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
			          
			if(undepositedFund){
				var accountResult	= null;
				var accountSearch	= null;
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});
				//IcIndicator		= "";
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT}) });
			}
			
			//custbody_offset_cash
			if(payment_type==1 || undepositedFund){ //1=cash 
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : "custbody_offset_cash"}) });
			}
			else{
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : OFFSETBANKACC}) });
			}
			
			/*
			else
			{
				accountSearch	= Search.create({
					type    : Search.Type.ACCOUNT,
					filters : [{name : 'number', operator : 'is', values : '149401'}]
				});
				
				accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
				accountID		= accountResult[0].id;

				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID}); // Undeposited Funds account
				
				var unFundReturn = getOffsetUndepositedFunds('Offset', accountID);
				var unFundAccountIs = unFundReturn[0];
				//log.debug({title: 'unFundAccountIs:', details: unFundAccountIs});
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : unFundAccountIs});
			}
            */
          	
			currentRecord.commitLine({sublistId : LINE});
			console.log("line 1 committed");
        
			accountID = revAccount;
										
			currentRecord.selectNewLine({sublistId : LINE});
          	if(!undepositedFund) currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : CREDIT, value : currentRecord.getValue({fieldId : AMOUNT}) });
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});	// Unit Intra-Unit: Centage
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : offsetAccountIs});
			
			if(interunit_trans_type==8){ // vsf - Income type
				currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_cseg_tsa_fundreserv", value : currentRecord.getValue({fieldId : "custbody_related_party_vsf_reserve" }) });
			}	
			//custcol_cseg_tsa_fundreserv , custbody_related_party_vsf_reserve
			currentRecord.commitLine({sublistId : LINE});
          	console.log("line 2 committed");
           
		}
		catch(e)
		{
			Library.errorHandler('setIncomeLines', e);
		}
	}


//************************ SET EXPENSE LINES ************************
/**
 * Sets the first two lines for if the Grant pay type is selected.
 * 
 * @since 1.0.0
 * @param {Object} currentRecord
 * @returns {Void}
 */
function setExpenseLines(currentRecord, revAccount, offsetAccountIs,context)
{
	var accountID		= 0;
	var accountType		= null;
	var accountResult	= null;
	var accountSearch	= null;
	console.log(" setExpenseLine : **** Started **** ");
    console.log(" setExpenseLine : Payment Type="+payment_type);
    var undepositedFund = currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"});
	var payment_type = currentRecord.getValue({fieldId : "custbody_tsa_bank_acc_pay_type"});
	
	//try
	//{
		currentRecord.selectNewLine({sublistId : LINE});
		//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type
		
		console.log(" setExpenseLine : (1)");
		
		var interunit_trans_type = currentRecord.getValue({fieldId : "custbody_ic_trans_type"}); 

		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : CREDIT, value : currentRecord.getValue({fieldId : AMOUNT})});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true });
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
		//log.debug({title: 'If Bank - :', details: currentRecord.getValue({fieldId : BANKACCOUNT})});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : currentRecord.getValue({fieldId : BANKACCOUNT})});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : currentRecord.getValue({fieldId : OFFSETBANKACC})});
		// custbody_offset_cash
		
		if(payment_type==1){ //1=cash 
			accountSearch	= Search.create({
				type    : Search.Type.ACCOUNT,
				filters : [{name : 'number', operator : 'is', values : '149401'}]
			});
			
			accountResult	= accountSearch.run().getRange({start: 0, end: 1000});
			accountID		= accountResult[0].id;
			
			//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});	// Undeposited Funds
			
			var unFundReturn = getOffsetUndepositedFunds('Offset', accountID, context);
			var unFundAccountIs = unFundReturn[0];
			console.log('setExpenseLine : undeposited_Fund_AccountIs='+unFundAccountIs);
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : unFundAccountIs});
		}
		
		currentRecord.commitLine({sublistId : LINE});

		currentRecord.selectNewLine({sublistId : LINE});
  		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : payment_type});
		//currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : TSAPAYTYPE, value : 1}); // Cash pay type
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT})});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : MEMO, value : currentRecord.getValue({fieldId : MEMO}), ignoreFieldChange : true});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEPARTMENT, value : Runtime.getCurrentUser().department});
		
		accountID = revAccount;
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : ACCOUNT, value : accountID});
		currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, value : offsetAccountIs});
		
		/*
		if(interunit_trans_type==7){ //VSF - Expense type
			currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : "custcol_cseg_tsa_fundreserv", value : currentRecord.getValue({fieldId : "custbody_related_party_vsf_reserve" }) });
		}	
		*/
		currentRecord.commitLine({sublistId : LINE});
	/*}
	catch(e)
	{
		Library.errorHandler('setExpenseLines', e);
	}
	*/
}

	/**
	 * Calls functions that sets the first two transaction lines based
	 * on which transaction type is selected.
	 * 
	 * @since 1.0.0
	 * @param {Object} currentRecord
	 * @returns {Void}
	 */
	function setTransactionLines(currentRecord,context)
	{
		//try
		//{	
			console.log("setTransactionlines : **** Started ****");
			var revAccount;
			var IcIndicator;
			var transaction_type = currentRecord.getValue({fieldId : TRANSTYPE});
			var transaction_type_txt = currentRecord.getText({fieldId : TRANSTYPE});
			console.log("setTransactionlines : Transaction_type="+transaction_type+" - "+transaction_type_txt);
						
			
			var relparty_bank = currentRecord.getValue({fieldId : OFFSETBANKACC});
			var relparty_cash = currentRecord.getValue({fieldId : "custbody_offset_cash" });
			console.log("setTransactionlines : relparty_bank="+relparty_bank+" ,relparty_cash="+relparty_cash);

			if (!relparty_bank || !relparty_cash) {
                var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DEFAULT_BANK_OR_CASH_EMPTY', locale: translation.Locale.CURRENT })();
                alert(alertMessage);
				return true;
			}			
			
			// grant or centage // 2 Centage Paid, 5 Centage Received,  1 Grant Paid, 6 Grant Received, 3 Purchase, 4 Rent	
			if(transaction_type==3){ //3-Purchase
				setPurchaseLines(currentRecord,context);
				return true;
			}
			
			if(transaction_type==4){ //4-Rent
				setRentLines(currentRecord,context);
				return true;
			}
			
			var retVals = getAccount( currentRecord.getText({fieldId : TRANSTYPE}), 
					currentRecord.getText({fieldId : UNITTYPE}), 
					currentRecord.getText({fieldId : RELPARTYTYPE}),
					currentRecord.getValue({fieldId : "custbody_tsa_undeposited_funds"}), context );

            if (!retVals) {
				console.log('setTransactionLines : No return Values from getAccount - exit-return');
                return;
            }

			revAccount      = retVals[0];
			IcIndicator     = retVals[1]

            if (!revAccount || revAccount.length == 0) {
                return;
            }

			var offsetReturn = getOffsetAccount('Offset', revAccount,
					currentRecord.getText({fieldId : UNITTYPE}), 
					currentRecord.getText({fieldId : RELPARTYTYPE}), context);
			var offsetAccountIs = offsetReturn[0];
			console.log('setTransactionLines : offsetReturn='+offsetAccountIs);
			
			if (IcIndicator == 2) //income
			{
				console.log('setTransactionLines : Call setIncomeLines');
				setIncomeLines(currentRecord, revAccount, offsetAccountIs, context);
			}
			else if (IcIndicator == 1) //expense
			{	
				console.log('setTransactionLines : Call setExpenseLines');
				setExpenseLines(currentRecord, revAccount, offsetAccountIs, context);
			}

		/*}
		catch(e)
		{
			Library.errorHandler('setTransactionLines', e);
		}*/
	}
	
	
	return {
		fieldChanged : fieldChanged,
		saveRecord	 : saveRecord,
		lineInit	 : lineInit,
      	postSourcing : postSourcing,
		pageInit     : pageInit,
      	validateLine : validateLine
	}
});