/**********************************************************************************************************
 * Name:				Create journal 
 * 
 * Script Type:		ScheduledScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 23/01/2020 - Initial Development - KR
 * 
 * Author:			Viktor Schumann
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal for TSA IntraUnit transaction
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
 
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/
 
define(['N/record', 'N/runtime', 'N/search', 'N/task','N/url','N/https','../../../vs_lib', '../../Library.FHL.2.0'],
//define(['N/record', 'N/runtime', 'N/search', 'N/task','N/url','N/https'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 */
function(record, runtime, search, task, url, https, vs_lib, Library) {
//function( record, runtime, search, task, url, https ) {
	
'use strict';

/*	
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var SUBSIDIARY      = 'subsidiary';
	var UNIT	        = 'class';
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'approvalstatus';
	var MEMO            = 'memo';
	var DEPARTMENT      = 'department';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	var RELPARTYSUB     = 'custbody_rp_sub';
	var TYPE 		    = 'custbody_unit_type';
	var PARTYTYPE       = 'custbody_rp_type';
	var DEPRECIATION    = 'custbody_tsa_depreciation_inprogress';
	
	var LINE			= 'line';
	var ACCOUNT			= 'account';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var OFFSETACCOUNT	= 'custcol_rsm_offset_account';
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	var LINEPARTY       = 'custcol_cseg_tsa_relatedpar';
	var LINEPARTY2      = 'custcol_rl_party_script_only';
	var TSAPAYTYPE		= 'custcol_pay_type';
	var ACCOUNTYPE      = 'custcol_tsa_account_type';
	var UNITTYPE        = 'custcol_unit_type';
	var REALPARTYTYPE   = 'custcol_rp_type';
	var LINELINKEDTRAN  = 'custcol_linked_ic_trans';
	var LINEPARTYID     = null;
*/


	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var AMOUNT			= 'custbody_bank_amt';
	var TRANSTYPE 		= 'custbody_ic_trans_type';
	var CREDIT			= 'credit';
	var DEBIT			= 'debit';
	var UNITTYPE 		= 'custbody_unit_type';
	var RELPARTYTYPE    = 'custbody_rp_type';
	var SUBSIDIARY      = 'subsidiary';
	var UNIT	        = 'class';
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'transtatus';
	var MEMO            = 'memo';
	var LINE			= 'line';
	var ACCOUNT			= 'account';
	var OFFSETACCOUNT	= 'custcol_rsm_offset_account';
	var DEPARTMENT      = 'department';
	var DEPRECIATION    = 'custbody_tsa_depreciation_inprogress';
	
	
	// OFFSETTING JOURNAL 
	var RELPARTYSUB     = 'custbody_rp_sub';
	var RELPARTYSUBCUR  = 'custbody59'; // SUBSIDIARY LOOKUP NEEDED
	var OFFSETEXRATE    = ''; // HOW TO GET/NEEDED?
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	
	var BANK			= 'custbody_bank_chkbx';
	var BANKACCOUNT		= 'custbody_bank_acct';
	
	var EXPENSETYPE		= 'custcol_ic_expense_cat';
	
	var PARTY			= 'custbody_cseg_tsa_relatedpar';
	var LINEPARTY       = 'custcol_cseg_tsa_relatedpar';
	var LINEPARTY2      = 'custcol_rl_party_script_only';
	var LINEPARTYID     = null;
	var TSAPAYTYPE		= 'custcol_pay_type';
	var TRIGGER   		= 'custbody_trigger';

   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	 
   function execute(scriptContext)	{

			//****** Find Location Id from Shared Key *******

				function find_location_from_shared_key(shared_key){
					var return_result="-1";
					var locationSearchObj = search.create({
					  type: "location",
					  filters:
					  [
						//["internalid","anyof",code],
						["custrecord_tsa_iu_shared_key_loc", "is", shared_key],
			            "AND",
            			["custrecord_tsa_loc_type", "is", 1]                        
					  ],
					  columns:
					  [
						search.createColumn({ name: "internalid", label: "Internal ID" })
					  ]
					});
					log.debug("location_lookup::find_location_id_from_shared_key", "Looked up shared_key:"+shared_key);
					
					locationSearchObj.run().each(function (result) {
					  log.debug("location_lookup::find_location_id_from_shared_key", "location internalid: " + result.getValue({ name: "internalid" }));
					  return_result = result.getValue({ name: "internalid" });
					  return false;
					});
					return return_result;
				}

			 //*****************************  VALIDATE WIP ***************************
			function validateWIP(currentRecord) {
				try{
					log.debug("validateWIP","*** validate WIP started *** ");
					
					var subs_reserve_journal_creation_enabled = currentRecord.getValue({ fieldId : 'custbody_subs_reserve_journal_setting' });
					if(subs_reserve_journal_creation_enabled!=true) 
					{
					  log.debug("validateWIP","Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
					  currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_checked", value: true });
					  return true;
					}
					
					var transferComplete = currentRecord.getValue({
						fieldId : 'custbody_tsa_wip_transfer_complete'
					});  
					 
					if(transferComplete){
						currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_mapping", value: "" });
						currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_checked", value: true });
						return true;
					}

					var postObject = { internalType : currentRecord.getValue({ fieldId : "ntype" }) };
					postObject.recordType = "journalentry";
					
					var tmp_value;
					var tmp_category;
					
					log.debug("validateWIP","wip check - start");
					
					postObject.accountId = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "account"
					});
					postObject.item = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "item"
					});
					postObject.category = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "category"
					});
					postObject.reserve = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "custcol_cseg_tsa_fundreserv"
					});
					postObject.custcol_expense_type = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "custcol_expense_type"
					});
					postObject.custcol_income_type = currentRecord.getCurrentSublistValue({
						sublistId : "line",
						fieldId : "custcol_income_type"
					});

					postObject.side = (function(){
						var amt = currentRecord.getCurrentSublistValue({
							sublistId : "line",
							fieldId : "debit"
						});
						// Debit = 2 : Credit = 1
						return amt? "2" : "1";
					}());

					if(postObject.reserve){
						var reserveFields = search.lookupFields({
							type:'customrecord_cseg_tsa_fundreserv',
							id: postObject.reserve,
							columns: 'parent'
						});

						if(reserveFields.parent[0]){
							postObject.reserve = reserveFields.parent[0].value;
						}
					}
					
					log.debug("validateWIP","postObject="+JSON.stringify(postObject));
								
					var suitletURL = url.resolveScript({
					   scriptId: 'customscript_lm_slet_wip_server_2', deploymentId: 'customdeploy_lm_slet_wip_server_2', returnExternalUrl: true
		//			   params: { 'custscript_invoice_id': invRec.getValue("id")}
					});
					
					var response  = https.post({
						url: suitletURL,
						body : JSON.stringify(postObject)
					});
					
					log.debug("validateWIP","accoint id="+runtime.accountId+" , response.body="+response.body);
					
					currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_mapping", value: "" });
					var objLine = JSON.parse(response.body);
					if(objLine.error){
						log.debug("validateWIP","WIP mapping error="+objLine.error);
					}
					else if(objLine.id){
						currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_mapping", value: objLine.id });
						currentRecord.setCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_wip_checked", value: true });
						log.debug("validateWIP","WIP mapping ="+objLine.id);
					}
					
				}
				catch(e){
					vs_lib.createErrorLog(runtime.getCurrentScript().id, journalId, e, runtime.getCurrentUser().id,"InterUnit - Offsetting Journal - validateWIP");
					Library.errorHandler('InterUnit - Offsetting Journal - validateWIP', e);
				}
				
				return true;
				
			} // *********** Validate WIP END *********** 

     	// 		***************************** MAIN *******************************
		try{
			var script = runtime.getCurrentScript();
			log.debug({ title: 'Create IC journal', details:'*** Started *** Script Name='+script });
			var intra_company_trans_Id = script.getParameter({ name: 'custscript_rsm_intracompany_id' });
			log.debug({ title: '', details: 'custscript_rs_intracompany_id='+intra_company_trans_Id });

			var uitRec = record.load({type: 'customtransaction_tsa_unit_intracompany', id: intra_company_trans_Id});
		   
			var mSub = uitRec.getValue(SUBSIDIARY);
			var mRelPar = uitRec.getText(PARTY);
			var mRelPar_value = uitRec.getValue(PARTY);
			var related_party_id = uitRec.getValue(PARTY);
			var mUnit = uitRec.getText(UNIT);
			var mUnit_value= uitRec.getValue(UNIT);
			
			var mAmount = uitRec.getValue(AMOUNT);
			var mCurrency = uitRec.getValue(CURRENCY);
			var mExRate = uitRec.getValue(EXRATE);
			var trandate = uitRec.getValue("trandate");
			var journalId = null;
			var purpose = uitRec.getValue("custbody_tsa_nsipurps");
          
		  	var trans_type = uitRec.getValue({ fieldId: "custbody_ic_trans_type" });
			var interunit_trans_type = uitRec.getValue({fieldId : "custbody_ic_trans_type"});                    	
/*
		2=Centage-Expense, 	5=Centage-Income, 	10=Fund-Expense, 	9=Fund-Income
		1=Grant-Expense,	6=Grant-Income, 	3=Other-Expense,	4=Other-Income
*/
			var unit_value;
			var related_party_value;
			
			// related party record : custrecord_tsa_vsf_reserve
			var vsf_reserve = uitRec.getValue({fieldId : "custbody_related_party_vsf_reserve"}); 
			log.debug('Body', 'RelParty id from interUnit record='+related_party_id);

            var relparty_shared_key;
          	var relparty_shared_key1 = uitRec.getValue({fieldId : "custbody_tsa_relparty_shared_key"});
          	var unit_shared_key1 = uitRec.getValue({fieldId : "custbody_tsa_unit_iu_shared_key"});
			log.debug("","relparty_shared_key1="+relparty_shared_key1+", unit_shared_key1="+unit_shared_key1+", trans_type="+trans_type);
          
            var location_found;
            log.debug("Shared Key Lookup", "RelParty Shared Key Lookup");
            if(related_party_id){
                log.debug("Shared Key Lookup","relparty="+related_party_id);
                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',returnExternalUrl: true,
                    params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': related_party_id }
                });
                var response = https.get({ url: suitletURL });
                log.debug("Shared Key Lookup","Relaparty shared_key_lookup response=" + JSON.stringify(response));
                log.debug("Shared Key Lookup","RelParty shared key id=" + response.body);
                relparty_shared_key=response.body;
                location_found = find_location_from_shared_key(relparty_shared_key);
            }

          
			var entity;
			var entity_type;
			if(trans_type==9) entity_type="customer"; //fund income
			if(trans_type==10) entity_type="vendor"; //fund expense
			if(entity_type){
				var entitySearchObj = search.create({
				   type: entity_type,
				   filters:[["custentity_tsa_iu_shared_key_entity","anyof",unit_shared_key1]],
				   columns:[search.createColumn({name: "internalid"})]
				});
				var default_reserve;
				var searchResultCount = entitySearchObj.runPaged().count;
				entitySearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
				   entity = result.getValue({ name: 'internalid' });
				   return true;
				});
				log.debug("","lineinit:: entity="+entity);
				//if(entity){ curr_record.setCurrentSublistValue({sublistId : LINE, fieldId : "entity", value : entity});  }  	

			}			

/*
If account on offsetting journal is Accounts Payable 
the name value should be representing Supplier (via IU shared key) of TSA Related Party

If account on offsetting journal is Accounts Receivable 
the name value should be representing Customer (via IU shared key) of TSA Related Party
*/

			// #region ******  Call suitelet - Unit lookup *********
			var suitletURL = url.resolveScript({
				scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl: true,
				params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': mRelPar_value }
			});
			var response = https.get({ url: suitletURL });
			log.debug('Create IC journal::GET',"Unit lookup call response: " + JSON.stringify(response));
			log.debug('Create IC journal::GET',"Unit lookup call response returned id: " + response.body);
			unit_value=parseInt(response.body);
			// #endregion		 

			// #region ******  Call suitelet - Related Party lookup *********
			var suitletURL = url.resolveScript({
				scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl: true,
				params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': mUnit_value } //"3KYA THQ : DIV : Coast : COR : Changamwe"
			});
			var response = https.get({ url: suitletURL });
			log.debug('Create IC journal::GET',"Related_Party_lookup_Call response: " + JSON.stringify(response));
			log.debug('Create IC journal::GET',"Related_Party_lookup_Call returned id: " + response.body);
			related_party_value=parseInt(response.body);
			// #endregion
			
/*			if(interunit_trans_type==7){
				var vsf_reserve_lookup = search.lookupFields({
					type: "customrecord_cseg_tsa_relatedpar",
					id: related_party_value,
					columns: ["custrecord_tsa_vsf_reserve"]
				});
				if(vsf_reserve_lookup.custrecord_tsa_vsf_reserve[0]){
					log.debug('Body', 'RelParty VSF RESERVE from Related Party Record='+JSON.stringify(vsf_reserve_lookup));
					vsf_reserve=vsf_reserve_lookup.custrecord_tsa_vsf_reserve[0].value;				
				}
				else{
					e="Default VSF reserve is not set on the Related Party Record.";
					vs_lib.createErrorLog(runtime.getCurrentScript().id, journalId, e, runtime.getCurrentUser().id,"InterUnit - Offsetting Journal",true);
				}
			}
*/			
			log.debug('Body mSub-', mSub+', mRelPar-'+mRelPar+', mUnit='+mUnit+', mCurrency='+mCurrency+" ,looked up related_party_value="+related_party_value+" ,looked up unit_value="+unit_value);
		   
			var rSub = uitRec.getValue(RELPARTYSUB);
			log.debug('Body', 'From RelPar Sub field='+rSub);
			var rSubCur = null;
			
			rSub = search.lookupFields({
				type: "customrecord_cseg_tsa_relatedpar",
				id: related_party_id,
				columns: ["custrecord_tsa_subsidiary"]
			}).custrecord_tsa_subsidiary[0].value;
			log.debug('Body', 'RelPar Sub from Related Party Record='+rSub);
			
			
		 /*
			var rSubRecord = search.lookupFields({
				type: search.Type.SUBSIDIARY,
				id: rSub,
				columns: ['currency']
			});
		   if(rSubRecord){
			   rSubCur = rSubRecord.currency[0].value;
		   }
		   */
		 
		   var journalRec = record.create({
			   type : record.Type.JOURNAL_ENTRY,
			   isDynamic: true 
		   });
		   
		   
		   journalRec.setValue("trandate", trandate);
		   //journalRec.setValue('trandate', new Date());
		   journalRec.setValue(SUBSIDIARY, rSub);
		   journalRec.setValue({ fieldId: "location" , value: location_found});
           journalRec.setValue({ fieldId: "custbody_tsa_location_main_jrn" , value: location_found});
		   journalRec.setValue(DEPRECIATION, false);
		   log.debug('',"custbody_tsa_vs_ce_auto_generated set");
		   journalRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
		   journalRec.setValue("memo", purpose);
		 
		   journalRec.setValue(CURRENCY, mCurrency);
		   
		 /*
		   if (rSubCur != mCurrency){
			 journalRec.setValue(CURRENCY, rSubCur);
		   }
		  */
			
			for (var i = 0; i < uitRec.getLineCount({sublistId : LINE}); i++){
				var accountID	= uitRec.getSublistValue({sublistId : LINE, fieldId : OFFSETACCOUNT, line : i});
				var credit	= uitRec.getSublistValue({sublistId : LINE, fieldId : CREDIT, line : i});
				var debit	= uitRec.getSublistValue({sublistId : LINE, fieldId : DEBIT, line : i});
				var memo	= uitRec.getSublistValue({sublistId : LINE, fieldId : MEMO, line : i});
				var department  	= uitRec.getSublistValue({sublistId : LINE, fieldId : DEPARTMENT, line : i});
				var offset_reserve = uitRec.getSublistValue({sublistId : LINE, fieldId : "custcol_tsa_offset_reserve", line : i});
				var reserve;
              
              	/* 
				if(interunit_trans_type!=4){ // Income type
					reserve = uitRec.getSublistValue({sublistId : LINE, fieldId : "custcol_cseg_tsa_fundreserv", line : i});
				}*/
				
              	//if(interunit_trans_type==3 && i>0){ // Expense type
				if(offset_reserve){ // Income type
					reserve = offset_reserve;
				}	
				
              
				log.debug('Line account-', accountID+', credit='+credit+', debit='+debit+', rSubCur='+rSubCur+' ,department='+department+' ,reserve='+reserve);
				
				journalRec.selectNewLine({sublistId : LINE});
				journalRec.setCurrentSublistValue({
					   sublistId : LINE,
					   fieldId   : ACCOUNT,
					   value     : accountID
					});
				journalRec.setCurrentSublistValue({
						sublistId : LINE,
						fieldId   : CREDIT,
						value     :	debit
					 });
				journalRec.setCurrentSublistValue({
					sublistId : LINE,
					fieldId   : DEBIT,
					value     : credit
				 });
				journalRec.setCurrentSublistValue({
						sublistId : LINE,
						fieldId   : MEMO,
						value     : memo
					 });
				log.debug("","lineinit:: entity="+entity);
				if(entity && i==1){ journalRec.setCurrentSublistValue({sublistId : LINE, fieldId : "entity", value : entity}); }  	
              
				/*journalRec.setCurrentSublistText({
					sublistId : LINE,
					fieldId   : UNIT,
					value     : mRelPar
				 });
				journalRec.setCurrentSublistText({
					sublistId : LINE,
					fieldId   : LINEPARTY,
					value     : mUnit
				 });
				 journalRec.setCurrentSublistText({
					sublistId : LINE,
					fieldId   : UNIT,
					value     : mRelPar,
					ignoreFieldChange: true
				 });
				 */
				journalRec.setCurrentSublistValue({
					sublistId : LINE,
					fieldId   : DEPARTMENT,
					value     : department
				 });
							
	/*
				journalRec.setCurrentSublistText(LINE, UNIT, mRelPar, false);
				journalRec.setCurrentSublistText(LINE, LINEPARTY2, mUnit, false);
				
				LINEPARTYID = journalRec.getCurrentSublistValue({
					sublistId : LINE,
					fieldId   : LINEPARTY2
				 });
				
				journalRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
	*/
				journalRec.setCurrentSublistValue(LINE, UNIT, unit_value, false);
				if(location_found) journalRec.setCurrentSublistValue(LINE, "location", location_found );
				journalRec.setCurrentSublistValue(LINE, LINEPARTY2, related_party_value, false); // just for the peace of mind... otherwise I think there's no meaning of this column...inherited from RSM
							
				journalRec.setCurrentSublistValue(LINE, LINEPARTY, related_party_value);

				
				journalRec.setCurrentSublistValue({
					sublistId : LINE,
					fieldId   : "custcol_cseg_tsa_fundreserv",
					value     : reserve
				});
				
				validateWIP(journalRec);
				
				journalRec.commitLine({sublistId : LINE});
			}
			
			try {
				
				journalRec.setValue(LINKEDICTRANS, intra_company_trans_Id);
				journalId =  journalRec.save();
				
				log.debug({    
					title: 'journal record created successfully', 
					details: 'New journalId:  ' + journalId+', LINEPARTYID-'+LINEPARTYID
				});
				
			} 
			catch (e) {
				 log.error({
					 title: e.name,
						details: e.message
				 });                
				 vs_lib.createErrorLog(runtime.getCurrentScript().id, journalId, e, runtime.getCurrentUser().id,"InterUnit - Offsetting Journal - Record Saving ");
				 //vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
			} 
			
			if(journalId != null){
				//uitRec.setValue(LINKEDICTRANS, journalId);
				//uitRec.save();
              var id = record.submitFields({ type: 'customtransaction_tsa_unit_intracompany',  id: intra_company_trans_Id,  values: {'custbody_linked_ic_trans': journalId},
		    			options: {enableSourcing: false, ignoreMandatoryFields : true}
					   });

			}
		   
		
		}
		catch(e){
			vs_lib.createErrorLog(runtime.getCurrentScript().id, journalId, e, runtime.getCurrentUser().id,"InterUnit - Offsetting Journal");
			Library.errorHandler('InterUnit - Offsetting Journal', e);
		}
		
		
	}
	 
	
	return {
        execute: execute
    };
});

function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}
