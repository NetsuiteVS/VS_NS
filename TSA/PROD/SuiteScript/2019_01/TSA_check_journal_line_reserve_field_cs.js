/****************************************************************************************
 * 
 * Script Type:	2.0 Client
 *
 * Author:		Viktor Schumann		02/04/2019
 *
 * Notes:		This Script Checks the Journal Line reserve setting in case of specific accounts marked with the custrecord_tsa_vs_reserve_is_mandatory.
				Also checks the custrecord_tsa_vs_account_prohibited to prohibit of the usage of specific accounts.
				
				The two setting is sourced to custom transaction column fields: custcol_tsa_account_prohibited - custcol_tsa_vs_reserve_mandatory
  
 ****************************************************************************************/

//custrecord_tsa_vs_reserve_is_mandatory
//custrecord_tsa_vs_account_prohibited

// custcol_tsa_account_prohibited
// custcol_tsa_vs_reserve_mandatory

// IHQ subsidiaries - we don't need Subs restrictions with this script
// 1  = Parent Company // 2  = TSA Global // 18 = ROAS // 19 = SAIT // 29 = SALT College 
//var IHQ_SUBS="1,2,18,19,29"; 
//var subs_to_check = ","+runtime.getCurrentScript().getParameter({name : 'custscript_tsa_ihq_related_subsidiaries'})+",";
//console.log("*** script parameter (from Company Preferences)=" + subs_to_check+" subs_to_check.indexOf="+subs_to_check.indexOf(","+user_sub+",") );
//if(subs_to_check.indexOf(","+user_sub+",")==-1) return;  // if current user is not included into the IHQ subsidiaries then return 
// Subs set at script deployment




/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 
define(['N/https','N/search', 'N/runtime', 'N/translation'], function(https, search, runtime, translation) {

   /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
		console.log("*** Line change triggered - sublist="+scriptContext.sublistId+" - field="+scriptContext.fieldId+" - line Number="+scriptContext.lineNum);

		// ************ Line Sublist  **********
		//if(scriptContext.sublistId=="line" && scriptContext.fieldId=="account"){
		if(scriptContext.sublistId=="line"){

			var userObj = runtime.getCurrentUser();
			var user_sub = userObj.subsidiary;
			
			if(userObj.roleId=="administrator") {
				console.log(" Current Role is Admin - all accounts enabled");
				return true;
			}
			
			console.log("*** checking if Accounct was prohibited *** current user's roleId=" + userObj.roleId+" | subsidiary="+user_sub);
						
			var currentRecord = scriptContext.currentRecord;
			var account_prohibited = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "custcol_tsa_account_prohibited" });
			var reserve_mandatory = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "custcol_tsa_vs_reserve_mandatory" });
			var reserve = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "custcol_cseg_tsa_fundreserv" });
			var account = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
			console.log("account="+account+" | account prohibited="+account_prohibited+" | reserve is mandatory=" + reserve_mandatory+" | reserve="+reserve);
			
			
			
			if(account_prohibited){
				//alert("Please do not use this account. It is for Reserve Automation only.");
				var alert_text = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ACC_PROHIBITED', locale: translation.Locale.CURRENT })();
				alert(alert_text);
				return false;
			}
			
			
			if(reserve_mandatory && !reserve){
				//alert("Reserve is mandatory with this Account.");
				var alert_text = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ACC_MANDATORY', locale: translation.Locale.CURRENT })();
				alert(alert_text);
				return false;
			}
						
		}
		return true;
    }

  
        //#region ******************************  PAGE INIT  ************************************* 

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

            try {
                clearLinesAfterIUCheckboxWasTickedPageInit(scriptContext.currentRecord.type);
				//hidePlusButtons(scriptContext);
            }
            catch (e) {
                console.log("project_fields_check::pageInit() Error message=" + e);
            }
            finally {
            }
        }

        function clearLinesAfterIUCheckboxWasTickedPageInit(recordType) {

            if (recordType == "journalentry") {
                localStorage.setItem("iuAccountWithoutChkBoxMessageMustBeShown", 1);
            }
        }

        //#endregion

        //#region ******************************  FIELD CHANGE  ************************************* 

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            try {
                clearLinesAfterIUCheckboxWasTickedFieldchanged(scriptContext);
            }
            catch (e) {
                console.log("project_fields_check::fieldChanged() Error message=" + e);
            }
            finally {
            }
        }

        function clearLinesAfterIUCheckboxWasTickedFieldchanged(scriptContext) {
			
			console.log("project_fields_check:: *** Started *** ");
            if (scriptContext.currentRecord.type != "journalentry") {
                return;
            }
			
            var fieldId = scriptContext.fieldId;
            var currentRecord = scriptContext.currentRecord;
            var SUBLIST_ID = "line";
            var interUnit = currentRecord.getValue({ fieldId: "custbody_tsa_inter_unit" });

            if (fieldId == "custbody_tsa_inter_unit" && interUnit) {

                var lineCount = currentRecord.getLineCount({ sublistId: SUBLIST_ID });
 
                if (lineCount > 0) {
                  	currentRecord.cancelLine({ sublistId:'line' });

                    var message = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_IU_CHECKBOX_TICKED', locale: translation.Locale.CURRENT })();
                    alert(message);

                    for (var i = lineCount - 1; i >= 0; i--) {
                        currentRecord.removeLine({ sublistId: SUBLIST_ID, line: i, ignoreRecalc: true });
                    }
                }
                
            }

            if (fieldId == "account") {

                var accountTxt = currentRecord.getCurrentSublistText({ sublistId: SUBLIST_ID, fieldId: "account" });
                console.log("project_fields_check::fieldChanged() accountTxt=" + accountTxt);
                var messageMustBeShown = localStorage.getItem('iuAccountWithoutChkBoxMessageMustBeShown');

                if (messageMustBeShown == 1 && !interUnit && (accountTxt.charAt(0) == 'T' || accountTxt.charAt(0) == 'U' || accountTxt.charAt(0) == 'D')) {

                    localStorage.setItem("iuAccountWithoutChkBoxMessageMustBeShown", 0);
                    var message = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_IU_ACCOUNT_WIHTOUT_CHKBOX', locale: translation.Locale.CURRENT })();
                    alert(message);
                }
            }
			console.log("project_fields_check:: Finished");
        }
        //#endregion
  
    return{
    	pageInit: pageInit,
		//validateField: validateField,
		fieldChanged: fieldChanged,
		//lineInit: lineInit
    	validateLine: validateLine,
    	//saveRecord: saveRecord		
    };
});
