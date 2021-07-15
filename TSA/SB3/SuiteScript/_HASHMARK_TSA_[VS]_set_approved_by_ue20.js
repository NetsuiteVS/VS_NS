/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (#TSA_[VS]_set_approved_by_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Store active user to custbody_ihq_vs_approved_by field when approvalstatus is set to "2"
 * 
 * Date:        03/10/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
    function (record, search, runtime) {

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

            try {

                log.debug("SetApprovedBy::BeforeSubmit", "Start");

                if (scriptContext.type != scriptContext.UserEventType.CREATE && scriptContext.type != scriptContext.UserEventType.EDIT) {
                    return;
                }

                var oldRecord = scriptContext.oldRecord;
                var newRecord = scriptContext.newRecord;

                var oldApproval = oldRecord.getValue({ fieldId: 'approvalstatus' });
                var newApproval = newRecord.getValue({ fieldId: 'approvalstatus' });

                log.debug("SetApprovedBy::BeforeSubmit", "approvalstatus old:" + oldApproval);
                log.debug("SetApprovedBy::BeforeSubmit", "approvalstatus new:" + newApproval);
				
              	var current_approved_by=newRecord.getValue({ fieldId: "custbody_ihq_vs_approved_by" });
              
                if ( newApproval.equals("2") && (oldApproval != newApproval || !current_approved_by) ) {
                    var userId = runtime.getCurrentUser().id;
                    log.debug("SetApprovedBy::BeforeSubmit", "userID:" + userId);
                    newRecord.setValue({ fieldId: "custbody_ihq_vs_approved_by", value: userId, ignoreFieldChange: false });
                }

                log.debug("SetApprovedBy::BeforeSubmit", "End");

                return true;
            }
            catch (e) {
                log.debug("SetApprovedBy::BeforeSubmit - ERROR", e);
            }
            finally {
            }
        }

        //#endregion

        return {
            beforeSubmit: beforeSubmit
        };

    });
