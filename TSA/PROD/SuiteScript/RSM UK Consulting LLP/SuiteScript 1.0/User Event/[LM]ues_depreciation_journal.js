/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_depreciation_journal.js)
 *
 * Script Type:	User Event
 *
 * Version:		2018.010 - Initial Release
 *
 * Author:		RSM
 *
 * Purpose:
 *
 * Script:
 * Deploy:
 *
 * Notes:
 *
 * Libraries:
 ****************************************************************************************/

var ctx = nlapiGetContext();

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 *
 * @appliedtorecord recordType
 *
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function onDepJeBeforeSubmit(type) {
	if (ctx.getExecutionContext() == "mapreduce" || ctx.getExecutionContext() == "scheduled") {
		nlapiSetFieldValue("custbody_tsa_depreciation_inprogress", "T");
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 *
 * @appliedtorecord recordType
 *
 * @param {String}
 *            type Operation types: create, edit, delete, xedit, approve,
 *            cancel, reject (SO, ER, Time Bill, PO & RMA only) pack, ship (IF
 *            only) dropship, specialorder, orderitems (PO only) paybills
 *            (vendor payments)
 * @returns {Void}
 */
function afterSubmitLaunchProcess(type) {
	if (ctx.getExecutionContext() == "mapreduce" || ctx.getExecutionContext() == "scheduled") {
      var params = {
			"custscript_lm_depje_internalid" : nlapiGetRecordId()
		};
		nlapiScheduleScript("customscript_lm_sch_depje_reserve", null, params);
	}
}
