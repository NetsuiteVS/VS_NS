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
    if (ctx.getExecutionContext() == "csvimport" || ouu_txn == "T") { }
    else {
        return;
    }

    try {
        var subs_reserve_journal_creation_enabled = nlapiGetFieldValue('custbody_subs_reserve_journal_setting');
        nlapiLogExecution("debug", "onCSV Journal BeforeSubmit", "Reserve checking: id=" + nlapiGetRecordId() + " , subs reserve T journal enabled=" + subs_reserve_journal_creation_enabled);
        if (subs_reserve_journal_creation_enabled != "T") {
            nlapiLogExecution("debug", "onCSV Cash Sale BeforeSubmit", "Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
            return true;
        }
    }
    catch (e) {
        nlapiLogExecution("error", "onCSV Cash Sale BeforeSubmit", JSON.stringify(e));
    }

    if (type != "create" && type != "edit" && type != "xedit") {
        return;
    }
    var linecount = nlapiGetLineItemCount("line");

    var postObjectArray = [];

    //Init filter arrays. 0 is a non used init value, so we don't have to check if array is empty.
    var reserveFilterArray = ["0"];
    var accountFilterArray = ["0"];
    var accountTypeFilterArray = ["0"];
    var reserveParentFilterArray = ["@NONE@"];
    var sideFilterArray = ["0"];

    //Init postObjects
    for (var linenum = 1; linenum <= linecount; linenum++) {

        nlapiSelectLineItem("line", linenum);
        var account = nlapiGetCurrentLineItemValue("line", "account");
        var credit = parseFloat(nlapiGetCurrentLineItemValue("line", "credit"));
        var reserve = nlapiGetCurrentLineItemValue("line", "custcol_cseg_tsa_fundreserv");
        //nlapiLogExecution("DEBUG", "reserve", JSON.stringify(reserve));

        var postObject = {
            accountId: account,
            accountType: null,
            fxAccount: null,
            isValid: false,
            reserve: reserve ? reserve : "@NONE@",
            reserveParent: null,
            recordType: "Journal",
            //internalType: "1",
            side: (function () { return (credit > 0) ? "1" : "2"; }()),
            mappingResultIds: []
        };

        if (reserve) {
            reserveFilterArray.push(reserve);
        }
        accountFilterArray.push(postObject.accountId);
        postObjectArray.push(postObject);
    }

    //Get reserve
    nlapiLogExecution("DEBUG", "reserveFilterArray", JSON.stringify(reserveFilterArray));
    var reserveParentSearch = nlapiSearchRecord("customrecord_cseg_tsa_fundreserv", null,
        [["internalid", "anyof", reserveFilterArray]],
        [new nlobjSearchColumn("parent")]
    );

    for (var i = 0; reserveParentSearch != null && i < reserveParentSearch.length; i++) {

        var searchresult = reserveParentSearch[i];
        var reserveInternalId = reserveParentSearch[i].getId();
        var columns = searchresult.getAllColumns();

        for (var j = 0; j < postObjectArray.length; j++) {
            if (postObjectArray[j].reserve == reserveInternalId) {
                postObjectArray[j].reserveParent = searchresult.getValue(columns[0]);
            }
        }
    }

    var results = nlapiSearchRecord("account", null,
        [new nlobjSearchFilter("internalid", null, "anyof", accountFilterArray)],
        [new nlobjSearchColumn("type"), new nlobjSearchColumn("custrecord_fam_account_showinfixedasset")]);
    nlapiLogExecution("DEBUG", "results", JSON.stringify(results));

    //Set fxAccount, accountType and isValid properties
    for (var i = 0; results != null && i < results.length; i++) {

        //Find the postObject based on internalId
        var searchresult = results[i];
        var internalId = results[i].getId();
        var columns = searchresult.getAllColumns();

        //nlapiLogExecution("DEBUG", "internalId", internalId);
        var currentPostObject;
        for (var j = 0; j < postObjectArray.length; j++) {
            if (postObjectArray[j].accountId == internalId) {
                currentPostObject = postObjectArray[j];

                currentPostObject.fxAccount = searchresult.getValue(columns[1]);
                var accountType = searchresult.getValue(columns[0]);
                currentPostObject.accountType = "";
                for (var x in accountsReference) {
                    if (accountType === accountsReference[x].text_type) {
                        currentPostObject.accountType = accountsReference[x].value;
                        break;
                    }
                }

                currentPostObject.isValid = isValid(currentPostObject);
                //nlapiLogExecution("DEBUG", "currentPostObject", JSON.stringify(currentPostObject));
            }
        }
    }

    //Create filter arrays
    accountFilterArray = ["0"];//Set to default
    for (var i = 0; i < postObjectArray.length; i++) {

        if (postObjectArray[i].isValid) {
            if (accountFilterArray.indexOf(postObjectArray[i].accountId) == -1) accountFilterArray.push(postObjectArray[i].accountId);
            if (postObjectArray[i].reserveParent && reserveParentFilterArray.indexOf(postObjectArray[i].reserveParent) == -1) reserveParentFilterArray.push(postObjectArray[i].reserveParent);
            if (sideFilterArray.indexOf(postObjectArray[i].side) == -1) sideFilterArray.push(postObjectArray[i].side);
            if (accountTypeFilterArray.indexOf(postObjectArray[i].accountType) == -1) accountTypeFilterArray.push(postObjectArray[i].accountType);
        }
    }

    //Create search filter
    var searchFilters = [
        [["custrecord_wip_account", "anyof", accountFilterArray], "OR", ["custrecord_wip_all_account", "is", "T"]], "AND",
        ["isinactive", "is", "F"], "AND",
        ["custrecord_wip_transaction_type", "anyof", "1"], "AND",
        ["custrecord_wip_account_type", "anyof", accountTypeFilterArray], "AND",
        ["custrecord_wip_reserve_parent", "anyof", reserveParentFilterArray], "AND",
        ["custrecord_wip_side", "anyof", sideFilterArray]
    ];
    nlapiLogExecution("DEBUG", "Filters", JSON.stringify(searchFilters));

    var mappingResults = nlapiSearchRecord("customrecord_tsa_wip_mapping", null, searchFilters,
        [
            new nlobjSearchColumn("custrecord_wip_account"),
            new nlobjSearchColumn("custrecord_wip_account_type"),
            new nlobjSearchColumn("custrecord_wip_reserve_parent"),
            new nlobjSearchColumn("custrecord_wip_side"),
            new nlobjSearchColumn("custrecord_wip_all_account")
        ]
    );

    //Create searchable mappingResult array
    var mappingResultArray = [];
    //nlapiLogExecution("DEBUG", "mappingResults.length", JSON.stringify(mappingResults.length));
    nlapiLogExecution("DEBUG", "mappingResults", JSON.stringify(mappingResults));
    for (var i = 0; mappingResults != null && i < mappingResults.length; i++) {

        var searchresult = mappingResults[i];
        var columns = searchresult.getAllColumns();
        var mappingId = searchresult.getId();

        var identifier1 = searchresult.getValue(columns[0]) + ";" + searchresult.getValue(columns[1]).split(",")[0] + ";" + searchresult.getValue(columns[2]) + ";" + searchresult.getValue(columns[3]);
        var identifier2 = searchresult.getValue(columns[4]) + ";" + searchresult.getValue(columns[1]).split(",")[0] + ";" + searchresult.getValue(columns[2]) + ";" + searchresult.getValue(columns[3]);
        //nlapiLogExecution("DEBUG", "identifier1", JSON.stringify(identifier1));
        //nlapiLogExecution("DEBUG", "identifier2", JSON.stringify(identifier2));
        if (!mappingResultArray.hasOwnProperty(identifier1)) {
            mappingResultArray[identifier1] = [];
        }
        if (!mappingResultArray.hasOwnProperty(identifier2)) {
            mappingResultArray[identifier2] = [];
        }

        mappingResultArray[identifier1].push(mappingId);
        mappingResultArray[identifier2].push(mappingId);
        //nlapiLogExecution("DEBUG", "mappingResultArray[identifier1]", mappingResultArray[identifier1]);
        //nlapiLogExecution("DEBUG", "mappingResultArray[identifier2]", mappingResultArray[identifier2]);
    }

    for (var i = 0; i < postObjectArray.length; i++) {

        var postObjectIdentifier1 = postObjectArray[i].accountId + ";" + postObjectArray[i].accountType + ";" + postObjectArray[i].reserveParent + ";" + postObjectArray[i].side;
        var postObjectIdentifier2 = "T" + ";" + postObjectArray[i].accountType + ";" + postObjectArray[i].reserveParent + ";" + postObjectArray[i].side;
        //nlapiLogExecution("DEBUG", "postObjectIdentifier1", JSON.stringify(postObjectIdentifier1));
        //nlapiLogExecution("DEBUG", "postObjectIdentifier2", JSON.stringify(postObjectIdentifier2));

        if (mappingResultArray.hasOwnProperty(postObjectIdentifier1)) {
            postObjectArray[i].mappingResultIds = mappingResultArray[postObjectIdentifier1];
            //nlapiLogExecution("DEBUG", "mappingResultArray[postObjectIdentifier1]", mappingResultArray[postObjectIdentifier1]);
        }
        else if (mappingResultArray.hasOwnProperty(postObjectIdentifier2)) {
            postObjectArray[i].mappingResultIds = mappingResultArray[postObjectIdentifier2];
            //nlapiLogExecution("DEBUG", "mappingResultArray[postObjectIdentifier2]", mappingResultArray[postObjectIdentifier2]);
        }
        //nlapiLogExecution("DEBUG", "postObjectArray[i].mappingResultIds", postObjectArray[i].mappingResultIds);
    }

    for (var i = 0; i < postObjectArray.length; i++) {

        /**
         * Request simulation object to call the Suitelet code
         */
        var sletRequest = new SuiteletRequest(postObjectArray[i]);

        // CallBack object to capture the response from Suitelet code
        var SuiteletResponse = {};
        // Callback
        SuiteletResponse.write = function (response) {
            var objLine = JSON.parse(response);
            // If WIP mapping error then copy error to both the line and
            // body error fields
            if (objLine.error) {
                throw objLine.error;
            } else if (objLine.id) {
                // Update WIP Mapping record id on journal line
                nlapiSetCurrentLineItemValue("line", "custcol_tsa_wip_mapping", objLine.id);
                nlapiSetCurrentLineItemValue("line", "custcol_tsa_wip_mapping_error", "");
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
		//nlapiLogExecution("DEBUG", "Input", request.getBody());
		try{
			objLine = JSON.parse(request.getBody());
		}
		catch(e){
			throw nlapiCreateError("USER_ERROR","Malformed Line Input.", true);
		}

        if (!objLine.isValid) {
            // allow transaction line to be saved
            returnObj.id = "";
            return response.write(JSON.stringify(returnObj));
        }

        if (objLine.mappingResultIds.length > 0) {
            if (objLine.mappingResultIds.length > 1)
				throw nlapiCreateError("MULIPLE_MAPPING", "MULIPLE_MAPPING", true);
            returnObj = { id: objLine.mappingResultIds[0] };
		}else{
			throw nlapiCreateError("NO_MAPPING", "NO_MAPPING", true);
		}
		return response.write(JSON.stringify(returnObj));
	}catch(e){
		return response.write('{ "error" : "' + e.getDetails() + '" }');
	}
}

var ObjLine = function () {
    this.accountId = "";
    this.accountType = "";
    this.fxAccount = null;
    this.isValid = false;
    this.reserve = "";
    this.reserveParent = null;
    this.side = null;
    this.mappingResultIds = [];
}


/**
 * 
 * @param {ObjLine} objLine
 */
var isValid = function (lineObject) {
    var valid = false;
    // Reserve Segment NOT Blank
    if (lineObject.reserveParent) {
        valid = true;
    }
    // Reserve Segment is Blank
    else if (lineObject.accountType == "4" && lineObject.fxAccount == "1") { //1=asset account - SHOW IN FIXED ASSETS MANAGEMENT
        if (!lineObject.reserveParent) {
            lineObject.reserveParent = "@NONE@";
        }
        valid = true;
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

