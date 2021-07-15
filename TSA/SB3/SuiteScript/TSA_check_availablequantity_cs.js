/****************************************************************************************
 * 
 * Script Type:	2.0 Client
 *
 * Author:		Viktor Schumann		23/06/2020
 *
 * Notes:		Do not allow stock to go underwater (negative)
 *			 
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/https', 'N/search', 'N/runtime', 'N/translation', 'N/record', 'N/url'], function (https, search, runtime, translation, record, url) {

//custcol_cseg_tsa_fundreserv
//custitem_tsa_ihq_def_reserve
// IHQ subsidiaries:
// 1  = Parent Company // 18 = ROAS // 19 = SAIT // 29 = SALT College // 2  = TSA Global

    // IHQ subsidiaries:
    // 1  = Parent Company // 2  = TSA Global // 18 = ROAS // 19 = SAIT // 29 = SALT College 
    //var IHQ_SUBS="1,2,18,19,29"; 

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
	// fieldChanged

	
    function validateLine(scriptContext) {
        console.log("Check available quantity:*** STARTED *** sublist=" + scriptContext.sublistId + " - field=" + scriptContext.fieldId + " - line Number=" + scriptContext.lineNum);

          // **** IHQ Subs check
          var ihq_subs = runtime.getCurrentScript().getParameter({ name: "custscript_ihq_subs_list" });
          // Parent=1, ROAS=18, SAIT=19, SAIT Elim=30, SALT College=32, // custscript_ihq_subs_list
          // Global only scripts will not trigger with the listed subsidiaries.

          var subsidiary = scriptContext.currentRecord.getValue({ fieldId: "subsidiary" });
          console.log("Check Availavailable_quantity::Validate Line - subsidiary="+subsidiary+" , ihq_subs="+ihq_subs);
          var isIHQ = false;
          var ihq_subs_array = [];
          if(ihq_subs){
              ihq_subs_array=JSON.parse(ihq_subs);
              ihq_subs_array.forEach(function(subs){if(subs==subsidiary)isIHQ=true;});
          }
          if(isIHQ){
              console.log("Check Availavailable_quantity::Validate Line - IHQ subsidiary - Exit");
              return true;
          }

          // ******* IHQ Subs check end 
      
      
		var currentRecord = scriptContext.currentRecord;
		var available_quantity_txt = currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "quantityavailable" });		
		var quantity_txt = currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "quantity" });		
      	var itemtype = currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "custcol_tsa_vs_item_type" });		
      	console.log("Check Availavailable_quantity : item type="+itemtype);
      	if(itemtype!=1) return true; // only 1=Inventory Item 
		var available_quantity = 0.00;
		var quantity = 0.00;
		if(available_quantity_txt){ available_quantity = parseFloat(available_quantity_txt) };
		if(quantity_txt){ quantity = parseFloat(quantity_txt) };
	
		console.log("Check Availavailable_quantity : available_quantity="+available_quantity+" , quantity="+quantity);
		
		if(available_quantity<quantity){
			var msg = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ZERO_STOCK_NOT_ALLOWED', locale: translation.Locale.CURRENT })();
			alert(msg);
			return false;
		}
	
		return true;
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

        //fieldChanged: fieldChanged,
        //lineInit: lineInit
        validateLine: validateLine

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

/*
            try{
				var userObj = runtime.getCurrentUser();
				var user_sub = userObj.subsidiary;
				var subs_exists_in_unit = false;
				console.log("*** current user's roleId=" + userObj.roleId + " | user subsidiary=" + user_sub);
				//var subs_to_check = ","+runtime.getCurrentScript().getParameter({name : 'custscript_tsa_ihq_related_subsidiaries'})+",";
				//console.log("*** script parameter (from Company Preferences)=" + subs_to_check+" subs_to_check.indexOf="+subs_to_check.indexOf(","+user_sub+",") );
				//if(subs_to_check.indexOf(","+user_sub+",")==-1) return;  // if current user is not included into the IHQ subsidiaries then return 
				// Subs set at script deployment

				var currentRecord = scriptContext.currentRecord;
				var subsidiary = currentRecord.getValue({ fieldId: "subsidiary" });
				var record_subsidiary = currentRecord.getText({ fieldId: "subsidiary" });
				var customDefaultReserveId = currentRecord.getValue({ fieldId: "custpage_default_reserve" });
				console.log("Default Reserve Script -  record_subsidiary="+JSON.stringify(subsidiary)+" , customDefaultReserveId="+customDefaultReserveId+" , subsidiary="+subsidiary);
				if(!customDefaultReserveId) return true;
				
				// #region ******  Call suitelet -  lookup ********* 
				var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_item_def_reserve_chk_sl', deploymentId: 'customdeploy_tsa_item_def_reserve_chk_sl',	returnExternalUrl: true, 
					params: { 'custscript_subs_prm': JSON.stringify(subsidiary), 'custscript_reserve_prm': customDefaultReserveId }
				});		
				var response = https.get({ url: suitletURL });
				log.debug( "Unit_lookup_Call", "response: " + JSON.stringify(response) );
				log.debug("Unit_lookup_Call", "returned id: " + response.body );
				if(response.body=="-1") subs_exists_in_unit=true;
			
				if(!subs_exists_in_unit){
					var msg = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_RESERVE_IS_NOT_ALLOWED_IN_SUBS', locale: translation.Locale.CURRENT })();
					alert(msg+". (id="+response.body+")");
					return false;
				}
				
			}
			catch(e){
				console.log(e);
			}

*/
