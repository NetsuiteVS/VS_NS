/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_csvimport_journal.js)
 *
 * Script Type:	User Event
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
 * Context referenced globally
 */
var ctx = nlapiGetContext();

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 *
 * @appliedtorecord invoice
 *
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function onCsvJournalBeforeSubmit(type) {
  
  		//if (vs_lib10.userSubsidiaryIsIHQ()) return true;
		
  		var ouu_txn = nlapiGetFieldValue('custbody_tsa_oou_txn');
		if (ctx.getExecutionContext() == "csvimport" || ouu_txn=="T"){ }
        else{
          return;
		}
      
        try{
            var subs_reserve_journal_creation_enabled = nlapiGetFieldValue('custbody_subs_reserve_journal_setting');
            nlapiLogExecution("debug","onCSV Journal BeforeSubmit","Reserve checking: id="+nlapiGetRecordId()+" , subs reserve T journal enabled="+subs_reserve_journal_creation_enabled);
            if(subs_reserve_journal_creation_enabled!="T") {
                nlapiLogExecution("debug","onCSV Cash Sale BeforeSubmit","Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
                return true;
            }
        }
        catch(e){
            nlapiLogExecution("error","onCSV Cash Sale BeforeSubmit", JSON.stringify(e) );
        }

		if(type != "create" && type != "edit" && type != "xedit"){
			return;
		}
		var linecount = nlapiGetLineItemCount("line");
		for (var linenum = 1; linenum <= linecount; linenum++) {

			nlapiSelectLineItem("line", linenum);
			var account = nlapiGetCurrentLineItemValue("line", "account");
			var credit = parseFloat(nlapiGetCurrentLineItemValue("line", "credit"));
			var reserve = nlapiGetCurrentLineItemValue("line", "custcol_cseg_tsa_fundreserv");
			var reserveParent = "";
			if(reserve){
				reserveParent = nlapiLookupField(
					"customrecord_cseg_tsa_fundreserv", reserve,
					"parent", false);
			}

			var postObject = {
				accountId : account,
				reserve : reserveParent,
				recordType : "Journal",
				internalType : "1",
				side : (function(){
					return (credit > 0)? "1" : "2";
				}())
			};
			/**
			 * Request simulation object to call the Suitelet code
			 */
			var sletRequest = new SuiteletRequest(postObject);

			// CallBack object to capture the response from Suitelet code
			var SuiteletResponse = {};
			// Callback
			SuiteletResponse.write = function(response) {
				var objLine = JSON.parse(response);
				// If WIP mapping error then copy error to both the line and
				// body error fields
				if (objLine.error) {
					throw objLine.error;
				} else if (objLine.id) {
					// Update WIP Mapping record id on journal line
					nlapiSetCurrentLineItemValue("line",
							"custcol_tsa_wip_mapping", objLine.id);
					nlapiSetCurrentLineItemValue("item",
							"custcol_tsa_wip_mapping_error", "");
				}
				nlapiCommitLineItem("line");
			}
			// call post function on WIP Server Suitelet
			post(sletRequest, SuiteletResponse);
		}
}


/**
 * Fake the Suitelet Object to call Suitelet code from Workflow Action server script
 */
var SuiteletRequest = function(bodyObject){
	this.body = JSON.stringify(bodyObject);
};

/**
 * Send fake HTTP Request to Suitelet code
 * @param bodyObject
 */
SuiteletRequest.prototype.getBody = function(){
	return this.body;
};



/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function post(request, response){
	try{
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
			// Sale Transactions look at income account 
			if(["10","7","5", "29"].indexOf(objLine.internalType) > -1){
				objLine.accountId = nlapiLookupField("item", objLine.item, "incomeaccount", false);
			}
			else if(objLine.item){
			// Purchase Transactions look at asset account - the next 3 lines added by RSM as part of INC-1413 fix - remark by VS
                objLine.accountId = nlapiLookupField("item", objLine.item, "expenseaccount", false); 
			} 
			else if(objLine.item){ //fix ends
			// Purchase Transactions look at asset account 
                objLine.accountId = nlapiLookupField("item", objLine.item, "assetaccount", false);
			}
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

