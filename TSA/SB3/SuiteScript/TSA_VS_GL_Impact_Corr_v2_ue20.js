/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 */

/*
    15/06/2020 - Viktor Schumann

    This script creates inverse and new Custom GL impact lines and populates the reserve custom segment with values from Transaction lines.
	
*/

define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/task'],
    function (record, log, search, runtime, task) {

        var errMsg = '';

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {
                if (scriptContext.type == scriptContext.UserEventType.DELETE) return;

                log.debug("GL_Impact:afterSubmit", "Started");
                var currentRecord = scriptContext.newRecord;
                var id = currentRecord.getValue({ fieldId: "id" });
                var transactionToUpdate = record.load({ type: currentRecord.type, id: id, isDynamic: false });                
                transactionToUpdate.save();
                log.debug("GL_Impact:afterSubmit", "Finished");

                return;
            }
            catch (e) {
                log.debug("Error", 'Message: ' +  JSON.stringify(e));
            }
            finally {
                /*if (errMsg) {
                    throwError();
                }*/
            }
        }

        /**
         * Throws an error
         * Try/catch block omitted as it is necessary for the script to break here
         * @since 1.0.0
         * @private
         * @returns null
         */
        function throwError() {
            var error = null;
            error = nlapiCreateError('INVD_UAT_REC', errMsg, true);
            throw error;
        }

        return {
            afterSubmit: afterSubmit
        };

    });
