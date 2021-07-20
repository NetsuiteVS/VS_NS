/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_get_approval_users_ss2.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Find the users to email
 * 
 * Date:        15/04/2021
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/
define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task', 'N/email', 'N/url', 'N/https','N/format/i18n'],
/**
    * @param {record} record
    * @param {search} search
    */

    function (record, search, render, format, runtime, task, email, url, https, formati) {

        function makeItCurrency(myNumber,currency1){
            var myFormat = formati.getCurrencyFormatter({currency: currency1});
            var newCur = myFormat.format({
                    number: myNumber
                    });

            return newCur;
        }
        /**
            * @param {Object} scriptContext
            * @param {string} scriptContext.type
            * @Since 2018.2
            */

        //************************** EXECUTE *****************************

        var TEST_MODE = false;
        var DAY_FILTER = TEST_MODE ? 30 : 30;
        var RESCHEDULE_LIMIT = TEST_MODE ? 9900 : 150;
        var CONST_FILTER = [
            [
                [
                    ["type", "anyof",
                        "Custom108",//Advance
                        "Custom112",//TSA Expense
                        "Custom107",//TSA Income
                        "Custom115",//TSA Interunit
                        "Custom116"//TSA Unit Expense
                    ],
                    "AND",
                    ["status", "anyof",
                        "Custom108:B",//Advance: Pending Approval
                        "Custom108:R",//Advance: Pending HOD Review
                        "Custom108:Q",//Advance: Pending Approval - HOD Reviewed
                        "Custom112:B",//TSA Expense: Pending Approval
                        "Custom107:A",//TSA Income: Pending Review
                        "Custom115:B",//TSA Interunit: Pending Approval
                        "Custom116:B"//TSA Unit Expense: Pending Approval
                    ]
                ],
                "OR",
                [
                    ["type", "anyof",
                        "ExpRept",//Expense Claim
                        "Journal",//Journal
                        "VendBill",//Supplier invoice
                        "VendPymt",//Supplier invoice payment
                        "PurchOrd"//Purchase Order
                    ],
                    "AND",
                    ["custbody_tsa_cust_aprov_stat", "anyof",
                        "2",//Pending Approval
                        "7",//Pending HOD Review
                        "6"//Pending Approval - HOD Reviewed
                    ],
                    "AND",
                    ["status", "noneof", "VendBill:C"]//Supplier invoice: Cancelled
                ]
            ],
            "AND",
            ["mainline", "is", "T"]
        ];
        var processedTxns;
        var subsidiariesToProcess;
        var rescheduled = false;
        
        function execute(scriptContext) {
  //          try {

                log.debug("get_approval_users::execute", "Started");

                var currentScript = runtime.getCurrentScript();
                var processedTypes = [];//Only for testing purposes 
                processedTxns = currentScript.getParameter({ name: "custscript_processed_txns" }) ?
                    currentScript.getParameter({ name: "custscript_processed_txns" }).replace("[", "").replace("]", "").replace(/"/g, '').split(",") : [];
                subsidiariesToProcess = currentScript.getParameter({ name: "custscript_subs_to_process" }) ?
                    currentScript.getParameter({ name: "custscript_subs_to_process" }).replace("[", "").replace("]", "").replace(/"/g, '').split(",") : undefined;
                log.debug("get_approval_users::execute", "subsidiariesToProcess=" + subsidiariesToProcess);
                var approvals = { normalApproval: {}, hodApproval: {} };
                var scriptMustBeRescheduled = false;
                log.debug("get_approval_users::execute", "processedTxns=" + processedTxns);

                //Actualize filter by date
                var filterDate = new Date();
                filterDate.setDate(filterDate.getDate() - DAY_FILTER);
                var month = (filterDate.getMonth() < 9 ? '0' : '') + (filterDate.getMonth() + 1);
                var day = (filterDate.getDate() < 10 ? '0' : '') + filterDate.getDate();
                var filterDateStr = day + "/" + month + "/" + filterDate.getFullYear();
                var actualizedFilter = CONST_FILTER;
                actualizedFilter.push("AND");
                actualizedFilter.push(["trandate", "onorafter", filterDateStr]);
                log.debug("get_approval_users::execute", "filterDateStr=" + filterDateStr);

                if (!subsidiariesToProcess) {

                    subsidiariesToProcess = [];

                    var transactionSearchObj = search.create({
                        type: "transaction",
                        filters: actualizedFilter,
                        columns: [search.createColumn({ name: "subsidiary", summary: "GROUP", sort: search.Sort.ASC, label: "Subsidiary" })]
                    });
                    log.debug("get_approval_users::execute", "Subsidiary search count=" + transactionSearchObj.runPaged().count);
                    transactionSearchObj.run().each(function (result) {
                        subsidiariesToProcess.push(result.getValue({ name: 'subsidiary', summary: "GROUP" }));
                        return true;
                    });
                }
                log.debug("get_approval_users::execute", "filterDateStr=" + filterDateStr + ", subsidiariesToProcess=" + subsidiariesToProcess);

                if (subsidiariesToProcess.length == 0) {
                    log.debug("get_approval_users::execute", "Finished");
                    return true;
                }

                //Actualize filter by Subsidiary
                actualizedFilter.push("AND");
                actualizedFilter.push(["subsidiary", "anyof", parseInt(subsidiariesToProcess[0])]);
                log.debug("get_approval_users::execute", "actualizedFilter=" + JSON.stringify(actualizedFilter));
                
                //GROUP neccessary because of duplicated elements in the search result...
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters: actualizedFilter,
                    columns:
                        [
                            search.createColumn({ name: "type", summary: "GROUP", label: "Type" }),
                            search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                            search.createColumn({ name: "transactionnumber", summary: "GROUP", label: "Transaction Number" }),
                            search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                            search.createColumn({ name: "trandate", summary: "GROUP"}),
                            search.createColumn({ name: "entity", summary: "GROUP" }),
                            search.createColumn({ name: "memo", summary: "GROUP" }),
                            search.createColumn({ name: "fxamount", summary: "MAX" }),
                          	search.createColumn({ name: "currency", summary: "GROUP" }),
                            search.createColumn({ name: "status", summary: "GROUP" }),
                          
                            search.createColumn({ name: "custbody_tsa_iouemp", summary: "GROUP" }),
                            search.createColumn({ name: "custbody_tsa_non_s_exp_payee", summary: "GROUP" }),
                            search.createColumn({ name: "custbody_tsa_nsipurps", summary: "GROUP" }),
                            search.createColumn({ name: "custbody_tsa_payee_fbu", summary: "GROUP" }),

                            search.createColumn({ name: "custbody_tsa_advareason", summary: "GROUP" }),
                          
                            search.createColumn({ name: "custbody_tsa_cust_aprov_stat", summary: "GROUP" })
                        ]
                });
                log.debug("get_approval_users::execute", "Transaction search count=" + transactionSearchObj.runPaged().count);

                var transactionSearchPaged = transactionSearchObj.runPaged({ pageSize: 1000 });
                transactionSearchPaged.pageRanges.forEach(function (page_range) {

                    var transactionPage = transactionSearchPaged.fetch({ index: page_range.index });
                  	
                    transactionPage.data.every(function (result){
						var internalid = result.getValue({ name: 'internalid', summary: "GROUP"});

                        if (TEST_MODE) {

                            //Set this to test one specific txn else set it to undefined.
                            var specific_ID_to_test = 440742;

                            if (specific_ID_to_test) {
                                if (internalid == specific_ID_to_test) {
                                    log.debug("", "Test Txn found");
                                }
                                else { return true; }
                            }
                            else {
                                var maxNumberOfTestRecords = 1;
                                if (processedTypes.length >= maxNumberOfTestRecords) {//When you want to test only one record....
                                    return true;
                                }

                                if (processedTypes.indexOf(result.getText({ name: 'type', summary: "GROUP" })) > -1) { return true; }
                                else { processedTypes.push(result.getText({ name: 'type', summary: "GROUP" })); }
                            }
                        }
						
                      	var entity1 = result.getText({name: "entity",summary: "GROUP"})||"1";
                      	var entity2 = result.getText({name: "custbody_tsa_iouemp", summary: "GROUP"})||"2";
                      	var entity3 = result.getText({name: "custbody_tsa_non_s_exp_payee",summary: "GROUP"})||"3";
                        //var entity4 = result.getValue({name: "custbody_tsa_nsipurps", summary: "GROUP"})||"4";
                        var entity5 = result.getText({name: "custbody_tsa_payee_fbu", summary: "GROUP"})||"5";
                      	var name = 	(entity1=="- None -"?"":entity1)+
                            		(entity2=="- None -"?"":entity2)+
                            		(entity3=="- None -"?"":entity3)+
                            		//(entity4=="- None -"?"":entity4)+
                            (entity5 == "- None -" ? "" : entity5);

                        var txnType = result.getValue({ name: 'type', summary: "GROUP" }).toLowerCase();
                        log.debug("", "txnType=" + txnType);

                        var memo = result.getValue({ name: 'memo', summary: "GROUP" });
                        if (!memo || memo == "- None -") {
                            memo = result.getValue({ name: 'custbody_tsa_nsipurps', summary: "GROUP" });
                            if (!memo || memo == "- None -") {
                                memo = result.getValue({ name: 'custbody_tsa_advareason', summary: "GROUP" }) || "";
                            }
                        }

                        var txn = {
                            type: result.getText({ name: 'type', summary: "GROUP" }),
                            typeid: txnType,
                            tranId: (txnType == "vendpymt" ? result.getValue({ name: 'transactionnumber', summary: "GROUP" }) : result.getValue({ name: 'tranid', summary: "GROUP"})),
                            internalId: internalid,
                            trandate: JSON.stringify(result.getValue({ name: 'trandate', summary: "GROUP" })).split("T")[0].replace(/"/g, ''),
                            entity: name, //result.getText({ name: 'entity', summary: "GROUP" }),
                            memo: memo,
                          	currency: result.getText({ name: 'currency', summary: "GROUP" }),
                            total: Math.abs(result.getValue({ name: 'fxamount', summary: "MAX" })),
                            status: result.getText({ name: 'status', summary: "GROUP" })
                        };
                      	log.debug("","type="+txn.typeid+", status="+result.getText({ name: 'status', summary: "GROUP" })+", mixedStatus="+result.getText({ name: 'custbody_tsa_cust_aprov_stat', summary: "GROUP" }) );                      	
                        txn.mixedStatus = (txn.typeid.indexOf("custom") > -1) ? result.getText({ name: 'status', summary: "GROUP" }) : result.getText({ name: 'custbody_tsa_cust_aprov_stat', summary: "GROUP" });
                      
                        if (processedTxns.indexOf(txn.internalId) == -1) { //to test one txn - && txn.internalId==438293

                            logGovernanceMonitoring("processedRecords=" + processedTxns.length + ", txn=" + JSON.stringify(txn));
                            processedTxns.push(txn.internalId);

                            var suitletURL = url.resolveScript({
                                scriptId: 'customscript_tsa_vs_get_appr_users_sl2',
                                deploymentId: 'customdeploy_tsa_vs_get_appr_users_sl2',
                                returnExternalUrl: true,
                                params: { 'txn': JSON.stringify(txn), 'summary_email': true }
                            });

                            try {
                                var response = JSON.parse(https.get({ url: suitletURL }).body);

                                if (response.normalApproval.length > 0) {
                                    log.debug("get_approval_users::execute", "response.normalApproval=" + response.normalApproval);
                                    approvals.normalApproval[txn.internalId] = {
                                        tranId: txn.tranId,
                                        userIds: response.normalApproval,
                                        type: txn.type,
                                        internalId: txn.internalid,
                                        trandate: txn.trandate,
                                        entity: txn.entity,
                                        memo: txn.memo,
                                        total: txn.total,
                                      	currency: txn.currency,
                                        status: txn.mixedStatus
                                    };
                                }
                                if (response.hodApproval.length > 0) {
                                    log.debug("get_approval_users::execute", "response.hodApproval=" + response.hodApproval);
                                    approvals.hodApproval[txn.internalId] = {
                                        tranId: txn.tranId,
                                        userIds: response.hodApproval,
                                        type: txn.type,
                                        internalId: txn.internalid,
                                        trandate: txn.trandate,
                                        entity: txn.entity,
                                        memo: txn.memo,
                                        total: txn.total,
                                      	currency: txn.currency,
                                        status: txn.mixedStatus
                                    };
                                }
                            }
                            catch (e) {
                                log.error("get_approval_users::execute - ERROR", "TranId=" + txn.tranId + ". " + e.message);
                            }
                        }

                        return IS_GU_OK(RESCHEDULE_LIMIT);
                    });
                    return IS_GU_OK(RESCHEDULE_LIMIT);
                });

                //Write new record and send mails
                if (Object.keys(approvals.hodApproval).length > 0 || Object.keys(approvals.normalApproval).length > 0) {

                    //Write new record
                    var createdRecord = record.create({ type: "customrecord_tsa_vs_approval_mail", isDynamic: true, defaultValues: null });
                    createdRecord.setValue({ fieldId: "custrecord_tsa_vs_subsidiary_app_mail", value: parseInt(subsidiariesToProcess[0]) });
                    createdRecord.setValue({ fieldId: "custrecord_tsa_vs_matrix_data", value: JSON.stringify(approvals) });
                    createdRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });

                    //Send mails
                    try {
                        if (TEST_MODE) {
                            //Check if script already running
                            //if (!IsSendMailAlreadyRunning()) {
                            //    log.debug("get_approval_users::execute", "Execute customscript_tsa_vs_send_appr_mail_ss2");
                            //    var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                            //    scheduledScriptTask.scriptId = "customscript_tsa_vs_send_appr_mail_ss2";
                            //    scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_send_appr_mail_ss2";
                            //    scheduledScriptTask.submit();
                            //}
                        }
                        else {
                            //Check if script already running
                            if (!IsSendMailAlreadyRunning()) {
                                log.debug("get_approval_users::execute", "Execute customscript_tsa_vs_send_appr_mail_ss2");
                                var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                                scheduledScriptTask.scriptId = "customscript_tsa_vs_send_appr_mail_ss2";
                                scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_send_appr_mail_ss2";
                                scheduledScriptTask.submit();
                            }
                        }
                    }
                    catch (e) {
                        log.error("get_approval_users::execute - ERROR","At run customscript_tsa_vs_send_appr_mail_ss2" + e.message);
                    }
                }

                //If GU limit is OK let's remove processed (array element at 0th position) subsidiary from the queue
                if (IS_GU_OK(RESCHEDULE_LIMIT) || TEST_MODE) {
                    log.debug("get_approval_users::execute", "Processed subsidiary has been removed from queue");
                    subsidiariesToProcess.shift();
                }

                //Reschedule script if there are subsidiaries to process.
                if (TEST_MODE) {
                    if (subsidiariesToProcess.length > 0) {//processedTxns.length < 8 && 
                        log.debug("get_approval_users::execute", "Test reschedule");
                        //rescheduleScript();
                    }
                }
                else {
                    if (subsidiariesToProcess.length > 0) {
                        rescheduleScript();
                    }
                }

                logGovernanceMonitoring("Finished");
/*            }
            catch (e) {
                log.error("get_approval_users::execute - ERROR", e.message);
            }
            finally {
            }
*/
        }

        function IsSendMailAlreadyRunning() {
            var ss = search.create({
                type: record.Type.SCHEDULED_SCRIPT_INSTANCE,
                filters: [
                    ["status", "anyof", "PENDING", "PROCESSING", "RESTART", "RETRY"]
                    , "AND",
                    ["script.scriptid", search.Operator.IS, "customscript_tsa_vs_send_appr_mail_ss2"]
                    , "AND",
                    ["scriptDeployment.scriptid", search.Operator.IS, "customdeploy_tsa_vs_send_appr_mail_ss2_2"]
                ],
                columns: ["status", "script.internalid"]
            }).run().getRange(0, 5);
            log.debug("get_approval_users::execute", "Number of running scheduled script instances=" + ss.length);
            return (ss.length > 0);
        }

        // #region GOVERNANCE MONITORING

        function logGovernanceMonitoring(caller) {
            var script = runtime.getCurrentScript();
            log.debug("get_approval_users::logGovernanceMonitoring", caller + " - Remaining Usage = " + script.getRemainingUsage());
        }

        // #endregion

        // #region GU check, RESCHEDULE SCRIPT

        //Returns TRUE when we have enough Governance Unit...
        function IS_GU_OK(GU_Limit) {
                return runtime.getCurrentScript().getRemainingUsage() > GU_Limit;
        }

        function rescheduleScript(GU_Limit) {

            log.debug("get_approval_users::reschedule", "get_approval_users must be rescheduled.");

            var scheduledScriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                params: { custscript_processed_txns: processedTxns, custscript_subs_to_process: subsidiariesToProcess }
            });
            scheduledScriptTask.scriptId = "customscript_tsa_vs_get_apprl_users_ss2";
            scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_get_apprl_users_ss2";
            scheduledScriptTask.submit();

            return true;
        }

        // #endregion

        return {
            execute: execute
        };

    });