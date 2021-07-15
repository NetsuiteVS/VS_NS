/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_tsa_unit_expense.js)
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
 * Purpose:			Automates various processes within TSA Unit Expense.
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
   function expenseBeforeLoad(scriptContext) {
      var order = scriptContext.newRecord;
      var form  = scriptContext.form;

      form.getSublist('line').getField('account').updateDisplayType({displayType:'disabled'}); 
      
   }
   
   return {
      beforeLoad: expenseBeforeLoad
   };
});