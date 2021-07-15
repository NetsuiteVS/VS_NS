/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script (TSA_VS_set_SI_appr_status_wfa.js)
 *
 * Script Type:	Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set TSA Custom Approval Status ( custbody_tsa_cust_aprov_stat ) field on Supplier Invoice Payment's related Supplier Invoice records.
 *
 * Date:        17/01/2020
 *
 ****************************************************************************************/

define(['N/error', 'N/record', 'N/search', 'N/runtime'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, runtime) {

        //#region ******************************  ON ACTION  ************************************* 

        /**
         * Definition of the Action script trigger point.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @Since 2016.1
         */
        function onAction(scriptContext) {

            try {

                var newRecord = scriptContext.newRecord;
                var supplierPaymentRecord = record.load({ type: newRecord.type, id: scriptContext.newRecord.id });
                var parentApprovalStatus = runtime.getCurrentScript().getParameter({ name: "custscript_tsa_vs_custom_approval_status" });
                log.debug("set_SI_appr_status::OA", "parentApprovalState =" + parentApprovalStatus);

                var supplierPaymentSearchObj = search.create({
                    type: "vendorpayment",
                    filters:
                        [
                            ["type", "anyof", "VendPymt"],
                            "AND",
                            ["internalidnumber", "equalto", scriptContext.newRecord.id],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["appliedtotransaction.custbody_tsa_cust_aprov_stat", "noneof", parentApprovalStatus]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", join: "appliedToTransaction", label: "Internal ID" }),
                            search.createColumn({ name: "custbody_tsa_cust_aprov_stat", join: "appliedToTransaction", label: "TSA Custom Approval Status" })
                        ]
                });

                var remainderInvoicesToProcess = supplierPaymentSearchObj.runPaged().count;
                log.debug("set_SI_appr_status::OA", "remainderInvoicesToProcess =" + remainderInvoicesToProcess);

                supplierPaymentSearchObj.run().each(function (result) {

                    var supplierInvoiceId = result.getValue({ name: 'internalid', join: "appliedToTransaction" });
                    log.debug("set_SI_appr_status::OA", "Supplier Invoice Id in Progress =" + supplierInvoiceId);

                    remainderInvoicesToProcess--;
                                       
                    record.submitFields({
                        type: record.Type.VENDOR_BILL,
                        id: supplierInvoiceId,
                        values: {
                            custbody_tsa_cust_aprov_stat: parentApprovalStatus
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    if (runtime.getCurrentScript().getRemainingUsage() < 30) {
                        log.debug("set_SI_appr_status::OA", "Finished - need to rerun");
                        return false;
                    }

                    return true;
                });

                log.debug("set_SI_appr_status::OA", "Unprocessed invoice count = " + remainderInvoicesToProcess);

                return remainderInvoicesToProcess;
            }
            catch (e) {
                log.debug("set_SI_appr_status::OA - ERROR", e);
            }
            finally {
            }
        }

        //#endregion

        return {
            onAction: onAction
        };

    });




