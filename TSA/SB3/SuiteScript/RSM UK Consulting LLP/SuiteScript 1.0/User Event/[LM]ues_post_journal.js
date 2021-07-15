/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_post_journal.js)
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
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function recordOnAfterSubmit(type){
	try {
      if(type != "create" && type != "edit" && type != "xedit") return;
      if(nlapiGetFieldValue("custbody_tsa_wip_transfer_complete") == "T") {
        nlapiLogExecution("DEBUG", "ues_post_journals","custbody_tsa_wip_transfer_complete=true - exit");
        return;
      }
      
		var posting = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), "posting", false);
		if (posting != "T")
          	nlapiLogExecution("DEBUG", "ues_post_journals",nlapiGetRecordId()+" - Transaction is not posted - exit");
			return;
		var results = nlapiSearchRecord("journalentry", null,
				[new nlobjSearchFilter("custbody_wip_source_transaction", null, "anyof", nlapiGetNewRecord().getId())], null);
		if(results){
          	nlapiLogExecution("DEBUG", "ues_post_journals","Transfer Journal Found - exit");
			return;
        }
		postJournal(nlapiGetNewRecord(), "line");
      	nlapiLogExecution("DEBUG", "ues_post_journals","Tried to post Journal on Lines");
		postJournal(nlapiGetNewRecord(), "item");
      	nlapiLogExecution("DEBUG", "ues_post_journals","Tried to post Journal on Item");

		var transactionRecord = nlapiGetNewRecord();
		var lineCount = transactionRecord.getLineItemCount("expense");
		if(lineCount > -1 && transactionRecord.getRecordType() == "expensereport"){
			// Mark the pointer to say that it is expense report.
			ExpenseRecord.isExpense = true;
			// Get list of distinct currencies and exrate from record
			var expCurrencyList = ExpenseRecord.getCurrencies(transactionRecord, lineCount);
			// Loop through found currencies
			nlapiLogExecution("DEBUG", "ues_post_journals::expCurrencyList",JSON.stringify(expCurrencyList));
			for(var idx = 0; idx < expCurrencyList.length; idx++){
				// Set Expense pointer to current currency and exchange rate
				var objExpense = JSON.parse(expCurrencyList[idx]);
              	nlapiLogExecution("DEBUG", "ues_post_journals::objExpense",JSON.stringify(objExpense));
				ExpenseRecord.currencyPtr = objExpense.currency;
				ExpenseRecord.exRatePtr = objExpense.exRate;
				// Generate Journal per currency and exchange rate
				postJournal(transactionRecord, "expense");
			}
		}else if(lineCount > -1){
			postJournal(transactionRecord, "expense");
		}
	} catch (e) {
		nlapiLogExecution("DEBUG", "Errored Record", nlapiGetNewRecord().getId());
		nlapiLogExecution("DEBUG", "FATAL", e);
	}
}
