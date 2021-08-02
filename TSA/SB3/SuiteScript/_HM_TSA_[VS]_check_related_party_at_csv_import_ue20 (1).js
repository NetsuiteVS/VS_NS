/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (#TSA_[VS]_check_related_party_at_csv_import_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     InterUnit - offline upload journal - check_related_party_at_csv_import_ue20
 * 
 * Date:        23/12/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/translation'],
    function (record, search, runtime, translation) {

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
                var newRecord = scriptContext.newRecord;
                var currentRecord = scriptContext.newRecord;
                var interunit = currentRecord.getValue("custbody_tsa_inter_unit");
                var externalid = currentRecord.getValue("externalid");

                if (!interunit) {
                    log.debug(externalid, "This is not an InterUnit journal. Exit.");
                    return true;
                }

                log.debug(externalid, "Started");

                //Get all related party type
                var relatedPartyArray = [];
                var relatedPartySearchObj = search.create({
                    type: "customrecord_cseg_tsa_relatedpar",
                    filters:
                        [
                            ["custrecord_tsa_rp_type", "noneof", "@NONE@"],
                            "AND",
                            ["custrecord_tsa_def_bank", "noneof", "@NONE@"],
                            "AND",
                            ["custrecord_tsa_def_cash_on_hand", "noneof", "@NONE@"],
                            /*"AND", ["custrecord_tsa_def_location", "noneof", "@NONE@"],*/
                            "AND",
                            ["custrecord_rp_division", "noneof", "@NONE@"],
                            "AND",
                            ["custrecord_tsa_subsidiary", "noneof", "@NONE@"],
                            "AND",
                            ["custrecord_tsa_iu_shared_key_rp", "noneof", "@NONE@"]
                        ],
                    columns: [search.createColumn({ name: "internalid" })]
                });
                var relatedPartySearchPaged = relatedPartySearchObj.runPaged({ pageSize: 1000 });
                relatedPartySearchPaged.pageRanges.forEach(function (page_range) {
                    var relatedPartyPage = relatedPartySearchPaged.fetch({ index: page_range.index });
                    relatedPartyPage.data.every(function (result) {
                        relatedPartyArray.push(result.getValue({ name: 'internalid' }));
                        return true;
                    });
                    return true;
                });
                log.debug(externalid, "relatedPartyArray:" + relatedPartyArray);

                //Get IU mapping
                var interUnitMappingArray = [];
                var unitActivityTypeSearch = search.create({
                    type: "customrecord_tsa_unit_activity_types",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_uat_formusage", "is", 6]	// 3=Interunit , 6-Offset
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_uat_unittype", label: "Unit Type" }),
                            search.createColumn({ name: "custrecord_uat_relatedpartytype", label: "Related Party Type" }),
                            search.createColumn({ name: "custrecord_tsa_ini_gl_account", label: "GL Account" })
                        ]
                });

                var unitActivityTypeResultSet = unitActivityTypeSearch.run().getRange({ start: 0, end: 1000 });
                for (var result in unitActivityTypeResultSet) {
                    interUnitMappingArray.push(
                        unitActivityTypeResultSet[result].getValue({ name: "custrecord_uat_unittype" }) + ";" +
                        unitActivityTypeResultSet[result].getValue({ name: "custrecord_uat_relatedpartytype" }) + ";" +
                        unitActivityTypeResultSet[result].getValue({ name: "custrecord_tsa_ini_gl_account" }));
                }
                log.debug(externalid, "interUnitMappingArray:" + interUnitMappingArray);

                var lineCount = currentRecord.getLineCount({ sublistId: "line" });

                //Get all Related Parties from lines
                var relatedPartiesInLinesArray = [];
                var relPartySharedKeysArray = [];
                var unitSharedKeysArray = [];
                for (var i = 0; i < lineCount; i++) {
                    var relatedPartyLineValue = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_cseg_tsa_relatedpar", line: i });
                    if (relatedPartiesInLinesArray.indexOf(relatedPartyLineValue) == -1) {
                        relatedPartiesInLinesArray.push(relatedPartyLineValue);
                    }
                    var relPartySharedKeyLineValue = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_relparty_shared_key", line: i });
                    if (relPartySharedKeysArray.indexOf(relPartySharedKeyLineValue) == -1) {
                        relPartySharedKeysArray.push(relPartySharedKeyLineValue);
                    }
                    var unitSharedKeyLineValue = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_unit_div_shared_key", line: i });
                    if (unitSharedKeysArray.indexOf(unitSharedKeyLineValue) == -1) {
                        unitSharedKeysArray.push(unitSharedKeyLineValue);
                    }
                }
                log.debug(externalid, "relatedPartiesInLinesArray:" + relatedPartiesInLinesArray);
                log.debug(externalid, "relPartySharedKeysArray:" + relPartySharedKeysArray);
                log.debug(externalid, "unitSharedKeysArray:" + unitSharedKeysArray);

                //Get FilteredBy field from Related Parties
                var filteredByAssocArray = [];
                var customrecord_cseg_tsa_relatedparSearchObj_1 = search.create({
                    type: "customrecord_cseg_tsa_relatedpar",
                    filters: [["internalid", "anyof", relatedPartiesInLinesArray]],
                    columns: [
                        search.createColumn({ name: "internalid", label: "internalid" }),
                        search.createColumn({ name: "custrecord_cseg_tsa_relatedpar_n101"})
                    ]
                });
                customrecord_cseg_tsa_relatedparSearchObj_1.run().each(function (result) {
                    var relatedPartyId = result.getValue({ name: "internalid" });
                    var filteredBy = result.getValue({ name: "custrecord_cseg_tsa_relatedpar_n101" });
                    filteredByAssocArray[relatedPartyId] = filteredBy;
                });
                log.debug(externalid, "filteredByAssocArray:" + filteredByAssocArray);

                for (var i=0; i<lineCount; i++) {
                    var relatedParty = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_cseg_tsa_relatedpar", line: i });
                                        
                    var unit = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_rsm_uni_division", line: i });
			        var unit_type = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_unit_type", line: i });
        			var relParty_type = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_rp_type", line: i });
        			var acc_unit_type = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_tsa_acc_unit_type", line: i });
        			var acc_pay_type = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_tsa_acc_iu_pay_type", line: i });
        			var tsa_rel_party_shared_key = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_relparty_shared_key", line: i });
                  	var account = currentRecord.getSublistValue({ sublistId: "line", fieldId: "account", line: i });
                    var iuMappingValue = unit_type+";"+relParty_type+";"+account;
                  
                    log.debug(externalid, "relatedParty=" + relatedParty + ", iuMappingValue=" + iuMappingValue + ", acc_pay_type=" + acc_pay_type + ", unit_type=" + unit_type + ", unit=" + unit + ", relParty_type=" + relParty_type);
                    if(!relatedParty){
                        throw new Error("Error at line "+i+". Message:"+translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MISSING_RELPARTY', locale: translation.Locale.CURRENT })());
                    }

                    if (!filteredByAssocArray[relatedParty] || filteredByAssocArray[relatedParty].indexOf(unit) == -1) {
                        throw new Error("Error at line " + i + ". Message:" + translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
                    }

                    if(relatedPartyArray.indexOf(relatedParty) == -1){
                        throw new Error("Error at line "+i+". Message:" + translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_NOT_COMPLETE', locale: translation.Locale.CURRENT })());
                    }

                    //DHQ=1 THQ=2 Unit=3 //if((a=="D" || a=="U" || a=="T") ){ //1=DHQ, 2=THQ, 3=Unit
                    if (!acc_pay_type){
                        if (acc_unit_type != unit_type && acc_unit_type != relParty_type) {
                          //alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_UNIT_MISMATCH', locale: translation.Locale.CURRENT })());
                          throw new Error("Error at line "+i+". Message:" + translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_UNIT_MISMATCH', locale: translation.Locale.CURRENT })());
                        }
                  
                        if (interUnitMappingArray.indexOf(iuMappingValue) == -1) {
                            throw new Error("Error at line "+i+". Message:" + translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_MAPPING_MISMATCH', locale: translation.Locale.CURRENT })());
                        }
        			}
                }

                //Precheck offset journal: related party - unit pairs
                //Get units based on related party shared keys
                var offsetUnitAssocArray = [];
                var classificationSearchObj = search.create({
                    type: "classification",
                    filters: [["custrecord_tsa_iu_shared_key_unit", "anyof", relPartySharedKeysArray]],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custrecord_tsa_iu_shared_key_unit" })
                    ]
                }); 
                classificationSearchObj.run().each(function (result) {
                    var unitId = result.getValue({ name: "internalid" });
                    var rpSharedKey = result.getValue({ name: "custrecord_tsa_iu_shared_key_unit" });
                    offsetUnitAssocArray[rpSharedKey] = unitId;
                    return true;
                });
                log.debug("", "offsetUnitAssocArray: " + offsetUnitAssocArray);

                //Get related parties based on unit shared keys
                var offsetRelatedPartyAssocArray = [];
                var offsetRelatedPartiesArray = [];
                var customrecord_cseg_tsa_relatedparSearchObj_2 = search.create({
                    type: "customrecord_cseg_tsa_relatedpar",
                    filters: [["custrecord_tsa_iu_shared_key_rp", "anyof", unitSharedKeysArray]],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custrecord_tsa_iu_shared_key_rp"})
                    ]
                });
                customrecord_cseg_tsa_relatedparSearchObj_2.run().each(function (result) {
                    var rpId = result.getValue({ name: "internalid" });
                    var unitSharedKey = result.getValue({ name: "custrecord_tsa_iu_shared_key_rp" });
                    offsetRelatedPartyAssocArray[unitSharedKey] = rpId;  

                    if (offsetRelatedPartiesArray.indexOf(rpId) == -1) {
                        offsetRelatedPartiesArray.push(rpId);
                    }

                    return true;
                });
                log.debug("", "offsetRelatedPartyAssocArray: " + offsetRelatedPartyAssocArray);
                log.debug("", "offsetRelatedPartiesArray: " + offsetRelatedPartiesArray);

                //Get FilteredBy field from Related Parties
                var offsetFilteredByAssocArray = [];
                var customrecord_cseg_tsa_relatedparSearchObj_3 = search.create({
                    type: "customrecord_cseg_tsa_relatedpar",
                    filters: [["internalid", "anyof", offsetRelatedPartiesArray]],
                    columns: [
                        search.createColumn({ name: "internalid", label: "internalid" }),
                        search.createColumn({ name: "custrecord_cseg_tsa_relatedpar_n101" })
                    ]
                });
                customrecord_cseg_tsa_relatedparSearchObj_3.run().each(function (result) {
                    var relatedPartyId = result.getValue({ name: "internalid" });
                    var filteredBy = result.getValue({ name: "custrecord_cseg_tsa_relatedpar_n101" });
                    offsetFilteredByAssocArray[relatedPartyId] = filteredBy;
                });
                log.debug(externalid, "offsetFilteredByAssocArray:" + offsetFilteredByAssocArray);

                //Precheck (future) offset unit-related party pairs
                for (var i = 0; i < lineCount; i++) {
                    var offsetRelPartySharedKey = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_relparty_shared_key", line: i });
                    var offsetUnitSharedKey = currentRecord.getSublistValue({ sublistId: "line", fieldId: "custcol_unit_div_shared_key", line: i });
                    var offsetRelatedParty = offsetRelatedPartyAssocArray[offsetUnitSharedKey];
                    var offsetUnit = offsetUnitAssocArray[offsetRelPartySharedKey];

                    log.debug(externalid, "offsetRelPartySharedKey=" + offsetRelPartySharedKey + ", offsetUnitSharedKey=" + offsetUnitSharedKey + ", offsetRelatedParty=" + offsetRelatedParty + ", offsetUnit=" + offsetUnit);
                    log.debug(externalid, "offsetFilteredByAssocArray[" + offsetRelatedParty + "]:" + offsetFilteredByAssocArray[offsetRelatedParty]);

                    if (!offsetFilteredByAssocArray[offsetRelatedParty] || offsetFilteredByAssocArray[offsetRelatedParty].indexOf(offsetUnit) == -1) {
                        throw new Error("Error at line " + i + ". Message:(Offset Journal);" + translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
                    }
                }

                log.debug(externalid, "Finished");
                return true;
            }
            catch (e) {
                log.debug(externalid, e);
                throw e;
            }
        }

        //#endregion

        return {
            beforeSubmit: beforeSubmit
        };

    });
