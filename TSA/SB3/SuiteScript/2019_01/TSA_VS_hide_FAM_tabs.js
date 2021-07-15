/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	14/05/2019 - Viktor Schumann
	
	Hide FAM subtabs on the screen.
	
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
		console.log( "Hide FAM pageinit started"); 
		try{
        var current_onclick=jQuery('#customtxt').attr("onclick");
        current_onclick.replace("return false;","");
          
//jQuery("#customtxt").attr("onclick","jQuery('#recmachcustrecord_summary_histjournallnk').remove();jQuery('#recmachcustrecord_far_expinc_transactionlnk').remove();jQuery('#recmachcustrecord_tsa_porejectnlnk').remove();jQuery('#recmachcustrecord_deprhistjournallnk').remove();jQuery('#recmachcustrecord_assetsourcetrnlnk').remove();jQuery('#recmachcustrecord_tsa_billrejectlnk').remove();jQuery('#recmachcustrecord_tsa_billreject_2lnk').remove();jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').remove();"+current_onclick);
jQuery("#customtxt").attr("onclick","jQuery('#recmachcustrecord_summary_histjournallnk').hide();jQuery('#recmachcustrecord_far_expinc_transactionlnk').hide();jQuery('#recmachcustrecord_tsa_porejectnlnk').hide();jQuery('#recmachcustrecord_deprhistjournallnk').hide();jQuery('#recmachcustrecord_assetsourcetrnlnk').hide();jQuery('#recmachcustrecord_tsa_billrejectlnk').hide();jQuery('#recmachcustrecord_tsa_billreject_2lnk').hide();jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').hide();"+"setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);"+current_onclick+" return false");
        }
      	catch(e){ console.log(e); }
/*      
        jQuery('#customtxt').click();
		jQuery('#recmachcustrecord_tsa_rejectionexptxt').click();
		jQuery('#recmachcustrecord_summary_histjournallnk').remove();
		jQuery('#recmachcustrecord_far_expinc_transactionlnk').remove();
		jQuery('#recmachcustrecord_tsa_porejectnlnk').remove();
		jQuery('#recmachcustrecord_deprhistjournallnk').remove();
		jQuery('#recmachcustrecord_assetsourcetrnlnk').remove();
		jQuery('#recmachcustrecord_tsa_billrejectlnk').remove();
		jQuery('#recmachcustrecord_tsa_billreject_2lnk').remove();
		jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').remove();
		console.log("Hide FAM ok... click on lines");
		jQuery('#linestxt').click();
*/
      
    }

	function hide_fam_subtabs() {
		
		// request.getParameter('custpage_param1') //script parameter
		//var rec=context.currentRecord;		

		console.log( "Hide FAM function started"); 
		try{
        var current_onclick=jQuery('#customtxt').attr("onclick");
        current_onclick.replace("return false;","");
          
//jQuery("#customtxt").attr("onclick","jQuery('#recmachcustrecord_summary_histjournallnk').remove();jQuery('#recmachcustrecord_far_expinc_transactionlnk').remove();jQuery('#recmachcustrecord_tsa_porejectnlnk').remove();jQuery('#recmachcustrecord_deprhistjournallnk').remove();jQuery('#recmachcustrecord_assetsourcetrnlnk').remove();jQuery('#recmachcustrecord_tsa_billrejectlnk').remove();jQuery('#recmachcustrecord_tsa_billreject_2lnk').remove();jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').remove();"+current_onclick);
jQuery("#customtxt").attr("onclick","jQuery('#recmachcustrecord_summary_histjournallnk').hide();jQuery('#recmachcustrecord_far_expinc_transactionlnk').hide();jQuery('#recmachcustrecord_tsa_porejectnlnk').hide();jQuery('#recmachcustrecord_deprhistjournallnk').hide();jQuery('#recmachcustrecord_assetsourcetrnlnk').hide();jQuery('#recmachcustrecord_tsa_billrejectlnk').hide();jQuery('#recmachcustrecord_tsa_billreject_2lnk').hide();jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').hide();"+"setTimeout(function(){ console.log('after click'); jQuery('#recmachcustrecord_tsa_rejectionexptxt').click(); }, 500);"+current_onclick+" return false");
        }
      	catch(e){ console.log(e); }
		
/*		
		jQuery('#recmachcustrecord_tsa_rejectionexptxt').click();
		jQuery('#recmachcustrecord_summary_histjournallnk').remove();
		jQuery('#recmachcustrecord_far_expinc_transactionlnk').remove();
		jQuery('#recmachcustrecord_tsa_porejectnlnk').remove();
		jQuery('#recmachcustrecord_deprhistjournallnk').remove();
		jQuery('#recmachcustrecord_assetsourcetrnlnk').remove();
		jQuery('#recmachcustrecord_tsa_billrejectlnk').remove();
		jQuery('#recmachcustrecord_tsa_billreject_2lnk').remove();
		jQuery('#recmachcustrecord_tsa_iourejectionrsnlnk').remove();
		console.log("Hide FAM ok... click on lines");
		jQuery('#linestxt').click();
*/
      
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
      hide_fam_subtabs: hide_fam_subtabs
    };
});

/*
	fieldChanged: fieldChanged,
	postSourcing: postSourcing,
	lineInit: lineInit
*/
