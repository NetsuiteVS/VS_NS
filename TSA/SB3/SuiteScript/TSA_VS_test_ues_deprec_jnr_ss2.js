/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_test_ues_deprec_jnr_ss2.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Test customscript_lm_ues_depje
 * 
 * Date:        16/08/2021
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
        //************************** EXECUTE *****************************

        function execute(scriptContext) {
            try {

                log.debug("execute", "Started");

                var rec = record.load({ type: record.Type.JOURNAL_ENTRY, id: 434673, isDynamic: true });
                rec.save({ enableSourcing: false, ignoreMandatoryFields: true });

                log.debug("execute", "Finished");
            }
            catch (e) {
                log.debug("execute - ERROR", e);
            }
            finally {
            }

        }
        
        return {
            execute: execute
        };

    });