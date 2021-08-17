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

define(['N/https', 'N/search', 'N/runtime', 'N/translation', 'N/record', 'N/url'], function (https, search, runtime, translation, record, url) {

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
    function saveRecord(scriptContext) {
        console.log("Default Reserve Script :: field change triggered *** sublist=" + scriptContext.sublistId + " - field=" + scriptContext.fieldId + " - line Number=" + scriptContext.lineNum);

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
				console.log( "Suitelet response: " + JSON.stringify(response) );
				console.log( "Suitelet response - returned id: " + response.body );
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

			return subs_exists_in_unit || !customDefaultReserveId;
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

		saveRecord: saveRecord

		//pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //lineInit: lineInit
        //validateLine: validateLine,

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
                //var currentscript = runtime.getCurrentScript();

				try{
				  
					for(var i=0; i<subsidiary.length; i++){
						console.log("** Cycle - subs check - i="+i+" subsidiary[i]="+subsidiary[i]);
						//if(!subs_exists_in_unit) break;				

						var customrecord_cseg_tsa_fundreservSearchObj = search.create({
						   type: "customrecord_cseg_tsa_fundreserv",
						   filters:
						   [ ["internalid","anyof",customDefaultReserveId] ],
						   columns:
						   [
							  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name" }),
							  search.createColumn({name: "scriptid", label: "Script ID"}),
							  search.createColumn({name: "name", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Name" }),
							  search.createColumn({name: "internalid", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Unit Internalid" })
						   ]
						});
						var searchResultCount = customrecord_cseg_tsa_fundreservSearchObj.runPaged().count;
						console.log(" i="+i+" , result count="+searchResultCount);
						
						var subs_exists_in_unit=false;
						customrecord_cseg_tsa_fundreservSearchObj.run().each(function(result){
							if(!subs_exists_in_unit){
								var unit_internalid=parseInt(result.getValue({ name: 'internalid', join: 'CUSTRECORD_CSEG_TSA_FUNDRESERV_N101' }));
								var unit_name=result.getValue({ name: 'name'});
								console.log(" i="+i+", result - unit_internalid="+unit_internalid+", unit_name="+unit_name );
								
								//********* Load Record ********
								var unit_record = record.load({ type: "classification", id: unit_internalid , isDynamic: false });
								var unit_subs = unit_record.getValue({ fieldId:'subsidiary' });
								console.log(" i="+i+", Loaded Unit - unit_subs="+unit_subs);
								
								for(var j=0; j<unit_subs.length; j++){
									if(subsidiary[i]==unit_subs[j]) subs_exists_in_unit=true;
									console.log(" i="+i+", j="+j+" unit_subs[j]="+unit_subs[j]+" , subs_exists_in_unit="+subs_exists_in_unit);
								}
							}
							return true;
						});
*/
