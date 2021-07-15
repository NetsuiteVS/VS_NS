/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	01/09/2020 - Viktor Schumann
	Hide currencies.
	
 */
 
define(['N/url', 'N/record', 'N/log', 'N/runtime','N/currentRecord', 'N/search'],
  function(url, record, log, runtime, currentRecord, search) {

  /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */	
	
//******************************** PAGE INIT 
	function pageInit(context) {
	
		// request.getParameter('custpage_param1') //script parameter
		var rec=context.currentRecord;
      	var type=rec.type;
		console.log( "hidePlusButtons started rec.type="+type); 
				
		var currencies=JSON.parse(rec.getValue("custitem_tsa_vs_curr_from_subs"));
		
		for(var i=0;i<200;i++){ jQuery("#price"+i+"lnk").hide(); }
				
		currencies.forEach(function(result_cc){
				console.log("currencies collected="+result_cc);
				jQuery("#price"+result_cc+"lnk").show();
		});
		
	}
	
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */	
	
    return {
      pageInit: pageInit,
	  //init2 : init2
      //lineInit: pageInit,
      //sublistChanged: pageInit
    };
});

/*
	fieldChanged: fieldChanged,
	postSourcing: postSourcing,
	lineInit: lineInit

	function init2() {

		var rec = currentRecord.get();
		var recid = rec.id;
		var type = rec.type;
	
		// request.getParameter('custpage_param1') //script parameter
      	var type=rec.type;
		console.log( "hidePlusButtons started rec.type="+type); 
				
		var currencies=JSON.parse(rec.getValue("custitem_tsa_vs_curr_from_subs"));
		
		for(var i=0;i<200;i++){ jQuery("#price"+i+"lnk").hide(); }
				
		currencies.forEach(function(result_cc){
				console.log("currencies collected="+result_cc);
				jQuery("#price"+result_cc+"lnk").show();
		});
		
	}

*/
