/**********************************************************************************************************
 * Name:			Create journal ([rsm]_ue_journal.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 05/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal from initiating journal
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/task','../../../vs_lib'],
/**
 * @param {format} format
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(format, record, runtime, search, serverWidget, task, vs_lib) {
	
'use strict';
	
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var SUBSIDIARY      = 'subsidiary';
	var UNIT	        = 'class';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'approvalstatus';
	var MEMO            = 'memo';
	var DEPARTMENT      = 'department';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	var UNITDIVISION    = 'custbody_rsm_uni_division';
	var PARTYDIVISION   = 'custbody_rsm_rp_division';
	
	var LINE			= 'line';
	var ACCOUNT			= 'account';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var OFFSETACCOUNT	= 'custcol_rsm_offset_account';
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	var LINEPARTY       = 'custcol_cseg_tsa_relatedpar';
	var LINEPARTY2      = 'custcol_rl_party_script_only';
	var LINEUNITTYPE 	= 'custcol_unit_type';
	var LINERELPARTYTYPE= 'custcol_rp_type';
	var LINEPARTYID     = null;
	var TSAPAYTYPE		= 'custcol_pay_type';
	var UNITEXCL        = 'custcol_unit_excl';
	var DHQEXCL         = 'custcol_dhq_excl';
	var LINELINKEDTRAN  = 'custcol_linked_ic_trans';
	var LINUNITDIV      = 'custcol_rsm_uni_division';
	var LINPARTYDIV     = 'custcol_rsm_rp_division';
	
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function journalBeforeLoad(scriptContext) {

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
    function journalBeforeSubmit(scriptContext) {
    	try {
              
          	  log.debug('C&E - BeforeSubmit', ' **** Start ****');
              log.debug('C&E - BeforeSubmit', 'scriptContext.type='+scriptContext.type+', runtime.executionContext'+runtime.executionContext+', runtime.executionContext'+runtime.executionContext);
				
				var tsa_inter_unit = scriptContext.newRecord.getValue("custbody_tsa_inter_unit");
				if(!tsa_inter_unit){
					log.debug('C&E - BeforeSubmit', '** This is not an interunit transaction (custbody_tsa_inter_unit) - Exit **');
					return true;
              	}
            				
              if ((scriptContext.type === scriptContext.UserEventType.EDIT && runtime.executionContext !== runtime.ContextType.SCHEDULED) || scriptContext.type === scriptContext.UserEventType.CREATE){ 

                  var lineCount    = scriptContext.newRecord.getLineCount({sublistId : LINE});
				  var prev_unit;
				  var prev_relParty;
                  var unit="";
                  var relatedParty="";
				  
                  for (var i = 0; i < lineCount; i++){
                      var unit_value    	 = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : UNIT, line : i});
                      var relatedParty_value = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : i});
					  if(prev_unit!=unit_value){
							if(unit_value){
								var unit_lookup = search.lookupFields({
									type:'classification',
									id: unit_value,
									columns: 'name'
								});
								log.debug('C&E - BeforeSubmit', 'i='+i+' ,unit_value='+unit_value+' ,unit_lookup='+JSON.stringify(unit_lookup));
								if(unit_lookup.name[0]){
									 unit = unit_lookup.name;
								}								
							}
							else{
								unit="";								
							}
					  }
                      log.debug('C&E - BeforeSubmit', 'i='+i+' ,unit='+unit+' ,prev_unit='+prev_unit);
					  prev_unit=unit;

					  if(prev_relParty!=relatedParty_value){
							if(relatedParty_value){
								var relParty_lookup = search.lookupFields({
									type:"customrecord_cseg_tsa_relatedpar",
									id: relatedParty_value,
									columns: 'name'
								});
								log.debug('C&E - BeforeSubmit', 'i='+i+' ,relatedParty_value='+relatedParty_value+' ,relParty_lookup='+JSON.stringify(relParty_lookup));
								if(relParty_lookup.name[0]){
									 relatedParty = relParty_lookup.name;
								}								
							}
							else{
								relatedParty="";								
							}
					  }
                      log.debug('C&E - BeforeSubmit', 'i='+i+' ,relatedParty='+relatedParty+' ,prev_relParty='+prev_relParty);
					  prev_relParty=relatedParty;
					  
					  
					  
                      var unitType       = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : LINEUNITTYPE, line : i});
                      var rlPartyType    = scriptContext.newRecord.getSublistValue({sublistId : LINE, fieldId : LINERELPARTYTYPE, line : i});
                      //var uDiv           = scriptContext.newRecord.getSublistText({sublistId : LINE, fieldId : LINUNITDIV, line : i});
                      //var rDiv           = scriptContext.newRecord.getSublistText({sublistId : LINE, fieldId : LINPARTYDIV, line : i});

					  var unit_shared_key=scriptContext.newRecord.getSublistValue( {sublistId : LINE, fieldId : "custcol_unit_div_shared_key", line:i} );
					  var relparty_shared_key=scriptContext.newRecord.getSublistValue( {sublistId : LINE, fieldId : "custcol_relparty_shared_key", line:i} );
                    
                      //log.debug('BS lineCount-', lineCount+', unit-'+unit+', relatedParty-'+relatedParty);
                      log.debug('C&E - BeforeSubmit', 'i='+i+' ,lineCount='+lineCount+', unit='+unit+', relatedParty='+relatedParty+', rlPartyType='+rlPartyType+', unitType='+unitType+'unit_shared_key='+unit_shared_key+'relparty_shared_key='+relparty_shared_key);

                      if(( unit_shared_key && relparty_shared_key ) && ( unit_shared_key==relparty_shared_key )){
                          log.debug('C&E - BeforeSubmit', 'i='+i+' , Shared Key Match');
                          scriptContext.newRecord.setSublistValue({sublistId: LINE, fieldId: DHQEXCL, line: i, value: true });
					  }// END OF uDiv == rDiv
                      if( unit_shared_key!=relparty_shared_key ){
                          log.debug('C&E - BeforeSubmit', 'i='+i+' , Shared Key DOESNt Match');
                          scriptContext.newRecord.setSublistValue({sublistId: LINE, fieldId: DHQEXCL, line: i, value: false });
					  }// END OF uDiv == rDiv

                    
                    if (unitType==3 && rlPartyType==3){
                      var subStr = false;
                      if(unit.length > relatedParty.length){
                        if(unit.search(relatedParty) != -1){
                          subStr = true;
                        }
                        log.debug('IF subStr-', subStr);
                      }else {
                        if(relatedParty.search(unit) != -1){
                          subStr = true;
                        }
                        log.debug('ELSE subStr-', subStr);
                      }
                      scriptContext.newRecord.setSublistValue({sublistId: LINE, fieldId: UNITEXCL, line: i, value: subStr });
                    }

                  }// END for loop
              }
      	}
		catch (e) {
            vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, JSON.stringify(e), runtime.getCurrentUser().id, scriptContext.newRecord.type);
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
    function journalAfterSubmit(scriptContext) {
    	
      	try {
            var joId = scriptContext.newRecord.id;
            log.debug('AS scriptContext.type-', scriptContext.type);
            log.debug('AS runtime.executionContext-', runtime.executionContext+" journal id="+joId);
            var ouu_txn_flag = scriptContext.newRecord.getValue("custbody_tsa_oou_txn");
          	var offsetting_journal_initiated = scriptContext.newRecord.getValue("custbody_tsa_vs_offs_jrnl_initiated");
			var linked_journal = scriptContext.newRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcol_linked_ic_trans', line: 0 });

          
            if (scriptContext.type === scriptContext.UserEventType.EDIT) { //|| scriptContext.type === scriptContext.UserEventType.CREATE *** offsetting journal create reversal should be set if necessary by the creator script
              var oldReversaldate = scriptContext.oldRecord.getValue({ fieldId: "reversaldate" });
              var newReversaldate = scriptContext.newRecord.getValue({ fieldId: "reversaldate" });
              var deferred = scriptContext.newRecord.getValue({ fieldId: "reversaldefer" });
              log.debug('C&E - BeforeSubmit', 'oldReversaldate=' + oldReversaldate + ", newReversaldate=" + newReversaldate+", deferred="+deferred);

              if (oldReversaldate !== newReversaldate ) { // || (scriptContext.type === scriptContext.UserEventType.CREATE && newReversaldate) 
                var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                scriptTask.scriptId = 'customscript_tsa_vs_set_rvrsl_offst_jrnl';
                //scriptTask.deploymentId = 'customdeploy_tsa_vs_setrvrsl_on_jrnl_ue2';
                scriptTask.params = {
                  'custscript_originating_journal_id': scriptContext.newRecord.id,
                  'custscript_date': newReversaldate,
                  'custscript_deferred_reversal':	(deferred?"T":"F")
                };
                var scriptTaskId = scriptTask.submit();
                log.debug('C&E - BeforeSubmit', 'Initiated Offsetting Reversal scheduled script TaskId=' + scriptTaskId);
              }
            }
          
            if(scriptContext.type === scriptContext.UserEventType.EDIT || (ouu_txn_flag && scriptContext.type === scriptContext.UserEventType.CREATE) ){
                var oldStatus = scriptContext.oldRecord.getValue(STATUS);
                var newStatus = scriptContext.newRecord.getValue(STATUS);

              	var inter_unit_flag = scriptContext.newRecord.getValue("custbody_tsa_inter_unit");
                if(!inter_unit_flag){
                  log.debug("ue_journals:journalAfterSubmit", "Not creating Offsetting Journal due to custbody_tsa_inter_unit is false.");
                  return true;
                }              

                log.debug("ue_journals:journalAfterSubmit",'oldStatus='+oldStatus+', newStatus='+newStatus+', Linked Tran='+linked_journal+" ,ouu_txn_flag="+ouu_txn_flag);

                if( (oldStatus==1 && newStatus==2 || newStatus==2 && ouu_txn_flag) && isNullOrEmpty(linked_journal) && !offsetting_journal_initiated ){
                  	// in case of OUU the created journal is approved (by WF) right from the creation 
                    //Call the scheduled script
					log.debug("ue_journals:journalAfterSubmit","Offsetting journal was initiated.");
                  	var id1 = record.submitFields({type: "journalentry",id: joId, values: { custbody_tsa_vs_offs_jrnl_initiated: true}, options: { enableSourcing: false, ignoreMandatoryFields : true}});
                    var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                    scriptTask.scriptId = 'customscript_rsm_sc_create_journal';
                    //scriptTask.deploymentId = 'customdeploy1';
                    scriptTask.params = {custscript_rsm_journal_id: joId};
                    var scriptTaskId = scriptTask.submit();
                }
            }
        }
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, e, runtime.getCurrentUser().id, scriptContext.newRecord.type);
    	}
 	}

    return {
        beforeLoad: journalBeforeLoad,
        beforeSubmit: journalBeforeSubmit,
        afterSubmit: journalAfterSubmit
    };
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}