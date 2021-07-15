/*
    Author: 	Viktor Schumann 25/07/2019

    Contains some useful function
 *	
 * Purpose:		Library script to share useful functions for SS2
 *
 * Notes:		Needs to be added to a script via the define tag
 * 				define(['../vs_lib'], function (vs_lib) {});
 *
 * Functions:
 *
 * #createErrorLog						#getEliminationJournalId                #userSubsidiaryIsIHQ
*/

/**
 * vs_lib.js
 * @NApiVersion 2.x
**/
define(['N/record', 'N/runtime', 'N/search', 'N/error'], function (record, runtime, search, error) {

    // #region **************  CREATE ERROR LOG  ******************************

    function createErrorLog(scriptId, recordId, message, userId, recordType, doNotThrowError) {

        try {

            var isTransactionRecord = false;

            try {
                //Check if parameter record is transaction or not
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters: [["internalid", "anyof", recordId]],
                    columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                });
                var isTransactionRecord = transactionSearchObj.runPaged().count > 0;
            }
            catch (e) { }

            //Create an error log record
            var newErrorLogRecord = record.create({ type: "customrecord_tsa_error_log", isDynamic: false, defaultValues: null });

            newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_script_id", value: scriptId, ignoreFieldChange: true });
            if (isTransactionRecord) {
                newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_trans_id", value: recordId, ignoreFieldChange: true });
            }
            newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_record_id", value: recordId.toString(), ignoreFieldChange: true });
            newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_record_type", value: recordType, ignoreFieldChange: true });
            newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_error_message", value: JSON.stringify(message), ignoreFieldChange: true });
            newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_error_status", value: 1, ignoreFieldChange: true });
            if (userId > 0) {
                newErrorLogRecord.setValue({ fieldId: "custrecord_tsa_ui_user", value: userId, ignoreFieldChange: true });
            }

            newErrorLogRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
        }
        catch (e) {
            log.debug("vs_lib::createErrorLog - Error", message);
        }

        if (!doNotThrowError) {
            throw message;
        }
    }

    // #endregion

    // #region **************  GET ELIMINATION JOURNAL ID  ********************

    function getEliminationJournalId(transactionId) {

        try {

            var journalId;

            var journalEntrySearchObj = search.create({
                type: "journalentry",
                filters:
                    [
                        ["type", "anyof", "Journal"],
                        "AND",
                        ["custcol_linked_ic_trans", "anyof", transactionId]
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
            log.debug("vs_lib::getEliminationJournalId - Error", e);
        }
    }

    // #endregion

    // #region **************  CHECK IF USER SUBSIDIARY IS IHQ  ********************

    function userSubsidiaryIsIHQ() {

        try {
            var ihqSubsidiaries = ";Parent Company;SAIT;ROAS;SALT collage;SAIT Elimination;";
            var userId = runtime.getCurrentUser().id;
            var subsidiaryIsIHQ = false;

            log.debug("vs_lib::userSubsidiaryIsIHQ", 'userId= ' + userId);

            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [["internalid", "anyof", userId]],
                columns: [search.createColumn({ name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)" })]
            });

            employeeSearchObj.run().each(function (result) {
                var subsidiary = result.getText({ name: 'subsidiarynohierarchy' });
                subsidiaryIsIHQ = ihqSubsidiaries.includes(";" + subsidiary + ";");

                log.debug("vs_lib::userSubsidiaryIsIHQ", "User's subsidiary= " + subsidiary);
                log.debug("vs_lib::userSubsidiaryIsIHQ", "User's subsidiary is IHQ= " + subsidiaryIsIHQ);
                return true;
            });

            return subsidiaryIsIHQ;
        }
        catch (e) {
            log.debug("vs_lib::userSubsidiaryIsIHQ - Error", e);
        }
    }

    // #endregion

    return {
        createErrorLog: createErrorLog,
        getEliminationJournalId: getEliminationJournalId,
        userSubsidiaryIsIHQ: userSubsidiaryIsIHQ
    };

});
