/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_tsa_unit_income.js)
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
 * Purpose:			Automates various processes within TSA Unit Income.
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
define(['N/format', 'N/ui/serverWidget'],

function(format, serverWidget) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
   function incomeBeforeLoad(scriptContext) {
      var order = scriptContext.newRecord;
      var form  = scriptContext.form;

      form.getSublist('line').getField('account').updateDisplayType({displayType:'disabled'});
     
      if (scriptContext.type == scriptContext.UserEventType.VIEW){
        var inject_field = scriptContext.form.addField({
              id: 'custpageinjectcode',
              type: 'INLINEHTML',
              label: 'Inject Code'
        });
        
        var script_text='<script>';
        var not_bank=(!order.getValue("custbody_tsa_sentbybankcr"));
        var not_cheque=(!order.getValue("custbody_tsa_sentbycheque"));
        //custbody_tsa_nsichequenum_fs_lbl custbody_bank_acct_fs_lbl
	 	if(not_bank)script_text=script_text+'jQuery("#custbody_bank_acct_fs_lbl").hide();';
        if(not_cheque)script_text=script_text+'jQuery("#custbody_tsa_nsichequenum_fs_lbl").hide();';
        //var script_text+='nlapiSetFieldDisplay("custpageinjectcode",false);';
        var script_text=script_text+'</script>';
        
		inject_field.defaultValue = script_text;

      }

      
   }
   
   return {
      beforeLoad: incomeBeforeLoad
   };
});