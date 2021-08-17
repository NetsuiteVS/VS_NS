/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 */

/*
    06/06/2019 - Viktor Schumann

    This script creates inverse and new Custom GL impact lines and populates the reserve custom segment with values from Transaction lines.
	
*/

define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/task'],
    function (record, log, search, runtime, task) {

        var errMsg = '';
        var itemSearchObj;

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {
                if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
                var currentRecord = scriptContext.newRecord;
                var id = currentRecord.getValue({ fieldId: "id" });
                var nonRecoverableTaxCode = runtime.getCurrentScript().getParameter({ name: "custscript_ihq_non_recoverable_tax_code" });
                var transactionToUpdate = record.load({ type: currentRecord.type, id: id, isDynamic: false });

                log.debug("GL_Impact:afterSubmit", " nonRecoverableTaxCode=" + nonRecoverableTaxCode + " id=" + id);

                getItemSearchObj(id, nonRecoverableTaxCode);

                //If there are no lines with non recoverable tax code, we have nothing to do...
                if (itemSearchObj.runPaged().count == 0) {
                    log.debug("GL_Impact:afterSubmit", " No item with non-rec tax in the transaction.");
                    return;
                }

                var custbody_tsa_gl_correction_req = 0;
              	/* 12/03/2020 removed by VS
                custbody_tsa_gl_correction_req = currentRecord.getValue({ fieldId: "custbody_tsa_gl_correction_req" }) || 0;
                log.debug("GL_Impact:afterSubmit", "custbody_tsa_gl_correction_req= " + custbody_tsa_gl_correction_req);
                custbody_tsa_gl_correction_req++;
				*/
              
                transactionToUpdate.setValue({ fieldId: 'custbody_tsa_gl_correction_req', value: custbody_tsa_gl_correction_req });
                transactionToUpdate.save();
                log.debug("GL_Impact:afterSubmit", "GL Impact correction has been triggered. custbody_tsa_gl_correction_req= " + custbody_tsa_gl_correction_req);
                
                //var custbody_tsa_gl_correction_req = currentRecord.getValue({ fieldId: "custbody_tsa_gl_correction_req" });
                //if (custbody_tsa_gl_correction_req == 0) {
                //    var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                //    scriptTask.scriptId = 'customscript_tsa_vs_gl_impact_corr_ss20';
                //    scriptTask.deploymentId = null;//'customdeploy_tsa_vs_gl_impact_corr_ss20';
                //    scriptTask.params = {
                //        'custscript_doc_type': currentRecord.type,
                //        'custscript_doc_id': id
                //    };
                //    scriptTask.submit();
                //}
                //else {
                //    log.debug("GL_Impact:afterSubmit", "Skip because this is a scheduled script generated afterSubmit");
                //    return;
                //}

                return;
            }
            catch (e) {
                log.debug("Error", 'Message: ' +  JSON.stringify(e));
            }
            finally {
                /*if (errMsg) {
                    throwError();
                }*/
            }
        }

        function getItemSearchObj(id, nonRecoverableTaxCode) {
            //Get all the Item lines in actual transaction
            itemSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["mainline", "is", "F"],
                        "AND",
                        //["item.type", "anyof", "InvtPart", "Group", "Kit", "NonInvtPart", "OthCharge", "Service"],
                        ["customgl","is","F"],
                        "AND",
                        //["posting", "is", "T"],
                        //"AND",
                        ["internalidnumber", "equalto", id],
                        "AND",
                        ["taxitem", "anyof", String(nonRecoverableTaxCode)],
  						"AND", 
      					[
                         ["custcol_cseg_tsa_fundreserv","noneof","@NONE@"],"OR",
                         ["custcol_cseg_tsa_relatedpar","noneof","@NONE@"],"OR",
                         ["custcol_tsa_vs_property_segment_name","isnotempty",""],"OR",
                         //["line.cseg_ihq_property","noneof","@NONE@"],"OR",
                         ["custcol_cseg_tsa_project","noneof","@NONE@"],"OR",
                         ["isrevrectransaction","is","T"]
                        ]                      
                    ],
                columns:
                    [
                        search.createColumn({ name: "account", label: "Account" }),
                        search.createColumn({ name: "taxamount", label: "Amount (Tax)" }),
                        search.createColumn({
                            name: "expenseaccount",
                            join: "item",
                            label: "Expense/COGS Account"
                        }),
                        search.createColumn({ name: "amount", label: "Amount" }),
                        search.createColumn({ name: "creditamount", label: "Amount (Credit)" }),
                        search.createColumn({ name: "debitamount", label: "Amount (Debit)" }),
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "memo", label: "Memo" }),
                        search.createColumn({ name: "posting", label: "Posting" }),
                        search.createColumn({
                            name: "line",
                            sort: search.Sort.ASC,
                            label: "Line ID"
                        }),
                        search.createColumn({
                            name: "name",
                            join: "CUSTCOL_CSEG_TSA_FUNDRESERV",
                            label: "Name"
                        }),
                        search.createColumn({ name: "department", label: "Department" }),
                        search.createColumn({ name: "taxcode", label: "Tax Item" }),
                        search.createColumn({ name: "custcol_sv_non_recoverable_tax_lines", label: "Non Recoverable Tax Lines" })
                    ]
            });
        }

        /**
         * Throws an error
         * Try/catch block omitted as it is necessary for the script to break here
         * @since 1.0.0
         * @private
         * @returns null
         */
        function throwError() {
            var error = null;
            error = nlapiCreateError('INVD_UAT_REC', errMsg, true);
            throw error;
        }

        return {
            afterSubmit: afterSubmit
        };

    });
