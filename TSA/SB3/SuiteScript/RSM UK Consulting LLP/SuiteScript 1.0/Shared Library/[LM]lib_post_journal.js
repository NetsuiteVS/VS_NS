/****************************************************************************************
 * Name:		SuiteScript 1.0 Library ([LM]lib_post_journal.js)
 *
 * Script Type:	Library File
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
 * Callback Function to be used with Array filter to get unique values
 */
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

/**
 * Expense Record global pointer object for Expense Report
 * To allow creation of Journals in different currencies
 * 
 * @type {Object}
 */
var ExpenseRecord = {
		/**
		 * Pointer to Record Type. Whether current record is an Expense Report
		 * @memberof ExpenseRecord
		 */
		isExpense : false,
		/**
		 * Pointer to Currency of the Expense Report line
		 * @memberof ExpenseRecord
		 */
		currencyPtr : "1",
		/**
		 * Pointer to Exchange Rate of the Expense Report line
		 * @memberof ExpenseRecord
		 */
		exRatePtr : 1.00,
		/**
		 * Get Unique Currencies from Expense Record
		 * @param {nlobjRecord} expenseRecord
		 * @param {Number} lines
		 * @return {Array} list of currency internalid
		 */
		getCurrencies : function(expenseRecord, lines){
			var currencyList = [];
			for (var i = 1; i <= lines; i++) {
				var objStr = JSON.stringify({
					currency : expenseRecord.getLineItemValue("expense", "currency", i),
					exRate : expenseRecord.getLineItemValue("expense", "exchangerate", i)
				});
				currencyList.push(objStr);
			}
          	//nlapiLogExecution("DEBUG", "lib_post_journals::getCurrencies",JSON.stringify(currencyList));
            //nlapiLogExecution("DEBUG", "lib_post_journals::onlyUnique",JSON.stringify(currencyList.filter(onlyUnique)));
			return currencyList.filter(onlyUnique);
		}
};

/**
 * Creates Journal Entry record line using object of values for fields
 * @param {nlobjRecord} journalRecord
 * @param {object} values
 */
function createLine(journalRecord, values){
	nlapiLogExecution("DEBUG", "lib_post_journal.js::createLine - Values",JSON.stringify(values));
	journalRecord.selectNewLineItem("line");
	journalRecord.setCurrentLineItemValue("line", "account",
			values.account);
	journalRecord.setCurrentLineItemValue("line", values.side, values.amount);
	journalRecord.setCurrentLineItemValue("line", "department",
			values.department);
	journalRecord.setCurrentLineItemValue("line", "class", values.class);
	journalRecord.setCurrentLineItemValue("line", "location", values.location);
	journalRecord.setCurrentLineItemValue("line",
			"custcol_cseg_tsa_relatedpar", values.relatedParty);
	journalRecord.setCurrentLineItemValue("line",
			"custcol_cseg_tsa_project", values.project);
	if(values.reserve){
		journalRecord.setCurrentLineItemValue("line",
				"custcol_cseg_tsa_fundreserv", values.reserve);
	}else if(values.originalReserve){
		journalRecord.setCurrentLineItemValue("line",
				"custcol_cseg_tsa_fundreserv", values.originalReserve);
	}
	journalRecord.commitLineItem("line", false);
}


/**
 * Creates Reserve Transfer Journal Entry record
 * 
 * @param {nlobjRecord} currentRecord
 * @param {String} sublistId
 * 
 */
function postJournal(currentRecord, sublistId) {
	try {
		var lineCount = currentRecord.getLineItemCount(sublistId);
		if(lineCount < 1)
			return;

		var bodyFields = {
			subsidiary : currentRecord.getFieldValue("subsidiary"),
			currency : currentRecord.getFieldValue("currency"),
			date : currentRecord.getFieldValue("trandate"),
			department : currentRecord.getFieldValue("department"),
			class : currentRecord.getFieldValue("class"),
			location : currentRecord.getFieldValue("location"),
            exRate : currentRecord.getFieldValue("exchangerate")
		};

		nlapiLogExecution("DEBUG", "lib_post_journal.js::postJournal - Body Fields",JSON.stringify(bodyFields));

		/**
		 * Reserve Transfer Journal Entry Record
		 * @type {nlobjRecord}
		 */
		var jeRecord = nlapiCreateRecord("journalentry", null);
        jeRecord.setFieldValue("customform", nlapiGetContext().getSetting("SCRIPT","custscript_tsa_wip_journal_form"));
		jeRecord.setFieldValue("trandate", bodyFields.date);
		jeRecord.setFieldValue("subsidiary", bodyFields.subsidiary);

		// Expense Report, the currency and exchange rates
		// are not available at body level
		jeRecord.setFieldValue("currency", bodyFields.currency);
		jeRecord.setFieldValue("exchangerate", bodyFields.exRate);

		/*nlapiLogExecution("DEBUG", "IS Expense Report", ExpenseRecord.isExpense);
		nlapiLogExecution("DEBUG", "Expense Currency", ExpenseRecord.currencyPtr);
		nlapiLogExecution("DEBUG", "Expense Rate", ExpenseRecord.exRatePtr);*/
		if(ExpenseRecord.isExpense){
			jeRecord.setFieldValue("currency", ExpenseRecord.currencyPtr);
			jeRecord.setFieldValue("exchangerate", ExpenseRecord.exRatePtr);
		}

        jeRecord.setFieldValue("approvalstatus", "2");
		jeRecord.setFieldValue("custbody_tsa_wip_transfer_complete", "T");
		jeRecord.setFieldValue("custbody_wip_source_transaction", currentRecord
				.getId());
		
      	nlapiLogExecution("DEBUG", "lib_post_journal.js::postJournal","lineCount="+lineCount);
      
		for (var i = 1; i <= lineCount; i++) {

			var mappingRecordId = currentRecord.getLineItemValue(sublistId,
					"custcol_tsa_wip_mapping", i);
            nlapiLogExecution("DEBUG", "lib_post_journal.js::postJournal","mappingRecordId="+mappingRecordId);
			if (!mappingRecordId)
				continue;

			var lineCurrency = currentRecord.getLineItemValue(sublistId, "currency", i);
			var lineRate = currentRecord.getLineItemValue(sublistId, "exchangerate", i);
			
			if(ExpenseRecord.isExpense && lineCurrency != ExpenseRecord.currencyPtr){
				continue;
			}

			if(ExpenseRecord.isExpense && lineRate != ExpenseRecord.exRatePtr){
				continue;
			}

			/**
			 * Collect Field values required to create Journal Entry line
			 * @type {Object}
			 */
			var values = {};
			values.amount = currentRecord.getLineItemValue(sublistId, "amount", i);

			if (!values.amount) {
				values.amount = currentRecord.getLineItemValue(sublistId, "debit", i);
			}

			if (!values.amount) {
				values.amount = currentRecord.getLineItemValue(sublistId, "credit", i);
			}

			var fxamount = currentRecord.getLineItemValue(sublistId, "foreignamount", i);
			if(ExpenseRecord.isExpense && fxamount){
				values.amount = fxamount;
			}

			values.department = currentRecord.getLineItemValue(sublistId,
					"department", i) || bodyFields.department;
			values.class = currentRecord.getLineItemValue(sublistId, "class", i) || bodyFields.class;
			values.location = currentRecord.getLineItemValue(sublistId,
					"location", i) || bodyFields.location;
			values.relatedParty = currentRecord.getLineItemValue(sublistId,
					"custcol_cseg_tsa_relatedpar", i);
			values.project = currentRecord.getLineItemValue(sublistId,
					"custcol_cseg_tsa_project", i);
			values.reserve = currentRecord.getLineItemValue(sublistId,
					"custcol_cseg_tsa_fundreserv", i);
			values.originalReserve = values.reserve;

			var mappingFields = nlapiLookupField(
					"customrecord_tsa_wip_mapping", mappingRecordId, [
							"custrecord_wip_debit_reserve","custrecord_wip_credit_reserve",
							"custrecord_wip_debit", "custrecord_wip_credit",
							"custrecord_wip_debit_reserve_2","custrecord_wip_credit_reserve_2",
							"custrecord_wip_debit_2", "custrecord_wip_credit_2",
							"custrecord_wip_debit_reserve_3","custrecord_wip_credit_reserve_3",
							"custrecord_wip_debit_3", "custrecord_wip_credit_3"], false);

			nlapiLogExecution("DEBUG", "Mapping Fields",JSON.stringify(mappingFields));
			// Debit Line
			values.account = mappingFields.custrecord_wip_debit;
			values.side = "debit";
			values.reserve = mappingFields.custrecord_wip_debit_reserve;
			createLine(jeRecord, values);

			// Credit Line
			values.account = mappingFields.custrecord_wip_credit;
			values.side = "credit";
			values.reserve = mappingFields.custrecord_wip_credit_reserve;
			createLine(jeRecord, values);

			// Second Journal
			if(mappingFields.custrecord_wip_debit_2 && mappingFields.custrecord_wip_credit_2){
				// Debit 2 Line
				values.account = mappingFields.custrecord_wip_debit_2;
				values.side = "debit";
				values.reserve = mappingFields.custrecord_wip_debit_reserve_2;
				createLine(jeRecord, values);

				// Credit 2 Line
				values.account = mappingFields.custrecord_wip_credit_2;
				values.side = "credit";
				values.reserve = mappingFields.custrecord_wip_credit_reserve_2;
				createLine(jeRecord, values);
			}

			// Third Journal
			if(mappingFields.custrecord_wip_debit_3 && mappingFields.custrecord_wip_credit_3){
				// Debit 3 Line
				values.account = mappingFields.custrecord_wip_debit_3;
				values.side = "debit";
				values.reserve = mappingFields.custrecord_wip_debit_reserve_3;
				createLine(jeRecord, values);

				// Credit 3 Line
				values.account = mappingFields.custrecord_wip_credit_3;
				values.side = "credit";
				values.reserve = mappingFields.custrecord_wip_credit_reserve_3;
				createLine(jeRecord, values);
			}
		}
		if(jeRecord.getLineItemCount("line") > 0){
			nlapiSubmitRecord(jeRecord, true, true);
		}
	} catch (e) {
		nlapiLogExecution("DEBUG", "Errored Record", currentRecord.getId());
		nlapiLogExecution("DEBUG", "Error Creating JE", e);
	}
}
