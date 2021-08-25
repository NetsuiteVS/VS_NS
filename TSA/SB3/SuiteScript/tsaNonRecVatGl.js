/*************************************************************************************
 * Script Type: customGLImpact script
 * 
 * API Version:	1.0
 *
 * Purpose:     To customise the GL impact on non-recoverable tax
	
	TXNs: 
	Expense Claim, 
	Journal,
	Supplier Credit, 
	Supplier Invoice
 *************************************************************************************/

var errMsg = '';
/**
 * Function used as entry point to GL Impact plug-in scripts
 * @since 1.0.0
 * @public
 * @param {Object} transaction - the transaction this plug-in is running on
 * @param {Object} standardLines - The lines on the GL impact prior to customisation
 * @param {Object} customLines - An object used to add and retain custom lines on a GL impact 
 * @returns null
 */
function customizeGlImpact(transaction, standardLines, customLines) {

    var unitInformation = {};
    var id = transaction.getId();
  	var rec_type = transaction.getRecordType();
    nlapiLogExecution('debug', 'GL Plugin Triggered', "*** GL Plugin Start *** id=" + id+", rec_type="+rec_type);

    try {
      	
		// TXNs: Expense Claim, Journal Supplier Credit, Supplier Invoice
		//sublists: item, expense, line 

        var creditAccount = nlapiGetContext().getSetting('SCRIPT', 'custscript_nr_ax_account');
        var nonRecoverableTaxCode = nlapiGetContext().getSetting('SCRIPT', 'custscript_ihq_non_rec_tax_code_2').split(",");
            
        /*if (!id) {
            nlapiLogExecution('DEBUG', 'customizeGlImpact', 'id is not defined - EXIT plugin ');
            return true;
        }*/
              
        var linecount = standardLines.getCount();
        nlapiLogExecution('debug', 'getLines', 'Standard Lines count =' + linecount);
        if (linecount == 0) {
            nlapiLogExecution('debug', 'getLines', 'line count was zero - Exit');
            return true;  // no work to complete
        }

        // *********** Debit or Credit ??? **********
        var isCredit = 0;
        for (var i = 0; i < linecount; i++) {
            //get the value of NetSuite's GL posting
            var line = standardLines.getLine(i);
            var stLine = standardLines.getLine(i);
            //nlapiLogExecution('debug', 'standard lines', JSON.stringify(stLine));
            var account = stLine.getAccountId();
            var taxItemId = stLine.getTaxItemId();
            var taxType = stLine.getTaxType();

            if (!account) continue;
            nlapiLogExecution('debug', 'standard lines', "account=" + account + ", taxItemId=" + taxItemId + ", taxType=" + taxType);
            nlapiLogExecution('DEBUG', 'standard lines', 'nonRecoverableTaxCode=' + JSON.stringify(nonRecoverableTaxCode));

            if (nonRecoverableTaxCode.indexOf(String(taxItemId)) > -1 && !taxType) {
                isCredit = Math.abs(parseFloat(stLine.getCreditAmount() || 0));
                nlapiLogExecution('DEBUG', 'standard lines', 'isCredit=' + (isCredit > 0).toString());
                break;
            }
        }
        // *********** Debit or Credit END

        var sublists = ["expense", "item", "line"];
        for (i = 0; i < sublists.length; i++) {
            processSublist(sublists[i], transaction, standardLines, customLines, nonRecoverableTaxCode, rec_type, isCredit);
        }

        nlapiLogExecution('debug', 'GL Plugin', "*** GL Plugin Finished ***");
    }
    catch (e) {
        nlapiLogExecution("ERROR", "createErrorLog", e.message);
    }
}

function processSublist(sublist, transaction, standardLines, customLines, nonRecoverableTaxCode, rec_type, isCredit) {

    var tr_linecount = transaction.getLineItemCount(sublist);    
    nlapiLogExecution('debug', 'getLines', 'TXN lines count(' + sublist + ') =' + tr_linecount);
    for (var i = 1; i <= tr_linecount; i++) { // !!!! This is nlobjRecord, first line is 1 in suitescript 1.0 !!!
        var account = transaction.getLineItemValue(sublist, "account", i);
        var taxItemId = transaction.getLineItemValue(sublist, "taxcode", i);
        var tax1amt = transaction.getLineItemValue(sublist, "tax1amt", i);
        var amount = transaction.getLineItemValue(sublist, "amount", i);        
        var custcol_cseg_tsa_relatedpar = transaction.getLineItemValue(sublist, "custcol_cseg_tsa_relatedpar", i);
        var custcol_cseg_tsa_project = transaction.getLineItemValue(sublist, "custcol_cseg_tsa_project", i);
        var cseg_tsa_act_code = transaction.getLineItemValue(sublist, "cseg_tsa_act_code", i);
        var cseg_tsa_fundreserv = transaction.getLineItemValue(sublist, "cseg_tsa_fundreserv", i);
        var cseg_ihq_property = transaction.getLineItemValue(sublist, "cseg_ihq_property", i);
        var cseg_tsa_cost_cen = transaction.getLineItemValue(sublist, "cseg_tsa_cost_cen", i);
        var class_;
        var location;
        if (rec_type == "journalentry") {
            class_ = transaction.getLineItemValue(sublist, "class", i);
            location = transaction.getLineItemValue(sublist, "location", i);
        }
        else {
            class_ = transaction.getFieldValue("class");
            if (rec_type == "vendorbill") {
                location = transaction.getFieldValue("location");
            }
        }
        var department = transaction.getLineItemValue(sublist, "department", i);
        var memo = transaction.getLineItemValue(sublist, "memo", i);
        var entity = transaction.getFieldValue("entity");

        nlapiLogExecution('debug', 'tr lines i=' + i, "account=" + account + ", taxItemId=" + taxItemId + ", tax1amt=" + tax1amt);
        nlapiLogExecution('debug', 'tr lines i=' + i, "amount=" + amount + ", class=" + class_ + ", department=" + department + ", location=" + location);
        nlapiLogExecution('debug', 'tr lines i=' + i, "custcol_cseg_tsa_relatedpar=" + custcol_cseg_tsa_relatedpar + ", custcol_cseg_tsa_project=" + custcol_cseg_tsa_project + ", cseg_tsa_act_code=" + cseg_tsa_act_code);
        nlapiLogExecution('debug', 'tr lines i=' + i, "cseg_tsa_fundreserv=" + cseg_tsa_fundreserv + ", cseg_ihq_property=" + cseg_ihq_property + ", cseg_tsa_cost_cen=" + cseg_tsa_cost_cen);

        if (nonRecoverableTaxCode.indexOf(String(taxItemId)) > -1) {

            var vat_account = nlapiLookupField('salestaxitem', taxItemId, 'purchaseaccount');
            nlapiLogExecution('DEBUG', 'tr lines', "vat_account=" + vat_account);

            //Create credit line or Inverse line
            var invertedLine = customLines.addNewLine();
            invertedLine.setAccountId(parseInt(vat_account));
            if (class_) invertedLine.setClassId(parseInt(class_));
            if (location) invertedLine.setLocationId(parseInt(location));
            if (department) invertedLine.setDepartmentId(parseInt(department));
            //if (memo) invertedLine.setMemo(memo);
            //if (entity) invertedLine.setEntityId(parseInt(entity));

            if (isCredit) { invertedLine.setDebitAmount(parseFloat(tax1amt)); }
            else { invertedLine.setCreditAmount(parseFloat(tax1amt)); }

            //Create debit line or "new" line for the non-vat account
            var newLine = customLines.addNewLine();
            newLine.setAccountId(parseInt(account));
            if (class_) newLine.setClassId(parseInt(class_));
            if (location) newLine.setLocationId(parseInt(location));
            if (department) newLine.setDepartmentId(parseInt(department));
            if (memo) newLine.setMemo(memo);
            if (entity) newLine.setEntityId(parseInt(entity));

            if (isCredit) { newLine.setCreditAmount(parseFloat(tax1amt)); }
            else { newLine.setDebitAmount(parseFloat(tax1amt)); }

            if (custcol_cseg_tsa_relatedpar) newLine.setSegmentValueId('cseg_tsa_relatedpar', parseInt(custcol_cseg_tsa_relatedpar));
            if (custcol_cseg_tsa_project) newLine.setSegmentValueId('cseg_tsa_project', parseInt(custcol_cseg_tsa_project));
            if (cseg_tsa_act_code) newLine.setSegmentValueId('cseg_tsa_act_code', parseInt(cseg_tsa_act_code));
            if (cseg_tsa_fundreserv) newLine.setSegmentValueId('cseg_tsa_fundreserv', parseInt(cseg_tsa_fundreserv));
            if (cseg_ihq_property) newLine.setSegmentValueId('cseg_ihq_property', parseInt(cseg_ihq_property));
            if (cseg_tsa_cost_cen) newLine.setSegmentValueId('cseg_tsa_cost_cen', parseInt(cseg_tsa_cost_cen));
        }
    }
}