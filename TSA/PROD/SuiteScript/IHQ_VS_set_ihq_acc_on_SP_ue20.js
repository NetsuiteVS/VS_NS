/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent 
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set custbody_ihq_vendor_ac ( [IHQ] SUPPLIER ACCOUNT ) field on Supplier Payment records in case of related Supplier Invoice records has the same value in their custbody_ihq_vendor_ac field.
 * 
 * Date:        15/01/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime'],
    function (record, log, search, runtime) {

        //#region ******************************  AFTER SUBMIT  ************************************* 

        /**
         * Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

            try {

                log.debug("set_vendor_acc::afterSubmit", "Start");

                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {

                    var newRecord = record.load({ type: record.Type.VENDOR_PAYMENT, id: scriptContext.newRecord.id });
                    var invoiceIhqVendorAcToCompare = "";
                    var lineCount = newRecord.getLineCount({ sublistId: "apply" });

                    for (var i = 0; i < lineCount; i++) {

                        var invoiceId = newRecord.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                        var invoiceToLoad = record.load({ type: record.Type.VENDOR_BILL, id: invoiceId, isDynamic: true });
                        var currentInvoiceIhqVendorAc = invoiceToLoad.getValue({ fieldId: 'custbody_ihq_vendor_ac' });

                        if (!invoiceIhqVendorAcToCompare.equals("") && !invoiceIhqVendorAcToCompare.equals(currentInvoiceIhqVendorAc)) {
                            log.debug("set_vendor_acc::afterSubmit", "Different contents are found in related Supplier Invoice's custbody_ihq_vendor_ac field");
                            return true;
                        }

                        invoiceIhqVendorAcToCompare = currentInvoiceIhqVendorAc;

                        if (i === lineCount - 1) {
                            newRecord.setValue({ fieldId: "custbody_ihq_vendor_ac", value: currentInvoiceIhqVendorAc, ignoreFieldChange: true });
                            newRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
                            log.debug("set_vendor_acc::afterSubmit", "custbody_ihq_vendor_ac field has been refreshed");
                        }
                    }
                }

                log.debug("set_vendor_acc::afterSubmit", "End");

                return true;
            }
            catch (e) {
                log.debug("set_vendor_acc::afterSubmit - ERROR", e);
            }
            finally {
            }            
        }

        //#endregion

        return {
            afterSubmit: afterSubmit
        };

    });
