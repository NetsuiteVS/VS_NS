/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_post_journal.js)
 *
 * Script Type:	User Event
 *
 * Version:		2018.010 - Initial Release
 *
 * Author:		RSM
 * 				Viktor S. added comments...
 * 				Viktor S. 05/06/2019 Added Suitelet call functionality to create Reserve Journals due to triggering WFs on Reserve Journals
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

function callPostJournalSuitlelet(newRecord, sublistId, discountrate) {
	var newRecordJson = JSON.parse(JSON.stringify(newRecord));

  	//nlapiLogExecution("DEBUG", "sublist id= " + sublistId , "");
	nlapiLogExecution("DEBUG", "Post Journal","suitelet call started sublist="+sublistId);
    if (nlapiGetNewRecord().getLineItemCount(sublistId) > 0) {

      	nlapiSubmitField( nlapiGetRecordType(), nlapiGetRecordId(), "custbody_tsa_reserve_initiated", "T", "F" );
        //nlapiLogExecution("DEBUG", "linecount(" + sublistId + ")", ">0");

        //Add neccessary fields...
        newRecordJson["customform"] = nlapiGetContext().getSetting("SCRIPT", "custscript_tsa_wip_journal_form_2");
        newRecordJson["sublistId"] = sublistId;  // newRecordJson["sublistId"] = "line";
        newRecordJson["recordId"] = newRecord.getId();
		newRecordJson["exp_isExpense"] = ExpenseRecord.isExpense;
		newRecordJson["exp_currencyPtr"] = ExpenseRecord.currencyPtr;
		newRecordJson["exp_exRatePtr"] = ExpenseRecord.exRatePtr;
      	//newRecordJson["reversal_flag"] = reversal_flag;
      	if(discountrate) newRecordJson["discountrate"] = discountrate;
		

        //nlapiLogExecution("DEBUG", "json", JSON.stringify(newRecordJson));

        //Call suitelet
        //var url = "https://825746-sb2.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=517&deploy=1&compid=825746_SB2&h=4d0f17c143905b664e50";
		var url = nlapiResolveURL('SUITELET', 'customscript_sa_vs_submit_journal_sl10','customdeploy_sa_vs_submit_journal_sl10','external');
      
        var suiteletResponse = nlapiRequestURL(url, JSON.stringify(newRecordJson), null, null, "POST");
        var suiteletText = suiteletResponse.getBody();
      	nlapiLogExecution("DEBUG", "Post Journal","response="+JSON.stringify(suiteletText) );
	}
}

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

function beforeSubmit(type) {
    try {
        nlapiLogExecution("DEBUG", "Post Journal","*** beforeSubmit Started ***");
      	if (type == "create" || type == "copy"){

          var context = nlapiGetContext();
          var environment = context.getEnvironment();
          var exec_context = context.getExecutionContext() 
          nlapiLogExecution( 'DEBUG', 'Post Journal','type='+type+' ,environment='+environment+' ,exec_context='+exec_context);

          var rec = nlapiGetNewRecord();
          rec.setFieldValue("custbody_tsa_reserve_initiated","F");
        }
    }
  	catch(e){
      nlapiLogExecution( 'DEBUG', 'Post Journal - Error',e);
    }  
}

function recordOnAfterSubmit(type) {
    try {
        nlapiLogExecution("DEBUG", "Post Journal","*** Aftersubmit Started id="+nlapiGetNewRecord().getId() );
      	if (type != "create" && type != "edit" && type != "xedit") return;
        if (nlapiGetFieldValue("custbody_tsa_wip_transfer_complete") == "T") return;
		
      	var context = nlapiGetContext();
    	var environment = context.getEnvironment();
        var exec_context = context.getExecutionContext() 
    	nlapiLogExecution( 'DEBUG', 'Post Journal','environment='+environment+' ,exec_context='+exec_context);

      	var rec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
        var posting = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), "posting", false);      	
        //var reserve_initiated = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), "custbody_tsa_reserve_initiated", false);
      	//var posting = rec.getFieldValue("posting"); //This doesn't work. record doesn't have this.
      	var reserve_initiated = rec.getFieldValue("custbody_tsa_reserve_initiated");
        var discountrate = rec.getFieldValue("discountrate");
      	var reversal_flag = rec.getFieldValue("isreversal");
      	if (reversal_flag=="T"){
          nlapiLogExecution("DEBUG", "Post Journal","Reversal flag - Exit");
          return; 	// *** EXIT if it is a reversal journal. Reversal journal's reserve journal is created by a scheduled script ***
        }
        if (posting != "T"){
          nlapiLogExecution("DEBUG", "Post Journal","Not Posted - Exit");
          return; 	// *** EXIT if it is not a POSTING transaction ***
        }
        if (reserve_initiated == "T"){
          nlapiLogExecution("DEBUG", "Post Journal","Resreve initiated - Exit");
          return; 	// *** EXIT if Reserve Journal Creation was Initiated already ***
        }

      	nlapiLogExecution("DEBUG", "Post Journal","Posting Transaction");
        var results = nlapiSearchRecord("journalentry", null, [new nlobjSearchFilter("custbody_wip_source_transaction", null, "anyof", nlapiGetNewRecord().getId())], null);
        if (results){
			nlapiLogExecution("DEBUG", "Post Journal","Checked existing reserve journals="+JSON.stringify(results));
			return; // ******* EXIT if the reserve journals exists already *******       
		}

        var transactionRecord = nlapiGetNewRecord();
      	var item_count = transactionRecord.getLineItemCount("item");
      	var line_count = transactionRecord.getLineItemCount("line");
      	var expense_count = transactionRecord.getLineItemCount("expense");
      	var item_sublist_reserve_found = 0;
      	var line_sublist_reserve_found = 0;
      	var expense_sublist_reserve_found = 0;
      	for(i=1;i<=item_count;i++){
          var mapping=transactionRecord.getLineItemValue("item","custcol_tsa_wip_mapping",i);
          if(mapping) item_sublist_reserve_found++;
        }
      	for(i=1;i<=line_count;i++){
          var mapping=transactionRecord.getLineItemValue("line","custcol_tsa_wip_mapping",i);
          if(mapping) line_sublist_reserve_found++;
        }
        for(i=1;i<=expense_count;i++){
          var mapping=transactionRecord.getLineItemValue("expense","custcol_tsa_wip_mapping",i);
          if(mapping) expense_sublist_reserve_found++;
        }
      	
        nlapiLogExecution("DEBUG", "", "id="+nlapiGetNewRecord().getId()+" #item_sublist_reserve_found="+item_sublist_reserve_found+" ,#line_sublist_reserve_found="+line_sublist_reserve_found+" ,#expense_sublist_reserve_found="+expense_sublist_reserve_found);

      
      	if( item_sublist_reserve_found==0 && line_sublist_reserve_found==0 && expense_sublist_reserve_found==0)	{
          nlapiLogExecution("DEBUG", "", "id="+nlapiGetNewRecord().getId()+" - No Reserve in Lines. Exit! ");
          return; // Exit if there's no reserve in lines
        }
      
      	
      
      	//both are Viktor's users
        if (nlapiGetUser() == 9999 || nlapiGetUser() == 3969) { // This "if-else" block is just for testing purposes. Now the suitelet call runs for everyone in the "else" branch too
          	callPostJournalSuitlelet(nlapiGetNewRecord(), "line", discountrate);
		    callPostJournalSuitlelet(nlapiGetNewRecord(), "item", discountrate);
        }
        else {
          	callPostJournalSuitlelet(nlapiGetNewRecord(), "line", discountrate);
		    callPostJournalSuitlelet(nlapiGetNewRecord(), "item", discountrate);

            //postJournal(nlapiGetNewRecord(), "line");
          	//postJournal(nlapiGetNewRecord(), "item");
        }
      
        var lineCount = transactionRecord.getLineItemCount("expense");
        if (lineCount > -1 && transactionRecord.getRecordType() == "expensereport") {
            // Mark the pointer to say that it is expense report.
            ExpenseRecord.isExpense = true;
            // Get list of distinct currencies and exrate from record
            var expCurrencyList = ExpenseRecord.getCurrencies(transactionRecord, lineCount);
            // Loop through found currencies
            for (var idx = 0; idx < expCurrencyList.length; idx++) {
                // Set Expense pointer to current currency and exchange rate
                var objExpense = JSON.parse(expCurrencyList[idx]);
                ExpenseRecord.currencyPtr = objExpense.currency;
                ExpenseRecord.exRatePtr = objExpense.exRate;
                // Generate Journal per currency and exchange rate
                if (nlapiGetUser() == 9999) {
          			callPostJournalSuitlelet(transactionRecord, "expense", discountrate);
        		}
        		else {
            		callPostJournalSuitlelet(transactionRecord, "expense", discountrate);
        		}
            }
        } else if (lineCount > -1) {
            if (nlapiGetUser() == 9999  || nlapiGetUser() == 3969) { // This "if-else" block is just for testing purposes. Now the suitelet call runs for everyone in the "else" branch too
          		callPostJournalSuitlelet(transactionRecord, "expense", discountrate);
            }
        	else {
              	callPostJournalSuitlelet(transactionRecord, "expense", discountrate);
            	//postJournal(transactionRecord, "expense");
        	}
        }
    } catch (e) {
        nlapiLogExecution("DEBUG", "Errored Record", nlapiGetNewRecord().getId());
        nlapiLogExecution("DEBUG", "FATAL", e);
    }
}

/*
//			var IHQ_SUBS= ","+(nlapiGetContext().getSetting('SCRIPT', 'custscript_tsa_ihq_related_subsidiaries') || "1,2,18,19,29")+",";

			try{
				if(IHQ_SUBS.indexOf(","+bodyFields.subsidiary+",")>-1){
					nlapiInitiateWorkflow("journalentry", je_id, workflowid); // IHQ WF
				}
				else{
					nlapiInitiateWorkflow("journalentry", je_id, workflowid); // TSA Global WF
				}
			}
			catch(e){
				nlapiLogExecution("DEBUG", "Journal Workflow ERROR", JSON.stringify(e) );
			}
*/
