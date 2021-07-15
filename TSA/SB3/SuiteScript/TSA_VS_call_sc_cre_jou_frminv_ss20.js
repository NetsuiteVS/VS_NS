/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (#TSA_VS_call_sc_cre_jou_frminv_ss20.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Call customscript_rsm_sc_cre_jou_frm_inv script for specified invoices
 * 
 * Date:        05/02/2020
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/

define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task'],
    /**
     * @param {record} record
     * @param {search} search
     */

    function (record, search, render, format, runtime, task) {

        /**
          * @param {Object} scriptContext
          * @param {string} scriptContext.type
          * @Since 2018.2
          */

        // #region EXECUTE
        var maxQueryRecordCount = 600;

        // #endregion

        //************************** EXECUTE *****************************

        function execute(scriptContext) {
            try {

                log.debug("Call sc_cre_jou_frminv::execute", "Started");

                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [["type", "anyof", "CustInvc"],//Sales Invoice
                            "AND", ["status", "anyof", "CustInvc:B"],//Status= Paid In Full (statusRef:"paidInFull" )
                            //"AND", ["custbody_tsa_elimination_journal_ref", "anyof", "@NONE@"], //TSA ELIMINATION JOURNAL REFERENCE == empty
                            //"AND", ["custbody_cseg_tsa_relatedpar", "noneof", "@NONE@"], //TSA Related Party(body) is not empty
                            "AND", ["mainline", "is", "T"],
                            "AND", ["custbody_tsa_inter_unit", "is", "T"],
                         	//"AND", ["custbody_tsa_rp_stock_loc_type", "anyof", "2"], // Allan removed this requirement - IFAS-959 05/05/2021
                            "AND", ["custbody_tsa_vs_elimination_queue", "contains", "in queue"]

                        ],
                    columns: [
                        search.createColumn({ name: "trandate", sort: search.Sort.DESC, label: "Date" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })]
                });

                var invoiceResultSet = invoiceSearchObj.run().getRange(0, maxQueryRecordCount);

                for (var result in invoiceResultSet) {

                    var invoiceId = invoiceResultSet[result].getValue({ name: "internalid" });
                    log.debug("Call sc_cre_jou_frminv::execute", "Processed invoice Id: " + invoiceId);

                    var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    scriptTask.scriptId = 'customscript_rsm_sc_cre_jou_frm_inv';
                    scriptTask.params = { custscript_rsm_invoice_id: invoiceId };
                    var scriptTaskId = scriptTask.submit();

                    //Reschedule if neccessary
                    reschedule(50);
                }  

                logGovernanceMonitoring("EndProcess");
            }
            catch (e) {
                log.debug("Call sc_cre_jou_frminv::Execute - Error", e);
            }
            finally {
            }

        }
        
        // #region GOVERNANCE MONITORING

        function logGovernanceMonitoring(caller) {
            var script = runtime.getCurrentScript();
            log.debug("Call sc_cre_jou_frminv::logGovernanceMonitoring", caller + " - Remaining Usage = " + script.getRemainingUsage());
        }

        // #endregion
                
        // #region RESCHEDULE SCRIPT

        function reschedule(rescheduleGovernanceUsageLimit) {

            if (runtime.getCurrentScript().getRemainingUsage() > rescheduleGovernanceUsageLimit) {
                return false;
            }

            log.debug("Call sc_cre_jou_frminv::reschedule", "customscript_tsa_vs_call_sc_cre_ss20 must be rescheduled!");

            var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT, params: { custscript_processed_records: 0 } });
            scheduledScriptTask.scriptId = "customscript_tsa_vs_call_sc_cre_ss20";
            scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_call_sc_cre_ss20";
            scheduledScriptTask.submit();

            return true;
        }

        // #endregion

        return {
            execute: execute
        };

    });