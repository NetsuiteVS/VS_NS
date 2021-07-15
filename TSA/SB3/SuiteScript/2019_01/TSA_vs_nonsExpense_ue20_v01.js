/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 *	15/01/2019 Viktor S. 
 *	The beforeload function adds a field to the Income form and also loads the 
	
 *
 
 */
 
define(['N/record', 'N/search', 'N/email', 'N/render', 'N/format', 'N/runtime', 'N/ui/serverWidget', 'N/translation'],
function(record, search, email, render, format, runtime, serverWidget, translation) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

		if (scriptContext.type == scriptContext.UserEventType.DELETE) return;

      	if (scriptContext.type == scriptContext.UserEventType.VIEW){
	        //scriptContext.form.clientScriptFileId = 43205;//<< SET THIS TO YOUR SCRIPT ID
			//scriptContext.form.clientScriptModulePath = 'SuiteScripts/myClientscript.js';//

			//var sentby_cheque = currentRecord.getValue({ fieldId: "subsidiary" });		
			
/*			29/05/2019 Allan removed the whole Custom subtab hence this became obsolete

        	var inject_field = scriptContext.form.addField({
            	id: 'custpageinjectcode',
            	type: 'INLINEHTML',
            	label: 'Inject Code'
         	});

         	var field_text="<script>";
          	field_text += "setTimeout(function(){ require(['/SuiteScripts/TSA_VS_hide_FAM_tabs'], function(mod){ console.log('loaded'); mod.hide_fam_subtabs(); }) } ,500);";
          	inject_field.defaultValue = field_text+" </script>";
*/
          
           	return;
        }
      
    	if (scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){}
        else {return;}
      
		var currentRecord = scriptContext.newRecord;
		var subsidiary = currentRecord.getValue({ fieldId: "subsidiary" });
		
		var form = scriptContext.form;
        var bank_account_label = translation.get({collection: 'custcollection__tsa_collection_01', key: 'BANK_ACCOUNT', locale: translation.Locale.CURRENT })();
		var selectField = form.addField({ id : 'custpage_first_line_account', type : serverWidget.FieldType.SELECT, label : bank_account_label, container:"main" });
      	selectField.isMandatory = true;
      
      	form.insertField({ field : selectField, nextfield : 'transtatus' }); //debittotal
      
		selectField.addSelectOption({ value : '', text : '' });
		//selectField.addSelectOption({ value : '2000', text : 'Account 2' });
	
		//custbody_tsa_vs_account_list_storage
		
		/*
		Saved Search Criteria explanation:
		Bank - Restrict to account starting 165, 167 within the subsidiary of the person creating the transaction
		Cash - Restrict to account starting 161, 163 within the subsidiary of the person creating the transaction
        170 - Corporate Credit Card
		Cheque - Restrict to "Undeposited Funds"
		*/
		
		/*var sessionObj = runtime.getCurrentSession();
		//sessionObj.set({name: "myKey", value: "myValue"});
		log.debug("Session object myKey value: " + sessionObj.get({name: "custscript_nsi_default_account"}));
		defaultAccount = sessionObj.get({name: "custscript_nsi_default_account"});
		*/
		
		var scriptObj = runtime.getCurrentScript();
		log.debug("Script parameter of custscript1: " + scriptObj.getParameter({name: 'custscript_nsi_default_account'}));
		defaultAccount = scriptObj.getParameter({name: 'custscript_nsi_default_account'});
		
		
		var subs_filter="@CURRENT@";
		if (scriptContext.type != scriptContext.UserEventType.CREATE) subs_filter=subsidiary;
		
		var accountSearchObj = search.create({
		   type: "account",
		   filters:
		   [
			  [ 
				["number","startswith","161"],"OR",
				["number","startswith","163"],"OR",
				["number","startswith","165"],"OR",
                ["number","startswith","167"],"OR",
				["number","startswith","170"]
				//["internalidnumber","equalto",defaultAccount]
			  ],"AND", 
			  ["subsidiary","anyof", subs_filter ],"AND",
              ["isinactive","is","F"]
		   ],
		   columns:
		   [
			  search.createColumn({name: "internalid", label: "Internal ID"}),
			  search.createColumn({name: "number", label: "Number"}),
			  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name" }),
			  search.createColumn({name: "custrecord_tsa_acc_currency", label: "Currency" })
		   ]
		});
		var searchResultCount = accountSearchObj.runPaged().count;
		log.debug("accountSearchObj result count",searchResultCount);		
		
		var result_array=[];
		accountSearchObj.run().each(function(result){
		   result_array.push(result);
		   return true;
		});
		//result_array.push({ "defaultAccount":defaultAccount});
		
		var json_result=JSON.stringify(result_array);

		currentRecord.setValue({ fieldId: "custbody_tsa_vs_account_list_storage", value: json_result, ignoreFieldChange: true, fireSlavingSync: false });

/*			
			statement_run_SearchObj.run().each(function(result){
				sr_id=result.getValue({	name: 'id' });
				nr_of_st_sent=result.getValue({	name: 'custrecord_nr_of_statements_sent' });
				nr_of_st_to_send=result.getValue({	name: 'custrecord_nr_of_statements_to_send' });
				sr_status=result.getValue({	name: 'custrecord_vs_status' });
				sr_date=result.getValue({	name: 'custrecord_date' });
				start_sending=result.getValue({	name: 'custrecord_start_sending' });
				subsidiary=result.getValue({ name: 'custrecord_statement_subsidiary' });
				//log.debug("","Statement Run Internal id: sr_id="+sr_id+" | nr_of_st_sent="+nr_of_st_sent+" start_sending="+start_sending+" subsidiary="+subsidiary);
				// .run().each has a limit of 4,000 results
				return true;
			});
			log.debug("","Statement Run Internal id: sr_id="+sr_id+" | nr_of_st_sent="+nr_of_st_sent+" start_sending="+start_sending+" subsidiary="+subsidiary);
*/		

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
    function beforeSubmit(scriptContext) {
    
       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
    	
    	var currentRecord = scriptContext.newRecord;
    	//var duedate = currentRecord.getValue({fieldId: 'duedate'});
		
		var lineCount = currentRecord.getLineCount({ sublistId: "line" });
		var payee = currentRecord.getValue({fieldId: "custbody_tsa_non_s_exp_payee"});
		log.debug("nons Expense beforesubmit","line count="+lineCount+" payee="+payee);
		/* this is for Dynamic mode 
		currentRecord.selectLine({ sublistId: "line", line: 1 });
		objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'name', value: payee, ignoreFieldChange: true });
		objRecord.commitLine("line");
		*/
		var i=0;
		for(i=0;i<lineCount;i++){
			currentRecord.setSublistValue({ sublistId:'line', fieldId:'entity', line:i, value:payee });
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
    function afterSubmit(scriptContext) {

       	if (scriptContext.type == scriptContext.UserEventType.DELETE) return;
    	
    	var currentRecord = scriptContext.newRecord;
    	//var duedate = currentRecord.getValue({fieldId: 'duedate'});
    	
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit
    };
    
}); 