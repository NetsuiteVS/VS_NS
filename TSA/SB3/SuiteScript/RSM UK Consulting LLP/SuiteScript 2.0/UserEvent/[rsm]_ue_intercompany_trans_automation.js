/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_intercompany_trans_automation.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 22/05/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create offset journal on approval of intercompany transaction 
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
	
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var AMOUNT			= 'custbody_bank_amt';
	var TRANSTYPE 		= 'custbody_ic_trans_type';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var SUBSIDIARY      = 'subsidiary';
	var UNIT	        = 'class';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'transtatus';
	var MEMO            = 'memo';
	var LINE			= 'line';
	var ACCOUNT			= 'account';
	var OFFSETACCOUNT	= 'custcol_rsm_offset_account';
	var DEPARTMENT      = 'department';
	var DEPRECIATION    = 'custbody_tsa_depreciation_inprogress';
	
	
	// OFFSETTING JOURNAL 
	var RELPARTYSUB     = 'custbody_rp_sub';
	var RELPARTYSUBCUR  = 'custbody59'; // SUBSIDIARY LOOKUP NEEDED
	var OFFSETEXRATE    = ''; // HOW TO GET/NEEDED?
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	
	var BANK			= 'custbody_bank_chkbx';
	var BANKACCOUNT		= 'custbody_bank_acct';
	
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var LINEPARTY       = 'custcol_cseg_tsa_relatedpar';
	var LINEPARTY2      = 'custcol_rl_party_script_only';
	var LINEPARTYID     = null;
	var TSAPAYTYPE		= 'custcol_pay_type';
	var TRIGGER   		= 'custbody_trigger';
	
	function intercomBeforeLoad(scriptContext) {
      var order = scriptContext.newRecord;
      var form  = scriptContext.form;

      /*var descriptionFld = order.getSublistField({
         sublistId : 'line',
         fieldId   : 'account',
         line      : 0
      });
      descriptionFld.updateDisplayType({ displayType : serverWidget.FieldDisplayType.DISABLED });*/
      form.getSublist('line').getField('account').updateDisplayType({displayType:'disabled'}); 
      
      	if (scriptContext.type === scriptContext.UserEventType.COPY ){
      		var thisRec = scriptContext.newRecord;
      		log.debug('AS scriptContext.type-', scriptContext.type+', thisRec-'+thisRec);
      		thisRec.setValue({fieldId: LINKEDICTRANS, value: null, ignoreFieldChange: true});
  		}
	}
	
	/**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
	function intercomBeforeSubmit(scriptContext) {
	    
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
    	
       	var oldStatus = null;
       	if(scriptContext.type === scriptContext.UserEventType.EDIT){
       		oldStatus = scriptContext.oldRecord.getValue(STATUS);
       	}
 	    var newStatus = scriptContext.newRecord.getValue(STATUS);
 	   log.debug('BS oldStatus-', oldStatus+', newStatus-'+newStatus);
      
    }

	 /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
	function intercomAfterSubmit(scriptContext) {
	   
     	try {
           var uitRec = record.load({type: 'customtransaction_tsa_unit_intracompany', id: scriptContext.newRecord.id});
           log.debug('AS scriptContext.type-', scriptContext.type+" id="+scriptContext.newRecord.id);
           log.debug('AS runtime.executionscriptContext-', runtime.executionContext);
           var minSub = scriptContext.newRecord.getValue(SUBSIDIARY);
           var partySub = scriptContext.newRecord.getValue(RELPARTYSUB);

           if(scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.APPROVE){
               var oldStatus = scriptContext.oldRecord.getValue(STATUS);
               var newStatus = scriptContext.newRecord.getValue(STATUS);
               log.debug('','oldStatus='+oldStatus+', newStatus='+newStatus+' - OffsetJ will be created at B->C only');

               if( oldStatus === 'B' && newStatus === 'C'){ // || newStatus === 'C'
				
				var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
				scriptTask.scriptId = 'customscript_tsa_vs_createjrnl_intrcmpy';
				scriptTask.params = {custscript_rsm_intracompany_id: scriptContext.newRecord.id};
				var scriptTaskId = scriptTask.submit();
                log.debug('','scheduled script initiated: customscript_tsa_vs_createjrnl_intrcmpy');   
				   // origianl createOffsetJournal(scriptContext, uitRec);
                   //just copied here - var uitRec = record.load({type: 'customtransaction_tsa_unit_intracompany', id: scriptContext.newRecord.id});
				   // original uitRec.save();
               }
           }
		   
  		}
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, JSON.stringify(e), runtime.getCurrentUser().id, scriptContext.newRecord.type);
    	}
	}
   
   function createOffsetJournal(scriptContext, uitRec)	{

                   //just copied here - var uitRec = record.load({type: 'customtransaction_tsa_unit_intracompany', id: scriptContext.newRecord.id});
				   // original uitRec.save();
	   
	   var mSub = scriptContext.newRecord.getValue(SUBSIDIARY);
	   var mRelPar = scriptContext.newRecord.getText(PARTY);
	   var mUnit = scriptContext.newRecord.getText(UNIT);
	   var mAmount = scriptContext.newRecord.getValue(AMOUNT);
	   var mCurrency = scriptContext.newRecord.getValue(CURRENCY);
	   var mExRate = scriptContext.newRecord.getValue(EXRATE);
	   var journalId = null;
	   
	   log.debug('Body mSub-', mSub+', mRelPar-'+mRelPar+', mUnit-'+mUnit+', mCurrency-'+mCurrency);
	   
	   var rSub = scriptContext.newRecord.getValue(RELPARTYSUB);
	   var rSubCur = null;
	   var rSubRecord = search.lookupFields({
		    type: search.Type.SUBSIDIARY,
		    id: rSub,
		    columns: ['currency']
		});
	   if(rSubRecord){
		   rSubCur = rSubRecord.currency[0].value;
	   }
	   
	   var journalRec = record.create({
           type : record.Type.JOURNAL_ENTRY,
           isDynamic: true 
       });
	   
	   
  	   journalRec.setValue('trandate', new Date());
  	   journalRec.setValue(SUBSIDIARY, rSub);
  	   journalRec.setValue(DEPRECIATION, false);
       log.debug('',"custbody_tsa_vs_ce_auto_generated set");
       journalRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
  	   
  	   if (rSubCur != mCurrency){
  		 journalRec.setValue(CURRENCY, rSubCur);
  	   }
		
		for (var i = 0; i < scriptContext.newRecord.getLineCount({sublistId : LINE}); i++){
			var accountID	= scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, line : i});
			var credit	= scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : CREDIT, line : i});
			var debit	= scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : DEBIT, line : i});
			var memo	= scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : MEMO, line : i});
			var department = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : DEPARTMENT, line : i});
			var reserve = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : "custcol_cseg_tsa_fundreserv", line : i});
			
			log.debug('Line account-', accountID+', credit-'+credit+', debit-'+debit+', rSubCur-'+rSubCur+' ,department-'+department);
			
			journalRec.selectNewLine({sublistId : LINE});
	       	journalRec.setCurrentSublistValue({
	               sublistId : LINE,
	               fieldId   : ACCOUNT,
	               value     : accountID
	            });
	       	journalRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : CREDIT,
	                value     :	debit
	             });
	       	journalRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEBIT,
                value     : credit
             });
	       	journalRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : MEMO,
	                value     : memo
	             });
	       	/*journalRec.setCurrentSublistText({
                sublistId : LINE,
                fieldId   : UNIT,
                value     : mRelPar
             });
	       	journalRec.setCurrentSublistText({
                sublistId : LINE,
                fieldId   : LINEPARTY,
                value     : mUnit
             });
             journalRec.setCurrentSublistText({
                sublistId : LINE,
                fieldId   : UNIT,
                value     : mRelPar,
                ignoreFieldChange: true
             });
             */
	       	journalRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEPARTMENT,
                value     : department
             });
			 
	       	journalRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : "custcol_cseg_tsa_fundreserv",
                value     : reserve
             });
			 
			 
	       	journalRec.setCurrentSublistText(LINE, UNIT, mRelPar, false);
	       	journalRec.setCurrentSublistText(LINE, LINEPARTY2, mUnit, false);
	       	
	       	LINEPARTYID = journalRec.getCurrentSublistValue({
                sublistId : LINE,
                fieldId   : LINEPARTY2
             });
	       	
	       	journalRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
	       	
	       	journalRec.commitLine({sublistId : LINE});
		}
		
		try {
            
			journalRec.setValue(LINKEDICTRANS, scriptContext.newRecord.id);
            journalId =  journalRec.save();
            
            uitRec.setValue(LINKEDICTRANS, journalId);
            
            log.debug({    
                title: 'journal record created successfully', 
                details: 'New journalId:  ' + journalId+', LINEPARTYID-'+LINEPARTYID
            });
            
        
         } catch (e) {
             log.error({
                 title: e.name,
                    details: e.message
             });                
        } 
        
        if(journalId != null){
        	return journalId;
        }
	   
   }
   
   return {
      beforeLoad: intercomBeforeLoad,
      beforeSubmit: intercomBeforeSubmit,
      afterSubmit: intercomAfterSubmit
   };
});