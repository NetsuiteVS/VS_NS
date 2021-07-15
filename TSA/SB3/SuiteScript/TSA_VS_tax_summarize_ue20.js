/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_VS_tax_summarize_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Tax summarize before/for invoice printing
 * 			 
 *			Can run with both IHQ and Global.
 * 
 * Date:        29/08/2019
 *
 * 
 
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime', 'SuiteScripts/vs_lib.js'],
    function (record, log, search, runtime, vs_lib) {

        //#region ******************************  BEFORE LOAD  ************************************* 

        /**
        * Function definition to be triggered before record is loaded.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.newRecord - New record
        * @param {Record} scriptContext.oldRecord - Old record
        * @param {string} scriptContext.type - Trigger type
        * @Since 2015.2
        */
        function beforeLoad(scriptContext) {

            try {

                log.debug("tax_summarize::beforeLoad", "Start");

                if (!scriptContext.type.equals("print")) return;

                var newRecord = scriptContext.newRecord;
                var lineCount = newRecord.getLineCount({ sublistId: "item" });

                if (lineCount <= 0) {
                    log.debug("tax_summarize::beforeLoad", "Item sublist has no lines");
                    return true;
                }

                var netSummary = Object();
                var taxSummary = Object();
                for (var i = 0; i < lineCount; i++) {

                    if (newRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i }) == "Subtotal") {
                        continue;
                    }
                    var taxCodeDisplay = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                    taxCodeDisplay = taxCodeDisplay == null ? "" : taxCodeDisplay.replace("VAT_AR:", "");
                    var taxCode = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }) + ";" + taxCodeDisplay;
                    var netAmount = parseFloat(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }))
                    var taxAmount = parseFloat(newRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));

                    if (!netSummary.hasOwnProperty(taxCode)) {
                        netSummary[taxCode] = 0.0;
                    }

                    if (!taxSummary.hasOwnProperty(taxCode)) {
                        taxSummary[taxCode] = 0.0;
                    }

                    netSummary[taxCode] += netAmount;
                    taxSummary[taxCode] += taxAmount;
                }

                var taxSummaryJSON = [];
                var data = [];
                for (var key in taxSummary) {

                    if (taxSummary.hasOwnProperty(key)) {
                        data.push({ code: key, amount: String(Math.round(netSummary[key] * 100) / 100) + ";" + String(Math.round(taxSummary[key] * 100) / 100) });
                    }
                };
                taxSummaryJSON.push({ data: data });

                var taxSummaryStr = JSON.stringify(taxSummaryJSON);
                taxSummaryStr = taxSummaryStr.substr(1, taxSummaryStr.length - 2);

                log.debug("tax_summarize::beforeLoad", "taxSummaryStr= " + taxSummaryStr);

                newRecord.setValue({ fieldId: "custbody_tsa_vs_tax_summary", value: taxSummaryStr });

                log.debug("tax_summarize::beforeLoad", "End");

                return true;
            }
            catch (e) {
                log.debug("tax_summarize::beforeLoad - ERROR", e);
            }
            finally {
            }
        }

        //#endregion               

        return {
            beforeLoad: beforeLoad
        };

    });
