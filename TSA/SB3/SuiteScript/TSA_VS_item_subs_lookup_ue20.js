/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (#TSA_VS_item_subs_lookup_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Lookup item's subsidiary

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

            if (context.request.method == 'GET') {

                try {
                    log.debug("item_subs_lookup::onRequest", "Started");

                    var returnValue = "-1";

                    var SUBSIDIARY_PRM = context.request.parameters.custscript_subsidiary_prm;
                    var ITEM_ID_PRM = context.request.parameters.custscript_item_prm;
                    log.debug("item_subs_lookup::onRequest", "SUBSIDIARY_PRM: " + SUBSIDIARY_PRM);
                    log.debug("item_subs_lookup::onRequest", "ITEM_ID_PRM: " + ITEM_ID_PRM);

                    if (!SUBSIDIARY_PRM || SUBSIDIARY_PRM.length == 0 || !ITEM_ID_PRM || ITEM_ID_PRM.length == 0) {
                        context.response.write(-1);
                    }

                    returnValue = "0";

                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                            [
                                ["internalid", "anyof", ITEM_ID_PRM]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "subsidiary", label: "Subsidiary" })
                            ]
                    });
                    var searchResultCount = itemSearchObj.runPaged().count;
                    log.debug("item_subs_lookup::onRequest", "itemSearchObj result count:" + searchResultCount);
                    itemSearchObj.run().each(function (result) {
                        var subsidiary = result.getValue({ name: 'subsidiary' });
                        log.debug("item_subs_lookup::onRequest", "subsidiary:" + subsidiary);
                        if (SUBSIDIARY_PRM.equals(subsidiary)) {
                            returnValue = "1";
                        }
                        return true;
                    });


                    log.debug("item_subs_lookup::onRequest", "returnValue: " + returnValue);
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
