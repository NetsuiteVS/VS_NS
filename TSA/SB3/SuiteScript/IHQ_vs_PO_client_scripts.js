/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	16/11/2019 - Viktor Schumann 
 */
 
define(['N/url', 'N/record', 'N/log', 'N/runtime','N/currentRecord'],
  function(url, record, log, runtime, currentRecord) {
	  
    function pageInit(scriptContext) {
      try{
		console.log("customscript_ihq_vs_po_cleint_scripts:: *** PO pageinit fired ***");
		var userObj = runtime.getCurrentUser();
        var current_onclick=jQuery('#itemstxt').attr("onclick");
		current_onclick.replace("return false;","");

		console.log("Internal ID of current user role: " + userObj.roleId);
		if(String(userObj.roleId).indexOf("ihq")>-1)
		{ //window.nlapiDisableLineItemField("line","account",true); 
          	jQuery("#itemstxt").attr("onclick","jQuery('#expensetxt').hide();"+"setTimeout(function(){ console.log('after click');}, 500);"+current_onclick+" return false");
			jQuery("#expensetxt").hide();
		}
		//line_buttons
		//var rec=scriptContext.currentRecord;
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
      catch(e){
        console.log("customscript_ihq_vs_po_cleint_scripts::ERROR="+e);
      }
    }
  	
    return {
		pageInit: pageInit	  
    };
});