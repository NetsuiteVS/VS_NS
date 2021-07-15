/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (#TSA_VS_set_reserve_cs20.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set reserve field on transactions
 * 
 * Date:        22/06/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/search', 'N/runtime', 'N/record', 'N/translation'],

    function (url, log, search, runtime, record, translation) {

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

                //log.debug("set_reserve::Field changed", "Script started");
                console.log("set_reserve::Field changed fired");

                var fieldId = scriptContext.fieldId;    
                
                console.log("set_reserve::Field changed fieldId:" + fieldId);

                if (fieldId != "item" && fieldId != "custcol_cseg_tsa_project") {
                    return true;
                }
                //var itemId = scriptContext.currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "item" });
                var projectId = scriptContext.currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "custcol_cseg_tsa_project" });

                //console.log("set_reserve::Field changed itemId:" + itemId);
                console.log("set_reserve::Field changed projectId:" + projectId);

                if (!projectId) {
                    return true;
                }
                
                var project = search.lookupFields({ type: 'customrecord_cseg_tsa_project', id: projectId, columns: 'custrecord_tsa_def_res' });
                if (!project || !project.custrecord_tsa_def_res || !project.custrecord_tsa_def_res[0]) {
                    console.log("set_reserve::Field changed  No project found or default reserved hasnt been set");
                    return true;
                }
                var defaultReserve = project.custrecord_tsa_def_res[0].value;
                console.log("set_reserve::Field changed  defaultReserve:" + defaultReserve);

                if (!defaultReserve || defaultReserve.length == 0) {
                    return true;
                }

                scriptContext.currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'custcol_cseg_tsa_fundreserv', value: defaultReserve });     

                console.log("set_reserve::Field changed finished");
                //log.debug("set_reserve::Field changed", "Script finished");
            }
            catch (e) {
                console.log("set_reserve::Field changed - Error message=" + e);
                log.debug("set_reserve::Field changed - ERROR", e);
            }
            finally {
            }
        }

        //#endregion

      function validateLine(scriptContext) {
          console.log("set_reserve::Validate Line **** Started ****");
          var currentRecord = scriptContext.currentRecord;
		  var ihq_subs = runtime.getCurrentScript().getParameter({ name: "custscript_ihq_subs_list" });
		  // Parent=1, ROAS=18, SAIT=19, SAIT Elim=30, SALT College=32, 
		  // custscript_ihq_subs_list
		  // Global only scripts will not trigger with the listed subsidiaries.
		  
		  var subsidiary = currentRecord.getValue({ fieldId: "subsidiary" });
		  console.log("set_reserve::Validate Line - subsidiary="+subsidiary+" , ihq_subs="+ihq_subs);
		  var isIHQ = false;
		  var ihq_subs_array = [];
		  if(ihq_subs){
			  ihq_subs_array=JSON.parse(ihq_subs);
			  ihq_subs_array.forEach(function(subs){if(subs==subsidiary)isIHQ=true;});
		  }
		  if(isIHQ){
			  console.log("set_reserve::Validate Line - IHQ subsidiary - Exit");
			  return true;
		  }
		  
          var projectId = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "custcol_cseg_tsa_project" });
          var reserve = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "custcol_cseg_tsa_fundreserv" });

          if(projectId && !reserve){
              var msg = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ALL_PROJECTS_MUST_HAVE_RESERVES', locale: translation.Locale.CURRENT })();
              alert(msg);
              return false;
          }

          return true;
      }


  
  
        return {
            fieldChanged: fieldChanged,
          	validateLine: validateLine
        };
    });

