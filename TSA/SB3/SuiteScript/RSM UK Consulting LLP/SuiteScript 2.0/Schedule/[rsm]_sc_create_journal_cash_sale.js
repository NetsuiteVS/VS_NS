/**********************************************************************************************************
 * Name:			Create journal ([rsm]_sc_create_journal_cash_sale.js)
 * 
 * Script Type:		ScheduledScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 10/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal for cash sales
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['../../Library.FHL.2.0', 'N/record', 'N/runtime', 'N/search', 'N/task','N/url','N/https','../../../vs_lib'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 */
function(Library, record, runtime, search, task, url, https, vs_lib) {
	
'use strict';
	
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
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function createJournal(scriptContext) {
    	var script = runtime.getCurrentScript();
        log.debug({title: 'Script Name',details: script});
        var casId = script.getParameter({name: 'custscript_rsm_cashsale_id'});
        //casId = 119073;
        log.debug({title: 'casId-',details: casId});
        
      	try {
              var casRec = record.load({type: record.Type.CASH_SALE, id: casId}); //, isDynamic: true

              var accountResult	= null;
              var offAccountSearch	= null;
              var newJouID = null;

              offAccountSearch = search.create({
                  type: search.Type.CASH_SALE,
                     filters:
                     [
                        ["internalid","anyof",casId],
                        "AND",
                        ["account.custrecord_offset", "is", "T"],
                        "AND",
                        ["formulatext: case when {creditamount} is NULL and {debitamount} is NULL then 0 else 1 end", "is", "1"]
                     ],
                     columns:
                     [
                        search.createColumn({name: "account"}),
                        search.createColumn({name: "custrecord_offset", join: "account"}),
                        search.createColumn({name: "debitamount"}),
                        search.createColumn({name: "creditamount"}),
                        search.createColumn({name: "debitfxamount"}),
                        search.createColumn({name: "creditfxamount"}),						
                        search.createColumn({name: "posting"}),
                        search.createColumn({name: "memo"}),
                        search.createColumn({name: "entity"}),
                        search.createColumn({name: "subsidiary"}),
                        search.createColumn({name: "department"}),
                        search.createColumn({name: "class"}),
                        search.createColumn({name: "custbody_cseg_tsa_relatedpar"}),
                        search.createColumn({name: "type", join: "account"}),
                        search.createColumn({name: "trandate"})
                     ],
                      settings: [
                          search.createSetting({
                              name: 'consolidationtype',
                              value: 'NONE'
                          })] 
                  });

              accountResult    = offAccountSearch.run().getRange({start: 0, end: 1000});

              if((!isNullOrEmpty(accountResult))){
                  newJouID = createJournalStandard(accountResult, casId, casRec);
              }
              //var casRecID =  casRec.save();
              //log.debug({title: 'Cash Sale submitted-',details:casRecID});
        }
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, casId, JSON.stringify(e), runtime.getCurrentUser().id, "Cash Sale - Journal Entry");
    	}
    }
    
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} accountResult, casId, casRec
	 * @returns {String} jouID
	 */
	function createJournalStandard(accountResult, casId, casRec){
		log.debug({title: 'createJournalStandard',details: '***Started***'});
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
//****** Find Location Id from Shared Key - END
        
		var rSubCur = null;
		var offsetAccountIs = null;
		var unitType = null;
		var relPrtyTyp = null;
		var subsidiary   = casRec.getValue(SUBSIDIARY);
		var department   = casRec.getValue(DEPARTMENT);
		var unit         = casRec.getText({fieldId: UNIT});
		var unit_value   = casRec.getValue({fieldId: UNIT});
		var party        = casRec.getText({fieldId: PARTY});
		var party_value  = casRec.getValue({fieldId: PARTY});
            unitType     = casRec.getText({fieldId: TYPE});
            relPrtyTyp   = casRec.getText({fieldId: PARTYTYPE});
        var rSubsidiary  = casRec.getValue(RELPARTYSUB);
        var currency     = casRec.getValue(CURRENCY);
        var exchangerate = casRec.getValue(EXRATE);
        var status       = casRec.getValue(STATUS);
		var rSub         = casRec.getValue(RELPARTYSUB);
      	var tranDate         = casRec.getValue("trandate");
		
      	/*	Remarked by Viktor S.  - Journal's currency should be the original Transaction's currency since there aren't any value conversion in the script.
		   var rSubRecord = search.lookupFields({
			    type: search.Type.SUBSIDIARY,
			    id: rSub,
			    columns: ['currency']
			});
		   if(rSubRecord){
			   rSubCur = rSubRecord.currency[0].value;
		   }
      	*/
      
		log.debug({title: 'createJournalStandard',details: 'rSub='+rSub+' ,rSubCur='+rSubCur+' ,unit='+unit+' ,party='+party+' ,unitType='+unitType+' ,relPrtyTyp='+relPrtyTyp});
		
		/////
		var rSubBnk = null;
		var defaultAccount = null;
		var suspenseAccount = null
		var rRecord = search.lookupFields({
			type: 'customrecord_cseg_tsa_relatedpar',
			id: casRec.getValue(PARTY),
			columns: ['custrecord_tsa_subsidiary', 'custrecord_tsa_def_bank']
		});
		if(!isNullOrEmpty(rRecord)){
			if((!isNullOrEmpty(rRecord.custrecord_tsa_def_bank[0])))   rSubBnk = rRecord.custrecord_tsa_def_bank[0].value;
		}
		log.debug({title: 'Before getOffsetSuspense',details: "PARTY="+casRec.getValue(PARTY)});

		//var suspenseReturn = getOffsetSuspense('Suspense', casRec.getValue(PARTY)); //??? Why Party why not Related Party Type? 
		var suspenseReturn = getOffsetSuspense('Suspense', casRec.getText(PARTYTYPE)); //amended by Viktor S.
		if(!isNullOrEmpty(suspenseAccount)){
			suspenseAccount = suspenseReturn[0];
		}
		log.debug("Consolidation",'Returned suspenseAccounts='+suspenseAccount+', rSubBnk='+rSubBnk);
		
		if(!isNullOrEmpty(rSubBnk)){
			defaultAccount = rSubBnk;
        } else if(isNullOrEmpty(rSubBnk)){
			defaultAccount = suspenseAccount;
        }
		

//**** Shared key lookup    
  		var relparty = party_value;
        var relparty_shared_key;
        var location_found;
        log.debug("Shared Key Lookup", "RelParty Shared Key Lookup");
        if(relparty){
            log.debug("Shared Key Lookup","relparty="+relparty);
            var suitletURL = url.resolveScript({
                scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',returnExternalUrl: true,
                params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': relparty }
            });
            var response = https.get({ url: suitletURL });
            log.debug("Shared Key Lookup","Relaparty shared_key_lookup response=" + JSON.stringify(response));
            log.debug("Shared Key Lookup","RelParty shared key id=" + response.body);
            relparty_shared_key=response.body;
            location_found = find_location_from_shared_key(relparty_shared_key);
			log.debug("Shared Key Lookup","location found=" + location_found);
        }
      
      
		var newJouRec = record.create({
	           type : record.Type.JOURNAL_ENTRY,
	           isDynamic: true 
	       });
		newJouRec.setValue('trandate', tranDate);  // new Date()
		newJouRec.setValue(LINKEDICTRANS, casId);
		newJouRec.setValue(SUBSIDIARY, rSub);
      	newJouRec.setValue("location", location_found);
      	newJouRec.setValue("custbody_tsa_location_main_jrn", location_found);
      
		newJouRec.setValue(MEMO, casRec.getValue(MEMO));
		newJouRec.setValue(DEPRECIATION, false);
	  	/* Remarked by Viktor S.
      	if (rSubCur != currency){
	  		newJouRec.setValue(CURRENCY, rSubCur);
		}
        */
      	newJouRec.setValue(CURRENCY, currency); // added by Viktor S.  - Journal's currency should be the original Transaction's currency since there aren't any value conversion in the script.
      	newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);

		// #region ******  Call suitelet - Unit lookup ********* //added by Viktor S.
		var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
			params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': party_value } 
		});		
		var response = https.get({ url: suitletURL });
		log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
		log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
		var line_unit_value=parseInt(response.body);
		// #endregion		 

		// #region ******  Call suitelet - Related Party lookup *********
		var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
			params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': unit_value }
		});		
		var response = https.get({ url: suitletURL });
		log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
		log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
		var line_party_value=parseInt(response.body);
		// #endregion
		  
		log.debug({title: 'account Result', details: JSON.stringify(accountResult) });
		
		var sum_credit=0.00000000;
		var sum_debit=0.00000000;
		
	  	for ( var i = 0; i < accountResult.length; i++) {
	  		log.debug({title: '** account i='+i,details:  accountResult[i].getValue({name: 'account'})
       		 +', debitamount='+accountResult[i].getValue({name: "custrecord_offset", join: "account"})
       		 +', debitamount='+accountResult[i].getValue({name: 'debitamount'})
       		 +', creditamount='+accountResult[i].getValue({name: 'creditamount'})
       		 +', debitfxamount='+accountResult[i].getValue({name: 'debitfxamount'})
       		 +', creditfxamount='+accountResult[i].getValue({name: 'creditfxamount'})			 
       		 +', posting='+accountResult[i].getValue({name: 'posting'})
       		 +', memo='+accountResult[i].getValue({name: 'memo'})
       		 +', entity='+accountResult[i].getValue({name: 'entity'})
       		 +', subsidiary='+accountResult[i].getValue({name: 'subsidiary'})
       		 +', department='+accountResult[i].getValue({name: 'department'})
       		 +', class='+accountResult[i].getValue({name: 'class'})
       		 +', custbody_cseg_tsa_relatedpar='+accountResult[i].getValue({name: 'custbody_cseg_tsa_relatedpar'})
       		 });
       
	  		var accountID	 = accountResult[i].getValue({name: 'account'});
	  		var memo		 = accountResult[i].getValue({name: 'memo'});
			
			var credit		 = accountResult[i].getValue({name: 'creditfxamount'});
			sum_credit		 = sum_credit+parseFloat(credit||0);
			if(credit) credit= parseFloat(String(credit||0));
			
			var debit		 = accountResult[i].getValue({name: 'debitfxamount'});
			sum_debit		 = sum_debit+parseFloat(debit||0);
			if(debit) debit=parseFloat(String(debit||0));
			
			var credit_x	 = accountResult[i].getValue({name: 'creditamount'});
			var debit_x		 = accountResult[i].getValue({name: 'debitamount'});
			if(!credit) credit=credit_x;
			if(!debit) debit=debit_x;
			var accType		 = accountResult[i].getValue({name: "type", join: "account"})
			
			log.debug("Before getOffsetAccount","Account="+accountID+" ,offsetReturn="+offsetReturn+", unitType="+unitType+", relPrtyTyp="+relPrtyTyp );

			var offsetReturn = getOffsetAccount('Offset', accountID, unitType, relPrtyTyp);

			log.debug("After getOffsetAccount","Account="+accountID+" ,offsetReturn="+offsetReturn+", unitType="+unitType+", relPrtyTyp="+relPrtyTyp );

			if(!isNullOrEmpty(offsetReturn)){
				offsetAccountIs = offsetReturn[0];
			}
			newJouRec.selectNewLine({sublistId : LINE});

           	if(defaultAccount && i==0) {
				log.debug({title: 'Related Party has BANK account',details: 'accountID='+accountID+', defaultAccount'+defaultAccount+', unitType-'+unitType+', relPrtyTyp-'+relPrtyTyp+', accType-'+accType+', offsetAccountIs-'+offsetAccountIs});
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : defaultAccount
		            });
			} else {
				log.debug({title: 'Offset account (Undeposited Fund) ',details: 'accountID='+accountID+' ,defaultAccount'+defaultAccount+' ,unitType-'+unitType+' ,relPrtyTyp-'+relPrtyTyp+' ,accType-'+accType+' ,offsetAccountIs-'+offsetAccountIs});
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : offsetAccountIs
		            });
			}
			
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : CREDIT,
	                value     :	debit
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEBIT,
                value     : credit
             });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : MEMO,
	                value     : memo
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEPARTMENT,
                value     : department
             });
			newJouRec.setCurrentSublistValue({
				sublistId : LINE, 
				fieldId   : LINELINKEDTRAN, 
				value     : casId});
			
			// added by Viktor S.
          	newJouRec.setCurrentSublistValue(LINE, UNIT, line_unit_value, false); // values from "Call suitelet - Unit lookup" - up around line #210
			newJouRec.setCurrentSublistValue(LINE, LINEPARTY2, line_party_value, false);
			newJouRec.setCurrentSublistValue(LINE, LINEPARTY, line_party_value );
			if(location_found) newJouRec.setCurrentSublistValue(LINE, "location", location_found ); 

			/* set remarked by Viktor S.
			newJouRec.setCurrentSublistText(LINE, UNIT, party, false);
			newJouRec.setCurrentSublistText(LINE, LINEPARTY2, unit, false);
	       	
	       	LINEPARTYID = newJouRec.getCurrentSublistValue({
                sublistId : LINE,
                fieldId   : LINEPARTY2
             });
	       	
	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
	    	*/   	
	       	newJouRec.commitLine({sublistId : LINE});
		}
		log.debug({title: 'for(i) finished',details: 'sum_credit='+sum_credit+' ,sum_debit'+sum_debit+' ,credit='+credit+' ,debit='+debit});
// rounding correction
		if(sum_credit!=sum_debit && Math.abs(sum_credit-sum_debit)<2){
          	i--;
          	log.debug({title: 'rounding adjustment',details: 'i='+i});
            var lineNum = newJouRec.selectLine({sublistId: LINE,line: i});
            if(debit>0){
              newJouRec.setCurrentSublistValue({ sublistId:LINE, fieldId:CREDIT, value:debit+sum_credit-sum_debit });
            }
            if(credit>0){
              newJouRec.setCurrentSublistValue({ sublistId:LINE, fieldId:DEBIT, value:credit-(sum_credit-sum_debit) });
            }
          	newJouRec.commitLine({sublistId : LINE});
          	
        }
		var jouID =  newJouRec.save();
		
		//casRec.setValue(LINKEDICTRANS, jouID);
		var id = record.submitFields({
		    type:	record.Type.CASH_SALE,
		    id: casId,
		    values: {
		    	'custbody_linked_ic_trans': jouID,
              	'custbody_vs_trigger_elim_journal':false
		    },
		    options: {
		        enableSourcing: false,
		        ignoreMandatoryFields : true
		    }
		});
		
        log.debug({    
            title: 'journal record created successfully cash sale', 
            details: 'New journalId:  ' + jouID+', LINEPARTYID-'+LINEPARTYID+', cashsale updated id-'+id
        });

		return jouID;
	}
	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} formUsage, offsetAccount, unitType, RelPartyType
	 * @returns {String} retVals
	 */
	function getOffsetAccount(formUsage, initialAccount, unitType, RelPartyType){
		var offAccount		= 0;
		var offAccountResult	= null;
		var offAccountSearch	= null;
		try	{
			offAccountSearch = search.create({
				type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      "AND", 
				      ["formulatext: {custrecord_uat_formusage}","is",formUsage], 
				      "AND", 
				      ["custrecord_tsa_ini_gl_account","is",initialAccount], 
				      "AND", 
				      ["formulatext: {custrecord_uat_unittype}","is",unitType], 
				      "AND", 
				      ["formulatext: {custrecord_uat_relatedpartytype}","is",RelPartyType]
				   ],
				   columns:
				   [
				      search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"})
				   ]
				});
			offAccountResult    = offAccountSearch.run().getRange({start: 0, end: 1}); // Was 1000. Why when we need the 1st line only? Changed to 1 by Viktor S.
			log.debug({title: 'offAccount result:', details: JSON.stringify(offAccountResult) });

			var script = runtime.getCurrentScript();
        	//log.debug({title: 'Script Name',details: script});
			var casId = script.getParameter({name: 'custscript_rsm_cashsale_id'});
			var isResultOk = offAccountSearch.runPaged().count > 0;
			if(!isResultOk) {
				log.debug("Consolidation:Offset Account Lookup","Offset result is null");
				vs_lib.createErrorLog(script.id, casId, "The Unit Activity Type is missing. formUsage="+formUsage+", Account="+initialAccount+", unitType="+unitType+", RelPartyType="+RelPartyType, runtime.getCurrentUser().id, "Cash Sale - Journal Entry");
			}
			offAccount        = offAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			var retVals = [offAccount];
			log.debug({title: 'offAccount 1:', details: offAccount});
		}
		catch(e)
		{
			Library.errorHandler('getOffsetAccount', e);
		}

		return retVals;
	}
	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} formUsage, RelPartyType
	 * @returns {String} retVals
	 */
	 function getOffsetSuspense(formUsage, RelPartyType){
		var offAccount		= 0;
		var offAccountResult	= null;
		var offAccountSearch	= null;
		try	{
			offAccountSearch = search.create({
				type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      "AND", 
				      ["formulatext: {custrecord_uat_formusage}","is",formUsage], 
				      "AND", 
				      ["formulatext: {custrecord_uat_unittype}","is",RelPartyType]
				   ],
				   columns:
				   [
				      search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"})
				   ]
				});
			offAccountResult    = offAccountSearch.run().getRange({start: 0, end: 1}); // was 1000, amended by Viktor S.
			offAccount        = offAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			var retVals = [offAccount];
			log.debug({title: 'Suspense Account :', details: offAccount});
		}
		catch(e)
		{
			Library.errorHandler('getOffsetSuspense', e);
		}

		return retVals;
	}
	
	
    return {
        execute: createJournal
    };
    
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}