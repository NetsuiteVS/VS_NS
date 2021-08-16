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
  	nlapiLogExecution("DEBUG", "", "beforesubmit started");
	if (type=="create" && (ctx.getExecutionContext() == "mapreduce" || ctx.getExecutionContext() == "scheduled") || (type=="edit" && nlapiGetRecordId()==434673) )  {
		nlapiSetFieldValue("custbody_tsa_depreciation_inprogress", "T");
      	nlapiLogExecution("DEBUG", "", "beforesubmit - set custbody_tsa_depreciation_inprogress=true");
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
    nlapiLogExecution("DEBUG", "", "after submit started");
    if ((type == "create") && (ctx.getExecutionContext() == "mapreduce" || ctx.getExecutionContext() == "scheduled") || (type == "edit" && nlapiGetRecordId() == 434673)) { // specific record for testing only in edit mode
        var params = {
            "custscript_lm_depje_internalid": nlapiGetRecordId()
        };

        var rec = nlapiGetNewRecord();
        var there_is_an_asset = check_for_asset(rec);

        if (there_is_an_asset) {
            nlapiScheduleScript("customscript_lm_sch_depje_reserve", null, params);
            nlapiLogExecution("DEBUG", "", "after submit - customscript_lm_sch_depje_reserve scheduled script was triggered");
        }
    }
}

	
function check_for_asset(jeRecord) {
    try {
        var SUBLIST_LINE = "line";
        // Journal Entry Line Sublist number of lines
        var lineCount = jeRecord.getLineItemCount(SUBLIST_LINE);
        var accountFilterArray = [];
        for (var line = 1; line <= lineCount; line++) {
            jeRecord.selectLineItem(SUBLIST_LINE, line);

            var acc_type = jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "custcol_tsa_account_type");
            nlapiLogExecution("DEBUG", "", "LineNo=" + line + ", Account Type=" + acc_type);
            if (acc_type == "4") {
                nlapiLogExecution("DEBUG", "", "LineNo=" + line + ", Account Type=4 - skipped"); //4 - Other Curr Assets
                continue;
                /* Account type codes are: 0 - Bank 1 - Accts Receivable 2 - Inventory 4 - Other Curr Assets 5 - Fixed Assets 6 - Accum Deprec. 8 - Other Assets 10 - Accts Payable 12 - Oth Curr Liab. 14 - Long Term Liab. 16 - Equity-No Close 18 - Retained Earnings 19 - Equity-Closes 21 - Income 23 - COGS 24 - Expense 25 - Other Income 26 - Other Expense */
            }

            /**
             * Journal Entry Line Account Internal ID
             */
            var accountId = jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "account");
            accountFilterArray.push(accountId);
            /**
             * Journal Entry Line Memo String
             * @type {string}
             */
            var memo = jeRecord.getCurrentLineItemValue(SUBLIST_LINE, "memo");

            /**
             * Internal ID of Reserve linked to Asset Type
             */
            var assetTypeReserve = null;

            // Asset Revaluation Journal Entry contains name of the Asset in memo field
            // on Journal Entry lines e.g. FAM00038				
            var matches = String(memo).match(/FAM\d+/);
            nlapiLogExecution("DEBUG", "", "LineNo=" + line + ", matches=" + matches);
            if (matches) {
                return true;
            }
        }

        // check account for asset type
        nlapiLogExecution("DEBUG", "", "accountFilterArray=" + accountFilterArray);
        var filters = [new nlobjSearchFilter("custrecord_assettypedeprchargeacc", null, "anyof", accountFilterArray)];
        var assetTypeResults = nlapiSearchRecord("customrecord_ncfar_assettype", null, filters, null);

        if (assetTypeResults) {
            var asset_type_id = assetTypeResults[0].id;

            nlapiLogExecution("DEBUG", "", "AssetType (lib function)=" + asset_type_id);
            return true;
        }

        return false;
    }
    catch (e) {
        nlapiLogExecution("ERROR", "", e);
    }

    return false;
}
