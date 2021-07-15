/****************************************************************************************
 * Name:		SuiteScript 1.0 Suitelet ([LM]slet_wip_server.js)
 *
 * Script Type:	Suitelet
 *
 * Version:		2018.010 - Initial Release
 *
 * Author:		RSM
 *
 * Purpose:
 *
 * Script:
 * Deploy:
 *
 * Notes:
 *
 * Libraries:
 ****************************************************************************************/

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	if(request.getMethod() == "POST"){
		post(request, response);
	}
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function post(request, response){
	try{
		
		var CONST_ITEMTYPE = {
			'Assembly' : 'assemblyitem',
			'Description' : 'descriptionitem',
			'Discount' : 'discountitem',
			'GiftCert' : 'giftcertificateitem',
			'InvtPart' : 'inventoryitem',
			'Group' : 'itemgroup',
			'Kit' : 'kititem',
			'Markup' : 'markupitem',
			'NonInvtPart' : 'noninventoryitem',
			'OthCharge' : 'otherchargeitem',
			'Payment' : 'paymentitem',
			'Service' : 'serviceitem',
			'Subtotal' : 'subtotalitem'
		};

		var objLine = new ObjLine();
		var returnObj = {};
		nlapiLogExecution("DEBUG", "Input", request.getBody());
		try{
			objLine = JSON.parse(request.getBody());
		}
		catch(e){
			throw nlapiCreateError("USER_ERROR","Malformed Line Input.", true);
		}

		if(objLine.item){

			// Viktor S. 12/03/2019 custitem_tsa_vs_itemtype_4_scripting - non-stored, defaulted from type with a formula conversion to give the scriptable itemtype back.
			// I've re-developed the Sales and Purchase account "update" part to be able to handle inventory, non-inventory and discount items (and other items) as well.
			
			var itemtype = CONST_ITEMTYPE[nlapiLookupField('item', objLine.item, 'type', false)];
			//nlapiLookupField("item", objLine.item, "custitem_tsa_vs_itemtype_4_scripting", false); // we can't use that  formula sourced custom field because it is language dependent 30/04/2019 
			
			var item_record=nlapiLoadRecord(itemtype,objLine.item);
			nlapiLogExecution("debug","***WIP Server Suitelet***", " itemtype="+itemtype+" item_record="+JSON.stringify(item_record) );

			// Sale Transactions look at income account 
			if(["10","7","5", "29"].indexOf(objLine.internalType) > -1){ // remark added by V.S. - Invoice-7, Cash Sale-5, Credit Memo-10, Cash Refund-29 **** full list at the bottom of the script
				objLine.accountId = item_record.getFieldValue("incomeaccount");
				nlapiLogExecution("debug","***WIP Server Suitelet***", " Sales account id 1. objLine.accountId="+objLine.accountId);
				if(!objLine.accountId) objLine.accountId=item_record.getFieldValue("account");;
				nlapiLogExecution("debug","***WIP Server Suitelet***", " Sales account id 2. objLine.accountId="+objLine.accountId);
				//nlapiLookupField("item", objLine.item, "incomeaccount", false);
			}
			else if(objLine.item){
			// Purchase Transactions look at asset account 
				objLine.accountId=item_record.getFieldValue("assetaccount");
				nlapiLogExecution("debug","***WIP Server Suitelet***", " Purchase account id 1.search objLine.accountId="+objLine.accountId);
				if(!objLine.accountId) objLine.accountId=item_record.getFieldValue("expenseaccount");
				nlapiLogExecution("debug","***WIP Server Suitelet***", " Purchase account id 2.search objLine.accountId="+objLine.accountId);
				if(!objLine.accountId) objLine.accountId=item_record.getFieldValue("account");
				nlapiLogExecution("debug","***WIP Server Suitelet***", " Purchase account id 3.search objLine.accountId="+objLine.accountId);

                //objLine.accountId = nlapiLookupField("item", objLine.item, "assetaccount", false); 
			}
			else if(objLine.item){ // Viktor S. 12/03/2019 we don't need this I think
			// Purchase Transactions look at asset account 
            // objLine.accountId = nlapiLookupField("item", objLine.item, "assetaccount", false); //expenseaccount
			}
			// 12/03/2019 V.S. re-dev ends here ***
		}
		else if(objLine.category){
			objLine.accountId = nlapiLookupField("expensecategory", objLine.category, "account", false);
		}

		if(!objLine.accountId){
			throw nlapiCreateError("USER_ERROR","No Income/Asset account found on Item or Expense Category.", true);
		}

		// Get the account type
		objLine.account = getAccount(objLine.accountId);

		if(!isValid(objLine)){
			// allow transaction line to be saved
			returnObj.id = "";
			return response.write(JSON.stringify(returnObj));
		}

		var searchFilters = [[ ["custrecord_wip_account", "anyof", objLine.accountId], "OR",
		                       ["custrecord_wip_all_account", "is", "T"]
		                      ],"AND",
							  ["isinactive","is","F"],"AND",
							  ["custrecord_wip_transaction_type","anyof",objLine.internalType],"AND",
							["custrecord_wip_account_type","anyof",objLine.account.type ],"AND",
							["custrecord_wip_reserve_parent","anyof", objLine.reserve]
							];

		if(objLine.side){
			searchFilters.push("AND");
			searchFilters.push(["custrecord_wip_side","anyof", objLine.side]);
		}

		if(objLine.fxAsset){
			searchFilters.push("AND");
			searchFilters.push(["custrecord_wip_fixed_asset","anyof", objLine.account.fxacc]);
		}

		nlapiLogExecution("DEBUG", "Filters", JSON.stringify(searchFilters));
		var mappingResults = nlapiSearchRecord("customrecord_tsa_wip_mapping", null, searchFilters, null);
		if(mappingResults){
			if(mappingResults.length > 1)
				throw nlapiCreateError("MULIPLE_MAPPING", "MULIPLE_MAPPING", true);
			returnObj = {id : mappingResults[0].id};
		}else{
			throw nlapiCreateError("NO_MAPPING", "NO_MAPPING", true);
		}
		return response.write(JSON.stringify(returnObj));
	}catch(e){
		return response.write('{ "error" : "' + e.getDetails() + '" }');
	}
}

/**
 * Search account record and return with required fields
 * @param {string} id
 */
function getAccount(id){
	var results = nlapiSearchRecord("account", null,
			[new nlobjSearchFilter("internalid", null, "anyof", id)],
			[new nlobjSearchColumn("type"), new nlobjSearchColumn("custrecord_fam_account_showinfixedasset")]);

  var accountType = results[0].getValue("type");
  var accountTypeId = "";
  for(var x in accountsReference){
      if(accountType === accountsReference[x].text_type){
        accountTypeId = accountsReference[x].value;
        break;
      }
  }

	return {
		type : accountTypeId,
		fxacc : results[0].getValue("custrecord_fam_account_showinfixedasset")
	};
}

var ObjLine = function(){
	this.accountId = "";
	this.account = {};
	this.reserve = "";
	this.side = null;
}

/**
 * 
 * @param {ObjLine} objLine
 */
var isValid = function(lineObject){
	var valid = false;
	// Reserve Segment NOT Blank
	if(lineObject.reserve){
		valid = true;
	}
	// Reserve Segment is Blank
	else if(lineObject.internalType == "20" || lineObject.internalType == "17" || lineObject.internalType == "1"){
		if(lineObject.account.type == "4" && lineObject.account.fxacc == "1"){
			// 1 = Asset Account
			if(!lineObject.reserve){
				lineObject.reserve = "@NONE@";
			}
			valid = true;
		}
	}
	return valid;
}

var accountsReference = [
{"text_type":"Bank","text":"Bank","value":"1"},
{"text_type":"AcctRec","text":"Accounts Receivable","value":"2"},
{"text_type":"OthCurrAsset","text":"Other Current Asset","value":"3"},
{"text_type":"FixedAsset","text":"Fixed Asset","value":"4"},
{"text_type":"OthAsset","text":"Other Asset","value":"5"},
{"text_type":"AcctPay","text":"Accounts Payable","value":"6"},
{"text_type":"CredCard","text":"Credit Card","value":"7"},
{"text_type":"OthCurrLiab","text":"Other Current Liability","value":"8"},
{"text_type":"LongTermLiab","text":"Long Term Liability","value":"9"},
{"text_type":"Equity","text":"Reserves/Accumulated Surplus/Deficit","value":"4"},
{"text_type":"Income","text":"Income","value":"11"},
{"text_type":"COGS","text":"Cost of Goods Sold","value":"12"},
{"text_type":"Expense","text":"Expense","value":"13"},
{"text_type":"OthIncome","text":"Other Income","value":"14"},
{"text_type":"OthExpense","text":"Other Expense","value":"15"},
{"text_type":"DeferRevenue","text":"Deferred Revenue","value":"17"},
{"text_type":"DeferExpense","text":"Deferred Expense","value":"18"},
{"text_type":"UnbilledRec","text":"Unbilled Receivable","value":"19"},
{"text_type":"Stat","text":"Statistical","value":"20"}];


/*
Name	InternalID
Assembly Build	34
Assembly Unbuild	35
Bill	17
Bill CCard	19
Bill Credit	20
Bill Payment	18
Bin Putaway Worksheet	42
Bin Transfer	45
Cash Refund	29
Cash Sale	5
CCard Refund	22
Check	3
Commission	38
Credit Card	21
Credit Memo	10
Currency Revaluation	36
Customer Deposit	40
Customer Refund	30
Deposit	4
Deposit Application	41
Expense Report	28
Finance Charge	52
Inventory Adjustment	11
Inventory Cost Revaluation	51
Inventory Count	57
Inventory Distribution	14
Inventory Transfer	12
Inventory Worksheet	13
Invoice	7
Item Fulfillment	32
Item Receipt	16
Journal	1
Liability Adjustment	27
Opportunity	37
Paycheck	24
Paycheck Journal	56
Payment	9
Payroll Adjustment	26
Payroll Liability Check	25
Purchase Order	15
Quote	6
Return Authorization	33
Revenue Commitment	46
Revenue Commitment Reversal	47
Sales Order	31
Sales Tax Payment	23
Statement Charge	8
Tegata Payable	50
Tegata Receivables	49
Transfer	2
Transfer Order	48
Vendor Return Authorization	43
Work Order	44
*/


