/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_get_approve_btn_state_sl2.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Get approve button state
 * 
 * Date:        14/04/2021
 *
 ****************************************************************************************/



/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(scriptContext) {

            //#region ******************************  GET  ************************************* 

            if (scriptContext.request.method == 'GET') {
                try {

                    log.debug("get_approve_btn_state::GET", "STARTED");

                    var request = scriptContext.request;
                    var role = request.parameters.role;  
                    log.debug("get_approve_btn_state::GET", "role=" + role);

                    var enable_approve_button = search.lookupFields({ type: "role", id: parseInt(role), columns: "custrecord_tsa_off_unload_app" }).custrecord_tsa_off_unload_app;

                    log.debug("get_approve_btn_state::GET", "enable_approve_button=" + enable_approve_button + ", FINISHED");
                    scriptContext.response.write(enable_approve_button ? "true" : "false");

                    return enable_approve_button;
                }
                catch (e) {
                    log.debug("get_approve_btn_state::GET - ERROR", e);
                }
                finally {
                }
            }

            //#endregion


            //#region******************************  POST  *************************************

            if (scriptContext.request.method == 'POST') {
                try {
                    return;
                }
                catch (e) {
                    log.debug("get_approve_btn_state::POST - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

        }

        return {
            onRequest: onRequest
        };

    });
