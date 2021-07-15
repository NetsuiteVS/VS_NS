/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_Set_Rvrsl_on_Offst_Jrnl_ue2.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set reversal journal for offsetting journals
 * 
 * Date:        22/03/2021
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

        // #region FFFF REGION NAME

        var processedRecords;
        var maxQueryRecordCount = 999;

        // #endregion

        //************************** EXECUTE *****************************

        function execute(scriptContext) {
            try {

                log.debug("Set_Rvrsl_on_Offst_Jrnl::execute", "Started");

                var originatingJournalId = runtime.getCurrentScript().getParameter({ name: "custscript_originating_journal_id" });
                var date = runtime.getCurrentScript().getParameter({ name: "custscript_date" });
              	var deferred = runtime.getCurrentScript().getParameter({ name: "custscript_deferred_reversal" });
                log.debug("Set_Rvrsl_on_Offst_Jrnl::execute", "originatingJournalId="+originatingJournalId+", date="+date+", deferred="+deferred);

                search.create({
                    type: "transaction",
                    filters:
                        [
                            ["custbody_linked_ic_trans", "anyof", originatingJournalId], "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns: [ search.createColumn({ name: "internalid", summary: "GROUP", sort: search.Sort.ASC, label: "Internal ID" }) ]
                }).run().each(function (result) {

                    var internalId = result.getValue({ name: 'internalid', summary: "GROUP" });
                    var journal = record.load({ type: record.Type.JOURNAL_ENTRY, id: internalId, isDynamic: true });
                    journal.setValue({ fieldId: "reversaldate", value: date, ignoreFieldChange: false });
                  	journal.setValue({ fieldId: "reversaldefer", value: deferred, ignoreFieldChange: false });
                    journal.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.debug("Set_Rvrsl_on_Offst_Jrnl::execute", "internalId=" + internalId);

                    //var id = record.submitFields({ type: record.Type.JOURNAL_ENTRY, id: internalId, values: { reversaldate: date },
                    //    options: { enableSourcing: false, ignoreMandatoryFields: true }
                    //});

                    return true;
                });

                log.debug("Set_Rvrsl_on_Offst_Jrnl::execute", "Finished");
            }
            catch (e) {
                log.debug("Set_Rvrsl_on_Offst_Jrnl::execute - Error", e);
            }
            finally {
            }

        }
        
        return {
            execute: execute
        };

    });