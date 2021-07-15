/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 */

/*
    30/07/2019 - Viktor Schumann

    This will updates transactions' journal reference (tsa_elimination_journal_ref)

*/

define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/url', 'N/https', 'N/task'], 	// , 'SuiteScripts/vs_lib'
    function (record, log, search, runtime, url, https, task) { 						// , vs_lib

        /**
        * Function definition to be triggered before record is loaded.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.newRecord - New record
        * @param {Record} scriptContext.oldRecord - Old record
        * @param {string} scriptContext.type - Trigger type
        * @Since 2015.2
        */
        function beforeLoad(scriptContext) {
            try {

                if (scriptContext.type != scriptContext.UserEventType.VIEW
                    && scriptContext.type != scriptContext.UserEventType.EDIT) return;

                var currentRecord = scriptContext.newRecord;
                var tranId = currentRecord.getText({ fieldId: "tranid" });
                tranId = scriptContext.newRecord.id;

                log.debug("Journal_ref_update::beforeSubmit", 'tranId: ' + tranId);

                if (!tranId || tranId.length == 0) {
                    return;
                }
                
                var journalId = getEliminationJournalId(tranId); //vs_lib.

                log.debug("Journal_ref_update::beforeSubmit", 'journalId: ' + journalId);

                if (!journalId || journalId.length == 0) {
                    return;
                }

                currentRecord.setValue("custbody_tsa_elimination_journal_ref", journalId);

                return true;
            }
            catch (e) {
                log.debug("Error", 'Message: ' + e);
            }
            finally {
            }
        }

        return {
            beforeLoad: beforeLoad
        };
  
    function getEliminationJournalId(transactionId) {

        try {

            var journalId;

            var journalEntrySearchObj = search.create({
                type: "journalentry",
                filters:
                    [
                        ["type", "anyof", "Journal"],
                        "AND",
                        ["custcol_linked_ic_trans", "anyof", transactionId],
                      	"AND", 
      					["reversalofnumber","isempty",""],
                      	"AND", 
      					["reversalnumber","isempty",""]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custbody_linked_ic_trans", label: "Linked I / C Transaction" })
                    ]
            });

            journalEntrySearchObj.run().each(function (result) {
                journalId = result.getValue("internalid");
                return false;
            });
			
            return journalId;
        }
        catch (e) {
            log.debug("getEliminationJournalId - Error", e);
        }
    }
  
  
    });

