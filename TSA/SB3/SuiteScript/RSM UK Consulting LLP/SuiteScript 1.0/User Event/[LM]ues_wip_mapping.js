/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Mar 2018     Leon Munir
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function wipOnBeforeSubmit(type){
	if(type != "create" && type != "edit" && type != "xedit")
		return;

	var transactionTypes = nlapiGetFieldTexts("custrecord_wip_transaction_type");
	nlapiSetFieldValue("custrecord_transaction_type_text", JSON.stringify(transactionTypes));

	var accountTypes = nlapiGetFieldTexts("custrecord_wip_account_type");
	nlapiSetFieldValue("custrecord_wip_account_text", JSON.stringify(accountTypes));
}
