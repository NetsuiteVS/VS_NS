/****************************************************************************************
 * Name:		SuiteScript 1.0 Suitelet (SA_VS_Submit_Journal_sl10.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Journal records cannot be submitted from user event 
 *              directly because it doesn't trigger related workflow.

 ****************************************************************************************/

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */


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
    isExpense: false,
    /**
     * Pointer to Currency of the Expense Report line
     * @memberof ExpenseRecord
     */
    currencyPtr: "1",
    /**
     * Pointer to Exchange Rate of the Expense Report line
     * @memberof ExpenseRecord
     */
    exRatePtr: 1.00,
    /**
     * Get Unique Currencies from Expense Record
     * @param {nlobjRecord} expenseRecord
     * @param {Number} lines
     * @return {Array} list of currency internalid
     */
    getCurrencies: function (expenseRecord, lines) {
        var currencyList = [];
        for (var i = 1; i <= lines; i++) {
            var objStr = JSON.stringify({
                currency: expenseRecord.getLineItemValue("expense", "currency", i),
                exRate: expenseRecord.getLineItemValue("expense", "exchangerate", i)
            });
            currencyList.push(objStr);
        }
        return currencyList.filter(onlyUnique);
    }
};

/**
 * Creates Journal Entry record line using object of values for fields
 * @param {nlobjRecord} journalRecord
 * @param {object} values
 */
function createLine(journalRecord, values) {
    nlapiLogExecution("DEBUG", "Values", JSON.stringify(values));
    journalRecord.selectNewLineItem("line");
    journalRecord.setCurrentLineItemValue("line", "account", values.account);
    journalRecord.setCurrentLineItemValue("line", values.side, values.amount);
    journalRecord.setCurrentLineItemValue("line", "department", values.department);
    journalRecord.setCurrentLineItemValue("line", "class", values.class);
    if(values.location) journalRecord.setCurrentLineItemValue("line", "location", values.location);
    if(values.relatedParty) journalRecord.setCurrentLineItemValue("line", "custcol_cseg_tsa_relatedpar", values.relatedParty);
    if(values.project) journalRecord.setCurrentLineItemValue("line", "custcol_cseg_tsa_project", values.project);
    if (values.reserve) {
        journalRecord.setCurrentLineItemValue("line", "custcol_cseg_tsa_fundreserv", values.reserve);
    } else if (values.originalReserve) {
        journalRecord.setCurrentLineItemValue("line", "custcol_cseg_tsa_fundreserv", values.originalReserve);
    }
	if(values.activity) journalRecord.setCurrentLineItemValue("line", "cseg_tsa_act_code", values.activity);
  	if(values.cost_centre) journalRecord.setCurrentLineItemValue("line", "cseg_tsa_cost_cen", values.cost_centre); //cseg_tsa_cost_cen
    journalRecord.commitLineItem("line", false);
}


function suitelet(request, response) {
    if (request.getMethod() == "POST") {
        try {
            var nonRecoverableTaxCode = nlapiGetContext().getSetting('SCRIPT', 'custscript_ihq_non_rec_tax_code_2').split(",");
            nlapiLogExecution("DEBUG", "User id", "*** Post Started *** nonRecoverableTaxCode=" + JSON.stringify(nonRecoverableTaxCode));

            var jeRecordParam = JSON.parse(request.getBody());

            nlapiLogExecution("DEBUG", "jeRecordParam", JSON.stringify(jeRecordParam));

            //		var IHQ_SUBS= ","+(nlapiGetContext().getSetting('SCRIPT', 'custscript_tsa_ihq_related_subsidiaries') || "1,2,18,19,29")+",";
            var je_id; //created journal's record id; 24/05/2019 Viktor S.

            /*
                            var bodyFields = {
                            subsidiary: jeRecordParam.subsidiary ? jeRecordParam.subsidiary.internalid : null,
                            currency: jeRecordParam.currency ? jeRecordParam.currency.internalid : null,
                            date: jeRecordParam.trandate,
                            department: jeRecordParam.department ? jeRecordParam.department.internalid : null,
                            class: jeRecordParam.class ? jeRecordParam.class.internalid : null,
                            location: jeRecordParam.location ? jeRecordParam.location.internalid : null,
                            exRate: jeRecordParam.exchangerate,
                            customform: jeRecordParam.customform,
                            recordId: jeRecordParam.recordId,
                            sublistId: jeRecordParam.sublistId
                        };
            */

            var bodyFields = {
                subsidiary: parseInt(jeRecordParam.subsidiary.internalid),
                currency: jeRecordParam.currency ? parseInt(jeRecordParam.currency.internalid) : null,
                date: jeRecordParam.trandate,
                department: jeRecordParam.department ? parseInt(jeRecordParam.department.internalid) : null,
                class: jeRecordParam.class ? parseInt(jeRecordParam.class.internalid) : null,
                location: jeRecordParam.location ? parseInt(jeRecordParam.location.internalid) : null,
                exRate: jeRecordParam.exchangerate ? parseFloat(jeRecordParam.exchangerate) : null,
                customform: jeRecordParam.customform ? jeRecordParam.customform : null,
                recordId: jeRecordParam.recordId,
                sublistId: jeRecordParam.sublistId,
                isExpense: jeRecordParam.exp_isExpense,
                currencyPtr: jeRecordParam.exp_currencyPtr ? parseInt(jeRecordParam.exp_currencyPtr) : null,
                exRatePtr: jeRecordParam.exp_exRatePtr ? parseFloat(jeRecordParam.exp_exRatePtr) : null,
                reversal_flag: jeRecordParam.reversal_flag ? jeRecordParam.reversal_flag : false,
                recordtype: jeRecordParam.recordtype, //"journalentry"
                discountrate: jeRecordParam.discountrate,
                location2: jeRecordParam.custbody_tsa_location_main_jrn ? parseInt(jeRecordParam.custbody_tsa_location_main_jrn.internalid) : null,
              	tsa_related_party: jeRecordParam.custbody_cseg_tsa_relatedpar ? parseInt(jeRecordParam.custbody_cseg_tsa_relatedpar.internalid) : null,
                subtotal: jeRecordParam.subtotal
            };

            nlapiLogExecution("DEBUG", "Body Fields", JSON.stringify(bodyFields));

            if (bodyFields.subsidiary) {
                var journalCreationEnabled = nlapiLookupField('subsidiary', bodyFields.subsidiary, 'custrecord_reserv_transf_journal_enabled');
                nlapiLogExecution("DEBUG", "", "Subsidiary=" + bodyFields.subsidiary + " , journalCreationEnabled=" + journalCreationEnabled);

                if (journalCreationEnabled != "T") {
                    nlapiLogExecution("DEBUG", "", "Exit Transfer Journal BEFORE creation - journalCreationEnabled=" + journalCreationEnabled);
                    return true;
                }
            }

            //  calculate/set discount rate and amount

            var discount_rate = bodyFields.discountrate;
            var subtotal = bodyFields.subtotal;
            var discount_percent = 0.00;
            var discount_amount = 0.00;
            if (discount_rate) {
                if (discount_rate.indexOf("%") > 0) {
                    discount_percent = parseFloat(discount_rate.substring(0, discount_rate.indexOf("%")));
                }

                if (discount_rate && discount_rate.indexOf("%") == -1) {
                    discount_amount = parseFloat(discount_rate);
                    discount_percent = parseFloat((discount_amount / subtotal) * 100); //.toFixed(2);
                }
            }
            //  calculate/set discount rate and amount - end

            var lines = jeRecordParam.line;
            if (bodyFields.sublistId == "item") lines = jeRecordParam.item;
            if (bodyFields.sublistId == "expense") lines = jeRecordParam.expense;

            nlapiLogExecution("DEBUG", "sublist=" + bodyFields.sublistId + " | lines count", lines.length);

            /**
             * Reserve Transfer Journal Entry Record
             * @type {nlobjRecord}
             */
            var jeRecord = nlapiCreateRecord("journalentry", { recordmode: "dynamic" });
            jeRecord.setFieldValue("customform", bodyFields.customform);
            jeRecord.setFieldValue("trandate", bodyFields.date);
            jeRecord.setFieldValue("subsidiary", bodyFields.subsidiary);
            if (bodyFields.class) jeRecord.setFieldValue("class", bodyFields.class);
            if (bodyFields.location) {
                jeRecord.setFieldValue("location", bodyFields.location);
                jeRecord.setFieldValue("custbody_tsa_location_main_jrn", bodyFields.location);

            }

            if (bodyFields.recordtype == "journalentry") {
                jeRecord.setFieldValue("location", bodyFields.location2);
                jeRecord.setFieldValue("custbody_tsa_location_main_jrn", bodyFields.location2);
            }
            // in theory these fields (class and location) does not exist in Journal main, but the Location based numbering works based on that.


            // Expense Report, the currency and exchange rates
            // are not available at body level
            jeRecord.setFieldValue("currency", bodyFields.currency);
            jeRecord.setFieldValue("exchangerate", bodyFields.exRate);

            /*nlapiLogExecution("DEBUG", "IS Expense Report", ExpenseRecord.isExpense);
            nlapiLogExecution("DEBUG", "Expense Currency", ExpenseRecord.currencyPtr);
            nlapiLogExecution("DEBUG", "Expense Rate", ExpenseRecord.exRatePtr);*/
            if (bodyFields.isExpense) {
                jeRecord.setFieldValue("currency", bodyFields.currencyPtr);
                jeRecord.setFieldValue("exchangerate", bodyFields.exRatePtr);
            }

            var currency_precision = 2;
            //here??
            try {
                var currency_id = jeRecord.getFieldValue("currency");
                var currency_rec = nlapiLoadRecord("currency", currency_id);
                currency_precision = currency_rec.getFieldValue("currencyprecision");
                nlapiLogExecution("DEBUG", "currency precision check", "currency_precision=" + currency_precision);
            }
            catch (e) {
                nlapiLogExecution("DEBUG", "after currency precision check", e);
            }
            jeRecord.setFieldValue("approvalstatus", "2");
            jeRecord.setFieldValue("custbody_tsa_wip_transfer_complete", "T");
            jeRecord.setFieldValue("custbody_wip_source_transaction", bodyFields.recordId);
            jeRecord.setFieldValue("custbody_tsa_vs_ce_auto_generated", "T");

            for (var i = 0; i < lines.length; i++) {
                var mappingRecordId = lines[i].custcol_tsa_wip_mapping ? parseInt(lines[i].custcol_tsa_wip_mapping.internalid) : null;
                if (!mappingRecordId) continue;

                try {	//25/05/2019
                    // taxcode: NR-GB=  2201 in Prod and SB1, SB2 
                    //if(!bodyFields.isExpense){ // In case of Expense Claim it turns off including the Gross Amount 
                    nlapiLogExecution("debug", "Reserve Journal", " Check Taxcode in line=" + i);
                    if (lines[i].taxcode) {
                        var taxcode = parseInt(lines[i].taxcode.internalid);
                        var tax1amt = lines[i].tax1amt;
                        var taxcode_is_nonrecoverable = false;
                        nlapiLogExecution("debug", "Reserve Journal i=" + i, " nonRecoverableTaxCodes=" + JSON.stringify(nonRecoverableTaxCode) + ", current Taxcode=" + taxcode + " VAT=" + tax1amt);
                        if (nonRecoverableTaxCode.indexOf(String(taxcode)) > -1) {
                            //if (taxcode == 2201) {
                            taxcode_is_nonrecoverable = true;
                        }
                    }
                    //} // In case of Expense Claim it turns off including the Gross Amount 
                }
                catch (e) {
                    nlapiLogExecution("error", "Reserve Journal ERROR", JSON.stringify(e));
                }

                var lineCurrency = lines[i].currency ? lines[i].currency.internalid : null;
                var lineRate = lines[i].exchangerate;

                nlapiLogExecution("debug", "Reserve Journal", "i=" + i + " ,lineCurrency=" + JSON.stringify(lineCurrency) + " ,bodyFields.isExpense=" + bodyFields.isExpense + " ,bodyFields.currencyPtr=" + bodyFields.currencyPtr + " , bodyFields.exRatePtr=" + bodyFields.exRatePtr);
                if (bodyFields.isExpense && lineCurrency != bodyFields.currencyPtr) { continue; }

                // if (bodyFields.isExpense && lineRate != bodyFields.exRatePtr) { continue; } // remarked by VS 09/12/2019 - We shouldn't allow (in client) to add lines with same currency but different exchange rates.

                /**
                 * Collect Field values required to create Journal Entry line
                 * @type {Object}
                 */
                var values = {};
                values.amount = lines[i].amount;

                if (!values.amount) {
                    values.amount = lines[i].debit;
                }

                if (!values.amount) {
                    values.amount = lines[i].credit;
                }

                var fxamount = lines[i].foreignamount;

                if (discount_percent) {
                    values.amount = values.amount * (1 + discount_percent / 100);
                    values.amount = values.amount.toFixed(2);
                    fxamount = fxamount * (1 + discount_percent / 100);
                    fxamount = fxamount.toFixed(2);
                }

                var taxrate = 0.00;
                if (lines[i].taxrate1) {
                    taxrate = (parseFloat(lines[i].taxrate1.replace("%", "")) + 100) / 100;
                }

                nlapiLogExecution("debug", "", "1. fxamount=" + fxamount + " taxrate=" + taxrate);
                if (bodyFields.isExpense && fxamount) {
                    values.amount = fxamount;
                    nlapiLogExecution("debug", "", "2. taxcode_is_nonrecoverable=" + taxcode_is_nonrecoverable);
                    if (taxcode_is_nonrecoverable) {
                        var old_value = values.amount;
                        values.amount = parseFloat(values.amount) * taxrate; // add VAT if it's non-recoverable;
                        nlapiLogExecution("debug", "Reserve Journal", " ExpenseClaim and NR Tax - Tax added to Journal line Amount =" + taxcode + " amount=" + values.amount + " taxrate=" + taxrate);
                    }
                }
                else if (taxcode_is_nonrecoverable) {
                    var old_value = values.amount;
                    values.amount = parseFloat(values.amount) + parseFloat(tax1amt); // add VAT if it's non-recoverable;
                    nlapiLogExecution("debug", "Reserve Journal", " Tax added to Journal line Amount =" + taxcode + " amount=" + old_value + " + VAT=" + tax1amt + "=" + values.amount);
                }

                try {
                    values.amount = values.amount.toFixed(currency_precision);
                }
                catch (e) { }

                /*
                                values.department = lines[i].department.internalid || bodyFields.department;
                                values.class = lines[i].class || bodyFields.class;
                                values.location = lines[i].location || bodyFields.location;
                                values.relatedParty = lines[i].custcol_cseg_tsa_relatedpar;
                                values.project = lines[i].custcol_cseg_tsa_project;
                                values.reserve = lines[i].custcol_cseg_tsa_fundreserv;
                                values.originalReserve = values.reserve;
                */
                values.department = bodyFields.department;
                values.class = bodyFields.class;
                values.location = bodyFields.location;

                if (lines[i].department) { values.department = parseInt(lines[i].department.internalid); }
                else { if (!values.department) values.department = 101; }
                if (lines[i].class) values.class = parseInt(lines[i].class.internalid);
                if (lines[i].location) values.location = parseInt(lines[i].location.internalid);
                if (lines[i].custcol_cseg_tsa_relatedpar) {values.relatedParty = parseInt(lines[i].custcol_cseg_tsa_relatedpar.internalid);}
              	else if(bodyFields.tsa_related_party) {values.relatedParty = bodyFields.tsa_related_party;}
                if (lines[i].custcol_cseg_tsa_project) values.project = parseInt(lines[i].custcol_cseg_tsa_project.internalid);
                if (lines[i].custcol_cseg_tsa_fundreserv) values.reserve = parseInt(lines[i].custcol_cseg_tsa_fundreserv.internalid);
                if (lines[i].cseg_tsa_act_code) values.activity = parseInt(lines[i].cseg_tsa_act_code.internalid); //cseg_tsa_act_code
                if (lines[i].cseg_tsa_cost_cen) values.cost_centre = parseInt(lines[i].cseg_tsa_cost_cen.internalid); //cseg_tsa_cost_cen
                values.originalReserve = values.reserve;

                var mappingFields = nlapiLookupField(
                    "customrecord_tsa_wip_mapping", mappingRecordId, [
                        "custrecord_wip_debit_reserve", "custrecord_wip_credit_reserve",
                        "custrecord_wip_debit", "custrecord_wip_credit",
                        "custrecord_wip_debit_reserve_2", "custrecord_wip_credit_reserve_2",
                        "custrecord_wip_debit_2", "custrecord_wip_credit_2",
                        "custrecord_wip_debit_reserve_3", "custrecord_wip_credit_reserve_3",
                        "custrecord_wip_debit_3", "custrecord_wip_credit_3"], false);

                nlapiLogExecution("DEBUG", "Mapping Fields", JSON.stringify(mappingFields));

                // Debit Line
                values.account = mappingFields.custrecord_wip_debit;
                if (bodyFields.reversal_flag) { values.side = "credit"; }
                else { values.side = "debit"; }
                values.reserve = mappingFields.custrecord_wip_debit_reserve;
                createLine(jeRecord, values);

                // Credit Line
                values.account = mappingFields.custrecord_wip_credit;
                if (bodyFields.reversal_flag) { values.side = "debit"; }
                else { values.side = "credit"; }
                //values.side = "credit";
                values.reserve = mappingFields.custrecord_wip_credit_reserve;
                createLine(jeRecord, values);

                // Second Journal
                if (mappingFields.custrecord_wip_debit_2 && mappingFields.custrecord_wip_credit_2) {
                    // Debit 2 Line
                    values.account = mappingFields.custrecord_wip_debit_2;
                    if (bodyFields.reversal_flag) { values.side = "credit"; }
                    else { values.side = "debit"; }
                    //values.side = "debit";
                    values.reserve = mappingFields.custrecord_wip_debit_reserve_2;
                    createLine(jeRecord, values);

                    // Credit 2 Line
                    values.account = mappingFields.custrecord_wip_credit_2;
                    if (bodyFields.reversal_flag) { values.side = "debit"; }
                    else { values.side = "credit"; }
                    //values.side = "credit";
                    values.reserve = mappingFields.custrecord_wip_credit_reserve_2;
                    createLine(jeRecord, values);
                }

                // Third Journal
                if (mappingFields.custrecord_wip_debit_3 && mappingFields.custrecord_wip_credit_3) {
                    // Debit 3 Line
                    values.account = mappingFields.custrecord_wip_debit_3;
                    if (bodyFields.reversal_flag) { values.side = "credit"; }
                    else { values.side = "debit"; }
                    //values.side = "debit";
                    values.reserve = mappingFields.custrecord_wip_debit_reserve_3;
                    createLine(jeRecord, values);

                    // Credit 3 Line
                    values.account = mappingFields.custrecord_wip_credit_3;
                    if (bodyFields.reversal_flag) { values.side = "debit"; }
                    else { values.side = "credit"; }
                    //values.side = "credit";
                    values.reserve = mappingFields.custrecord_wip_credit_reserve_3;
                    createLine(jeRecord, values);
                }
            }

            je_id = nlapiSubmitRecord(jeRecord, true, true);
            nlapiLogExecution("DEBUG", "Create Journal", "Submit Record id=" + je_id);
            response.write(je_id);
        } catch (e) {
            //nlapiSendEmail( -5, 'viktorschumann@email.com', 'Error at submitting transfer journal record', '' , null, null, null );
            nlapiLogExecution("DEBUG", "Error Creating JE", e);
        }
        return je_id; //24/05/2019 Viktor S.
        //var jeRecord = JSON.parse(request.getBody());
        //var jeRecord = request.getBody();
        //nlapiLogExecution("DEBUG", "Input", request.getBody());
        //je_id = nlapiSubmitRecord(jeRecord, true, true);
        //nlapiLogExecution("DEBUG", "Je record= ", JSON.stringify(jeRecord));
        //} catch (e) {
        //nlapiSendEmail( -5, 'viktorschumann@email.com', 'Error at submitting transfer journal record', '' , null, null, null );
        //nlapiLogExecution("DEBUG", "Error in record", "");
        //}
    }
}