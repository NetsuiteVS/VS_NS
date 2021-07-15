/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_csvimport_sale.js)
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
var SUBLIST_ITEM = "item";

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
function onCsvSaleBeforeSubmit(type) {

    //if (vs_lib10.userSubsidiaryIsIHQ()) return true;
  
	if (ctx.getExecutionContext() != "csvimport") {
		return;
	}
	if (type != "create" && type != "edit" && type != "xedit") {
		return;
	}
  
    try{
        var subs_reserve_journal_creation_enabled = nlapiGetFieldValue('custbody_subs_reserve_journal_setting');
      	nlapiLogExecution("debug","onCSV Cash Sale BeforeSubmit","Reserve checking: id="+nlapiGetRecordId()+" , subs reserve T journal enabled="+subs_reserve_journal_creation_enabled);
        if(subs_reserve_journal_creation_enabled!="T") {
            nlapiLogExecution("debug","onCSV Cash Sale BeforeSubmit","Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
            return true;
        }
    }
  	catch(e){
	    nlapiLogExecution("error","onCSV Cash Sale BeforeSubmit", JSON.stringify(e) );
    }

	var linecount = nlapiGetLineItemCount(SUBLIST_ITEM);
	for (var linenum = 1; linenum <= linecount; linenum++) {

		nlapiSelectLineItem(SUBLIST_ITEM, linenum);
		var item = nlapiGetCurrentLineItemValue(SUBLIST_ITEM, SUBLIST_ITEM);
		var reserve = nlapiGetCurrentLineItemValue(SUBLIST_ITEM,
				"custcol_cseg_tsa_fundreserv");
		var reserveParent = "";
		if (reserve) {
			reserveParent = nlapiLookupField(
					"customrecord_cseg_tsa_fundreserv", reserve, "parent",
					false);
		}

		var postObject = {
			item : item,
			reserve : reserveParent,
			internalType : nlapiGetFieldValue("ntype")
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
				throw objLine.error;
			} else if (objLine.id) {
				// Update WIP Mapping record id on journal line
				nlapiSetCurrentLineItemValue(SUBLIST_ITEM,
						"custcol_tsa_wip_mapping", objLine.id);
				nlapiSetCurrentLineItemValue(SUBLIST_ITEM,
						"custcol_tsa_wip_mapping_error", "");
			}
			nlapiCommitLineItem(SUBLIST_ITEM);
		}
		// call post function on WIP Server Suitelet
		post(sletRequest, SuiteletResponse);
	}
}
