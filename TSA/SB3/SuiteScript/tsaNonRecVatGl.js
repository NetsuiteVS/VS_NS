/*************************************************************************************
 * Script Type: customGLImpact script
 * 
 * API Version:	1.0
 *
 * Purpose:     To customise the GL impact on non-recoverable tax
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
      	
        var creditAccount = nlapiGetContext().getSetting('SCRIPT', 'custscript_nr_ax_account');
        var nonRecoverableTaxCode = nlapiGetContext().getSetting('SCRIPT', 'custscript_ihq_non_rec_tax_code_2').split(",");
            
        /*if (!id) {
            nlapiLogExecution('DEBUG', 'customizeGlImpact', 'id is not defined - EXIT plugin ');
            return true;
        }*/
              
        var linecount = standardLines.getCount();
        nlapiLogExecution('debug', 'getSalesLines', 'Standard Lines count =' + linecount);
        if (linecount == 0) {
            nlapiLogExecution('debug', 'getSalesLines', 'line count was zero - Exit');
            return true;  // no work to complete
        }

        for (var i = 0; i < linecount; i++) {

            //get the value of NetSuite's GL posting
            var line = standardLines.getLine(i);
            //if (line.getId() == 0) continue; // summary lines; ignore - 

            //determine the amount.  debits will be positive.   Add it to the summary map
            var stLine = standardLines.getLine(i);
            nlapiLogExecution('debug', 'standard lines',JSON.stringify(stLine));
            var account = stLine.getAccountId();
            var taxItemId = stLine.getTaxItemId();
            var taxType = stLine.getTaxType();
	          
            if (!account) continue;
            nlapiLogExecution('debug', 'standard lines', "account=" + account + ", taxItemId=" + taxItemId + ", taxType=" + taxType);
			nlapiLogExecution('DEBUG', 'standard lines', 'nonRecoverableTaxCode=' + JSON.stringify(nonRecoverableTaxCode));
          
            if (nonRecoverableTaxCode.indexOf(String(taxItemId))>-1 && !taxType){
              	var vat_percent = nlapiLookupField('salestaxitem', taxItemId, 'rate').replace("%", "");
              	var vat_account = nlapiLookupField('salestaxitem', taxItemId, 'purchaseaccount');
				nlapiLogExecution('DEBUG', 'standard lines',' vat_percent=' + vat_percent+", vat_account="+vat_account);
				//var nonRecoverableTaxCode = 2201; //chilie 5211
				//

                //var vatLine = standardLines.getLine(i+1); //VAT is aggregated 
                //nlapiLogExecution('debug', 'VAT Line',JSON.stringify(vatLine));
                //var vat_account = vatLine.getAccountId();
                //var vat_taxAmount = vatLine.getTaxAmount();
                //var vat_taxableAmount = vatLine.getTaxableAmount();
              	//nlapiLogExecution('debug', 'VAT Line',"vat_account="+vat_account+", vat_taxAmount="+vat_taxAmount+", vat_taxableAmount="+vat_taxableAmount);
              	
                var credit_amount = Math.abs(parseFloat(stLine.getCreditAmount() || 0));
                var debit_amount = Math.abs(parseFloat(stLine.getDebitAmount() || 0));
				var amount = credit_amount+debit_amount;              
              
                nlapiLogExecution('debug', 'VAT Line', "amount=" + amount);
                amount = (amount * (parseFloat(vat_percent) / 100)).toFixed(2);
                nlapiLogExecution('debug', 'VAT Line', "vat amount=" + amount);
              
                var workingLine = {};
                workingLine.account = account;
                workingLine.amount = amount;
                workingLine.class = stLine.getClassId();
                workingLine.location = stLine.getLocationId();
                workingLine.department = stLine.getDepartmentId();
				workingLine.memo = stLine.getMemo();
              	workingLine.entity = stLine.getEntityId();
              
                workingLine.relatedParty = stLine.getSegmentValueId('cseg_tsa_relatedpar');
                workingLine.project = stLine.getSegmentValueId('cseg_tsa_project');
              	workingLine.project_activity_code = stLine.getSegmentValueId('cseg_tsa_act_code');
              	workingLine.reserve = stLine.getSegmentValueId('cseg_tsa_fundreserv'); 
              	//workingLine.reserve = stLine.getSegmentValueId('cseginterdept_elim'); 
                workingLine.property = stLine.getSegmentValueId('cseg_ihq_property');
              	workingLine.cost_centre = stLine.getSegmentValueId('cseg_tsa_cost_cen');
              
                //workingLine.projectActivity = stLine.getSegmentValueId('');
                nlapiLogExecution('debug', 'getSalesLines', 'workingLine.reserve=' + workingLine.reserve + ', workingLine.relatedParty=' + workingLine.relatedParty +
                    ', workingLine.project=' + workingLine.project + ', workingLine.property=' + workingLine.property);

                nlapiLogExecution('debug', 'getSalesLines - Income lines=', JSON.stringify(workingLine));

                //Create credit line or Inverse line
                var customCreditLine = customLines.addNewLine();
                customCreditLine.setAccountId(parseInt(vat_account));
                if (workingLine.class) customCreditLine.setClassId(parseInt(workingLine.class));
                if (workingLine.location) customCreditLine.setLocationId(parseInt(workingLine.location));
                if (workingLine.department) customCreditLine.setDepartmentId(parseInt(workingLine.department));              
              	//if (workingLine.memo) customCreditLine.setMemo(workingLine.memo);
              	//if (workingLine.entity) customCreditLine.setEntityId(parseInt(workingLine.entity));
              
              	if(credit_amount) { customCreditLine.setDebitAmount(parseFloat(amount)); } else{ customCreditLine.setCreditAmount(parseFloat(amount)); }
                //if(rec_type=="vendorcredit"){ customCreditLine.setDebitAmount(parseFloat(amount)); } else{ customCreditLine.setCreditAmount(parseFloat(amount)); }
                //if(rec_type=="journalentry"){ customCreditLine.setDebitAmount(parseFloat(amount)); } else{ customCreditLine.setCreditAmount(parseFloat(amount)); }
              
/*
                workingLine.relatedParty = stLine.getSegmentValueId('cseg_tsa_relatedpar');
                workingLine.project = stLine.getSegmentValueId('cseg_tsa_project');
              	workingLine.project_activity_code = stLine.getSegmentValueId('cseg_tsa_act_code');
              	workingLine.reserve = stLine.getSegmentValueId('cseg_tsa_fundreserv'); 
              	//workingLine.reserve = stLine.getSegmentValueId('cseginterdept_elim'); 
                workingLine.property = stLine.getSegmentValueId('cseg_ihq_property');
              	workingLine.cost_centre = stLine.getSegmentValueId('cseg_tsa_cost_cen');
*/              
              
                //Create debit line or "new" line for the non-vat account
                var customDebitLine = customLines.addNewLine();
                customDebitLine.setAccountId(parseInt(workingLine.account));
                if (workingLine.class) customDebitLine.setClassId(parseInt(workingLine.class));
                if (workingLine.location) customDebitLine.setLocationId(parseInt(workingLine.location));
                if (workingLine.department) customDebitLine.setDepartmentId(parseInt(workingLine.department));
				if (workingLine.memo) customDebitLine.setMemo(workingLine.memo);
              	if (workingLine.entity) customDebitLine.setEntityId(parseInt(workingLine.entity));
              
              	if (workingLine.relatedParty) customDebitLine.setSegmentValueId('cseg_tsa_relatedpar', parseInt(workingLine.relatedParty));              
				if (workingLine.project) customDebitLine.setSegmentValueId('cseg_tsa_project', parseInt(workingLine.project));
				if( workingLine.project_activity_code ) customDebitLine.setSegmentValueId('cseg_tsa_act_code', parseInt(workingLine.project_activity_code));
                if (workingLine.reserve) customDebitLine.setSegmentValueId('cseg_tsa_fundreserv', parseInt(workingLine.reserve));              
                if (workingLine.property) customDebitLine.setSegmentValueId('cseg_ihq_property', parseInt(workingLine.property));
              	if (workingLine.cost_centre) customDebitLine.setSegmentValueId('cseg_tsa_cost_cen', parseInt(workingLine.cost_centre));
              
                if(credit_amount){ customDebitLine.setCreditAmount(parseFloat(amount)); } else{ customDebitLine.setDebitAmount(parseFloat(amount)); }
              	
            }
        }
    }
    catch (e) {
        nlapiLogExecution("ERROR", "createErrorLog", e.message);
    }
}
