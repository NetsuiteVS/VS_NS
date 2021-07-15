/****************************************************************************************
 * Name:		SuiteScript 1.0 Client ([LM]cls_nonsalesincome_transaction.js)
 *
 * Script Type:	Client
 *
 * Version:		2018.020 - Account field is Enabled for AR & CA - LM
 *
 * Author:		RSM
 *
 * Purpose:		Disable Line sublist fields of Income record based on Status and User Role.
 *
 * Script:		customscript_lm_cls_nsi_transaction
 * Deploy:		customdeploy_lm_cls_nsi_transaction
 *
 * Notes:
 *
 * Libraries:
 ****************************************************************************************/

/*
11/01/2018 notes by Viktor S.
Sent By fields:
custbodytsa_sentbycash
custbody_tsa_sentbycheque
custbody_tsa_sentbybankcr
custbody_tsa_sentbyother // remove this from the form

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
	//validating Cheque Number
	console.log("***** on Save fired ****");
	var okToSave=true;
    var sentby_cheque = nlapiGetFieldValue("custbody_tsa_sentbycheque");
    var chequeNr = nlapiGetFieldValue("custbody_tsa_nsichequenum");
	var chequeNr_Field = nlapiGetField('custbody_tsa_nsichequenum');
	
    if(sentby_cheque=="T"){
      console.log("sentby is cheque");
      okToSave= !!chequeNr;
      if(!okToSave) alert("Please enter value(s) for: "+chequeNr_Field.getLabel());
    }
    else{
      nlapiSetFieldValue("custbody_tsa_nsichequenum","",false,false);
    }
  
    return okToSave;
}

function onChange(sublist,name,linenum){
	
	// *** Set the Account Number in the first Line
	if (name=="custpage_first_line_account"){
		var account_selected=nlapiGetFieldValue("custpage_first_line_account");
		if(account_selected=="") return;
		
		console.log("custpage_first_line_account changed="+account_selected);
		nlapiCancelLineItem("line");
		nlapiSelectLineItem("line",1);
		nlapiSetLineItemDisabled("line","account",false);
		nlapiSetCurrentLineItemValue("line", "account", parseInt(account_selected), false, true);
      	var debit=nlapiGetCurrentLineItemValue("line", "debit")
        var credit=nlapiGetCurrentLineItemValue("line", "credit");
      	nlapiSetLineItemDisabled("line","account",true);		
      	if(debit || credit) nlapiCommitLineItem("line");
		
	}
	
	// *** Adding data to the option select list (on change of the checkboxes) ***
	if (name=="custbodytsa_sentbycash" || name=="custbody_tsa_sentbycheque" || name=="custbody_tsa_sentbybankcr" || name=="currency" )
	{
		//alert("1");
      	var chart_of_accounts = nlapiGetFieldValue("custbody_tsa_vs_account_list_storage");
		console.log("Chart of accounts="+chart_of_accounts);
		var accounts_list_array = JSON.parse(chart_of_accounts);

		var sentby_cash = nlapiGetFieldValue("custbodytsa_sentbycash");
		var sentby_cheque = nlapiGetFieldValue("custbody_tsa_sentbycheque");
		var sentby_bank = nlapiGetFieldValue("custbody_tsa_sentbybankcr");
		var currency = nlapiGetFieldText("currency");
		//alert("2");
      
		console.log("changed field name="+name+" sentby_cash="+sentby_cash+" sentby_cheque="+sentby_cheque+" sentby_bank="+sentby_bank);
		
		//a.values.custrecord_tsa_acc_currency
		
		
		if( (name=="custbodytsa_sentbycash" || name=="currency") && sentby_cash=="T"){ 
			//nlapiDisableField("custpage_first_line_account", false);
            nlapiSetFieldDisplay("custpage_first_line_account",false);
            nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
			nlapiSetFieldValue("custbody_tsa_sentbycheque", "F", false, false);
			nlapiSetFieldValue("custbody_tsa_sentbybankcr", "F", false, false);
			i=0;
			nlapiRemoveSelectOption ( "custpage_first_line_account" , null);
			nlapiInsertSelectOption ( "custpage_first_line_account" , "" , "" , false );
			/* // This definition changed 28/01/2019 V.S. No 161+163 accounts needed
			accounts_list_array.forEach(function(a){
				if((a.values.number.substring(0,3)=="161" || a.values.number.substring(0,3)=="163") && a.values.custrecord_tsa_acc_currency==currency){
					console.log(a.id+" "+a.values.name);
					nlapiInsertSelectOption ( "custpage_first_line_account" , a.id , a.values.name , false );
				}
			});
			*/
			var _defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
			var default_account_name=nlapiLookupField("Account",_defaultAccount,"name");
			nlapiInsertSelectOption ( "custpage_first_line_account" , _defaultAccount , default_account_name , false );
			nlapiSetFieldValue("custpage_first_line_account",_defaultAccount,true,false);
			//_defaultAccount = nlapiGetFieldValue("custpage_first_line_account");
			//nlapiSetCurrentLineItemValue("line", "account", _defaultAccount, false, true);
			//nlapiDisableField("custpage_first_line_account", true);
            //nlapiDisableField("custbody_tsa_nsichequenum", true);

		}
		
		if((name=="custbody_tsa_sentbycheque" || name=="currency") && sentby_cheque=="T"){ // "Undeposited Funds"
			//nlapiDisableField("custbody_tsa_nsichequenum", false);
          	nlapiSetFieldDisplay("custbody_tsa_nsichequenum",true);
            nlapiSetFieldMandatory("custbody_tsa_nsichequenum",true);
          
            //nlapiDisableField("custpage_first_line_account", false);
			nlapiSetFieldValue("custbodytsa_sentbycash", "F", false, false);
			nlapiSetFieldValue("custbody_tsa_sentbybankcr", "F", false, false);
			_defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
			nlapiRemoveSelectOption ( "custpage_first_line_account" , null);
			nlapiInsertSelectOption ( "custpage_first_line_account" , "" , "" , false );
			var default_account_name=nlapiLookupField("Account",_defaultAccount,"name");
			nlapiInsertSelectOption ( "custpage_first_line_account" , _defaultAccount , default_account_name , false );
			nlapiSetFieldValue("custpage_first_line_account",_defaultAccount,true,false);
			//nlapiDisableField("custpage_first_line_account", true);
          	nlapiSetFieldDisplay("custpage_first_line_account",false);
		}

		if((name=="custbody_tsa_sentbybankcr" || name=="currency" ) && sentby_bank=="T"){
			//nlapiDisableField("custpage_first_line_account", false);
            nlapiSetFieldDisplay("custpage_first_line_account",true);
          
          	//nlapiDisableField("custbody_tsa_nsichequenum", true);
            nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
          
			nlapiSetFieldValue("custbodytsa_sentbycash", "F", false, false);
			nlapiSetFieldValue("custbody_tsa_sentbycheque", "F", false, false);
          
			nlapiRemoveSelectOption ( "custpage_first_line_account" , null);
			nlapiInsertSelectOption ( "custpage_first_line_account" , "" , "" , false );
			i=0;
			accounts_list_array.forEach(function(a){
				if((a.values.number.substring(0,3)=="165" || a.values.number.substring(0,3)=="167") && a.values.custrecord_tsa_acc_currency==currency){
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
	loadAccount();
	
	onChange("line","currency",0); // triggering the onChange to populate the Account SelecOption field list 
	
	isRoleEditable();
	var status = nlapiGetFieldValue("transtatus");
	if(status == "D" && (type == "create" || type == "copy"))
    {
		nlapiSetLineItemDisabled("line","account",true);
	}
	
	//**** Just chaching in the data to speed up the checkbox selection. (I mean NS will act faster next time when Lookup fired for the same query)
	_defaultAccount = ctx.getSetting("SCRIPT", "custscript_nsi_default_account");
	var default_account_name=nlapiLookupField("Account",_defaultAccount,"name");	
	//nlapiDisableField("custpage_first_line_account", true);
    //nlapiDisableField("custbody_tsa_nsichequenum", true);
    nlapiSetFieldDisplay("custpage_first_line_account",false);
    nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
  	var sentby_cheque = nlapiGetFieldValue("custbody_tsa_sentbycheque");
    var sentby_cash = nlapiGetFieldValue("custbodytsa_sentbycash");
	var sentby_bank = nlapiGetFieldValue("custbody_tsa_sentbybankcr");
  
    if(sentby_cheque=="T"){
  		nlapiSetFieldDisplay("custbody_tsa_nsichequenum",true);
		//nlapiDisableField("custbody_tsa_nsichequenum", false);      
        nlapiSetFieldDisplay("custpage_first_line_account",false);
        //nlapiDisableField("custpage_first_line_account", true);
    }
    if(sentby_bank=="T"){
  		nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
		//nlapiDisableField("custbody_tsa_nsichequenum", true);
        nlapiSetFieldDisplay("custpage_first_line_account",true);
        //nlapiDisableField("custpage_first_line_account", false);
        
		if(type == "edit") // 05/03/2019 Viktor S. populate account select list in case of EDIT 
    	{
            nlapiSelectLineItem("line",1);
            //nlapiSetLineItemDisabled("line","account",false);
            var account_current = nlapiGetCurrentLineItemValue("line", "account");
          	nlapiSetFieldValue("custpage_first_line_account",account_current,true,false);

		}
      
        
    }
    if(sentby_cash=="T"){
  		nlapiSetFieldDisplay("custbody_tsa_nsichequenum",false);
		//nlapiDisableField("custbody_tsa_nsichequenum", true);      
        nlapiSetFieldDisplay("custpage_first_line_account",false);
        //nlapiDisableField("custpage_first_line_account", true);
    }
  
	//****
	
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
	var defaultRole = ["1071", "1066"]; // Why don't use RoleId ??? Viktor S. 20/01/2019 *here*
	_isEditableRole = ( defaultRole.indexOf(ctx.getRole()) > -1 ? true : false );
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
function loadAccount()
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

	loadAccount();
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
		// If Non Sales Income status is not Pending Submission
		if(nsiStatus != "D")
		{
			// Disabled Debit fields
			nlapiSetLineItemDisabled("line","debit",true);
			nlapiSetLineItemDisabled("line","credit",true); // disable credit as well, otherwise entering there could clear the debit field - Viktor S. 
			// Enable Account field
			nlapiSetLineItemDisabled("line", "account", false);
		}
		else
		{
			// Enable Account field. // Actually, it disables the Account field... Viktor S. 
			nlapiSetLineItemDisabled("line","account", true);
		}

		// If current user role is in editable role list
		// and status is Pending Submission
		if(_isEditableRole && nsiStatus != "D")
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