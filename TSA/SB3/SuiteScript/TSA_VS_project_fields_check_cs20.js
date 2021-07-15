/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_project_fields_check_cs20.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check the following:
 *              If user selects a project activity code but has not selected a project user error to prevent adding line.
 *              If user selects a project but does not add an activity code, user error to prevent adding line.
 *              
 *              Other added functionality: Clear lines after IU checkbox was ticked
 * 
 * Date:        17/08/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/search', 'N/runtime', 'N/record', 'N/currentRecord', 'N/translation'],

    function (log, search, runtime, record, currentRecord, translation) {

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
 				
				hidePlusButtons(scriptContext);
            }
            catch (e) {
                console.log("project_fields_check::pageInit() Error message=" + e);
            }
            finally {
            }
        }


        //#endregion

 
        //#region *****************************  VALIDATE LINE  ***********************************

        /**
        * Validation function to be executed when sublist line is committed.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.sublistId - Sublist name
        *
        * @returns {boolean} Return true if sublist line is valid
        *
        * @since 2015.2
        */
        function validateLine(scriptContext) {

            try {

                console.log("project_fields_check::validateLine() Started");

			  // **** IHQ Subs check
			  var ihq_subs = runtime.getCurrentScript().getParameter({ name: "custscript_ihq_subs_list" });
			  // Parent=1, ROAS=18, SAIT=19, SAIT Elim=30, SALT College=32, 
			  // custscript_ihq_subs_list
			  // Global only scripts will not trigger with the listed subsidiaries.
			  
			  var subsidiary = scriptContext.currentRecord.getValue({ fieldId: "subsidiary" });
			  console.log("Project Fields Check::Validate Line - subsidiary="+subsidiary+" , ihq_subs="+ihq_subs);
			  var isIHQ = false;
			  var ihq_subs_array = [];
			  if(ihq_subs){
				  ihq_subs_array=JSON.parse(ihq_subs);
				  ihq_subs_array.forEach(function(subs){if(subs==subsidiary)isIHQ=true;});
			  }
			  if(isIHQ){
				  console.log("Project Fields Check::Validate Line - IHQ subsidiary - Exit");
				  return true;
			  }
			 
			  // ******* IHQ Subs check end 
              
                var sublistId = scriptContext.sublistId;

                var tsaProject = scriptContext.currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_cseg_tsa_project" });
                var projectActivityCode = scriptContext.currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "cseg_tsa_act_code" });
				
              	var pac_field_exists = jQuery("#"+sublistId+"_cseg_tsa_act_code_display").length;
              	if(pac_field_exists==0){
                  	console.log("Project Activity Check - pac_field_exists="+pac_field_exists+" ,sublistId="+sublistId);
					return true; //If Project Activity Code column is not in use then do not check.                  
                } 
              
                if (projectActivityCode && projectActivityCode.length > 0 && (!tsaProject || tsaProject.length == 0)) {
                    var errorMsg = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_TSA_PROJECT_CANNOT_BE_EMPTY', locale: translation.Locale.CURRENT })();
                    console.log("project_fields_check::validateLine() " + errorMsg);
                    alert(errorMsg);
                    return false;
                }
              	// IFAS-626: "As per my discussion with Loveth on Tuesday 28/01/2021 & email attached, Please remove the 1st validation."
              	// "A user can select a project without selecting and activity code. But the 2nd validation still applies."
              	/*
                if (tsaProject && tsaProject.length > 0 && (!projectActivityCode || projectActivityCode.length == 0)) {
                    var errorMsg = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_TSA_PROJECT_ACTIVITY_CANNOT_BE_EMPTY', locale: translation.Locale.CURRENT })();
                    console.log("project_fields_check::validateLine() " + errorMsg);
                    alert(errorMsg);
                    return false;
                }*/
                
                console.log("project_fields_check::validateLine() Finished");

                return true;
            }
            catch (e) {
                console.log("project_fields_check::validateLine() Error message=" + e);
            }
            finally {
            }
        }

        //#endregion
		
	function hidePlusButtons(context) {
		
		// request.getParameter('custpage_param1') //script parameter
		var rec=context.currentRecord;
      	var type=rec.type;
		console.log( "hidePlusButtons *** Started *** rec.type="+type); 
		
      	jQuery('#department_popup_new').remove();
		jQuery('#custcol_cseg_tsa_project_popup_new').remove();
		jQuery('#custcol_cseg_tsa_fundreserv_popup_new').remove();
		jQuery('#custcol_cseg_tsa_relatedpar_popup_new').remove();
      	jQuery('#cseg_tsa_act_code_popup_new').remove();
		jQuery('#class_popup_new').remove();

		jQuery('#class_popup_new').remove();
		jQuery('#custbody_cseg_tsa_relatedpar_popup_new').remove();
      	
        jQuery('#tbl_line_insert').hide();
      	jQuery('#tbl_item_insert').hide();
        jQuery('#tbl_expense_insert').hide();
      	console.log("hide Insert");
      
      	//setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);
      	//setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);
		//jQuery('#recmachcustrecord_tsa_rejectionexptxt').click();
      
		try{
			if(type=="purchaseorder" || type=="vendorbill" || type=="vendorreturnauthorization" || type=="vendorcredit" ){
                var current_onclick=jQuery('#itemtxt').attr("onclick");
                current_onclick.replace("return false;",""); 
                //jQuery("#customtxt").attr("onclick","");
				if(current_onclick.indexOf(".remove()")==-1){
          				jQuery("#itemtxt").attr("onclick","jQuery('#custcol_cseg_tsa_project_popup_new').remove();jQuery('#custcol_cseg_tsa_fundreserv_popup_new').remove();jQuery('#custcol_cseg_tsa_relatedpar_popup_new').remove();jQuery('#class_popup_new').remove();jQuery('#class_popup_new').remove();jQuery('#custbody_cseg_tsa_relatedpar_popup_new').remove();"+current_onclick+" return false");
                }
        	}          
        }
      	catch(e){ console.log(e); }      
      
      
    }


        return {
            pageInit: pageInit,
			lineInit: hidePlusButtons,
			sublistChanged: hidePlusButtons,
            validateLine: validateLine,
            //fieldChanged: fieldChanged
        };
    });

