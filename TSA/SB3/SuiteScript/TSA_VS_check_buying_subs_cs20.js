/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_check_buying_subs_cs20.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Consolidation&Elimination process creates Offsetting Supplier Bill for each Sales Invoice.
				The sunsidiary can be different and script should check the item record's subsidiary list contains the related party's subsidiary.  
 * 
 * Date:        29/10/2019
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/http', 'N/https', 'N/search', 'N/runtime', 'N/record', 'N/translation'],

    function (url, log, http, https, search, runtime, record, translation) {

        // **************************** PAGE INIT *************************
        function pageInit(context) {
            console.log("interUnit pageinit - call lineInit")

            console.log("pageinit: CLASS");
            var unit_division = context.currentRecord.getValue({ fieldId: "custbody_rsm_uni_division" });
            if (unit_division) {
                console.log("pageInit: unit_division=" + unit_division);
                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
                    deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
                    returnExternalUrl: true,
                    //params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
                    params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': unit_division }
                });

                var response = https.get({
                    url: suitletURL
                });

                console.log("shared_key_lookup response=" + JSON.stringify(response))
                console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
                context.currentRecord.setValue({ fieldId: "custbody_unit_div_shared_key", value: response.body });
            }

            console.log("3 postSourcing: RELPARTY context.fieldId=" + context.fieldId);
            var rp_division = context.currentRecord.getValue({ fieldId: "custbody_rsm_rp_division" });
            if (rp_division) {
                console.log("postSourcing: rp_division=" + rp_division);
                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
                    deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
                    returnExternalUrl: true,
                    //params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
                    params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': rp_division }
                });

                var response = https.get({
                    url: suitletURL
                });

                console.log("shared_key_lookup response=" + JSON.stringify(response))
                console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
                context.currentRecord.setValue({ fieldId: "custbody_relparty_div_shared_key", value: response.body });
            }

            //lineInit(context,1);
        }


        //************************* POST SOURCING **************************	
        function postSourcing(context) {
            try {
                //            var bankCashAmount = context.currentRecord.getValue({ fieldId: AMOUNT });
                var bankCB = true; //not used
                //context.currentRecord.getValue({ fieldId: BANK });
                //var bankAccount = context.currentRecord.getValue({ fieldId: BANKACCOUNT });
                //			var undepositedFund = context.currentRecord.getValue({ fieldId: "custbody_tsa_undeposited_funds"});
                //			var transaction_type = context.currentRecord.getValue({fieldId : TRANSTYPE});
                //			var transaction_type_txt = currentRecord.getText({fieldId : TRANSTYPE});

                console.log("0 postSourcing:context.fieldId=" + context.fieldId);
                switch (context.fieldId) {
                    case "class": //custbody_unit_div_shared_key custbody_relparty_div_shared_key , custbody_rsm_uni_division custbody_rsm_rp_division
                        console.log("2 postSourcing: CLASS context.fieldId=" + context.fieldId);
                        var unit_division = context.currentRecord.getValue({ fieldId: "custbody_rsm_uni_division" });
                        if (!unit_division) break;
                        console.log("postSourcing: unit_division=" + unit_division);
                        var suitletURL = url.resolveScript({
                            scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
                            deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
                            returnExternalUrl: true,
                            //params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
                            params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': unit_division }
                        });

                        var response = https.get({
                            url: suitletURL
                        });
                        console.log("shared_key_lookup response=" + JSON.stringify(response))
                        console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
                        context.currentRecord.setValue({ fieldId: "custbody_unit_div_shared_key", value: response.body });
                        break;
                    case "custbody_cseg_tsa_relatedpar": //custbody_unit_div_shared_key custbody_relparty_div_shared_key , custbody_rsm_uni_division custbody_rsm_rp_division
                        console.log("3 postSourcing: RELPARTY context.fieldId=" + context.fieldId);
                        var rp_division = context.currentRecord.getValue({ fieldId: "custbody_rsm_rp_division" });
                        if (!rp_division) break;
                        console.log("postSourcing: rp_division=" + rp_division);
                        var suitletURL = url.resolveScript({
                            scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',
                            deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',
                            returnExternalUrl: true,
                            //params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': '7864' }
                            params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': rp_division }
                        });

                        var response = https.get({ url: suitletURL });

                        console.log("shared_key_lookup response=" + JSON.stringify(response))
                        console.log("shared_key_lookup returned UNIT division shared key id: " + response.body)
                        context.currentRecord.setValue({ fieldId: "custbody_relparty_div_shared_key", value: response.body });
                        break;

                }
            }
            catch (e) {
                console.log(e);
            }
        }

        //#region ******************************  VALIDATE LINE  *************************************

        /**
        * Validation function to be executed when sublist line is committed.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.sublistId - Sublist name
        *
        * @returns {boolean} Return true if sublist line is valid
        *
        * @since 2015.2
        */
        function validateLine(scriptContext) {

            try {

                var inter_unit = scriptContext.currentRecord.getValue({ fieldId: 'custbody_tsa_inter_unit' });
                if (!inter_unit) return true;

                console.log("check_buying_subs::VL fired");
                var currentRecord = scriptContext.currentRecord;

                //Get invoice subsidiary
                var subsidiary = currentRecord.getValue({ fieldId: "subsidiary" });
                console.log("check_buying_subs::VL - subsidiary=" + subsidiary);

                //Get customer subsidiary
                var customerCseg = currentRecord.getValue({ fieldId: "custbody_cseg_tsa_relatedpar" });
                if (!customerCseg || customerCseg.length == 0) {
                    return true;
                }
                var tsaRelPar = search.lookupFields({ type: 'customrecord_cseg_tsa_relatedpar', id: customerCseg, columns: 'custrecord_tsa_subsidiary' });
                if (!tsaRelPar.custrecord_tsa_subsidiary[0]) {
                    return true;
                }
                var csegSubsidiary = tsaRelPar.custrecord_tsa_subsidiary[0].value;
                console.log("check_buying_subs::SR - csegSubsidiary=" + csegSubsidiary);

                //Get item subsidiary
                var item = currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "item" });
                if (!item || item.length == 0) {
                    return true;
                }

                if (parseFloat(subsidiary) != parseFloat(csegSubsidiary)) {

                    console.log("check_buying_subs::SR - response:" + JSON.stringify(response));

                    //Call suitelet - Check item subsidiary //added by Viktor S.
                    var suitletURL = url.resolveScript({
                        scriptId: 'customscript_tsa_vs_item_subs_lu_sl20', deploymentId: 'customdeploy_tsa_vs_item_subs_lu_sl20',
                        returnExternalUrl: false,
                        params: { 'custscript_subsidiary_prm': csegSubsidiary, 'custscript_item_prm': item }
                    });
                    var response = https.get({ url: suitletURL });
                    console.log("check_buying_subs::SR - response:" + JSON.stringify(response));
                    console.log("check_buying_subs::SR - returned value:" + response.body);

                    var lineSubsIsValid = parseInt(response.body);

                    console.log("check_buying_subs::SR - lineSubsIsValid:" + lineSubsIsValid);

                    if (lineSubsIsValid != 1) {

                        alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ITEM_IS_NOT_ALLOWED_IN_DEST_SUBS', locale: translation.Locale.CURRENT })());
                        return false;
                    }
                }


                return true;
            }
            catch (e) {
                console.log("check_buying_subs::VL - Error message=" + e);
                log.debug("check_buying_subs::VL - ERROR", e);
            }
            finally {
            }
        }

        //#endregion

        //#region ******************************  SAVE RECORD  ************************************* NOT USED !!!

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         * 
         * This function is not triggering because we moved it to BeforeSubmit due to permission issues 
         */
        function saveRecord(scriptContext) { //NOT USED !!!

            try {

                console.log("check_buying_subs::SR fired");

                var currentRecord = scriptContext.currentRecord;

                var offsetEntity = currentRecord.getValue({ fieldId: "custbody_offset_entity" });
                var customerCseg = currentRecord.getValue({ fieldId: "custbody_cseg_tsa_relatedpar" });

                if (!customerCseg || customerCseg.length == 0) {
                    return true;
                }

                console.log("check_buying_subs::SR - offsetEntity=" + offsetEntity);
                console.log("check_buying_subs::SR - customerCseg=" + customerCseg);

                var tsaRelPar = search.lookupFields({ type: 'customrecord_cseg_tsa_relatedpar', id: customerCseg, columns: 'custrecord_tsa_subsidiary' });
                if (!tsaRelPar.custrecord_tsa_subsidiary[0]) {
                    return true;
                }
                var csegSubsidiary = tsaRelPar.custrecord_tsa_subsidiary[0].value;
                console.log("check_buying_subs::SR - csegSubsidiary=" + csegSubsidiary);

                var offsetEntitySubsidiary = -1;
                if (offsetEntity && offsetEntity.length > 0) {
                    offsetEntitySubsidiary = search.lookupFields({ type: search.Type.VENDOR, id: offsetEntity, columns: 'subsidiary' });
                    console.log("check_buying_subs::SR - offsetEntitySubsidiary=" + JSON.stringify(offsetEntitySubsidiary["subsidiary"][0].value));

                    if (offsetEntitySubsidiary.subsidiary[0]) {
                        offsetEntitySubsidiary = offsetEntitySubsidiary.subsidiary[0].value;
                    }
                }
                console.log("check_buying_subs::SR - offsetEntitySubsidiary=" + offsetEntitySubsidiary);

                if (parseFloat(offsetEntitySubsidiary) != parseFloat(csegSubsidiary)) {

                    alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'TSA_REL_P_AND_OFFSET_ENTITY_DIFF', locale: translation.Locale.CURRENT })());
                    return false;
                }

                return true;
            }
            catch (e) {
                console.log("check_buying_subs::SR - Error message=" + e);
                log.debug("check_buying_subs::SR - Error", e);
            }
            finally {
            }
        }

        //#endregion

        //#region ******************************  FIELD CHANGE  ************************************* 

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            try {
                console.log("check_buying_subs::fieldChanged() scriptContext.fieldId=" + scriptContext.fieldId);
                if (scriptContext.fieldId == "custbody_cseg_tsa_relatedpar" || scriptContext.fieldId == "currency") {

                    var currentRecord = scriptContext.currentRecord;
                    var supplierId = currentRecord.getValue({ fieldId: "custbody_offset_entity" });
                    var currency = currentRecord.getValue({ fieldId: "currency" });

                    var suitletURL = url.resolveScript({
                        scriptId: 'customscript_tsa_vs_supplr_curr_chk_sl2',
                        deploymentId: 'customdeploy_tsa_vs_supplr_curr_chk_sl2',
                        returnExternalUrl: false,
                        params: { 'custscript_supplier_id': supplierId, 'custscript_supplier_currency': currency }
                    });
                    var response = https.get({ url: suitletURL });

                    if (response.body == "F") {
                        alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MISSING_SUPPLIER_CURRENCY', locale: translation.Locale.CURRENT })());
                    }
                    console.log("check_buying_subs::fieldChanged() supplierId=" + supplierId + ", currency=" + currency + ", Currency is missing=" + (response.body == "F" ? "true" : "false"));
                }
            }
            catch (e) {
                console.log("check_buying_subs::fieldChanged() Error message=" + e);
            }
            finally {
            }
        }

        //#endregion

        //#region *****************************  VALIDATE FIELD  ***********************************

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

            try {
                
                if (scriptContext.fieldId == "entity" || scriptContext.fieldId == "custbody_tsa_inter_unit") {

                    console.log("check_buying_subs::validateField Started. FieldId=" + scriptContext.fieldId);

                    var currentRecord = scriptContext.currentRecord;
                    var customerId = currentRecord.getValue({ fieldId: "entity" });
                    var isInterUnit = currentRecord.getValue({ fieldId: "custbody_tsa_inter_unit" });
                    var isInactive = false;
                    var supplierId;

                    console.log("check_buying_subs::validateField isInterUnit=" + isInterUnit + ", customerId=" + customerId);

                    if (!customerId || !isInterUnit) {
                        return true;
                    }

                    //Get customer shared key
                    var customerSharedKey = search.lookupFields({ type: 'customer', id: customerId, columns: 'custentity_tsa_iu_shared_key_entity' }).custentity_tsa_iu_shared_key_entity;
                    console.log("check_buying_subs::validateField customerSharedKey=" + JSON.stringify(customerSharedKey));

                    if (customerSharedKey.length > 0) {

                        console.log("check_buying_subs::validateField customerSharedKey=" + customerSharedKey[0].value);

                        var entitySearchObj = search.create({
                            type: "entity",
                            filters: [
                                ["custentity_tsa_iu_shared_key_entity", "anyof", customerSharedKey[0].value],
                                "AND", ["type", "anyof", "Vendor"]
                            ],
                            columns: [
                                search.createColumn({ name: "isinactive", label: "Inactive" }),
                                search.createColumn({ name: "entityid" })
                            ]
                        });
                        var searchResultCount = entitySearchObj.runPaged().count;
                        console.log("check_buying_subs::validateField searchResultCount=" + searchResultCount);
                        entitySearchObj.run().each(function (result) {
                            isInactive = result.getValue({ name: "isinactive" });
                            supplierId = result.getValue({ name: "entityid" });
                            console.log("check_buying_subs::validateField supplierId=" + supplierId);
                            return false;
                        });

                        console.log("check_buying_subs::validateField isInactive=" + isInactive);

                        if (isInactive) {
                            var alertText = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_SUPPLIER_INACTIVE', locale: translation.Locale.CURRENT })();
                            alert(alertText + " " + supplierId);
                            currentRecord.setValue({ fieldId: "entity", value: null});
                        }
                    }
                    console.log("check_buying_subs::validateField Finished");
                }                
            }
            catch (e) {
                console.log("check_buying_subs::validateField Error message=" + e);
            }
            finally {
            }

            return true;
        }

        //#endregion

        return {
            validateLine: validateLine,
            pageInit: pageInit,
            postSourcing: postSourcing,
            fieldChanged: fieldChanged,
            validateField: validateField
        };
    });

