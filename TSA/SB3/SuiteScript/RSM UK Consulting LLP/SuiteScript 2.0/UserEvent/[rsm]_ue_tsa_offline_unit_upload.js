/**********************************************************************************************************
 * Name:			Intracompany Transaction Automation ([rsm]_ue_tsa_offline_unit_upload.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 25/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Validate offline record and mark if any error
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['../../Library.FHL.2.0', 'N/format', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/task','../../../vs_lib'],

function(Library, format, serverWidget, search, record, runtime, task, vs_lib) {
   
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
	
	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var GROUP           = 'custrecord_tsa_ouu_group';
	var SUBSIDIARY      = 'custrecord_tsa_ouu_subsidiary';
	var DEPARTMENT      = 'custrecord_tsa_ouu_department';
	var UNIT	        = 'custrecord_tsa_ouu_unit';
	var PARTY			= 'custrecord_tsa_ouu_rp';
	var PARTYSCRIPTONLY	= 'custrecord_tsa_ouu_rp_script_only';
	var UNITTYPE 		= 'custrecord_tsa_ouu_unit_type';
	var RELPARTYTYPE    = 'custrecord_tsa_ouu_rp_type';
	var CURRENCY        = 'custrecord_tsa_ouu_currency';
	var CREDIT			= 'custrecord_tsa_ouu_credit';
	var DEBIT			= 'custrecord_tsa_ouu_debit';
	var MEMO            = 'custrecord_tsa_ouu_memo';
	var DATE			= 'custrecord_tsa_ouu_date';
	var TRANNAME        = 'custrecord_tsa_ouu_transaction_name';
	var ACCOUNT         = 'custrecord_tsa_ouu_account';
	var PROJECT         = 'custrecord_tsa_ouu_project'
	var RESERVE         = 'custrecord_tsa_ouu_reserve';
	var ERROR           = 'custrecord_tsa_ouu_error';
	var ERRORDESC       = 'custrecord_tsa_ouu_error_desc'
	var PROCESSED       = 'custrecord_tsa_ouu_processed';
	
    function offlineUplodeBeforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function offlineUplodeBeforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function offlineUplodeAfterSubmit(scriptContext) {
    	
      try {
            log.debug('AS scriptContext.type-', scriptContext.type);
            log.debug('AS runtime.executionContext-', runtime.executionContext);

            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                var error = false;
                var errDes = null;
                var glAccount = null;
                var party = null;
                var offRecID = null;
                var defBank = null;
                var offRec = record.load({type:	'customrecord_tsa_ouu_group', id: scriptContext.newRecord.id});
                var account         = offRec.getValue(ACCOUNT);
                var tranName        = offRec.getValue(TRANNAME);
                var debit           = offRec.getValue(DEBIT);
                var credit          = offRec.getValue(CREDIT);


                if(isNullOrEmpty(account)){
                    if(isNullOrEmpty(tranName)){
                        error = true;
                        errDes = 'Please enter values for ACCOUNT & TRANSACTION NAME';
                    }else if(!isNullOrEmpty(tranName) && offRec.getText(TRANNAME) != 'Bank'){
                        var retVals = getAccount(offRec.getText({fieldId : TRANNAME}), 
                                offRec.getText({fieldId : UNITTYPE}), 
                                offRec.getText({fieldId : RELPARTYTYPE}));
                        if(isNullOrEmpty(retVals)){
                            error = true;
                            errDes = 'There is no active UAT record for: '+ offRec.getText(TRANNAME);
                        }else {
                            glAccount = retVals;
                            log.debug('retVals-', retVals);
                        }
                    }

                    if(offRec.getText(TRANNAME) == 'Bank'){

                        var unit = offRec.getValue(UNIT);


                        var uniDefBank = search.lookupFields({
                            type: search.Type.CLASSIFICATION,
                            id: unit,
                            columns: ['custrecord_default_unit_bank_acct']
                        });
                        if(uniDefBank){
                            if((!isNullOrEmpty(uniDefBank.custrecord_default_unit_bank_acct[0])))	defBank = uniDefBank.custrecord_default_unit_bank_acct[0].value;
                        }
                        if(!isNullOrEmpty(defBank)){
                            glAccount = defBank
                        }else{
                            error = true;
                            errDes = 'There is no default Bank Account for this Unit: '+ offRec.getText(UNIT);
                        }
                        log.debug('unit-', unit+', defBank-'+defBank);
                    }
                    offRec.setValue(ACCOUNT, glAccount);
                } //END OF ACCOUNT NULL

                if(isNullOrEmpty(debit) && isNullOrEmpty(credit)){
                    error = true;
                    errDes = errDes +"      Please Enter Amount.";
                } else if(debit == 0 && credit == 0){
                    error = true;
                    errDes = errDes +"      Please Enter Amount.";
                }
                offRec.setValue(ERROR, error);
                offRec.setValue(ERRORDESC, errDes);

                offRecID =  offRec.save();
                log.debug({    
                    title: 'offRecID submitted', 
                    details: 'offRecID:  ' + offRecID
                });
            }
      	}
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, JSON.stringify(e), runtime.getCurrentUser().id, scriptContext.newRecord.type);
    	}
    }
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} tranType, unitType, RelPartyType
	 * @returns {String} account
	 */
	function getAccount(tranType, unitType, RelPartyType)	{
		var accountID		= 0;
		var IcIndicator		= '';
		var accountResult	= null;
		var accountSearch	= null;
		
		try	{
			accountSearch = search.create({
				 type: ACTIVITYTYPE,
				   filters:
				   [
				      ["isinactive","is","F"], 
				      "AND", 
				      ["name","is",tranType]
				   ],
				   columns:
				   [
				      search.createColumn({name: "custrecord_uat_glaccount", label: "GL Account"})
				   ]
				});
			
			/*"AND", 
		      ["formulatext: {custrecord_uat_unittype}","is",unitType], 
		      "AND", 
		      ["formulatext: {custrecord_uat_relatedpartytype}","is",RelPartyType], */
		      
			accountResult    = accountSearch.run().getRange({start: 0, end: 1000});
			accountID        = accountResult[0].getValue({name: 'custrecord_uat_glaccount'});
			log.debug({title: 'accountID 1:', details: accountID});
		}
		catch(e)	{
			Library.errorHandler('getAccount', e);
		}
		return accountID;
	}

    return {
        //beforeLoad: offlineUplodeBeforeLoad,
        //beforeSubmit: offlineUplodeBeforeSubmit,
        afterSubmit: offlineUplodeAfterSubmit
    };
    
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}