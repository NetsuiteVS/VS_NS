/****************************************************************************************
 * Name:		SuiteScript 1.0 Client (TSA_nons_expense_cs10.js)
 *
 * Author:		Viktor Schumann (and picked a few pieces from RSM's Income script)
 *
 * Purpose:		Refresh the custom Account List on Expense Record (added by the UserEvent)
 ****************************************************************************************/

/*
11/01/2018 notes by Viktor S.
Sent By fields:
custbodytsa_sentbycash
custbody_tsa_sentbycheque
custbody_tsa_sentbybankcr
custbody_tsa_sentbyother // remove this from the form

Pending Submission	A
Pending Approval	B
Approved	C
Rejected	D

1066 - customrole_tsa_chiefaccountant
1067 - customrole_tsa_cashier - TSA Cashier Role
1071 - customrole_tsa_accountsreceivable - TSA Accounts Receivable

custbody_tsa_vs_account_list_storage

*/

var ctx = nlapiGetContext();
var _isEditableRole = false;

/*
 onChange function added by Viktor S. 20/01/2019
 it captures the change of the sentby values and populates the Accound selectOption field's Option List values.
 
 Bank - Restrict to account starting 165, 167 within the subsidiary of the person creating the transaction
 Cash - 28/01/2019 V.S. the definition changed to Restrict to "Undeposited Funds" (Restrict to account starting 161, 163 within the subsidiary of the person creating the transaction)
 Cheque - Restrict to "Undeposited Funds"
 

*/
function onSave(type)
{
	console.log("***** on Save fired ****");
	var okToSave=true;
	
	/* Income stuff
    var sentby_cheque = nlapiGetFieldValue("custbody_tsa_sentbycheque");
  	var sentby_cash = nlapiGetFieldValue("custbodytsa_sentbycash");
    var sentby_bank = nlapiGetFieldValue("custbody_tsa_sentbybankcr");
  
    var chequeNr = nlapiGetFieldValue("custbody_tsa_nsichequenum");
	var chequeNr_Field = nlapiGetField('custbody_tsa_nsichequenum');
	
  
    if ( sentby_cheque=="F" && sentby_cash=="F" && sentby_bank=="F" )  {
       var msg_sentby_not_ticked = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_SENTBY_NOT_TICKED', locale: translation.Locale.CURRENT })();
      alert(msg_sentby_not_ticked);
      return false;
    }
  
    if(sentby_cheque=="T"){
      console.log("sentby is cheque");
      okToSave= !!chequeNr;
      var msg_pls_enter_value = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_PLS_ENTER_VALUE', locale: translation.Locale.CURRENT })();
      if(!okToSave) alert(msg_pls_enter_value+" "+chequeNr_Field.getLabel());
    }
    else{
      nlapiSetFieldValue("custbody_tsa_nsichequenum","",false,false);
    }
  	*/
	 
    return okToSave;
}

function onChange(sublist,name,linenum){
	
  	console.log("changed field="+name);

	// *** Check Account Type 
	if (name=="custcol_tsa_account_type" && linenum>1 && nlapiGetCurrentLineItemValue("line","account") ){
		account_type=nlapiGetCurrentLineItemValue("line","custcol_tsa_account_type");
		/* Account type check removed due to Loveth's request 11/04/2019 
		if(account_type!=13){
			//var msg_expense_account_needed = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_EXPENSE_ACCOUNT', locale: translation.Locale.CURRENT })();
			
			alert("Please select Expense Account only."); //msg_expense_account_needed
			nlapiSetCurrentLineItemValue("line","account",null,false,true);
			return false;
		}
        */
	}
	
	// *** Set the Account Number in the first Line
	if ( name=="custpage_first_line_account" || name=="custbody_tsa_exp_amount_paid" ){
		var account_selected=nlapiGetFieldValue("custpage_first_line_account");
		var amount_paid=nlapiGetFieldValue("custbody_tsa_exp_amount_paid");
		if(account_selected=="") return;
		
		console.log("custpage_first_line_account changed="+account_selected);
		nlapiCancelLineItem("line");
		nlapiSelectLineItem("line",1);
		nlapiSetLineItemDisabled("line","account",false);
		nlapiSetCurrentLineItemValue("line", "account", parseInt(account_selected), false, true);
		if(amount_paid) nlapiSetCurrentLineItemValue("line", "credit", parseFloat(amount_paid), false, true);
      	var debit=nlapiGetCurrentLineItemValue("line", "debit")
        var credit=nlapiGetCurrentLineItemValue("line", "credit");
      	nlapiSetLineItemDisabled("line","account",true);		
      	if(debit || credit) nlapiCommitLineItem("line");
		
		//nlapiSetFieldValue("custbody_tsa_non_s_exp_bank_account",account_selected);
	}
	
	// *** Adding data to the option select list (on change of currency) ***
	if (name=="currency" )
	{
		//alert("1");
      	var chart_of_accounts = nlapiGetFieldValue("custbody_tsa_vs_account_list_storage");
		console.log("Chart of accounts="+chart_of_accounts);
		var accounts_list_array = JSON.parse(chart_of_accounts);
		var currency = nlapiGetFieldText("currency");
		//alert("2");
		console.log("changed field name="+name);
		
		if(name=="currency"){
			//nlapiDisableField("custpage_first_line_account", false);
            nlapiSetFieldDisplay("custpage_first_line_account",true);                          
			nlapiRemoveSelectOption ( "custpage_first_line_account" , null);
			nlapiInsertSelectOption ( "custpage_first_line_account" , "" , "" , false );
			i=0;
			accounts_list_array.forEach(function(a){
              //if((a.values.number.substring(0,3)=="165" || a.values.number.substring(0,3)=="167") && a.values.custrecord_tsa_acc_currency==currency){
				if(a.values.custrecord_tsa_acc_currency==currency){
					console.log(a.id+" "+a.values.name);
					nlapiInsertSelectOption ( "custpage_first_line_account" , a.id , a.values.name , false );
				}
			});
          	//document.getElementById("inpt_custpage_first_line_account4").click();
				
		}
		
		/*
				if(nlapiGetLineItemCount("line") > 0)	{	return; 	}
				_defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
				nlapiSetCurrentLineItemValue("line", "account", _defaultAccount, false, true);
		*/

	}
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param	{String} type Access mode: create, copy, edit
 * @returns {Void}
 * @since	1.0.0
 */
function nsiOnPageInit(type)
{
	//loadAccount();
	
	onChange("line","currency",0); // triggering the onChange to populate the Account SelecOption field list 
	
	isRoleEditable();
	var status = nlapiGetFieldValue("transtatus");
	if(status == "A" && (type == "create" || type == "copy"))
    {
		nlapiSetLineItemDisabled("line","account",true);
	}

	//**** Just caching in the data to speed up the checkbox selection. (I mean NS will act faster next time when Lookup fired for the same query)
//	_defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
//	var default_account_name=nlapiLookupField("Account",_defaultAccount,"name");	
        
	if(type == "edit" || type == "copy") // 05/03/2019 Viktor S. populate account select list in case of EDIT 
   	{
        nlapiSelectLineItem("line",1);
        //nlapiSetLineItemDisabled("line","account",false);
        var account_current = nlapiGetCurrentLineItemValue("line", "account");
	    nlapiSetFieldValue("custpage_first_line_account",account_current,true,false);
	}
	
}

/**
 * Determines if current user role is in editable role list.
 * The editable roles are TSA Accounts Receivables and
 * TSA Chief Accountants.
 *
 * @private
 * @returns {Void}
 * @since	1.0.0
 */
function isRoleEditable()
{
	//var defaultRole = ["1071", "1066"]; // Why don't use RoleId ??? Viktor S. 20/01/2019 *here*
	//_isEditableRole = ( defaultRole.indexOf(ctx.getRole()) > -1 ? true : false );
	//
	var defaultRole = ["customrole_tsa_accountspayable", "customrole_tsa_chiefaccountant"];
	_isEditableRole = ( defaultRole.indexOf(ctx.getRoleId()) > -1 ? true : false );
  console.log(" role id="+ctx.getRoleId() );  
}

/**
 * Search account records where the custom
 * Non Sales Income default account checkbox
 * is set to checked and default it on the
 * first sublist line account field.
 *
 * @private
 * @returns	{Void}
 * @since	1.0.0
 */
function loadAccount() // !!! Not in use !!! This sets the first lines Account to the default in case of new Transaction with no lines. 
{
	var _defaultAccount = null;

	if(nlapiGetLineItemCount("line") > 0)
	{
		return;
	}

	var subsidiary = nlapiGetFieldValue("subsidiary"),
	currency = nlapiGetFieldValue("currency");

	if(!subsidiary || !currency) return;

	_defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
	//_defaultAccount = nlapiGetFieldValue("custpage_first_line_account");
	nlapiSetCurrentLineItemValue("line", "account", _defaultAccount, false, true);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param	{String} type Sublist internal id
 * @param	{String} name Field internal id
 * @returns {Void}
 * @since	1.0.0
 */
function nsiOnPostSourcing(type, name)
{
	/* In Administrator role, the sublist data is loaded
	 * after the subisidiary and the currency transaction body
	 * fields are populated or sourced.
	 */
	if(name != "subsidiary" && name != "currency") return;

	//loadAccount();
}

/********************************* PAGE INIT

 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param	{String} type Sublist internal id
 * @returns {Void}
 * @since	1.0.0
 */
function nsiOnLineInit(type)
{

	var nsiStatus = nlapiGetFieldValue("transtatus");
	
	var linecount = nlapiGetCurrentLineItemIndex("line");
	if(linecount == 1)
	{
		jQuery('#tbl_line_insert').hide();
      	// If Non Standard Expense status is not Pending Submission
		if(nsiStatus != "A")
		{
			// Disabled Debit fields
			nlapiSetLineItemDisabled("line","debit",true);
			nlapiSetLineItemDisabled("line","credit",true); // disable credit as well, otherwise entering there could clear the debit field - Viktor S. 
			// Enable Account field
			nlapiSetLineItemDisabled("line", "account", false);
            nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
            nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
          	nlapiSetLineItemDisabled("line","cseg_tsa_act_code", true);
		}
		else // *** Status is "A" - Pending Submission ***
		{
			// Enable Account field. // Actually, it disables the Account field... Viktor S. 
			nlapiSetLineItemDisabled("line","account", true);
          	nlapiSetLineItemDisabled("line","debit", true);
			nlapiSetLineItemDisabled("line","credit", true);
            nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", true);
            nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", true);
          	nlapiSetLineItemDisabled("line","cseg_tsa_act_code", true);
          
		}

		// If current user role is in editable role list
		// and status is not Pending Submission
		if(_isEditableRole && nsiStatus != "A")
		{
			// Disable Debit field.
			nlapiSetLineItemDisabled("line","debit", true);
			nlapiSetLineItemDisabled("line","credit", true); // disable credit as well, otherwise entering there could clear the debit field - Viktor S. 
		}
	}
	else
	{
		// Enable Account and Debit fields.
		nlapiSetLineItemDisabled("line","debit",false);
		nlapiSetLineItemDisabled("line","credit",false); // Enable credit as well - Viktor S. 
		nlapiSetLineItemDisabled("line","account",false);
		nlapiSetLineItemDisabled("line","custcol_cseg_tsa_project_display", false);
        nlapiSetLineItemDisabled("line","custcol_cseg_tsa_fundreserv_display", false);
      	nlapiSetLineItemDisabled("line","cseg_tsa_act_code", false);
      	jQuery('#tbl_line_insert').show();
	}
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param	{String} type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 * @since	1.0.0
 */
function nsiOnValidateDelete(type)
{
	// Prevent people from deleting the Default Account line
    return !(nlapiGetCurrentLineItemIndex("line") == 1);
}