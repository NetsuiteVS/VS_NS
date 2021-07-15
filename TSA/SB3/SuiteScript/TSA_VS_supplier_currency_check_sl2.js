/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_supplier_currency_check_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check if currency belongs to Supplier 
 * 
 * Date:        17/12/2020
 *
 ****************************************************************************************/



/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(scriptContext) {

            //#region ******************************  GET  ************************************* 

            if (scriptContext.request.method == 'GET') {
                try {

                    log.debug("supplier_currency_check::GET", "Started");

                    var supplierId = scriptContext.request.parameters.custscript_supplier_id;
                    var currencyCode = scriptContext.request.parameters.custscript_supplier_currency;

                    if (!supplierId || !currencyCode) {
                        log.debug("supplier_currency_check::GET", "Finished - Missing parameter. supplierId=" + supplierId + ", currencyCode=" + currencyCode);
                        scriptContext.response.write("F");
                        return "F";
                    }

                    var vendorSearchObj = search.create({
                        type: "vendor",
                        filters: [ ["internalid", "anyof", supplierId],
                                   "AND",
                                   ["currency", "anyof", currencyCode] ],
                        columns: [ search.createColumn({ name: "currency", label: "Currency" }) ]
                    });
                    var returnValue = (vendorSearchObj.runPaged().count == 0 ? "F" : "T");
        
                    scriptContext.response.write(returnValue);

                    log.debug("supplier_currency_check::GET", "Finished - supplierId=" + supplierId + ", currencyCode=" + currencyCode + ", returns=" + returnValue);

                    return returnValue;
                }
                catch (e) {
                    log.debug("supplier_currency_check::GET - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

        }

        return {
            onRequest: onRequest
        };

    });
