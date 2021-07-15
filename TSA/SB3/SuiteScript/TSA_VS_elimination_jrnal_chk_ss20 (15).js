/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (#TSA_VS_elimination_jrnal_chk_ss20.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check last two (now 10) days invoices (which are marked with "impact" in the field: "field"). 
 * 
 * Date:        07/10/2020
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/

define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task'],
    /**
     * @param {record} record
     * @param {search} search
     */

    function (record, search, render, format, runtime, task) {

        /**
          * @param {Object} scriptContext
          * @param {string} scriptContext.type
          * @Since 2018.2
          */

        var lastProcessedRecordId;

        //************************** EXECUTE *****************************

        function execute(scriptContext) {
            try {

                log.debug(" elimination_jrnal_chk::execute()", "Started");

                lastProcessedRecordId = runtime.getCurrentScript().getParameter({ name: "custscript_last_processed_record_id" });

                var filterDate = new Date();
                filterDate.setDate(filterDate.getDate() - 3);
                var month = (filterDate.getMonth() < 9 ? '0' : '') + (filterDate.getMonth() + 1);
                var day = (filterDate.getDate() < 10 ? '0' : '') + filterDate.getDate();
                var year = filterDate.getFullYear();
                var filterDateStr = day + "/" + month + "/" + year + " 10:00 pm";
				var invoiceID;
				
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["systemnotes.field", "anyof", "TRANDOC.IMPACT"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["internalidnumber", "greaterthan", lastProcessedRecordId],
                        "AND",
                        ["custbody_tsa_inter_unit", "is", "T"],
                        "AND",
                        ["systemnotes.date", "onorafter", filterDateStr]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", sort: search.Sort.ASC, label: "Internal ID" })
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug(" elimination_jrnal_chk::Execute()", "invoiceSearchObj result count" + searchResultCount);

                var testingRestricition = 0;//MUST BE DELETED AFTER TESTING
                invoiceSearchObj.run().each(function (result) {

                    //Reschedule if neccessary
                    if (!reschedule(300)) {
                        invoiceID = result.getValue({ name: 'internalid' });


                        //MUST BE DELETED AFTER TESTING - START
                        /*
						if (testingRestricition > 0) {
								return false;
						}
						testingRestricition++;
						invoiceID = "366668";//Just for testing purposes
						//MUST BE DELETED AFTER TESTING - END
						*/

                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "*** NEXT invoiceId:" + invoiceID);
                        lastProcessedRecordId = invoiceID;

                        var invoiceSearchObj = search.create({
                            type: search.Type.INVOICE,
                            filters:
                                [
                                    ["internalid", "anyof", invoiceID],
                                    "AND",
                                    ["taxline", "is", "F"],
                                    "AND",
                                    ["formulatext: case when {creditamount} is NULL and {debitamount} is NULL then 0 else 1 end", "is", "1"],
                                    "AND",
                                    ["formulatext: {account}", "isnotempty", ""]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "account", label: "Account" }),
                                    search.createColumn({ name: "creditamount", label: "Amount (Credit)" }),
                                    search.createColumn({ name: "debitamount", label: "Amount (Debit)" })
                                ],
                            settings: [
                                search.createSetting({
                                    name: 'consolidationtype',
                                    value: 'NONE'
                                })]
                        });

                        invoiceResult = invoiceSearchObj.run().getRange({ start: 0, end: 1000 });
                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "invoiceResult:" + JSON.stringify(invoiceResult));
                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "invoiceResult.length:" + invoiceResult.length);                                          

                        var journalentrySearchObj = search.create({
                            type: "journalentry",
                            filters: [
                                ["type", "anyof", "Journal"],
                                "AND",
                                ["custcol_linked_ic_trans", "anyof", invoiceID],
								"AND",
								["reversalofnumber","isempty",""],
								"AND",
								["reversaldate","isempty",""]
                            ],
                            columns: [
                                search.createColumn({ name: "account", label: "Account" }),
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "custcol_linked_ic_trans", label: "Linked IC" }),
                                search.createColumn({ name: "creditamount", label: "Amount (Credit)" }),
                                search.createColumn({ name: "debitamount", label: "Amount (Debit)" }),
                                search.createColumn({ name: "creditfxamount", label: "FX Amount (Credit)" }),
                                search.createColumn({ name: "debitfxamount", label: "FX Amount (Debit)" }),                              
                              	search.createColumn({ name: "exchangerate", label: "Exchange Rate" })
                            ],
                            settings: [
                                search.createSetting({
                                    name: 'consolidationtype',
                                    value: 'NONE'
                                })]
                        });
                        journalResult = journalentrySearchObj.run().getRange({ start: 0, end: 1000 });
						var more_than_one=0;
						var previous_id=0;
						var current_id=0;
						for(var i=0;i<journalResult.length;i++){
							current_id=journalResult[i].getValue({ name: 'internalid' });
							if(current_id!=previous_id) more_than_one++;
							previous_id=current_id;
						}
                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "journalResult=" + JSON.stringify(journalResult));
                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "journalResult.length=" + journalResult.length);
						if(more_than_one>1){
							log.error( "invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "There's more than one journal hence Skipping. result="+JSON.stringify(journalResult) );
							return true;
						}
                        var journalID;
						if(journalResult[0]) journalID=journalResult[0].getValue({ name: 'internalid' });
                        log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "journalInternalId=" + journalID);
						
                        var accountsMatches = true;
                        var creditMatchesDebit = true;						
						var nr_of_lines_not_match=false;
						var no_journal=false;
						
                        if (!journalResult || !journalResult[0] || !journalResult[0].getValue({ name: 'internalid' })) {
                            log.error("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "Related journal doesn't exit. InvoiceId="+invoiceID);
							no_journal=true;
                            //return true;
                        }
						else if (invoiceResult.length != journalResult.length) {
							nr_of_lines_not_match=true;
                            log.audit("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "InvoiceLineCount does not match journalLineCount.");
                        }

						if(!nr_of_lines_not_match && !no_journal){
							for (var i = 0; i < invoiceResult.length; i++) {

								var invoiceAccount = invoiceResult[i].getValue({ name: 'account' });
								var journalAccount = journalResult[i].getValue({ name: 'account' });
								var invoiceCreditAmount = invoiceResult[i].getValue({ name: 'creditamount' });
								var invoiceDebitAmount = invoiceResult[i].getValue({ name: 'debitamount' });
								var journalCreditAmount = journalResult[i].getValue({ name: 'creditfxamount' });
								var journalDebitAmount = journalResult[i].getValue({ name: 'debitfxamount' });                              
                              	if(!journalCreditAmount && !journalDebitAmount){
                                    var journalCreditAmount = journalResult[i].getValue({ name: 'creditamount' });
                                    var journalDebitAmount = journalResult[i].getValue({ name: 'debitamount' });
                                }

								log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "LINE(" + i + "): Invoice Account:" + invoiceAccount + ";   Journal Account:" + journalAccount);
								log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "LINE(" + i + "): Invoice Credit Amount:" + invoiceCreditAmount + ";   Journal Debit Amount:" + journalDebitAmount);
								log.debug("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "LINE(" + i + "): Invoice Debit Amount:" + invoiceDebitAmount + ";   Journal Credit Amount:" + journalCreditAmount);

								if (invoiceAccount != journalAccount) {
									accountsMatches = false;
									log.audit("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "MISMATCH AT LINE(" + i + "): Invoice account <> journal account! InvoiceId:" + invoiceID + " JournalID." + journalID);
									break;
								}  

								if (invoiceCreditAmount != journalDebitAmount) {
									creditMatchesDebit = false;
									log.audit("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "MISMATCH AT LINE(" + i + "): Invoice Credit Amount <> Journal Debit Amount");
									break;
								}       

								if (invoiceDebitAmount != journalCreditAmount) {
									creditMatchesDebit = false;
									log.audit("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "MISMATCH AT LINE(" + i + "): Invoice Debit Amount <> Journal Credit Amount");
									break;
								}   
							}
						}
						
                        if (!creditMatchesDebit || !accountsMatches || nr_of_lines_not_match) {
                            log.audit("invoice id="+invoiceID+" elimination_jrnal_chk::Execute()", "Reversing exiting journal and creating a new one.");

                            var reversalDate = new Date();
                            reversalDate.setDate(reversalDate.getDate());
                            var month = (reversalDate.getMonth() < 9 ? '0' : '') + (reversalDate.getMonth() + 1);
                            var day = (reversalDate.getDate() < 10 ? '0' : '') + reversalDate.getDate();
                            var year = reversalDate.getFullYear();
                            var reversalDateStr = day + "/" + month + "/" + year;
							
                          	/*
                            var id = record.submitFields({
                                type: record.Type.JOURNAL_ENTRY,
                                id: journalID,
                                values: {
                                    reversaldate: reversalDateStr
                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                }
                            });
                          	*/
                          
                          	var journal_orig = record.load({ type: record.Type.JOURNAL_ENTRY, id: journalID, isDynamic: true });
                          	var location = journal_orig.getValue({ fieldId: "custbody_tsa_location_main_jrn" });
                          	journal_orig.setValue({ fieldId: "reversaldate", value: reversalDate});
							journal_orig.setValue({ fieldId: "location" ,value: location });
        					var jouID = journal_orig.save();

                            log.debug("Call elimination_jrnal_chk::execute", "Creating journal from invoice Id: " + invoiceID);

                            var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                            scriptTask.scriptId = 'customscript_rsm_sc_cre_jou_frm_inv';
                            scriptTask.params = { custscript_rsm_invoice_id: invoiceID, custscript_orig_elim_journal: journalID };
                            var scriptTaskId = scriptTask.submit();
                        }

                        return true;
                    }
                    else {
                        return false;
                    }

                    return true;
                });

                logGovernanceMonitoring("EndProcess");
            }
            catch (e) {
                log.debug(" elimination_jrnal_chk::Execute() - Error", e);
            }
            finally {
            }

        }
        
        // #region GOVERNANCE MONITORING

        function logGovernanceMonitoring(caller) {
            var script = runtime.getCurrentScript();
            log.debug(" elimination_jrnal_chk::logGovernanceMonitoring()", caller + " - Remaining Usage = " + script.getRemainingUsage());
        }

        // #endregion
                
        // #region RESCHEDULE SCRIPT

        function reschedule(rescheduleGovernanceUsageLimit) {

            if (runtime.getCurrentScript().getRemainingUsage() > rescheduleGovernanceUsageLimit) {
                return false;
            }

            log.debug(" elimination_jrnal_chk::reschedule()", "#TSA_VS_elimination_jrnal_chk_ss20.js must be rescheduled!");

            var scheduledScriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                params: { custscript_last_processed_record_id: lastProcessedRecordId }
            });
            scheduledScriptTask.scriptId = "customscript_tsa_vs_el_jrnl_chk_ss20";
            scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_el_jrnl_chk_ss20";
            scheduledScriptTask.submit();

            return true;
          
        }

        // #endregion

        return {
            execute: execute
        };

    });