/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	15/11/2019 - Viktor Schumann
 
 */
/*
require(['N/currentRecord'], function (currentRecord){
var record = currentRecord.get();
var count = record.getLineCount({ sublistId: 'item' });
console.log(count)
}
*/
 
define(['N/url', 'N/record', 'N/log', 'N/runtime','N/currentRecord'],
  function(url, record, log, runtime, currentRecord) {
	  
    function pageInit(scriptContext) {
		console.log("ExpenseClaim pageinit fired"+" , scriptContext.type="+scriptContext.mode);
      	if (scriptContext.mode != "create" && scriptContext.mode != "edit") return;
		var userObj = runtime.getCurrentUser();
		var rec=scriptContext.currentRecord;
		var custom_form=rec.getValue({fieldId:"customform"});
		console.log("Internal ID of current user role: " + userObj.roleId+" ,customForm="+custom_form);
		if(custom_form==196) // ihq credit card form
		{ //window.nlapiDisableLineItemField("line","account",true); 
			//jQuery("#expensetxt").hide();
			rec.setValue({fieldId: "corpcardbydefault", value:true });
		}
		//line_buttons
		
		//var line_num = rec.selectLine({ sublistId: 'line', line: 0 });

		//jQuery('#line_buttons').hide();
		//jQuery('#line_remove').hide();
		//jQuery('#line_insert').hide();		
		//jQuery('.machineButtonRow').hide();
		//jQuery('.uir-machine-row-even').hide();
		
		//jQuery('.uir-copy').hide();
		//jQuery('#tbl_line_insert').hide();
		//jQuery('#tbl_line_remove').hide();
      	//jQuery('#tbl_line_clear').hide();
		//jQuery('.uir-addedit').hide();
		//window.nlapiDisableLineItemField("line","amount",true);
    }
  	
    return {
		pageInit: pageInit	  
    };
});