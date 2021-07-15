/****************************************************************************************
 * 
 * Script Type:	2.0 Client
 *
 * Author:		Viktor Schumann		20/02/2019
 *
 * Notes:		Default item line fields in Sales transactions 
 *
	Issue: 		Using the standard tax engine on the employee expense line when a Non-Recoverable 
				tax code is used, the user needs to select the expense account to re-code the tax 
				element otherwise the expense account defaults to the tax code setup
		
	Requirement: Default Expense account entry on line entry to the Category expense account on 
				 the selected in the line (This updates the GL impact of the transaction) when 
				 the Non-Recoverable VAT tax code is selected
			 
 ****************************************************************************************/

//custcol_cseg_tsa_fundreserv

//custitem_tsa_ihq_def_reserve

// IHQ subsidiaries:
// 1  = Parent Company // 18 = ROAS // 19 = SAIT // 29 = SALT College // 2  = TSA Global


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/https', 'N/search', 'N/runtime'], function (https, search, runtime) {

    // IHQ subsidiaries:
    // 1  = Parent Company // 2  = TSA Global // 18 = ROAS // 19 = SAIT // 29 = SALT College 

    //var IHQ_SUBS="1,2,18,19,29"; 

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
        console.log("*** line init triggered - sublist=" + scriptContext.sublistId);
    }


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
        console.log("Default Reserve Script :: field change triggered *** sublist=" + scriptContext.sublistId + " - field=" + scriptContext.fieldId + " - line Number=" + scriptContext.lineNum);

        // ************ Item **********
        if (scriptContext.sublistId == "item" && scriptContext.fieldId == "item") {
            try {
                var userObj = runtime.getCurrentUser();
                var user_sub = userObj.subsidiary;
                console.log("*** current user's roleId=" + userObj.roleId + " | subsidiary=" + user_sub);
                //var subs_to_check = ","+runtime.getCurrentScript().getParameter({name : 'custscript_tsa_ihq_related_subsidiaries'})+",";
                //console.log("*** script parameter (from Company Preferences)=" + subs_to_check+" subs_to_check.indexOf="+subs_to_check.indexOf(","+user_sub+",") );
                //if(subs_to_check.indexOf(","+user_sub+",")==-1) return;  // if current user is not included into the IHQ subsidiaries then return 
                // Subs set at script deployment

                var currentRecord = scriptContext.currentRecord;
                var item = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "item" });
                console.log("Default Reserve Script -  item=" + item);
                if (!item || item == "") return;

                //var currentscript = runtime.getCurrentScript();

                //ZS-15/08/2019: Get default reserve from custom record
                var customDefaultReserveId;
                var customDefaultReserveValue;
                var customrecord_item_def_reserveSearchObj = search.create({
                    type: "customrecord_item_def_reserve",
                    filters: [["custrecord_item_id", "anyof", item]],
                    columns: [
                        search.createColumn({ name: "custrecord_tsa_ihq_def_reserve2", label: "Default Reserve 2" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })]
                });

                customrecord_item_def_reserveSearchObj.run().each(function (result) {

                    customDefaultReserveId = result.getValue({ name: "custrecord_tsa_ihq_def_reserve2" });;
                    customDefaultReserveValue = result.getText({ name: "custrecord_tsa_ihq_def_reserve2" });
					console.log("Default Reserve :: result="+JSON.stringify(result));
                    return true;
                });
                console.log("reserve id=" + customDefaultReserveId + ", reserve value=" + customDefaultReserveValue);
                if (customDefaultReserveId && customDefaultReserveId != "") {

                    console.log("reserve id=" + customDefaultReserveId + ", reserve value=" + customDefaultReserveValue);

                    currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId,  fieldId: "custcol_cseg_tsa_fundreserv",  value: customDefaultReserveId });
                  	currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId,  fieldId: "custcol_vs_test_field",  value: customDefaultReserveId });
                }

                /* Rem:ZS-15/08/2019
                console.log("*** before item lookup");
                var lookup = search.lookupFields({
                    type: "item",
                    id: item,
                    columns: ['custitem_tsa_ihq_def_reserve']
                });
    
                console.log("lookup=" + lookup.custitem_tsa_ihq_def_reserve[0]);
                console.log("*** after item lookup");
    
                if (lookup.custitem_tsa_ihq_def_reserve[0] && lookup.custitem_tsa_ihq_def_reserve[0] != "") {
    
                    console.log("*** before getting value from lookup");
                    var reserve = lookup.custitem_tsa_ihq_def_reserve[0].value;
                    console.log("lookup=" + JSON.stringify(lookup) + " reserve value=" + reserve + " reserve description=" + lookup.custitem_tsa_ihq_def_reserve[0].text);
    
                    currentRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_cseg_tsa_fundreserv",
                        value: reserve
                    });
                }
                */
            }
            catch (e) {
                log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit - Error", 'Message: ' + e);
            }
            finally {
            }
        }
    }


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
        console.log("*** Default Reserve page init triggered - mode=" + scriptContext.mode);
    }


    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        lineInit: lineInit
        //validateLine: validateLine,
        //saveRecord: saveRecord

        /*      pageInit: pageInit,
                postSourcing: postSourcing,
                sublistChanged: sublistChanged,
                validateField: validateField,
                validateLine: validateLine,
                validateInsert: validateInsert,
                validateDelete: validateDelete,
                saveRecord: saveRecord
        */

    };
});
