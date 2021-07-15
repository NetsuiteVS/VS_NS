/****************************************************************************************
 * Name:		SuiteScript 1.0 User Event ([LM]ues_csvimport_journal.js)
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
function onCsvJournalBeforeSubmit(type) {
  
  		//if (vs_lib10.userSubsidiaryIsIHQ()) return true;
		
  		var ouu_txn = nlapiGetFieldValue('custbody_tsa_oou_txn');
		if (ctx.getExecutionContext() == "csvimport" || ouu_txn=="T"){ }
        else{
          return;
		}
      
        try{
            var subs_reserve_journal_creation_enabled = nlapiGetFieldValue('custbody_subs_reserve_journal_setting');
            nlapiLogExecution("debug","onCSV Journal BeforeSubmit","Reserve checking: id="+nlapiGetRecordId()+" , subs reserve T journal enabled="+subs_reserve_journal_creation_enabled);
            if(subs_reserve_journal_creation_enabled!="T") {
                nlapiLogExecution("debug","onCSV Cash Sale BeforeSubmit","Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
                return true;
            }
        }
        catch(e){
            nlapiLogExecution("error","onCSV Cash Sale BeforeSubmit", JSON.stringify(e) );
        }

		if(type != "create" && type != "edit" && type != "xedit"){
			return;
		}
		var linecount = nlapiGetLineItemCount("line");
		for (var linenum = 1; linenum <= linecount; linenum++) {

			nlapiSelectLineItem("line", linenum);
			var account = nlapiGetCurrentLineItemValue("line", "account");
			var credit = parseFloat(nlapiGetCurrentLineItemValue("line", "credit"));
			var reserve = nlapiGetCurrentLineItemValue("line", "custcol_cseg_tsa_fundreserv");
			var reserveParent = "";
			if(reserve){
				reserveParent = nlapiLookupField(
					"customrecord_cseg_tsa_fundreserv", reserve,
					"parent", false);
			}

			var postObject = {
				accountId : account,
				reserve : reserveParent,
				recordType : "Journal",
				internalType : "1",
				side : (function(){
					return (credit > 0)? "1" : "2";
				}())
			};
			/**
			 * Request simulation object to call the Suitelet code
			 */
			var sletRequest = new SuiteletRequest(postObject);

			// CallBack object to capture the response from Suitelet code
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
					nlapiSetCurrentLineItemValue("line",
							"custcol_tsa_wip_mapping", objLine.id);
					nlapiSetCurrentLineItemValue("item",
							"custcol_tsa_wip_mapping_error", "");
				}
				nlapiCommitLineItem("line");
			}
			// call post function on WIP Server Suitelet
			post(sletRequest, SuiteletResponse);
		}
}

