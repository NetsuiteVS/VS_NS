/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_fixed_asset_reserve.js)
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

var FXASSET_RESERVE = "fxassetreserve";

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function fxAssOnBeforeLoad(type, form, request){

	if(!isContextUI()) return;

	var reserveField = form.addField("custpage_assetreserve", "select", "Reserve", "146", "main");
	if(type == "edit" || type == "view"){
		var results = nlapiSearchRecord("customrecord_lm_fxasset_reserve", null,
				[new nlobjSearchFilter("custrecord_lm_fxasset_asset_type", null, "anyof", nlapiGetRecordId())], 
				[new nlobjSearchColumn("custrecord_lm_fxasset_reserve")]);
		if(results){
			reserveField.setDefaultValue(results[0].getValue("custrecord_lm_fxasset_reserve"));
		}
	}
}

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
function fxAssOnBeforeSubmit(type){

	if(!isContextUI()) return;

	if(type != "edit" && type != "xedit" && type != "create") return;

	//Store the reserve value into session
	nlapiGetContext().setSessionObject(FXASSET_RESERVE, nlapiGetFieldValue("custpage_assetreserve"));
	nlapiLogExecution("DEBUG", "Reserve", nlapiGetFieldValue("custpage_assetreserve"));
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function fxAssOnAfterSubmit(type){

	if(!isContextUI()) return;

	if(type != "edit" && type != "xedit" && type != "create") return;

	var reserve = nlapiGetContext().getSessionObject(FXASSET_RESERVE);
	// Check if existing record exists then update it
	var results = nlapiSearchRecord("customrecord_lm_fxasset_reserve", null,
			[new nlobjSearchFilter("custrecord_lm_fxasset_asset_type", null, "anyof", nlapiGetRecordId())],
			null);
	if(results){
		nlapiSubmitField("customrecord_lm_fxasset_reserve", results[0].id, "custrecord_lm_fxasset_reserve", reserve, true);
	}
	else{
		// ELSE record is not found so create it
		var linkRecord = nlapiCreateRecord("customrecord_lm_fxasset_reserve", null);
		linkRecord.setFieldValue("custrecord_lm_fxasset_asset_type", nlapiGetRecordId());
		linkRecord.setFieldValue("custrecord_lm_fxasset_reserve", reserve);
		nlapiSubmitRecord(linkRecord, true, true);
	}

	// Clear Session
	nlapiGetContext().setSessionObject(FXASSET_RESERVE, "");
}


function isContextUI(){
	return nlapiGetContext().getExecutionContext() == "userinterface";
}