/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_disposal_sale_invoice.js)
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

/**
 * Context referenced globally
 */
var ctx = nlapiGetContext();


/**
 * Load Background Process params from FAM Process record in FAM Bundle
 *
 * @return {Object} return Object of params
 */
function getBackgroundProcessParams() {
	// Search for FAM Background Process
	var filters = [
			new nlobjSearchFilter("custrecord_fam_procid", null, "is",
					"disposal"),
			new nlobjSearchFilter("custrecord_fam_proccurrstagestatus", null,
					"is", [ "1", "2" ]) ]; // Stage Status is Initiated or
											// In-Progress
	var column = new nlobjSearchColumn("custrecord_fam_procparams");
	// The Params field contains params as JSON string
	var processResults = nlapiSearchRecord("customrecord_fam_process", null,
			filters, column);
	if (processResults) {
		nlapiLogExecution("DEBUG", "Params", processResults[0].getValue(column));
	}
	var params = processResults
			&& JSON.parse(processResults[0].getValue(column));
	return params;
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 *
 * @appliedtorecord invoice
 *
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function onDisposalTransactionBeforeSubmit(type) {

	try {
		if (ctx.getExecutionContext() != "mapreduce") {
			return;
		}

		/**
		 * Process Parameters
		 *
		 * @type {Object}
		 */
		var params = getBackgroundProcessParams();
		//params = {"prmt":4,"recsToProc":{"28":{"date":1522479600000,"type":1,"qty":"1","item":"661","cust":"53","amt":"99800.00","tax":"38","loc":"1"},"31":{"date":1522479600000,"type":1,"qty":"1","item":"661","cust":"53","amt":"98000.00","tax":"38","loc":"1"}},"done":"T"};
		if (!params) {
			nlapiLogExecution("DEBUG", "Params", "None Found");
			return;
		}

		// Get Asset Id List from Parameters Object
		var assetList = Object.keys(params.recsToProc) || [];
		var assetTypeIdList = assetList.map(function(currentValue){
			return nlapiLookupField("customrecord_ncfar_asset", currentValue, "custrecord_assettype", false);
		});

		if (assetTypeIdList.length < 1) {
			nlapiLogExecution("DEBUG", "Asset Type Id", "None Found");
			return;
		}

		var linecount = nlapiGetLineItemCount("item");
		// Loop through Sales Invoice line items
		for (var linenum = 1; linenum <= linecount; linenum++) {

			nlapiSelectLineItem("item", linenum);
			var itemId = nlapiGetCurrentLineItemValue("item", "item");
			var amount = nlapiGetCurrentLineItemValue("item", "amount");

			// Assuming the Sales Invoice lines are created in same
			// order as the asset type keys are fed into params object
			// we fetch the key at the head of the array.
			var assetTypeId = assetTypeIdList.shift();

			// Use Attached Library to Search for Reserve
			var assetType = new AssetType(null);
			assetType.id = assetTypeId;
			// Lookup Custom Record for Asset Type Reserve
			var assetTypeReserve = assetType.getReserve();

			// If no Reserve found then continue to next line
			if (!assetTypeReserve) {
                nlapiSetCurrentLineItemValue("item", "custcol_tsa_wip_mapping_error", "No Reserve Found.");
                nlapiCommitLineItem("item");
				continue;
			}

			// Set Reserve on Line
			nlapiSetCurrentLineItemValue("item", "custcol_cseg_tsa_fundreserv",
					assetTypeReserve);
			/**
			 * Parent Internal Id of Reserve linked to Asset Type being Disposed
			 * 
			 * @type {string}
			 */
			var reserveParent = nlapiLookupField(
					"customrecord_cseg_tsa_fundreserv", assetTypeReserve,
					"parent", false);

			// Create Post object to be posted as request body to Suitelet post
			// function
			var postObject = {
				item : itemId,
				reserve : reserveParent,
				internalType : nlapiGetFieldValue("ntype"),
				fxAsset : true
			};
			/**
			 * Request simulation object to call the Suitelet code
			 */
			var sletRequest = new SuiteletRequest(postObject);

			/**
			 * CallBack object to capture the response from Suitelet code
			 */
			var SuiteletResponse = {};
			// Callback
			SuiteletResponse.write = function(response) {
				var objLine = JSON.parse(response);
				// If WIP mapping error then copy error to both the line and
				// body error fields
				if (objLine.error) {
					nlapiSetFieldValue("custbody_tsa_wip_mapping_error",
							objLine.error);
					nlapiSetCurrentLineItemValue("item",
							"custcol_tsa_wip_mapping_error", objLine.error);
				} else if (objLine.id) {
					// Update WIP Mapping record id on journal line
					nlapiSetCurrentLineItemValue("item",
							"custcol_tsa_wip_mapping", objLine.id);
					nlapiSetCurrentLineItemValue("item",
							"custcol_tsa_wip_mapping_error", "");
				}
				nlapiCommitLineItem("item");
			}
			// call post function on WIP Server Suitelet
			post(sletRequest, SuiteletResponse);
		}

	} catch (e) {
		nlapiLogExecution("DEBUG", "FATAL", e);
	}
}
