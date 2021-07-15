/****************************************************************************************
 * Name:		SuiteScript 1.0 Scheduled ([LM]sch_depreciation_journal.js)
 *
 * Script Type:	Scheduled
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
 * CONSTANTS
 */

var SUBLIST_LINE = "line";
/**
 * Journal Entry record fields.
 * For reference only
 * @type {Object}
 */
var JE = Object.freeze({
	BODY_FIEDLS : {
		MAPPING_ERROR : "custbody_tsa_wip_mapping_error"
	},
	LINE_FIELDS : {
		ACCOUNT : "account",
		MAPPING_ID : "custcol_tsa_wip_mapping",
		MAPPING_ERROR : "custcol_tsa_wip_mapping_error",
		RESERVE : "custcol_cseg_tsa_fundreserv"
	}
});

/**
 * Context reference to create logs and get script parameter data
 */
var ctx = nlapiGetContext();
/**
 * Globally store Journal Entry internal id so it can be used in different functions
 */
var jeInternalID = "";

/**
 * Main Scheduled Script function
 *
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	nlapiLogExecution("DEBUG", "Start Usage", ctx.getRemainingUsage());
	try {
		// Get Journal Entry Internal Id from Script Parameter
		jeInternalID = ctx.getSetting("SCRIPT","custscript_lm_depje_internalid");
		if(jeInternalID){
			updateJournalEntryRecord();
		}
	} catch (exception) {
		nlapiLogExecution("ERROR", "FATAL", exception);
	}
	nlapiLogExecution("DEBUG", "End Usage", ctx.getRemainingUsage());
}


function updateJournalEntryRecord(){

	// Load Journal Entry record
	var jeRecord = nlapiLoadRecord("journalentry", jeInternalID, {recordmode : 'dynamic'});
	jeRecord.setFieldValue("custbody_tsa_depreciation_inprogress", "F");
	// Journal Entry Line Sublist number of lines
	var lineCount = lineCount = jeRecord.getLineItemCount(SUBLIST_LINE);
	for (var line = 1; line <= lineCount; line++) {
		jeRecord.selectLineItem(SUBLIST_LINE, line);

		var acc_type=jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "custcol_tsa_account_type");
		nlapiLogExecution("DEBUG", "", "Account Type="+acc_type);
		if( acc_type == "4"){
			nlapiLogExecution("DEBUG", "", "Account Type=4 - skipped"); //4 - Other Curr Assets
			continue;
          /* Account type codes are: 0 - Bank 1 - Accts Receivable 2 - Inventory 4 - Other Curr Assets 5 - Fixed Assets 6 - Accum Deprec. 8 - Other Assets 10 - Accts Payable 12 - Oth Curr Liab. 14 - Long Term Liab. 16 - Equity-No Close 18 - Retained Earnings 19 - Equity-Closes 21 - Income 23 - COGS 24 - Expense 25 - Other Income 26 - Other Expense */
		}

		/**
		 * Journal Entry Line Account Internal ID
		 */
		var accountId = jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "account");
		/**
		 * Journal Entry Line Memo String
		 * @type {string}
		 */
		var memo = jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "memo");
		/**
		 * Internal ID of Reserve linked to Asset Type
		 */
		var assetTypeReserve = null;

		// Asset Revaluation Journal Entry contains name of the Asset in memo field
		// on Journal Entry lines e.g. FAM00038
		var matches = String(memo).match(/FAM\d+/);
      	nlapiLogExecution("DEBUG", "","matches="+matches);
		if(matches){
			// Extract Asset Name from Memo field
			var assetName = matches.pop();
          	nlapiLogExecution("DEBUG", "","assetName="+assetName);
			// Search Asset record using the name field to get the linked Asset Type
			var assetResults = nlapiSearchRecord("customrecord_ncfar_asset", null, 
					[new nlobjSearchFilter("idtext", null, "is", assetName)],
					[new nlobjSearchColumn("custrecord_assettype")]);
          	nlapiLogExecution("DEBUG", "assetResults", JSON.stringify(assetResults) );
			if(assetResults){
				var assetType = new AssetType();
				assetType.id = assetResults[0].getValue("custrecord_assettype");
				assetTypeReserve = assetType.getReserve();
              	nlapiLogExecution("DEBUG", "","1. assetTypeReserve="+assetTypeReserve);
			}
		}
		else{
			assetTypeReserve = (new AssetType(accountId)).getReserve();
          	nlapiLogExecution("DEBUG", "","2. assetTypeReserve="+assetTypeReserve);
		}

		// If no reserve is found then log the error and continue to next line
		if(!assetTypeReserve){
			nlapiLogExecution("DEBUG", "No Reserve Found", accountId);
            jeRecord.setCurrentLineItemValue(
					SUBLIST_LINE,
					"custcol_tsa_wip_mapping_error",
					"No Reserve Found"
				);
          	jeRecord.setFieldValue("custbody_tsa_wip_mapping_error", "No Reserve Found");
            jeRecord.commitLineItem(SUBLIST_LINE);
			continue;
		}

		// Update Reserve segment on Journal Entry Line
		jeRecord.setCurrentLineItemValue(
			SUBLIST_LINE,
			"custcol_cseg_tsa_fundreserv",
			assetTypeReserve
		);

		/**
		 * Parent Internal Id of Reserve linked to Asset Type of Account on the Journal Entry line
		 * @type {string}
		 */
		var reserveParent = nlapiLookupField("customrecord_cseg_tsa_fundreserv", assetTypeReserve, "parent", false);

		// Create Post object to be posted as request body to Suitelet post function
		var postObject = {
				accountId : jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "account"),
				reserve : reserveParent,
				recordType : "Journal",
				internalType : "1",
				fxAsset : true,
				side : 2
		};

		/**
		 * Request simulation object to call the Suitelet code
		 */
		var sletRequest = new SuiteletRequest(postObject);

		/**
		 * CallBack object to capture the response from Suitelet code
		 */
		var SuiteletResponse = {};
		// Callback
		SuiteletResponse.write = function(response){
			var objLine = JSON.parse(response);
			// If WIP mapping error then copy error to both the line and body error fields
			if(objLine.error){
				jeRecord.setFieldValue("custbody_tsa_wip_mapping_error", objLine.error);
				jeRecord.setCurrentLineItemValue(
					SUBLIST_LINE,
					"custcol_tsa_wip_mapping_error",
					objLine.error
				);
			}
			else if(objLine.id){
			// Update WIP Mapping record id on journal line
				jeRecord.setCurrentLineItemValue(
					SUBLIST_LINE,
					"custcol_tsa_wip_mapping",
					objLine.id
				);
			}
		}
		// call post function on WIP Server Suitelet
		post(sletRequest, SuiteletResponse);
		jeRecord.commitLineItem(SUBLIST_LINE);
	}
	nlapiSubmitRecord(jeRecord, true, true);
}
