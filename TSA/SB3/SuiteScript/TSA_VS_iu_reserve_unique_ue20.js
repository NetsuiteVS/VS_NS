/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (#TSA_VS_iu_reserve_unique_cs20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Disable to submit a "TSA InterUnit Reserve Mapping" record where "TSA Related Party" and "Interunit Category" fields has the same content.
 * 
 * Date:        07/09/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/error', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'N/translation', 'N/file'],
    function (url, error, record, log, search, runtime, http, https, translation, file) {

        //#region ******************************  BEFORE SUBMIT  ************************************* 

        /**
         * Function definition to be triggered before record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            log.debug("iu_reserve_unique::beforeSubmit", "Started");

            if (scriptContext.type != scriptContext.UserEventType.CREATE
                && scriptContext.type != scriptContext.UserEventType.XEDIT
                && scriptContext.type != scriptContext.UserEventType.VIEW
                && scriptContext.type != scriptContext.UserEventType.EDIT) {
                return;
            }

            var oldRecord = scriptContext.oldRecord;
            var newRecord = scriptContext.newRecord;
            var relatedParty = newRecord.getValue({ fieldId: 'custrecord_tsa_iurm_rel_party' });
            var interunitCategory = newRecord.getValue({ fieldId: 'custrecord_tsa_iurm_iu_cat' });
            var internalId = newRecord.getValue({ fieldId: 'id' });
            log.debug("iu_reserve_unique::beforeSubmit", "relatedParty:" + relatedParty);
            log.debug("iu_reserve_unique::beforeSubmit", "interunitCategory:" + interunitCategory);
            log.debug("iu_reserve_unique::beforeSubmit", "internalId:" + internalId);
            log.debug("iu_reserve_unique::beforeSubmit", "newRecord:" + JSON.stringify(newRecord));
            var filters;
            if (internalId) {
                filters = [["custrecord_tsa_iurm_iu_cat", "anyof", interunitCategory], "AND", ["custrecord_tsa_iurm_rel_party", "anyof", relatedParty], "AND", ["internalid", "noneof", internalId]];
            }
            else {
                filters = [["custrecord_tsa_iurm_iu_cat", "anyof", interunitCategory], "AND", ["custrecord_tsa_iurm_rel_party", "anyof", relatedParty]];
            }

            var customrecord_tsa_iu_res_mapSearchObj = search.create({
                type: "customrecord_tsa_iu_res_map",
                filters: filters,
                columns: [search.createColumn({ name: "scriptid", label: "Script ID" })]
            });

            var searchResultCount = customrecord_tsa_iu_res_mapSearchObj.runPaged().count;
            log.debug("iu_reserve_unique::beforeSubmit", "searchResultCount:" + searchResultCount);

            if (searchResultCount > 0) {
                var msg = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DUPLICATED_INTERUNIT_MAPPING', locale: translation.Locale.CURRENT })();

                throw msg;
               /*
              	error.create({
                    name: '#TSA_VS_iu_reserve_unique_cs20.js',
                    message: msg
                });
               */
            }

            log.debug("iu_reserve_unique::beforeSubmit", "Finished");

            return true;
        }

        //#endregion

        return {
            beforeSubmit: beforeSubmit
        };

    });
