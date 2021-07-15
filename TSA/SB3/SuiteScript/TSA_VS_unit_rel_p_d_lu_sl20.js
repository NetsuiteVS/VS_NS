/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_unit_rel_p_d_lu_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Lookup "linked" Unit/Related Party and Division

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        //#region *************************************  ON REQUEST  *********************************************

        function onRequest(context) {
            // #region **** find functions ***
            function find_unit_name_and_division(id) {
                var return_result = "-1;-1";
                var classificationSearchObj = search.create({
                    type: "classification",
                    filters:
                        [
                            ["internalid", "anyof", id]
                            //["formulatext: {name}", "is", name]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "name" }),
                            search.createColumn({ name: "custrecord_unit_division", label: "Division" })
                        ]
                });
                log.debug("unit_rel_p_d_lu::find_unit_name_and_division", "Looked up unit id:" + id);
                classificationSearchObj.run().each(function (result) {
                    log.debug("unit_rel_p_d_lu::find_unit_name_and_division", "unit name : " + result.getValue({ name: "name" }) + "; unit division : " + result.getText({ name: "custrecord_unit_division" }));
                    return_result = result.getValue({ name: "name" }) + ";" + result.getText({ name: "custrecord_unit_division" });
                    return false;
                });
                return return_result;
            }

            function find_related_party_name_and_division(id) {
                var return_result = "-1;-1";
                var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                    type: "customrecord_cseg_tsa_relatedpar",
                    filters:
                        [
                            ["internalid", "anyof", id]
                            //["formulatext: {name}", "is", name]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "name" }),
                            search.createColumn({ name: "custrecord_rp_division", label: "Division" })
                        ]
                });

                log.debug("unit_rel_p_d_lu::find_related_party_name_and_division", "Looked up Related Party id:" + id);

                customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                    log.debug("unit_rel_p_d_lu::find_related_party_name_and_division", "Related Party name: " + result.getValue({ name: "name" }) + "; Related Party division: " + result.getText({ name: "custrecord_rp_division" }));
                    return_result = result.getValue({ name: "name" }) + ";" + result.getText({ name: "custrecord_rp_division" });
                    return false;
                });
                return return_result;
            }

            // #endregion **** find functions ***

            if (context.request.method == 'GET') {

                try {
                    var UNIT_ID_PRM = context.request.parameters.custscript_unit_id_prm;
                    var RELATED_PARTY_ID_PRM = context.request.parameters.custscript_related_party_id_prm;
                    var returnValue = "";

                    log.debug("unit_rel_p_d_lu::onRequest", "UNIT_ID_PRM: " + UNIT_ID_PRM);
                    log.debug("unit_rel_p_d_lu::onRequest", "RELATED_PARTY_ID_PRM: " + RELATED_PARTY_ID_PRM);

                    if (!UNIT_ID_PRM || UNIT_ID_PRM.length == 0 || !RELATED_PARTY_ID_PRM || RELATED_PARTY_ID_PRM.length == 0) {
                        context.response.write(returnValue);
                    }

                    if (UNIT_ID_PRM && UNIT_ID_PRM.length > 0) {
                        returnValue += find_unit_name_and_division(UNIT_ID_PRM);
                    }
                    else {
                        returnValue += "-1;-1";
                    }

                    if (RELATED_PARTY_ID_PRM && RELATED_PARTY_ID_PRM.length > 0) {
                        returnValue += ";" + find_related_party_name_and_division(RELATED_PARTY_ID_PRM);
                    }
                    else {
                        returnValue += ";-1;-1";
                    }

                    log.debug("unit_rel_p_d_lu::onRequest", "returnValue: " + returnValue);
                    context.response.write(returnValue);
                }
                catch (e) {
                    log.debug("Error", 'Message: ' + e);
                }
                finally {
                }

            }

            if (context.request.method == 'POST') {
            }
        }

        //#endregion

        return {
            onRequest: onRequest
        };

    });
