/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_report_filtering_prep_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Prepare filtering of some reports' dropdown lists
 * 
 * Date:        27/08/2020
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

                    log.debug("report_filtering_prep::GET", "STARTED");

                    var request = scriptContext.request;
                    var account = request.parameters.account;
                    var deploymentId = request.parameters.deploymentId;

                    log.debug("report_filtering_prep::GET", "deploymentId:" + deploymentId);

                    if ((account.toLowerCase() + "_" + deploymentId.toLowerCase()).equals("825746-sb2_customdeploy_tsa_vs_report_filt_sl20")) {
                        scriptContext.response.write("https://825746-sb2.app.netsuite.com/app/site/hosting/scriptlet.nl?script=6586&deploy=1");
                    }                                                                     
                    if ((account.toLowerCase() + "_" + deploymentId.toLowerCase()).equals("825746-sb3_customdeploy_tsa_vs_report_filt_sl20")) {
                        scriptContext.response.write("https://825746-sb3.app.netsuite.com/app/site/hosting/scriptlet.nl?script=5127&deploy=1");
                    }                      
                    else {
                        scriptContext.response.write("error");
                    }
                }
                catch (e) {
                    log.debug("report_filtering_prep::onRequest:GET - ERROR", e);
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
