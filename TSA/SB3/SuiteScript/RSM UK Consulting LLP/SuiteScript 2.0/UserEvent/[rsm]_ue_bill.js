/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_bill.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 17/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Trigger the journal creation script on approval of bill
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/format', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/task','../../../vs_lib'],

function(format, serverWidget, search, record, runtime, task, vs_lib) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
'use strict';
	
	var SUBSIDIARY      = 'subsidiary';
	var DEPARTMENT      = 'department';
	var LOCATION        = 'location';
	var UNIT	        = 'class';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'approvalstatus';
	var MEMO            = 'memo';
	var LINE			= 'item';
	var ITEM            = 'item';
	var QTY             = 'quantity';
	var ENTITY          = 'entity'
	var TRANDATE        = 'trandate';
	
	var RELPARTYSUB     = 'custbody_rp_sub';
	var OFFSETENTITY    = 'custbody_offset_entity';
	var RPLOCATION      = 'custbody_rp_location';
	var SUBELIMIUNIT    = 'custbody_trans_unit_sub_elim_unit';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	var BOARD           = 'custbodytsa_internalfund';
	var TRANID          = 'tranid';
	
	function billBeforeLoad(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.COPY) {

    		var thisRec = scriptContext.newRecord;
    		log.debug('AS scriptContext.type-', scriptContext.type+', thisRec-'+thisRec);
    		thisRec.setValue({fieldId: LINKEDICTRANS, value: null, ignoreFieldChange: true});
    	}
    }
	function billBeforeSubmit(context) {
	}
   
    function billAfterSubmit(context) {
	   try {
           
           log.debug('AS context.type-', context.type);
           log.debug('AS runtime.executionContext-', runtime.executionContext);

           if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT || context.type === context.UserEventType.APPROVE){
			   //var bilRec = record.load({type:	record.Type.VENDOR_BILL, id: context.newRecord.id});

               var inter_unit_flag = context.newRecord.getValue("custbody_tsa_vs_ce_auto_generated");
               if(!inter_unit_flag){
                  log.debug("", "Not creating Journal due to custbody_tsa_inter_unit is false.");
                  return true;
               }
             	
             /* //This request was revoked by Allan - IFAS 959
               var location_type = context.newRecord.getValue("custbody_location_type");
               if(location_type!="2"){
                  log.debug("", "Not a Stock Location. Not creating Journal due to custbody_tsa_rp_stock_loc_type is false.");
                  return true;
               }
             */
               var oldStatus = 1;
               if(context.type != context.UserEventType.CREATE) oldStatus = context.oldRecord.getValue(STATUS);
               var newStatus = context.newRecord.getValue(STATUS);
               log.debug('AS oldStatus-', oldStatus+', newStatus-'+newStatus);

               if( oldStatus == 1 && newStatus == 2 ){ // oldStatus == 1 && // && (isNullOrEmpty(bilRec.getValue(LINKEDICTRANS)))
                   var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                   scriptTask.scriptId = 'customscript_rsm_sc_cre_jou_frm_bill';
                   scriptTask.params = {custscript_rsm_bill_id: context.newRecord.id};
                   var scriptTaskId = scriptTask.submit();
               }
           }
       }
       catch (e) {
           vs_lib.createErrorLog(runtime.getCurrentScript().id, context.newRecord.id, JSON.stringify(e), runtime.getCurrentUser().id, context.newRecord.type);
       }
   }

   return {
      beforeLoad: billBeforeLoad,
      beforeSubmit: billBeforeSubmit,
      afterSubmit: billAfterSubmit
   };
});

function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}