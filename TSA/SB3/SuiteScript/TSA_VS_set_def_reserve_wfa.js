/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script (TSA_VS_set_def_reserve_wfa.js)
 *
 * Script Type:	Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Find the default reserve for a product
 *
 * Date:        12/09/2019
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

              	log.debug("set_def_reserve_wfa::OA", "Starts");
              
                var itemId = runtime.getCurrentScript().getParameter({ name: "custscript_wf_item_id" });
                var defaultReserve = "";

                log.debug("set_def_reserve_wfa::OA", "itemId= " + itemId);

                var customrecord_item_def_reserveSearchObj = search.create({
                    type: "customrecord_item_def_reserve",
                    filters: [["custrecord_item_id", "anyof", itemId] ],
                    columns: [ search.createColumn({ name: "custrecord_tsa_ihq_def_reserve2", label: "Default Reserve 2" }) ]
                });

                var searchResultCount = customrecord_item_def_reserveSearchObj.runPaged().count;
                log.debug("set_def_reserve_wfa::OA", "Result count= " + searchResultCount);

                customrecord_item_def_reserveSearchObj.run().each(function (result) {
                    defaultReserve = result.getValue({ name: 'custrecord_tsa_ihq_def_reserve2' });
                    log.debug("set_def_reserve_wfa::OA", "defaultReserve= " + defaultReserve);
                    return false;
                });

                return defaultReserve;
            }
            catch (e) {
                log.debug("set_def_reserve_wfa::OA - ERROR", e);
            }
            finally {
            }
        }

        //#endregion

        return {
            onAction: onAction
        };

    });




