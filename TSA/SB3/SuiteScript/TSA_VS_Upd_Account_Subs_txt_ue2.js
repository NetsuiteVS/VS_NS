/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_VS_set_subs_list_on_acc_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set subsidiary list field on Chart of Accounts
 * 
 * Date:        16/03/2021
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'N/translation', 'N/file'],
    function (url, record, log, search, runtime, http, https, translation, file) {

        //#region ******************************  BEFORE LOAD  ************************************* 

        var accountSubsidiaries = [];
        var subsidiariesPerParents = [];

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

            log.debug("TSA_VS_set_subs_list_on_acc_ue20::beforeSubmit", "scriptContext.type=" + scriptContext.type);

            if ( scriptContext.type !== scriptContext.UserEventType.CREATE
                && scriptContext.type !== scriptContext.UserEventType.XEDIT
                && scriptContext.type != scriptContext.UserEventType.EDIT) return;
          
            var oldSubsidiaries=[];
            var oldIncludechildren;
          	if(scriptContext.type != scriptContext.UserEventType.CREATE){
            	oldSubsidiaries = scriptContext.oldRecord.getValue({ fieldId: 'subsidiary' });
            	oldIncludechildren = scriptContext.oldRecord.getValue({ fieldId: 'includechildren' });              
            }
            //var oldSubsidiaries = scriptContext.oldRecord.getValue({ fieldId: 'subsidiary' });
            var newSubsidiaries = scriptContext.newRecord.getValue({ fieldId: 'subsidiary' });
            var isParentCompany = scriptContext.newRecord.getValue({ fieldId: 'subsidiary' })==1;
            //var oldIncludechildren = scriptContext.oldRecord.getValue({ fieldId: 'includechildren' });
            var newIncludechildren = scriptContext.newRecord.getValue({ fieldId: 'includechildren' });
            var newSubsidiaryTxt = scriptContext.newRecord.getValue({ fieldId: 'custrecord_tsa_acc_sub_id' });
            var subsidiariesChanged = !arraysEqual(oldSubsidiaries, newSubsidiaries);
            log.debug("TSA_VS_set_subs_list_on_acc_ue20::beforeSubmit", "subsidiariesChanged=" + subsidiariesChanged + ", newSubsidiaryTxt.length=" + newSubsidiaryTxt.length + ", isParentCompany=" + isParentCompany);
 
            if (oldIncludechildren != newIncludechildren || subsidiariesChanged || newSubsidiaryTxt.length == 0 || newSubsidiaryTxt=="-" || newSubsidiaryTxt==" " ) {

                var includeChildren = scriptContext.newRecord.getValue({ fieldId: 'includechildren' });
                log.debug("TSA_VS_set_subs_list_on_acc_ue20::beforeSubmit", "includeChildren=" + includeChildren);
                accountSubsidiaries = newSubsidiaries;

                if (includeChildren) {

                    if (isParentCompany) {
                        accountSubsidiaries = ["All Sub"];
                    }
                    else {
                        var subsidiarySearchObj = search.create({
                            type: "subsidiary",
                            filters: [["isinactive", "is", "F"]],
                            columns:
                                [
                                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                                    search.createColumn({ name: "parent", label: "Parent Subsidiary" })
                                ]
                        });

                        subsidiarySearchObj.run().each(function (result) {
                            var id = result.getValue({ name: 'internalid' });
                            var parent = result.getValue({ name: 'parent' });

                            if (parent) {
                                if (!subsidiariesPerParents[parent]) {
                                    subsidiariesPerParents[parent] = [];
                                }
                                subsidiariesPerParents[parent].push(id);
                            }

                            return true;
                        });

                        for (var i = 0; i < accountSubsidiaries.length; i++) {
                            getRelatedSubsidiaries(accountSubsidiaries[i]);
                        }
                    }
                }
				
              	//var account_Subs = JSON.stringify(accountSubsidiaries.sort(function (a, b) { return a - b; }));
              	var account_Subs = accountSubsidiaries.sort(function (a, b) { return a - b; }).join(",");
                log.debug("TSA_VS_set_subs_list_on_acc_ue20::beforeSubmit", "accountSubsidiaries=" +account_Subs+", accountSubsidiaries.length="+accountSubsidiaries.length);

                scriptContext.newRecord.setValue({ fieldId: "custrecord_tsa_acc_sub_id", value: account_Subs, ignoreFieldChange: true });
            }

            log.debug("TSA_VS_set_subs_list_on_acc_ue20::beforeSubmit", "Finished");

            return true;
        }

        function arraysEqual(a1, a2) {
            a1.sort();
            a2.sort();
            return JSON.stringify(a1) == JSON.stringify(a2);
        }

        function getRelatedSubsidiaries(parent) {
            if (subsidiariesPerParents[parent] && subsidiariesPerParents[parent].length > 0) {

                for (var i = 0; i < subsidiariesPerParents[parent].length; i++) {
                    getRelatedSubsidiaries(subsidiariesPerParents[parent][i]);

                    if (accountSubsidiaries.indexOf(subsidiariesPerParents[parent][i]) == -1) {
                        accountSubsidiaries.push(subsidiariesPerParents[parent][i]);
                    }
                }
            }
        }

        //#endregion

        return {
            beforeSubmit: beforeSubmit
        };

    });
