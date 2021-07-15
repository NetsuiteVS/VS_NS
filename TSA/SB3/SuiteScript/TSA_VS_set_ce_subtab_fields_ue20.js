/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (#TSA_VS_set_ce_subtab_fields_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Populate Journal record's C&E subtab's filelds from the first line
 * 
 * Date:        13/02/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'N/translation', 'N/file'],
    function (url, record, log, search, runtime, http, https, translation, file) {


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

            try {
                log.debug("set_ce_subtab_fields::beforeSubmit", "Start");

                if (scriptContext.type != scriptContext.UserEventType.CREATE && scriptContext.type != scriptContext.UserEventType.EDIT) return true;

                var newRecord = scriptContext.newRecord;
                var lineCount = newRecord.getLineCount({ sublistId: "line" });

                if (lineCount == 0 || !newRecord.getValue({ fieldId: 'custbody_tsa_vs_ce_auto_generated' })) {
                    return true;
                }

                //Get values from body
                var unitTypeBody = newRecord.getValue({ fieldId: 'custbody_unit_type' });
                var rpTypeBody = newRecord.getValue({ fieldId: 'custbody_rp_type' });
                var rpSubBody = newRecord.getValue({ fieldId: 'custbody_rp_sub' });
                var offsetEntityBody = newRecord.getValue({ fieldId: 'custbody_offset_entity' });
                var offsetBankBody = newRecord.getValue({ fieldId: 'custbody_offset_bank' });
                var rsmUniDivisionBody = newRecord.getValue({ fieldId: 'custbody_rsm_uni_division' });
                var rsmRpDivisionBody = newRecord.getValue({ fieldId: 'custbody_rsm_rp_division' });

                //Get values from first line
                var unitTypeLine = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_unit_type', line: 0 });
                var rpTypeLine = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_rp_type', line: 0 });
                var rsmUniDivisionLine = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_rsm_uni_division', line: 0 });
                var rsmRpDivisionLine = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_rsm_rp_division', line: 0 });
                var relatedPartyLine = newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_cseg_tsa_relatedpar', line: 0 });

                var unitTypeIsEmpty = (unitTypeBody == null || unitTypeBody.length == 0);
                var unitDivisionIsEmpty = (rsmUniDivisionBody == null || rsmUniDivisionBody.length == 0);

                if (unitTypeIsEmpty && unitDivisionIsEmpty) {

                  	log.debug("set_ce_subtab_fields::beforeSubmit", "Update body C&E values");
                    //Update body values
                    if (unitTypeLine != null && unitTypeLine.length > 0) {
                        newRecord.setValue({ fieldId: "custbody_unit_type", value: unitTypeLine });
                    }
                    if ((rpTypeBody == null || rpTypeBody.length == 0) && rpTypeLine != null && rpTypeLine.length > 0) {
                        newRecord.setValue({ fieldId: "custbody_rp_type", value: rpTypeLine });
                    }
                    if ((rpSubBody == null || rpSubBody.length == 0) && relatedPartyLine != null && relatedPartyLine.length > 0) {

                        var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                            type: "customrecord_cseg_tsa_relatedpar",
                            filters: [["internalid", "anyof", relatedPartyLine]],
                            columns: [search.createColumn({ name: "custrecord_tsa_subsidiary", label: "Subsidiary" })]
                        });
                        var searchResultCount = customrecord_cseg_tsa_relatedparSearchObj.runPaged().count;
                        log.debug("customrecord_cseg_tsa_relatedparSearchObj result count", searchResultCount);
                        customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                            var subsidiary = result.getValue({ name: "custrecord_tsa_subsidiary" });
                            newRecord.setValue({ fieldId: "custbody_rp_sub", value: subsidiary });
                        });
                    }
                    if (rsmUniDivisionLine != null && rsmUniDivisionLine.length > 0) {
                        newRecord.setValue({ fieldId: "custbody_rsm_uni_division", value: rsmUniDivisionLine });
                    }
                    if ((rsmRpDivisionBody == null || rsmRpDivisionBody.length == 0) && rsmRpDivisionLine != null && rsmRpDivisionLine.length > 0) {
                        newRecord.setValue({ fieldId: "custbody_rsm_rp_division", value: rsmRpDivisionLine });
                    }
                }

                log.debug("set_ce_subtab_fields::beforeSubmit", "End");

                return true;
            }
            catch (e) {
                log.debug("set_ce_subtab_fields::beforeSubmit - ERROR", e);
            }
            finally {
            }
        }

        //#endregion       

        return {
            beforeSubmit: beforeSubmit
        };

    });
