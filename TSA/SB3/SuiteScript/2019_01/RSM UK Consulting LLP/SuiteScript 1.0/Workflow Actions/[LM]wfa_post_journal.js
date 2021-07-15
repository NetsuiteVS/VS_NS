/**
 * Module Description
 * Part of IOU custom development.
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Feb 2018     Leon Munir       RSM UK Consulting LLP
 *
 */

const SUBLIST = "line";

/**
 * @returns {Void} Any or no return value
 */
function postJournalAction() {
	try {
		var ctx = nlapiGetContext();

		// Get Amount
		var amount = ctx.getSetting("SCRIPT", "custscript_lm_iou_amount");
		var credit = ctx.getSetting("SCRIPT", "custscript_lm_iou_credit");
		var debit = ctx.getSetting("SCRIPT", "custscript_lm_iou_debit");
		var customform = ctx.getSetting("SCRIPT", "custscript_customform");

		// Collect data from current record
		//var iouRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		var iouResults = nlapiSearchRecord(nlapiGetRecordType(), null,
				[new nlobjSearchFilter("internalid", null, "anyof", nlapiGetRecordId()),
				 new nlobjSearchFilter("mainline", null, "is", "F")],
				 [new nlobjSearchColumn("account"),
				  new nlobjSearchColumn("subsidiary"),
				  new nlobjSearchColumn("currency"),
				  new nlobjSearchColumn("department"),
				  new nlobjSearchColumn("class"),
				  new nlobjSearchColumn("location"),
				  new nlobjSearchColumn("exchangerate")]);

		// Get Subsidiary Bank
		var results = nlapiSearchRecord("account", null,
				[new nlobjSearchFilter("subsidiary", null, "anyof", iouResults[0].getValue("subsidiary")),
				 new nlobjSearchFilter("custrecord_tsa_acc_currency", null, "contains", String(iouResults[0].getText("currency")) ),
				new nlobjSearchFilter("custrecord_tsa_default_iou", null, "is", "T")], null);

		if(!results){
			throw "No related IOU Bank Account found for the given Subsidiary";
		}
		else if(results.length > 1){
			throw "Multiple related IOU Bank Account found for the given Subsidiary";
		}

		// Create Journal Entry record
		var jeRecord = nlapiCreateRecord("journalentry", {recordmode : "dynamic"});
		jeRecord.setFieldValue("customform", customform);
		jeRecord.setFieldValue("subsidiary", iouResults[0].getValue("subsidiary"));
		jeRecord.setFieldValue("currency", iouResults[0].getValue("currency"));
		jeRecord.setFieldValue("custbody_tsa_linked_iou", nlapiGetRecordId());
		jeRecord.setFieldValue("approvalstatus" , "2");
		jeRecord.setFieldValue("exchangerate", iouResults[0].getValue("exchangerate"));
		
		jeRecord.selectNewLineItem(SUBLIST);
		// There is always only supposed to be one line on IOU transaction
		jeRecord.setCurrentLineItemValue(SUBLIST, "account", (debit == 1) ? '114' : results[0].id);
		jeRecord.setCurrentLineItemValue(SUBLIST, "debit", amount);
		jeRecord.setCurrentLineItemValue(SUBLIST, "department", iouResults[0].getValue("department"));
		jeRecord.setCurrentLineItemValue(SUBLIST, "class", iouResults[0].getValue("class"));
		jeRecord.commitLineItem(SUBLIST);

		jeRecord.selectNewLineItem(SUBLIST);
		// There is always only supposed to be one line on IOU transaction
		jeRecord.setCurrentLineItemValue(SUBLIST, "account", (credit == 1) ? '114' : results[0].id);
		jeRecord.setCurrentLineItemValue(SUBLIST, "credit", amount);
		jeRecord.setCurrentLineItemValue(SUBLIST, "department", iouResults[0].getValue("department"));
		jeRecord.setCurrentLineItemValue(SUBLIST, "class", iouResults[0].getValue("class"));
		jeRecord.commitLineItem(SUBLIST);
		nlapiSubmitRecord(jeRecord, true, true);
	} catch (e) {
		nlapiLogExecution("ERROR", "FATAL", e);
	}
}
