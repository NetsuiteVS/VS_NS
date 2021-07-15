/**********************************************************************************************************
 * Name:			Create journal ([rsm]_sc_create_journal_invoice.js)
 * 
 * Script Type:		ScheduledScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 14/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal for sales invoice
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
        log.debug({ title: 'Script Name', details: script });
        var invId = script.getParameter({ name: 'custscript_rsm_invoice_id' });
        var originalJournalId = script.getParameter({ name: 'custscript_orig_elim_journal' });
      
        //invId = 119084;
        log.debug({ title: 'invId-', details: invId });

        try {
            var invRec = record.load({ type: record.Type.INVOICE, id: invId });

            var accountResult = null;
            var offAccountSearch = null;
            var newJouID = null;

            offAccountSearch = search.create({
                type: search.Type.INVOICE,
                filters:
                    [
                        ["internalid", "anyof", invId],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
						["account.internalidnumber","isnotempty",""],
						"AND",
                        ["formulatext: case when {creditamount} is NULL and {debitamount} is NULL then 0 else 1 end", "is", "1"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "account" }),
                        search.createColumn({ name: "custrecord_offset", join: "account" }),
                        search.createColumn({ name: "debitamount" }),
                        search.createColumn({ name: "creditamount" }),                      
                        search.createColumn({ name: "debitfxamount" }),
                        search.createColumn({ name: "creditfxamount" }),
                        search.createColumn({ name: "posting" }),
                        search.createColumn({ name: "memo" }),
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "subsidiary" }),
                        search.createColumn({ name: "department" }),
                        search.createColumn({ name: "class" }),
                        search.createColumn({ name: "custbody_cseg_tsa_relatedpar" }),
						search.createColumn({ name: "currency", join: "subsidiary", label: "Subs Currency" })
                    ],
                settings: [
                    search.createSetting({
                        name: 'consolidationtype',
                        value: 'NONE'
                    })]
            });

            accountResult = offAccountSearch.run().getRange({ start: 0, end: 1000 });
			log.debug("accountResult",JSON.stringify(accountResult));

            if ((!isNullOrEmpty(accountResult))) {
                newJouID = createJournalStandard(accountResult, invId, invRec,originalJournalId);
            }
            if ((!isNullOrEmpty(newJouID))) {
                //invRec.setValue(LINKEDICTRANS, newJouID);
                //var invRecID =  invRec.save();
                //log.debug({title: 'Invoice submitted-',details:invRecID});
            }
        }
        catch (e) {

            //Set "journal has been successfully created" flag on invoice
            record.submitFields({
                type: record.Type.INVOICE,
                id: invId,
                values: { custbody_tsa_vs_elimination_queue: "error" },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

            vs_lib.createErrorLog(runtime.getCurrentScript().id, invId, JSON.stringify(e), runtime.getCurrentUser().id, "Invoice");
        }
    }
    
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} accountResult, invId, invRec
	 * @returns {String} jouID
	 */
	function createJournalStandard(accountResult, invId, invRec, originalJournalId){

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

		
		var unit      = null;
		var subEliSub = null;
		var subEliUni = null;
		var eliSubEliUni = null;
		var offsetAccountIs = null;
		var subsidiary   = invRec.getValue(SUBSIDIARY);
        var status       = invRec.getValue(STATUS);
		//var currency     = invRec.getValue(CURRENCY);
		var currency     = accountResult[0].getValue({ name:"currency", join:"subsidiary" });
		
		var rSub         = invRec.getValue(RELPARTYSUB);
		var invUnit      = invRec.getText(UNIT);
		var unit_value      = invRec.getValue(UNIT);
		
      	var trandate	   = invRec.getValue("trandate");
		var relparty	 = invRec.getValue("custbody_cseg_tsa_relatedpar");

			// #region ******  Call suitelet - Unit lookup ********* added by Viktor S.
			var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
				params: { 'custscript_search_type_prm': 'unit', 'custscript_id_prm': relparty }
			});		
			var response = https.get({ url: suitletURL });
			log.debug( "Unit_lookup_Call", "response: " + JSON.stringify(response) );
			log.debug("Unit_lookup_Call", "returned id: " + response.body );
			// #endregion
		
		var billUnit_value = parseInt(response.body);


		var unit_type 	  = invRec.getValue('custbody_unit_type');
		var relparty_type = invRec.getValue('custbody_rp_type');
		var unit_division = invRec.getValue('custbody_rsm_uni_division');
		var relparty_division = invRec.getValue('custbody_rsm_rp_division');
		var relparty_div_shared_key = invRec.getValue('custbody_relparty_div_shared_key');
		var unit_div_shared_key = invRec.getValue('custbody_unit_div_shared_key');
		
		
/*
New process: Elimination unit to be sourced from the unit record. New field added "Elimination Unit" {custrecord_tsa_iu_elim_unit}
The initiating (Sales Invoice) and Offsetting (Supplier Invoice) elimination journals must both share the same elimination unit 
for the consolidation reporting to balance therefore the following rules apply:
Rule 1: Elimination journal "pairs" must be in the same ELM unit
Rule 2: If either of the trading units is "THQ" then "THQ" ELM to be used
Rule 3: If "Unit <-> Unit" or "DHQ <-> Unit" trading is in the same division DHQ ELM to be used
Rule 4: If "Unit <-> Unit" or "DHQ <-> Unit" trading is in a different division then Subsidiary ELM to be used (Typically THQ and same in territory)		

Unit types - 1-DHQ, 2-THQ, 3-Unit, 4-None, 5-ELIM, 6-PROJECT
*/		
		var elim_rule = "";
		var elim_source = ""; // "unit-bill" or "unit-invoice" - shows the source of the elimination unit
		var unit_search_for;
		var unit_elm;
		var subs_elm;
				
		log.debug("Before Unit settings", "unit_type="+unit_type+" ,relparty_type="+relparty_type);				
		log.debug("Before Unit settings", "relparty_div_shared_key="+relparty_div_shared_key+" ,unit_div_shared_key="+unit_div_shared_key);
		log.debug("Before Unit settings", "rSub="+rSub+" ,subsidiary="+subsidiary);				

		var subsRecord = search.lookupFields({
			type: search.Type.SUBSIDIARY,
			id: subsidiary,
			columns: ['custrecord_sub_elim_sub', 'custrecord_sub_elim_unit']
		});
		subs_elm = subsRecord.custrecord_sub_elim_sub[0].value;
		log.debug("Before Unit settings", "Elimination Subsidiary="+subs_elm);				
		
		if(unit_type==2){ //THQ ELM of bill - Rule 2: If either of the trading units is "THQ" then "THQ" ELM to be used
			unit_search_for=unit_value;
			log.debug("Unit search setting","Case 1 - unit type is THQ");
			//subs_elm;
		}
		else if(relparty_type==2){ //THQ ELM of invoice - Rule 2: If either of the trading units is "THQ" then "THQ" ELM to be used
			unit_search_for=billUnit_value;
			log.debug("Unit search setting","Case 2 - unit type is THQ");
		}
		else if(relparty_div_shared_key==unit_div_shared_key){ //Rule 3: If "Unit <-> Unit" or "DHQ <-> Unit" trading is in the same division DHQ ELM to be used
			unit_search_for=unit_division;
			log.debug("Unit search setting","Case 3 - Unit and RelParty are in Same division");
		}
		else if(relparty_div_shared_key!=unit_div_shared_key){ //Rule 4: If "Unit <-> Unit" or "DHQ <-> Unit" trading is in a different division then Subsidiary ELM to be used (Typically THQ and same in territory)
			if( (!isNullOrEmpty(subsRecord.custrecord_sub_elim_unit[0])) ) unit_elm = subsRecord.custrecord_sub_elim_unit[0].value;
			log.debug("Unit record loaded","In case of different divisions - unit_elm="+unit_elm);
		}		
/*		else if(subsidiary == rSub){
			if( (!isNullOrEmpty(subsRecord.custrecord_sub_elim_unit[0])) ) unit_elm = subsRecord.custrecord_sub_elim_unit[0].value;
		}*/
		else{}
			
		if(unit_search_for){			
		    var classRec = record.load({type: "classification", id: unit_search_for});
			var subs_classRec = classRec.getValue('subsidiary');
			var elim_unit_classRec = classRec.getValue('custrecord_tsa_iu_elim_unit');
			//log.debug("Unit record loaded", "classRec=" + JSON.stringify(classRec) );				
			//log.debug("Unit record loaded", "subs_classRec=" + JSON.stringify(subs_classRec) );				
			log.debug("Unit record loaded", "elim_unit_classRec=" + JSON.stringify(elim_unit_classRec) );				

			unit_elm = elim_unit_classRec;
//			subs_elm = subs_classRec[0];
			log.debug("Unit record loaded",' unit_elm='+unit_elm);				
		}
		else if(!unit_elm){
			if( (!isNullOrEmpty(subsRecord.custrecord_sub_elim_unit[0])) ) unit_elm = subsRecord.custrecord_sub_elim_unit[0].value;
			log.debug("Unit record loaded","In case of unit_elm is still empty - Elim Subsidieriy's Elimination unit - unit_elm="+unit_elm);		
		}
			
		var newJouRec = record.create({
	           type : record.Type.JOURNAL_ENTRY,
	           isDynamic: true 
	       });
      	newJouRec.setValue("trandate", trandate);
		//newJouRec.setValue('trandate', new Date());
		newJouRec.setValue(LINKEDICTRANS, invId);
		newJouRec.setValue(DEPRECIATION, false);
		newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
      
        if(originalJournalId) newJouRec.setValue("custbody_tsa_iu_orig_elim_journal", originalJournalId);
		//newJouRec.setText(UNIT, subEliUni);
		//

		log.debug("Elimination",'subs_elm='+subs_elm+', unit_elm='+unit_elm);		
		newJouRec.setValue(SUBSIDIARY, subs_elm);
		unit = unit_elm;
		newJouRec.setValue(UNIT, unit);

        var unit_shared_key;
        var unit_location_found;
        log.debug("Shared Key Lookup", "Unit Shared Key Lookup");
        if(unit){
            log.debug("Shared Key Lookup","unit="+unit);
            var suitletURL = url.resolveScript({
                scriptId: 'customscript_tsa_vs_rp_shared_key_sl20',deploymentId: 'customdeploy_tsa_vs_rp_shared_key_sl20',returnExternalUrl: true,
                params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': unit }
            });
            var response = https.get({ url: suitletURL });
            log.debug("Shared Key Lookup","Unit shared_key_lookup response=" + JSON.stringify(response));
            log.debug("Shared Key Lookup","Unit shared key id=" + response.body);
            unit_shared_key=response.body;
            unit_location_found = find_location_from_shared_key(unit_shared_key);
        }
		
		newJouRec.setValue({ fieldId: "location" , value: unit_location_found});
        newJouRec.setValue({ fieldId: "custbody_tsa_location_main_jrn" , value: unit_location_found});      
/*		
		if (subsidiary == rSub){
			newJouRec.setValue(SUBSIDIARY, subsidiary);
			unit = subEliUni;
		}else{
			newJouRec.setValue(SUBSIDIARY, subEliSub);
			
			var eliSubRecord = search.lookupFields({
			    type: search.Type.SUBSIDIARY,
			    id: subEliSub,
			    columns: ['custrecord_sub_elim_unit']
			});
			if(eliSubRecord){
				if((!isNullOrEmpty(eliSubRecord.custrecord_sub_elim_unit[0])))	eliSubEliUni = eliSubRecord.custrecord_sub_elim_unit[0].value;
			}
			unit = eliSubEliUni;
		}
		log.debug("Eliminations","Subsidiary="+subsidiary+", rSub="+rSub+', eliSubEliUni='+eliSubEliUni+', subEliSub='+subEliSub+', subEliUni='+subEliUni+', unit='+unit);
*/

		log.debug("Elimination","currency="+JSON.stringify(currency)); // added by Viktor S.
		//if(currency==11) currency="PYG";
		newJouRec.setValue({fieldId:CURRENCY, value:parseInt(currency)}); // added by Viktor S.


		// #region ******  Call suitelet - Related Party lookup ********* //added by Viktor S.
		var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
			params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': unit_value }
		});		
		var response = https.get({ url: suitletURL });
		log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
		log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
		var line_party_value=parseInt(response.body);
		// #endregion
	  	
	  	for ( var i = 0; i <accountResult.length ; i++) { //accountResult.length
       
	  		var accountID	 = accountResult[i].getValue({name: 'account'});
	  		var memo		 = accountResult[i].getValue({name: 'memo'});
			var credit_fx	 = accountResult[i].getValue({name: 'creditfxamount'});
			var debit_fx	 = accountResult[i].getValue({name: 'debitfxamount'});
          	var credit		 = accountResult[i].getValue({name: 'creditamount'});
			var debit		 = accountResult[i].getValue({name: 'debitamount'});
			var lunit		 = accountResult[i].getValue({name: 'class'});
			var lparty		 = accountResult[i].getValue({name: 'custbody_cseg_tsa_relatedpar'});
			var department   = accountResult[i].getValue({name: 'department'});
	        
            //if(!credit) credit=credit_base;
            //if(!debit) debit=debit_base;
          
			log.debug("accountResult(i)="+i,'accountID='+accountID+', memo='+memo+', credit='+credit+', debit='+debit+', lunit='+lunit+', lparty='+lparty+', department='+department);
			
			newJouRec.selectNewLine({sublistId : LINE});
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : ACCOUNT, value : accountID });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : CREDIT, value : debit });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : DEBIT, value : credit });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : MEMO, value : memo });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : DEPARTMENT, value : department });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : LINELINKEDTRAN, value : invId });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : UNIT, value : unit });
			newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId   : "location", value     : unit_location_found });

			/*newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : LINEPARTY, value : lparty });*/

			newJouRec.setCurrentSublistValue({sublistId:LINE, fieldId:LINEPARTY2, value:parseInt(line_party_value), ignoreFieldChange:false}); // probably we don't need this... Viktor S.
			newJouRec.setCurrentSublistValue({sublistId:LINE, fieldId:LINEPARTY, value:parseInt(line_party_value) }); // added by Viktor S.

			/* remarked by Viktor S.
			newJouRec.setCurrentSublistText(LINE, LINEPARTY2, invUnit, false);

	       	LINEPARTYID = newJouRec.getCurrentSublistValue({ sublistId : LINE, fieldId : LINEPARTY2 });
	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
			*/

			newJouRec.commitLine({sublistId : LINE});
		}
		var jouID =  newJouRec.save();
        log.debug({    
            title: 'journal record created successfully Invoice', 
            details: 'New journalId:  ' + jouID
        });

        //Set "journal has been successfully created" flag on invoice
        record.submitFields({
            type: record.Type.INVOICE,
            id: invId,
            values: { custbody_tsa_vs_elimination_queue: "done" },
            options: { enableSourcing: false,  ignoreMandatoryFields: true }
        });

		return jouID;
	}
	
	return {
        execute: createJournal
    };
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}
