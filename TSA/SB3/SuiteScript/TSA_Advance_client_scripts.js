/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	19/12/2018 - Viktor Schumann
	
	1. Client Scripts to call the Expense form with an Advance record id parameter
 
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
    function pageInit() {
		console.log("pageinit fired");
    }
  
    function call_expense_form(context) {
		var scheme = 'https://';
		var host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
		var url_x = url.resolveRecord({ recordType: 'expensereport', recordId: null, isEditMode: true });
		
		//console.log(context);
		//console.log(currentRecord);
		var rec=currentRecord.get();
		
		var id=rec.getValue("id");
		
		console.log("full url="+scheme+host+url_x+" expense form called...almost... id="+id);
		window.open(url_x+"&adv="+id);
    }
    return {
      pageInit: pageInit,
      call_expense_form: call_expense_form
    };
});