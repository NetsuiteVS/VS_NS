/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	14/05/2019 - Viktor Schumann
	
	Hide "+" buttons on the screen.
	
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
		console.log( "pageinit started type="+type); 

		jQuery('#custcol_cseg_tsa_project_popup_new').remove();
		jQuery('#custcol_cseg_tsa_fundreserv_popup_new').remove();
		jQuery('#custcol_cseg_tsa_relatedpar_popup_new').remove();
		jQuery('#class_popup_new').remove();

		jQuery('#class_popup_new').remove();
		jQuery('#custbody_cseg_tsa_relatedpar_popup_new').remove();
      
      	//setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);
      	//setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);
		//jQuery('#recmachcustrecord_tsa_rejectionexptxt').click();
      
		try{
			if(type=="purchaseorder" || type=="vendorbill" || type=="vendorreturnauthorization" || type=="vendorcredit" ){
                var current_onclick=jQuery('#itemtxt').attr("onclick");
                current_onclick.replace("return false;",""); 
                //jQuery("#customtxt").attr("onclick","");
				if(current_onclick.indexOf(".remove()")==-1){
          				jQuery("#itemtxt").attr("onclick","jQuery('#custcol_cseg_tsa_project_popup_new').remove();jQuery('#custcol_cseg_tsa_fundreserv_popup_new').remove();jQuery('#custcol_cseg_tsa_relatedpar_popup_new').remove();jQuery('#class_popup_new').remove();jQuery('#class_popup_new').remove();jQuery('#custbody_cseg_tsa_relatedpar_popup_new').remove();"+current_onclick+" return false");
                }
        	}          
        }
      	catch(e){ console.log(e); }      
      
      
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
      lineInit: pageInit,
      sublistChanged: pageInit
    };
});

/*
	fieldChanged: fieldChanged,
	postSourcing: postSourcing,
	lineInit: lineInit
*/
