/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_cl_tsa_offline_unit_upload.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 08/07/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Validate Fields
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../../Library.FHL.2.0', 'N/search', 'N/currentRecord', 'N/runtime', 'N/log','N/ui/dialog','../../../vs_lib'], function(Library, Search, currentRecord, Runtime, log, dialog, vs_lib){
		
		'use strict';

        var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
        var TRANNAME    = 'custrecord_tsa_ouu_transaction_name';
		var PARTY		= 'custrecord_tsa_ouu_rp';
		var FORMUSAGE   = 'custrecord_uat_formusage';
		
		
    
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
      
      try {
              var currentRec = scriptContext.currentRecord;
              if(scriptContext.fieldId === TRANNAME){
                  var tranName = currentRec.getValue(TRANNAME);
                  var formUsageID = null;
                  var formUsage = Search.lookupFields({
                      type: ACTIVITYTYPE,
                      id: tranName,
                      columns: ['custrecord_uat_formusage']
                  });
                  if(formUsage){
                      if((!isNullOrEmpty(formUsage.custrecord_uat_formusage[0])))	formUsageID = formUsage.custrecord_uat_formusage[0].value;
                  }
                  if(formUsageID === '3'){
                      var rec = currentRecord.get();
                      var objField = rec.getField({fieldId: PARTY });
                      objField.isMandatory  = true;
                      log.debug({title: 'formUsageID:', details: formUsageID});
                  }
              }
   		}
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.currentRecord.getValue({ fieldId: "id" }), e, runtime.getCurrentUser().id, scriptContext.currentRecord.type);
    	}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

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

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

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

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    return {
        //pageInit: pageInit,
        fieldChanged: fieldChanged
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}