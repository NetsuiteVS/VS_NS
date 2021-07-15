/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_sales_invoice.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 12/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create vendor bill and trigger offset journal script for sales invoice on creation of invoice
 * 
 * Notes:			modified by TSA Viktor Schumann 08/2019
 * 					- suitelet call for Unit-Related Party identification
 * 
 * Dependencies:	
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public 
 */
define(['N/format', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/task','N/url', 'N/http', 'N/https','../../../vs_lib'],

function(format, serverWidget, search, record, runtime, task, url, http, https, vs_lib) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
'use strict';
	
	var SUBSIDIARY      = 'subsidiary';
	var DEPARTMENT      = 'department';
	var LOCATION        = 'location';
	var UNIT	        = 'class';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'transtatus';
	var MEMO            = 'memo';
	var LINE			= 'item';
	var ITEM            = 'item';
	var QTY             = 'quantity';
	var RATE            = 'rate';
	var AMOUNT          = 'amount';
	var ENTITY          = 'entity'
	var TRANDATE        = 'trandate';
	var UNITDIVISION    = 'custbody_rsm_uni_division';
	var PARTYDIVISION   = 'custbody_rsm_rp_division';
	
	var RELPARTYSUB     = 'custbody_rp_sub';
	var OFFSETENTITY    = 'custbody_offset_entity';
	var RPLOCATION      = 'custbody_rp_location';
	var SUBELIMIUNIT    = 'custbody_trans_unit_sub_elim_unit';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	var BOARD           = 'custbodytsa_internalfund';
	var TRANID          = 'tranid';
	var UNITEXCL        = 'custcol_unit_excl';
	var DHQEXCL         = 'custcol_dhq_excl';
	var LINUNITDIV      = 'custcol_rsm_uni_division';
    var LINPARTYDIV     = 'custcol_rsm_rp_division';
    var ID              = 'id';
	
	function invoiceBeforeLoad(scriptContext) {
      var order = scriptContext.newRecord;
      var form = scriptContext.form;
              
      if (scriptContext.type === scriptContext.UserEventType.COPY ){
  		var thisRec = scriptContext.newRecord;
  		log.debug('AS scriptContext.type-', scriptContext.type+', thisRec-'+thisRec);
  		thisRec.setValue({fieldId: LINKEDICTRANS, value: null, ignoreFieldChange: true});
  	}
	}
	function invoiceBeforeSubmit(context) {
		//if (context.type == context.UserEventType.DELETE) return;
    }
   
   function invoiceAfterSubmit(context) {
	   
     	try {

           log.debug('*** Started **** context.type=', context.type);
           log.debug('AS runtime.executionContext-', runtime.executionContext);
          
		   if(runtime.executionContext=="SUITELET") return true;
           if(runtime.executionContext=="SCHEDULED") return true;
          
           if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
			   
				var invRec = record.load({type:	record.Type.INVOICE, id: context.newRecord.id});
                var inter_unit_flag = invRec.getValue("custbody_tsa_inter_unit");
                if(!inter_unit_flag){
                  log.debug("ue_sales_invoice::invoiceAfterSubmit", "Not creating Supplier Bill due to custbody_tsa_inter_unit is false.");
                  return true;
                }
             
             	if(!invRec){
                      log.debug('incoiceAfterSubmit::check Invoice Record', "Invoice Record is empty, hence EXIT");
                      return;
                }
				
                if(!invRec.getText(PARTY)) {
                    log.debug('incoiceAfterSubmit::check Related Party', "Related party is empty, hence EXIT: "+invRec.getText(PARTY));
                    return;
                }
                

            	var dhqElm = false;
               	var untElm = false;
               	var unit         = invRec.getText(UNIT);
               	var relatedParty = invRec.getText(PARTY);
               	var unitType     = invRec.getText(UNITTYPE);
               	var rlPartyType  = invRec.getText(RELPARTYTYPE);
               	var uDiv         = invRec.getText(UNITDIVISION);
               	var rDiv         = invRec.getText(PARTYDIVISION);
             	var relparty_div_shared_key = invRec.getValue('custbody_relparty_div_shared_key');
				var unit_div_shared_key = invRec.getValue('custbody_unit_div_shared_key');


				if((!isNullOrEmpty(uDiv) && !isNullOrEmpty(rDiv)) && (relparty_div_shared_key == unit_div_shared_key)){
					log.debug('AS',' unit='+unit+', relatedParty='+relatedParty+', unitType='+unitType+', rlPartyType='+rlPartyType+' ,custbody_relparty_div_shared_key='+relparty_div_shared_key+' ,custbody_unit_div_shared_key='+unit_div_shared_key);

					dhqElm = true;
					if (unitType == 'Unit' && rlPartyType == 'Unit'){
						if(unit.length > relatedParty.length){
							if(unit.search(relatedParty) != -1){
								untElm = true;
								}
								log.debug('IF untElm=', untElm);
							}else {
								if(relatedParty.search(unit) != -1){
									untElm = true;
								}
								log.debug('ELSE untElm=', untElm);
							}
					}
                }// END OF uDiv == rDiv

                var lineCount    = invRec.getLineCount({sublistId : LINE});
                for (var i = 0; i < lineCount; i++){
                    invRec.setSublistValue({sublistId: LINE, fieldId: DHQEXCL, line: i, value: dhqElm });
                    invRec.setSublistValue({sublistId: LINE, fieldId: UNITEXCL, line: i, value: untElm });
                }	

                if (context.type === context.UserEventType.EDIT) {
                    //var invRecID =  invRec.save(); 										!!!!!!!!!! remarked 
                    log.debug({title: 'AS Invoice submitted EDIT-',details:invRecID});
                }

               if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) { //|| context.type === context.UserEventType.EDIT

                   if (context.type === context.UserEventType.EDIT) {
                       //Check if vendor bill exits.If exits lets delete it before continue
                       var vendorbillSearchObj = search.create({
                           type: "vendorbill",
                           filters:
                               [
                                   ["type", "anyof", "VendBill"],
                                   "AND",
                                   ["custbody_linked_ic_trans", "anyof", invRec.getValue(ID)]
                               ],
                           columns: [
                               search.createColumn({
                                   name: "internalid",
                                   summary: "GROUP",
                                   sort: search.Sort.DESC,
                                   label: "Internal ID"
                               })
                           ]
                       });

                       vendorbillSearchObj.run().each(function (result) {

                           try {

                               var recordToDeleteInternalId = result.getValue({ name: 'internalid' });
                               log.debug("", "Supplier invoice to delete: " + recordToDeleteInternalId);
                               record.delete({ type: record.Type.VENDOR_BILL, id: recordToDeleteInternalId });
                               log.debug("", "Deleted supplier invoice: " + recordToDeleteInternalId);
                           }
                           catch (e) {
                               vs_lib.createErrorLog(runtime.getCurrentScript().id, context.newRecord.id,
                                   "Linked Supplier Invoice has payment record and Sales Invoice has been modified (transaction id= " + invRec.getValue(ID) + "). | original exception message: " + e,
                                   runtime.getCurrentUser().id, context.newRecord.type, true);
                           }
                           return true;
                       });
                   }

				   var invRecID = invRec.save();
                   log.debug({title: 'AS Invoice submitted Create-',details:invRecID});
				   
                   var inv_status = invRec.getValue("approvalstatus");
                   if(inv_status=="1") return true;
                 
                   log.debug('Calling Suitelet','Calling Suitelet to create Vendor Bill');
                   //Call suitelet - Create vendor bill
                   var suitletURL = url.resolveScript({
                       scriptId: 'customscript_tsa_vs_create_vbill_sl20', deploymentId: 'customdeploy_tsa_vs_create_vbill_sl20', returnExternalUrl: true,
                       params: { 'custscript_invoice_id': invRec.getValue("id")}
                   });
                   var response = https.get({ url: suitletURL });
                   log.debug({ title: 'AS Invoice submitted Response-', details: response.body });
					
                   if(response.body){
                        var billID = parseInt(JSON.parse(response.body)["billId"]);

                       log.debug('Bill submitted Response-', 'Created Bill Id='+billID);

                       if (billID> 0) {
                           //invRec.setValue(LINKEDICTRANS, billID);
                           log.debug({ title: 'AS Invoice submitted Response-', details: 'billId saved' });
                       }
               	   }


                 /* remarked by Viktor S. due to the customscript_tsa_vs_check_inv_create_j scheduled script will check new invoices in the queue and PAID in FULL
                   var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                   scriptTask.scriptId = 'customscript_rsm_sc_cre_jou_frm_inv';
                   scriptTask.params = {custscript_rsm_invoice_id: context.newRecord.id};
                   var scriptTaskId = scriptTask.submit();
                 */
                 
                }
            }
   		}
          catch (e) {
            log.debug({ title: 'ERROR', details: e });
			//vs_lib.createErrorLog(runtime.getCurrentScript().id, context.newRecord.id, e, runtime.getCurrentUser().id, context.newRecord.type);
    	}
   }
      
   /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} str
	 * @returns {String} retVals
	 */
	function parseClassification(str){
		
		try	{
			var indx = 0;
			var retIndx = 0;
			var retIter = 0;
			var increment = 0;
			for (var i = 1; i <= 3; i++){
				indx = str.indexOf(':', indx + increment);
				//log.debug({title: 'indx:', details: indx});
				
				increment = 1;
				if (indx !== -1){
					retIndx = indx;
					retIter = retIter + 1;;
				}else if (indx === -1){
					break;
				}
			}
			var retVals = [retIndx, retIter];
		}
		catch(e)
		{
			Library.errorHandler('parseClassification', e);
		}

		return retVals;
	}
   
   return {
      beforeLoad: invoiceBeforeLoad,
      beforeSubmit: invoiceBeforeSubmit,
      afterSubmit: invoiceAfterSubmit
   };
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}