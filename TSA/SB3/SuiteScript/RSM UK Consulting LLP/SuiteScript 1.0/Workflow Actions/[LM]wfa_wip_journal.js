/****************************************************************************************
 * Name:		SuiteScript 1.0 Workflow Action ([LM]wfa_wip_journal.js)
 *
 * Script Type:	Workflow Action
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
 * @returns {Void} Any or no return value
 */
function createJournalAction() {

	var accountList = new Array();
	var lineList = new Array();
	var newRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
	for(var line = 1, linecount = newRecord.getLineItemCount("line"); line < linecount; line++){
		var account = newRecord.getLineItemValue("line", "account", line);
		accountList.push(account);
		lineList[account] = {
			linenum : line
		};
	}

	var wipAccountFilter = new nlobjSearchFilter("custrecord_wip_account", null, "anyof", accountList, null);
	wipAccountFilter.setLeftParens();
	wipAccountFilter.setOr(true);

	var allAccountFilter = new nlobjSearchFilter("custrecord_wip_account", null, "anyof", "117", null);
	allAccountFilter.setRightParens();

	var filters = [wipAccountFilter, allAccountFilter];
	filters.push( new nlobjSearchFilter("custrecord_wip_account", null, "anyof", accountList, null) );

	var results = nlapiSearchRecord(null,"customsearch_tsa_wip_mapping", filters);
	if(!results){
		throw nlapiCreateError("USER_ERROR", "Could not find mapping.", true);
	}

	var jeRecord = nlapiCreateRecord("journalentry");
	jeRecord.setFieldValue("approvalstatus", "2");

	for(var line = 1, linecount = newRecord.getLineItemCount("line"); line < linecount; line++){
		jeRecord.selectNewLineItem("line");
		jeRecord.setCurrentLineItemValue("line", "account", mapAccount);
		jeRecord.commitLineItem("line");
	}
	nlapiSubmitRecord(jeRecord, true, true);
}