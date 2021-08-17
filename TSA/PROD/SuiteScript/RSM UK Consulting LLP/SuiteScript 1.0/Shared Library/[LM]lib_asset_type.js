/****************************************************************************************
 * Name:		SuiteScript 1.0 Library ([LM]lib_asset_type.js)
 *
 * Script Type:	Library File
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

/**
 * Search 'Asset Type' custom record from Fixed Asset Management
 * Bundle 169224
 *
 * @return {string} Asset Type Internal Id
 */
var AssetType = function (account) {
	if(!account) return;

	var filters = [new nlobjSearchFilter(
			"custrecord_assettypedeprchargeacc", null, "anyof",
			account)];
	var assetTypeResults = nlapiSearchRecord(
			"customrecord_ncfar_assettype", null, filters, null);
	if(assetTypeResults){
		nlapiLogExecution("DEBUG", "BG Summary Record Internal ID", assetTypeResults[0].id);
	}
	this.id = assetTypeResults && assetTypeResults[0].id;
	nlapiLogExecution("DEBUG", "Asset Type Internal ID", this.id);
};

/**
 * Search 'Fixed Asset Type Reserve' (customrecord_lm_fxasset_reserve)
 * custom record. From Fixed Asset Management Bundle 169224
 *
 * @return {string} Reserve Segment Internal Id
 */
AssetType.prototype.getReserve = function () {
	var reserve = null;
	if (this.id) {
		var column = new nlobjSearchColumn("custrecord_lm_fxasset_reserve");
		var filter = new nlobjSearchFilter("custrecord_lm_fxasset_asset_type",
				null, "anyof", this.id);
		// Search 'Fixed Asset Type Reserve'
		// (customrecord_lm_fxasset_reserve) custom record.
		// The custom record links Fixed Asset Type to Reserve Segment
		// Filter on Asset Type (custrecord_lm_fxasset_asset_type)
		// Search Column Reserve (custrecord_lm_fxasset_reserve)
		var fxAssetReserveLinks = nlapiSearchRecord(
				"customrecord_lm_fxasset_reserve", null, filter, column);
		reserve = fxAssetReserveLinks &&  fxAssetReserveLinks[0].getValue(column);
	}
	return reserve;
};


/**
 * Fake the Suitelet Object to call Suitelet code from Workflow Action server script
 */
var SuiteletRequest = function(bodyObject){
	this.body = JSON.stringify(bodyObject);
};

/**
 * Send fake HTTP Request to Suitelet code
 * @param bodyObject
 */
SuiteletRequest.prototype.getBody = function(){
	return this.body;
};

