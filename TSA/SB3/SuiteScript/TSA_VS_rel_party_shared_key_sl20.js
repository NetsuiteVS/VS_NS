/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (#TSA_VS_rel_party_shared_key_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Lookup shared key of a related party

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        function onRequest(context) {
           
            if (context.request.method == 'GET') {

                try {
                    var returnValue = "-1";
                    var SEARCH_TYPE_PRM = context.request.parameters.custscript_search_type_prm;
                    var ID_PRM = context.request.parameters.custscript_id_prm;

                    log.debug("rel_party_shared_key::onRequest", "SEARCH_TYPE_PRM: " + SEARCH_TYPE_PRM);
                    log.debug("rel_party_shared_key::onRequest", "ID_PRM: " + ID_PRM);

                    if (!ID_PRM || ID_PRM.length == 0) {
                        context.response.write(-1);
                    }

                    if (SEARCH_TYPE_PRM.toLowerCase() == "unit") {

                        var classificationSearchObj = search.create({
                            type: "classification",
                            filters: [["internalid", "anyof", ID_PRM]],
                            columns:[search.createColumn({ name: "custrecord_tsa_iu_shared_key_unit", label: "IU Shared Key (Unit)" })]
                        });
                        classificationSearchObj.run().each(function (result) {
                            returnValue = result.getValue({ name: "custrecord_tsa_iu_shared_key_unit" });
                            log.debug("rel_party_shared_key::onRequest", "unit's shared key: " + returnValue);
                            return false;
                        });
                        log.debug("rel_party_shared_key::onRequest", "Key not found (unit)");
                    }
                    else if (SEARCH_TYPE_PRM.toLowerCase() == "relparty") {
                        var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                            type: "customrecord_cseg_tsa_relatedpar",
                            filters: [["internalid", "anyof", ID_PRM]],
                            columns:[search.createColumn({ name: "custrecord_tsa_iu_shared_key_rp", label: "IU Shared Key" }) ]
                        });
                        customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                            returnValue = result.getValue({ name: "custrecord_tsa_iu_shared_key_rp"});
                            log.debug("rel_party_shared_key::onRequest", "related party's shared key: " + returnValue);
                            return false;
                        });
                        log.debug("rel_party_shared_key::onRequest", "Key not found (related party)");
                    }
                    else {
                        throw error.create({
                            name: 'PARAMETER ERROR',
                            message: "custscript_search_type_prm parameter must be on of these two values: unit, relparty."
                        });
                    }

                    log.debug("rel_party_shared_key::onRequest", "returnValue: " + returnValue);
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

        return {
            onRequest: onRequest
        };

    });
