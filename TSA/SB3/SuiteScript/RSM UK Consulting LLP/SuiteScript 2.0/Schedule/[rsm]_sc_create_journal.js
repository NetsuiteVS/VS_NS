/**********************************************************************************************************
 * Name:			Create journal ([rsm]_sc_create_journal.js)
 * 
 * Script Type:		ScheduledScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 05/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 					12/08/2019 - Viktor S. Language Independent Unit-Related Party "exchange"
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal from initiating journal
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
	var CURRENCY        = 'currency';
	var EXRATE          = 'exchangerate';
	var STATUS          = 'approvalstatus';
	var MEMO            = 'memo';
	var DEPARTMENT      = 'department';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
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
	var UNITELIM        = 'custcol_unit_excl';
	var DHQELIM         = 'custcol_dhq_excl';
	var BOARD           = 'custbodytsa_internalfund';
	
	var LINEPARTYID     = null;
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
  	//*********************************** CREATE JOURNAL  ***********************************
    function createJournal(scriptContext) {
      
       var script = runtime.getCurrentScript();
       log.debug('Script Name',"*** Script Start *** "+script);
       var jouId = script.getParameter({name: 'custscript_rsm_journal_id'});
       //jouId = 126738;
       log.debug({title: 'jouId-',details: jouId});
      
       try {
              var jouRec = record.load({type: record.Type.JOURNAL_ENTRY, id: jouId}); //, isDynamic: true
              var subsidiary   = jouRec.getValue(SUBSIDIARY);
              var currency     = jouRec.getValue(CURRENCY);
              var exchangerate = jouRec.getValue(EXRATE);
              var status       = jouRec.getValue(STATUS);
			  var board        = jouRec.getValue(BOARD);
         	  var trandate	   = jouRec.getValue("trandate");
              log.debug({ title: 'subsidiary-',details: subsidiary+', currency-'+currency+', exchangerate-'+exchangerate+', status-'+status+', board='+board });

              var lineParty1, lineParty2;
              var prosedPrty = [];
              var flag = 0;

              var lineCount = jouRec.getLineCount({sublistId : LINE});
         	  var new_journal_ids_by_line = [];
              for (var i = 0; i < lineCount; i++){
                  flag = 0;
                  var line1    	 = jouRec.getSublistValue({sublistId : LINE, fieldId : LINE, line : i});
                  lineParty1   = jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : i});

                  //log.debug({title: 'accountID1-',details: accountID1+', accountType1-'+accountType1+', unit1-'+unit1+', lineParty1-'+lineParty1+', credit1-'+credit1+', debit1-'+debit1+', unitType1-'+unitType1+', relPrtyTyp1-'+relPrtyTyp1+', line1-'+line1});

                  for (var proLoc = 0; proLoc <= prosedPrty.length; proLoc++) {
                      if ((!isNullOrEmpty(lineParty1)) && prosedPrty[proLoc] == lineParty1) {
                          flag = 1;
                      }
                  }

                  if ((!isNullOrEmpty(lineParty1)) && flag == 0) {
                      //FIRST LINE
                      var sameParty = [];
                      sameParty.push(i);

                      for (var j = i + 1; j < lineCount; j++) {
                          //ADDITIONAL LINES
                          log.debug({title: 'lineParty2-',details: lineParty2+', j-'+j});
                          lineParty2    = jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : j});

                          if (lineParty1 == lineParty2 && (!isNullOrEmpty(lineParty2))) {
                              var line2    	 = jouRec.getSublistValue({sublistId : LINE, fieldId : LINE, line : j});
                              log.debug({title: 'lineParty1=lineParty2',details: 'lineParty1='+lineParty1+' ,lineParty2='+lineParty2+' ,i='+i+' ,j='+j+' ,line2='+line2});
                              sameParty.push(j);
                          }// end location if
                      } // end for j
                      prosedPrty.push(lineParty1);

                      // Process the same party
                      var debitSum = 0;
                      var creditSum = 0;
                      for (var k = 0; k < sameParty.length; k++) {
                          var cre = jouRec.getSublistValue({sublistId : LINE, fieldId : CREDIT, line : sameParty[k]});
                          var deb = jouRec.getSublistValue({sublistId : LINE, fieldId : DEBIT, line : sameParty[k]});
                          creditSum = +creditSum + cre;
                          debitSum  = +debitSum + deb;
                          log.debug({title: 'SYS cre-',details:cre+', deb-'+deb});
                      }

                      var newJouID = null;
                      if((creditSum > 0 || debitSum > 0) && (creditSum == debitSum)){
                          log.debug({title: 'SYS IN debitSum-',details: debitSum+', creditSum-'+creditSum});
                          newJouID = createJournalStandard(jouRec, sameParty, jouId, trandate);
                          for (var n = 0; n < sameParty.length; n++) {
                              new_journal_ids_by_line[sameParty[n]]=newJouID;
                              //jouRec.setSublistValue({sublistId : LINE, fieldId : LINELINKEDTRAN, line : sameParty[n], value: newJouID});
                              log.debug({title: 'SYS IN cre-',details:cre+', deb-'+deb+', newJouID-'+newJouID});
                          }
                      }else if((creditSum > 0 || debitSum > 0) && (creditSum != debitSum)){
                          log.debug({title: 'SYS sus debitSum-',details: debitSum+', creditSum-'+creditSum});
                          newJouID = createJournalSuspense(jouRec, sameParty, jouId, trandate);
                          for (var n = 0; n < sameParty.length; n++) {
                              new_journal_ids_by_line[sameParty[n]]=newJouID;
                              //jouRec.setSublistValue({sublistId : LINE, fieldId : LINELINKEDTRAN, line : sameParty[n], value: newJouID});
                              log.debug({title: 'SYS sus cre-',details:cre+', deb-'+deb+', newJouID-'+newJouID});
                          }
                      }
                  }// end flag if
              }

         	//need to re-load it due to record has been changed issues
         	for(var j=0;j<10;j++){
              try{
              var jouRec = record.load({type: record.Type.JOURNAL_ENTRY, id: jouId}); //, isDynamic: true
              var lineCount = jouRec.getLineCount({sublistId : LINE});
              for (var i = 0; i < lineCount; i++){
                  if(new_journal_ids_by_line[i]) jouRec.setSublistValue({ sublistId:LINE, fieldId:LINELINKEDTRAN, line:i, value:new_journal_ids_by_line[i] });
              }
              var iniJouID =  jouRec.save();
              log.debug('WriteBack to Init Journal',"Journal ID="+iniJouID);
              j=10;
              }
              catch(e){
                log.debug("offset writeback id="+jouId,e);
              }
            }
      	}
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, jouId, JSON.stringify(e), runtime.getCurrentUser().id,  "Journal Entry");
    	}
    }
    
	
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} jouRec, sameParty
	 * @returns {String} jouID
	 */
  	//*********************************** CREATE JOURNAL STANDARD ***********************************
	function createJournalStandard(jouRec, sameParty, jouId, trandate){

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

		
		var rSub = null;
		var rSubBnk = null;
		var rSubCur = null;
		var offsetAccountIs = null;
		var currency = jouRec.getValue(CURRENCY);
		var rev_date = jouRec.getValue({ fieldId: "reversaldate" });
        var rev_deferred = jouRec.getValue({ fieldId: "reversaldefer" });
		var rRecord = search.lookupFields({
			type: 'customrecord_cseg_tsa_relatedpar',
			id: jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[0]}),
			columns: ['custrecord_tsa_subsidiary', 'custrecord_tsa_def_bank']
		});
		if((!isNullOrEmpty(rRecord))){
			if((!isNullOrEmpty(rRecord.custrecord_tsa_subsidiary[0])))	rSub = rRecord.custrecord_tsa_subsidiary[0].value;
			if((!isNullOrEmpty(rRecord.custrecord_tsa_def_bank[0])))   rSubBnk = rRecord.custrecord_tsa_def_bank[0].value;
		}
		if((!isNullOrEmpty(rSub))){
			var rSubRecord = search.lookupFields({
				type: search.Type.SUBSIDIARY,
				id: rSub,
				columns: ['currency']
			});
			if(rSubRecord){
				if((!isNullOrEmpty(rSubRecord.currency[0]))) rSubCur = rSubRecord.currency[0].value;
			}
		}
		log.debug({title: 'CreateJournalStandard rSub-',details: rSub+', rSubBnk-'+rSubBnk+', rSubCur-'+rSubCur});
		
		var newJouRec = record.create({
	           type : record.Type.JOURNAL_ENTRY,
	           isDynamic: true 
	       });
		newJouRec.setValue("trandate", trandate);
      	//newJouRec.setValue('trandate', new Date());
		newJouRec.setValue(LINKEDICTRANS, jouId);
		newJouRec.setValue(SUBSIDIARY, rSub);
		newJouRec.setValue(MEMO, jouRec.getValue(MEMO));
		if( jouRec.getValue(BOARD) ) newJouRec.setValue(BOARD, jouRec.getValue(BOARD));
		newJouRec.setValue(DEPRECIATION, false);
	  	
	  	newJouRec.setValue(CURRENCY, currency);
      	newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
		if(rev_date) newJouRec.setValue({ fieldId: "reversaldate", value: rev_date, ignoreFieldChange: false });
		if(rev_deferred) newJouRec.setValue({ fieldId: "reversaldefer", value: rev_deferred, ignoreFieldChange: false });
	  	
		var location_found;
		
		for (var jnl = 0; jnl < sameParty.length; jnl++) {
			var jLine    	 = jouRec.getSublistValue({sublistId : LINE, fieldId : LINE, line : sameParty[jnl]});
			var jLineParty   = jouRec.getSublistText({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[jnl]});
			var jLineParty_value = jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[jnl]}); // added by Viktor S.
			var jLinePay_type = jouRec.getSublistValue({sublistId : LINE, fieldId : "custcol_tsa_acc_iu_pay_type", line : sameParty[jnl]}); // added by Viktor S.
			
			var jAccountID	 = jouRec.getSublistValue({sublistId : LINE, fieldId : ACCOUNT, line : sameParty[jnl]});
			var jAccountType = jouRec.getSublistValue({sublistId : LINE, fieldId : ACCOUNTYPE, line : sameParty[jnl]});
			var jUnit    	 = jouRec.getSublistText({sublistId : LINE, fieldId : UNIT, line : sameParty[jnl]});
			var jUnit_value   = jouRec.getSublistValue({sublistId : LINE, fieldId : UNIT, line : sameParty[jnl]}); // added by Viktor S.
			var jUnitType    = jouRec.getSublistText({sublistId : LINE, fieldId : UNITTYPE, line : sameParty[jnl]});
			var jRelPrtyTyp  = jouRec.getSublistText({sublistId : LINE, fieldId : REALPARTYTYPE, line : sameParty[jnl]});
			var jMemo		 = jouRec.getSublistText({sublistId : LINE, fieldId : MEMO, line : sameParty[jnl]});
			var jDepartment  = jouRec.getSublistValue({sublistId : LINE, fieldId : DEPARTMENT, line : sameParty[jnl]});
			var jCredit		 = jouRec.getSublistValue({sublistId : LINE, fieldId : CREDIT, line : sameParty[jnl]});
			var jDebit		 = jouRec.getSublistValue({sublistId : LINE, fieldId : DEBIT, line : sameParty[jnl]});
			var jUnitElim	 = jouRec.getSublistValue({sublistId : LINE, fieldId : UNITELIM, line : sameParty[jnl]});
			var jDhqElim	 = jouRec.getSublistValue({sublistId : LINE, fieldId : DHQELIM, line : sameParty[jnl]});
			
			var accTyp = jAccountType;

//*** Location Lookup
		if(jnl==0){
			var related_party_id=jLineParty_value;
			var relparty_shared_key;
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

			newJouRec.setValue({ fieldId: "location" , value: location_found});
          	newJouRec.setValue({ fieldId: "custbody_tsa_location_main_jrn" , value: location_found});
		}


	newJouRec.selectNewLine({sublistId : LINE});
          

	/* Income(DR bank) -	Cash, RelParty - custrecord_tsa_def_cash_on_hand
						Bank, RelParty - custrecord_tsa_def_bank
						Undeposited Fund, RelParty - custrecord_tsa_def_cash_on_hand , AccounId=118 149401 Undeposited Funds
				
	   Expense(CR Bank)-	Cash, Undeposited Fund
						Bank, RelParty - custrecord_tsa_def_bank
	*/

//**** Get Bank and Cash account of Related Party ****
			var result_cash;
			var result_bank;

			var customrecord_cseg_tsa_relatedparSearchObj = search.create({
			  type: "customrecord_cseg_tsa_relatedpar",
			  filters:  [ ["internalid","anyof",jLineParty_value], ],
			  columns:  [
				search.createColumn({ name: "custrecord_tsa_def_cash_on_hand", label: "default cash" }),
				search.createColumn({ name: "custrecord_tsa_def_bank", label: "default bank" }),
			  ]
			});
			customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
			  result_cash = result.getValue({ name: "custrecord_tsa_def_cash_on_hand" });
			  result_bank = result.getValue({ name: "custrecord_tsa_def_bank" });
			  log.debug("", "result bank="+result_bank);
			  log.debug("", "result cash="+result_cash);
			});
//**** Get Bank and Cash account of Related Party END ****
	
			if(jAccountID==118 && jDebit && result_cash){ // Undeposited Fund & Income transaction
				// Undeposited Fund, RelParty - custrecord_tsa_def_cash_on_hand , AccounId=118 149401 Undeposited Funds
				newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId   : ACCOUNT, value : result_cash});
				log.debug({title: '333offsetAccountIs-',details: offsetAccountIs+', result_cash='+result_cash+', accTyp-'+accTyp});
			}						
			else if (jAccountType !== '1'){ //it is not a bank account
				log.debug({title: 'jAccountType-',details: jAccountType+', jAccountID-'+jAccountID+', jUnitType-'+jUnitType+', jRelPrtyTyp-'+jRelPrtyTyp+', jUnitElim-'+jUnitElim+', jDhqElim-'+jDhqElim});
				var offsetReturn = getOffsetAccount('Offset', jAccountID, jUnitType, jRelPrtyTyp);
				offsetAccountIs = offsetReturn[0];
				log.debug({title: '111offsetAccountIs-',details: offsetAccountIs+', accTyp-'+accTyp});
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : offsetAccountIs
		            });
			} else {
				var account_x = rSubBnk; // this was the original value 
				if(result_bank) account_x = result_bank; // in case of bank payment type both income and expense kind of transactions are the same
				log.debug('offsetAccountIs (3)',' jDebit='+jDebit+" , jLinePay_type="+jLinePay_type);
				if(jDebit){ // income transaction
					log.debug('offsetAccountIs - jDebit - Income',' jDebit='+jDebit+" , jLinePay_type="+jLinePay_type);
					if(jLinePay_type==1) account_x=result_cash; 
				}
				if(jCredit){ // expense transaction
					log.debug('offsetAccountIs - jCredit - Expense',' jCredit='+jCredit+" , jLinePay_type="+jLinePay_type);
					if(jLinePay_type==1) account_x=118; // Undeposited Fund Account
				}				
				newJouRec.setCurrentSublistValue({ sublistId : LINE, fieldId : ACCOUNT, value : account_x });
				log.debug('offsetAccountIs (4)',"offsetAccountIs="+offsetAccountIs+', account_x='+account_x+', accTyp='+accTyp);
			}

			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : CREDIT,
	                value     :	jDebit
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEBIT,
                value     : jCredit
             });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : MEMO,
	                value     : jMemo
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEPARTMENT,
                value     : jDepartment
             });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : "location",
	                value     :	location_found
	             });						 
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : UNITELIM,
                value     : jUnitElim
             });
			newJouRec.setCurrentSublistValue({ sublistId:LINE, fieldId:DHQELIM, value:jDhqElim });
          

			// #region ******  Call suitelet - Unit lookup ********* //added by Viktor S.
			var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
				params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': jLineParty_value } 
			});		
			var response = https.get({ url: suitletURL });
			log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
			log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
			var line_unit_value=parseInt(response.body);
			// #endregion		 

			// #region ******  Call suitelet - Related Party lookup *********
			var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
				params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': jUnit_value }
			});
			var response = https.get({ url: suitletURL });
			log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
			log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
			var line_party_value=parseInt(response.body);
			// #endregion
		  
			newJouRec.setCurrentSublistValue(LINE, UNIT, line_unit_value, false);
			newJouRec.setCurrentSublistValue(LINE, LINEPARTY2, line_party_value, false);     	
	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, line_party_value);
					 
			/* remarked by Viktor S.
			newJouRec.setCurrentSublistText(LINE, UNIT, jLineParty, false);
			newJouRec.setCurrentSublistText(LINE, LINEPARTY2, jUnit, false);
			
	       	LINEPARTYID = newJouRec.getCurrentSublistValue({ sublistId : LINE, fieldId : LINEPARTY2 });
	       	
	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
			*/
			   
			newJouRec.commitLine({sublistId : LINE});
			   
		}
		var jouID1 =  newJouRec.save();
        log.debug({    
            title: 'journal record created successfully', 
            details: 'New journalId:  ' + jouID1+', LINEPARTYID-'+LINEPARTYID
        });

		return jouID1;
	}
	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} jouRec, sameParty
	 * @returns {String} jouID
	 */
	function createJournalSuspense(jouRec, sameParty, jouId, trandate){

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
      
		var rSub = null;
		var rSubBnk = null;
		var rSubCur = null;
		var offsetAccountIs = null;
		var suspenseAccount = null;
		var currency = jouRec.getValue(CURRENCY);
		var rRecord = search.lookupFields({
			type: 'customrecord_cseg_tsa_relatedpar',
			id: jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[0]}),
			columns: ['custrecord_tsa_subsidiary', 'custrecord_tsa_def_bank']
		});
		log.debug({title: 'rPartyType-',details: jouRec.getSublistText({sublistId : LINE, fieldId : REALPARTYTYPE, line : sameParty[0]})});
		var suspenseReturn = getOffsetSuspense('Suspense', jouRec.getSublistText({sublistId : LINE, fieldId : REALPARTYTYPE, line : sameParty[0]}));
		suspenseAccount = suspenseReturn[0];
		log.debug({title: 'suspenseAccount-',details: suspenseAccount});
		if((!isNullOrEmpty(rRecord))){
			if((!isNullOrEmpty(rRecord.custrecord_tsa_subsidiary[0])))	rSub = rRecord.custrecord_tsa_subsidiary[0].value;
			if((!isNullOrEmpty(rRecord.custrecord_tsa_def_bank[0])))	rSubBnk = rRecord.custrecord_tsa_def_bank[0].value;
		}
		if((!isNullOrEmpty(rSub))){
			var rSubRecord = search.lookupFields({
				type: search.Type.SUBSIDIARY,
				id: rSub,
				columns: ['currency']
			});
			if(rSubRecord){
				rSubCur = rSubRecord.currency[0].value;
			}
		}
		log.debug({title: 'rSub-',details: rSub+', rSubBnk-'+rSubBnk+', rSubCur-'+rSubCur});
		
		var newJouRec = record.create({
	           type : record.Type.JOURNAL_ENTRY,
	           isDynamic: true 
	       });
      	newJouRec.setValue('trandate', trandate);
		//newJouRec.setValue('trandate', new Date());
		newJouRec.setValue(LINKEDICTRANS, jouId);
		newJouRec.setValue(SUBSIDIARY, rSub);
		newJouRec.setValue(MEMO, jouRec.getValue(MEMO));
		newJouRec.setValue(DEPRECIATION, false);
		if( jouRec.getValue(BOARD) ) newJouRec.setValue(BOARD, jouRec.getValue(BOARD));
	  
	  	newJouRec.setValue(CURRENCY, currency);
      	newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
      
		for (var jnl = 0; jnl < sameParty.length; jnl++) {
			
			var jLine    	 = jouRec.getSublistValue({sublistId : LINE, fieldId : LINE, line : sameParty[jnl]});
			var jLineParty   = jouRec.getSublistText({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[jnl]});
			var jLineParty_value = jouRec.getSublistValue({sublistId : LINE, fieldId : LINEPARTY, line : sameParty[jnl]});
			var jAccountID	 = jouRec.getSublistValue({sublistId : LINE, fieldId : ACCOUNT, line : sameParty[jnl]});
			var jAccountType = jouRec.getSublistValue({sublistId : LINE, fieldId : ACCOUNTYPE, line : sameParty[jnl]});
			var jUnit    	 = jouRec.getSublistText({sublistId : LINE, fieldId : UNIT, line : sameParty[jnl]});
			var jUnit_value  = jouRec.getSublistValue({sublistId : LINE, fieldId : UNIT, line : sameParty[jnl]});
			var jUnitType    = jouRec.getSublistText({sublistId : LINE, fieldId : UNITTYPE, line : sameParty[jnl]});
			var jRelPrtyTyp  = jouRec.getSublistText({sublistId : LINE, fieldId : REALPARTYTYPE, line : sameParty[jnl]});
			var jMemo		 = jouRec.getSublistText({sublistId : LINE, fieldId : MEMO, line : sameParty[jnl]});
			var jDepartment  = jouRec.getSublistValue({sublistId : LINE, fieldId : DEPARTMENT, line : sameParty[jnl]});
			var jCredit		 = jouRec.getSublistValue({sublistId : LINE, fieldId : CREDIT, line : sameParty[jnl]});
			var jDebit		 = jouRec.getSublistValue({sublistId : LINE, fieldId : DEBIT, line : sameParty[jnl]});
			var jUnitElim	 = jouRec.getSublistValue({sublistId : LINE, fieldId : UNITELIM, line : sameParty[jnl]});
			var jDhqElim	 = jouRec.getSublistValue({sublistId : LINE, fieldId : DHQELIM, line : sameParty[jnl]});

//*** Location Lookup
		if(jnl==0){
			var related_party_id=jLineParty_value;
			var relparty_shared_key;
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

			newJouRec.setValue({ fieldId: "location" , value: location_found});
          	newJouRec.setValue({ fieldId: "custbody_tsa_location_main_jrn" , value: location_found});
		}
          
          
			newJouRec.selectNewLine({sublistId : LINE});

			if (jAccountType !== '1'){
				
				log.debug("", '1. AccountType='+jAccountType+', jAccountID-'+jAccountID+', jUnitType-'+jUnitType+', jRelPrtyTyp-'+jRelPrtyTyp);
				var offsetReturn = getOffsetAccount('Offset', jAccountID, jUnitType, jRelPrtyTyp);
				
				offsetAccountIs = offsetReturn[0];
				log.debug("", '2. offsetAccountIs='+offsetAccountIs+', jDebit='+jDebit+', jCredit='+jCredit);
				if(!offsetAccountIs || offsetAccountIs==0){ //here01
					vs_lib.createErrorLog(runtime.getCurrentScript().id, jouId, "Missing Offsett account:"+' ,jAccountID='+jAccountID+' ,jUnitType='+jUnitType+' ,jRelPrtyTyp='+jRelPrtyTyp , runtime.getCurrentUser().id,  "Journal Entry");
				}
			
				newJouRec.setCurrentSublistValue({
	               sublistId : LINE,
	               fieldId   : ACCOUNT,
	               value     : offsetAccountIs
	            });
			
			} else {
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : rSubBnk
		            });
				log.debug("", '3. Bank rSubBnk='+rSubBnk+', jDebit='+jDebit+', jCredit='+jCredit);
			}
			/*if (jAccountType == 'Bank'){
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : rSubBnk
		            });
				log.debug({title: 'VVVIf Bank rSubBnk-',details: rSubBnk+', jDebit-'+jDebit+', jCredit-'+jCredit});
				
			} else {
				log.debug({title: 'QQQjAccountType-',details: jAccountType+', jAccountID-'+jAccountID+', jUnitType-'+jUnitType+', jRelPrtyTyp-'+jRelPrtyTyp});
				var offsetReturn = getOffsetAccount('Offset', jAccountID, jUnitType, jRelPrtyTyp);
				offsetAccountIs = offsetReturn[0];
				log.debug({title: 'QQQIf offsetAccountIs-',details: offsetAccountIs+', jDebit-'+jDebit+', jCredit-'+jCredit});
				
				newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : offsetAccountIs
		            });
			}*/
			
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : CREDIT,
	                value     :	jDebit
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEBIT,
                value     : jCredit
             });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : MEMO,
	                value     : jMemo
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEPARTMENT,
                value     : jDepartment
             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : UNITELIM,
                value     : jUnitElim
             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DHQELIM,
                value     : jDhqElim
             });

			
			// #region ******  Call suitelet - Unit lookup ********* //added by Viktor S.
			var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
				params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': jLineParty_value } 
			});		
			var response = https.get({ url: suitletURL });
			log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
			log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
			var line_unit_value=parseInt(response.body);
			// #endregion		 

			// #region ******  Call suitelet - Related Party lookup *********
			var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
				params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': jUnit_value }
			});		
			var response = https.get({ url: suitletURL });
			log.debug("Related_Party_lookup_Call", "response: " + JSON.stringify(response));
			log.debug("Related_Party_lookup_Call", "returned id: " + response.body);
			var line_party_value=parseInt(response.body);
			// #endregion
		  
			newJouRec.setCurrentSublistValue(LINE, UNIT, line_unit_value, false);
			newJouRec.setCurrentSublistValue(LINE, LINEPARTY2, line_party_value, false);     	
	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, line_party_value);
			

			//newJouRec.setCurrentSublistText(LINE, UNIT, jLineParty, false); // Remarked by Viktor S.
			//newJouRec.setCurrentSublistText(LINE, LINEPARTY2, jUnit, false);
	       	//LINEPARTYID = newJouRec.getCurrentSublistValue({ sublistId : LINE, fieldId : LINEPARTY2 }); 
			   

	       	newJouRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
	       	
	       	newJouRec.commitLine({sublistId : LINE});
	       
	       	//ADD SUSPENSE LINE
	       	newJouRec.setCurrentSublistValue({
		               sublistId : LINE,
		               fieldId   : ACCOUNT,
		               value     : suspenseAccount
		            });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : CREDIT,
	                value     :	jCredit
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEBIT,
                value     : jDebit
             });
			newJouRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : MEMO,
	                value     : jMemo
	             });
			newJouRec.setCurrentSublistValue({
                sublistId : LINE,
                fieldId   : DEPARTMENT,
                value     : jDepartment
             });
			newJouRec.setCurrentSublistText(LINE, UNIT, jLineParty, false);
			newJouRec.setCurrentSublistValue(LINE, LINEPARTY, LINEPARTYID);
	       	
	       	newJouRec.commitLine({sublistId : LINE});
	       	
	       	
		}
		var jouID =  newJouRec.save();
        log.debug({    
            title: 'journal record created successfully', 
            details: 'New journalId:  ' + jouID+', LINEPARTYID-'+LINEPARTYID
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
	function getOffsetAccount(formUsage, offsetAccount, unitType, RelPartyType){
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
				      ["custrecord_tsa_ini_gl_account","is",offsetAccount], 
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
			offAccountResult = offAccountSearch.run().getRange({start: 0, end: 1000});
			if(offAccountResult) {
				if( offAccountResult[0] ) offAccount=offAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			}
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
			offAccountResult    = offAccountSearch.run().getRange({start: 0, end: 1000});
			offAccount        = offAccountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			var retVals = [offAccount];
			log.debug({title: 'Suspense 1:', details: offAccount});
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