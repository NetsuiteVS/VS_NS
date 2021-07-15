/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */

/****************************************************************************************
 * Name:		SuiteScript 2.0 Workflow action script 
 *
 * Script Type:	Action script
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Trigger Approval Email
 *
 * Date:        20/05/2021
 *
 ****************************************************************************************/

define(['N/error', 'N/record', 'N/search', 'N/runtime', 'N/task'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, runtime, task) {

        //#region ******************************  ON ACTION  ************************************* 

        /**
         * Definition of the Action script trigger point.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @Since 2016.1
         */
        function onAction(scriptContext) {
            log.debug("","*** Started ***");
			var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
			scheduledScriptTask.scriptId = "customscript_tsa_vs_get_apprl_users_ss2";
			//scheduledScriptTask.deploymentId = "customdeploy_tsa_vs_send_appr_mail_ss2";
			scheduledScriptTask.submit();
			return true;
        }

        //#endregion

        return {
            onAction: onAction
        };

    });




