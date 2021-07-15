/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_VS_chk_doc_prefix_unique_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check if location document prefix is unique befora save.
 * 
 * Date:        09/09/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/translation'],
    function (record, log, search, runtime, translation) {

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

            var errorMessage = "";
            try {

                log.debug("chk_doc_prefix_unique::beforeSubmit", "Started");

                if (scriptContext.type != scriptContext.UserEventType.CREATE
                    && scriptContext.type != scriptContext.UserEventType.XEDIT
                    && scriptContext.type != scriptContext.UserEventType.EDIT) return;

                var oldRecord = scriptContext.oldRecord;
                var newRecord = scriptContext.newRecord;
                var internalId = newRecord.id;

                if (!internalId) {
                    internalId = "0";
                }
                var tranPrefix = newRecord.getValue({ fieldId: 'tranprefix' });
                var tranInternalPrefix = newRecord.getValue({ fieldId: 'traninternalprefix' });
				if(!tranPrefix) tranPrefix="999999";
              	if(!tranInternalPrefix) tranInternalPrefix="999999";
              
                log.debug("chk_doc_prefix_unique::beforeSubmit", "internalId:" + internalId);
                log.debug("chk_doc_prefix_unique::beforeSubmit", "tranPrefix:" + tranPrefix);
                log.debug("chk_doc_prefix_unique::beforeSubmit", "tranInternalPrefix:" + tranInternalPrefix);

                var locationSearchObj = search.create({
                    type: "location",
                    filters: [
                        [ ["tranprefix", "is", tranPrefix], "OR", ["traninternalprefix", "is", tranInternalPrefix], "OR", ["tranprefix", "is", tranInternalPrefix], "OR", ["traninternalprefix", "is", tranPrefix] ],
                        "AND",
                        ["internalid", "noneof", internalId]
                    ],
                    columns:[
                            search.createColumn({ name: "tranprefix", label: "Transaction Prefix" }),
                            search.createColumn({ name: "traninternalprefix", label: "Internal Transaction Prefix" })]
                });

                log.debug("chk_doc_prefix_unique::beforeSubmit", "locationSearchObj.runPaged().count:" + locationSearchObj.runPaged().count);
                
                if (locationSearchObj.runPaged().count > 0) {
                    errorMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DUPLICATED_TRANSACTION_PREFIX', locale: translation.Locale.CURRENT })();
                    throw errorMessage;
                    return false;
                }

                log.debug("chk_doc_prefix_unique::beforeSubmit", "Finished");

                return true;
            }
            catch (e) {
                log.debug("chk_doc_prefix_unique::beforeSubmit - ERROR", e);
                if (errorMessage.length > 0) {
                    throw errorMessage;
                }
            }
            finally {
            }
        }

        //#endregion

        return {
            beforeSubmit: beforeSubmit
        };

    });
