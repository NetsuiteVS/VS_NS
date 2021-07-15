/**********************************************************************************************************
 * Name:			Create journal ([rsm]_ue_cash_sale.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 11/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal from cash sale
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
define(['N/url', 'N/http', 'N/https', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/task','../../../vs_lib'],
/**
 * @param {format} format
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
    function (url, http, https, format, record, runtime, search, serverWidget, task, vs_lib) {
	
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
	var UNITDIVISION    = 'custbody_rsm_uni_division';
	var PARTYDIVISION   = 'custbody_rsm_rp_division';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	
	var LINE			= 'item';
	var ACCOUNT			= 'account';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var OFFSETACCOUNT	= 'custcol_rsm_offset_account';
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	var LINEPARTY       = 'custcol_cseg_tsa_relatedpar';
	var LINEPARTY2      = 'custcol_rl_party_script_only';
	var LINEPARTYID     = null;
	var TSAPAYTYPE		= 'custcol_pay_type';
	var UNITEXCL        = 'custcol_unit_excl';
	var DHQEXCL         = 'custcol_dhq_excl';
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
    function cashsaleBeforeLoad(scriptContext) {

        if (scriptContext.type === scriptContext.UserEventType.COPY) {

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
    function cashsaleBeforeSubmit(scriptContext) {

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
    function cashsaleAfterSubmit(scriptContext) {
    	try {
            var cashId = scriptContext.newRecord.id;
            var casRec = record.load({type:	record.Type.CASH_SALE, id: scriptContext.newRecord.id});
          	var trigger_elimination_journal = casRec.getValue("custbody_vs_trigger_elim_journal");
          	var inter_unit_flag = casRec.getValue("custbody_tsa_inter_unit");
          	if(!inter_unit_flag){
              log.debug("ue_cash_sale::cashsaleAfterSubmit", "Not creating Offsetting Journal due to custbody_tsa_inter_unit is false");
              return true;
            }
          	
            log.debug('AS scriptContext.type-', "*** Start *** "+scriptContext.type);
            log.debug('AS runtime.executionContext-', runtime.executionContext);

            if ((scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) 
                    && (runtime.executionContext !== runtime.ContextType.SCHEDULED)){

                log.debug("ue_cash_sale::cashsaleAfterSubmit", "cashId: " + cashId)

                //Call suitelet to get language independent data
                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_unit_rel_p_d_lu_sl20',
                    deploymentId: 'customdeploy_tsa_vs_unit_rel_p_d_lu_sl20',
                    returnExternalUrl: true,
                    params: { 'custscript_unit_id_prm': casRec.getValue(UNIT), 'custscript_related_party_id_prm': casRec.getValue(PARTY) }
                });

                //Result is a semicolon separated list. "unit name;unit division;related party name;related party division;"
                var response = https.get({
                    url: suitletURL
                });
                
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "unit name from cash sale: " + casRec.getText(UNIT));
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "unit name: " + response.body.split(";")[0]);
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "unit division from cash sale: " + casRec.getText(UNITDIVISION));
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "unit division: " + response.body.split(";")[1]);
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "related party name from cash sale: " + casRec.getText(PARTY));
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "related party name: " + response.body.split(";")[2]);
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "related party division from cash sale: " + casRec.getText(PARTYDIVISION));
                log.debug("ue_cash_sale::cashsaleAfterSubmit", "related party division: " + response.body.split(";")[3]);

                var dhqElm = false;
                var untElm = false;
                var unit = response.body.split(";")[0];              
                var relatedParty = response.body.split(";")[2];
                var unitType     = casRec.getText(UNITTYPE); // these two "types" are never translated (hopefully)
                var rlPartyType  = casRec.getText(RELPARTYTYPE);
                var uDiv = response.body.split(";")[1];
                var rDiv = response.body.split(";")[3];
                log.debug('AS unit=', unit+' ,relatedParty='+relatedParty+' ,unitType='+unitType+' ,rlPartyType='+rlPartyType+' ,uDiv='+uDiv+' ,rDiv='+rDiv);

              if((!isNullOrEmpty(uDiv) && !isNullOrEmpty(rDiv)) && (uDiv == rDiv)){

                    dhqElm = true;
                    if (unitType == 'Unit' && rlPartyType == 'Unit'){
/* this section was remarked by Viktor S. because it's a bit of an overkill and next time I don't want to spend time to understand it...
                        if(unit.length > relatedParty.length){
                            if(unit.search(relatedParty) != -1){
                                untElm = true;
                            }
                            log.debug('IF untElm-', untElm);
                        }else {
                            if(relatedParty.search(unit) != -1){
                                untElm = true;
                            }
                            log.debug('ELSE untElm-', untElm);
                        }
*/
                      untElm = false; // ** this section added to replace the previous one. 03/09/2019 - Viktor S.
                      var a=unit.search(relatedParty);
                      var b=relatedParty.search(unit);
                      if(a>-1 || b>-1) untElm = true;
                      log.debug("",'untElm='+untElm); // ** section ends 03/09/2019 - Viktor S.
                      
                    }
                }// END OF uDiv == rDiv
                var lineCount    = casRec.getLineCount({sublistId : LINE});
                for (var i = 0; i < lineCount; i++){
                    casRec.setSublistValue({sublistId: LINE, fieldId: DHQEXCL, line: i, value: dhqElm });
                    casRec.setSublistValue({sublistId: LINE, fieldId: UNITEXCL, line: i, value: untElm });
                }	
              	casRec.setValue({ fieldId:"custbody_vs_trigger_elim_journal", value:false, ignoreFieldChange:true });
              	//thisRec.setValue({fieldId: LINKEDICTRANS, value: null, ignoreFieldChange: true});
                var casRecID =  casRec.save();
                log.debug({title: 'AS Cash Sale submitted-',details:casRecID});
            }
			
          
            if(scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY || trigger_elimination_journal){ // even if this creates an offset journal, not an elimination...
              	log.debug({title: '', details:'Offset Journal Scheduled Script Called' });
                var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                scriptTask.scriptId = 'customscript_rsm_sc_cre_jou_cas_sale';
                scriptTask.params = {custscript_rsm_cashsale_id: cashId};
                var scriptTaskId = scriptTask.submit();
            }
        }
     	catch (e) {
    		vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, JSON.stringify(e), runtime.getCurrentUser().id, scriptContext.newRecord.type);
     	}
    }

    return {
        beforeLoad: cashsaleBeforeLoad,
        beforeSubmit: cashsaleBeforeSubmit,
        afterSubmit: cashsaleAfterSubmit
    };
    
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}
