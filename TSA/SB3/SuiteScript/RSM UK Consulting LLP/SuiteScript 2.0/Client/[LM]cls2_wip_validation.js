/****************************************************************************************
 * Name:		SuiteScript 2.0 Client ([LM]cls2_wip_validations.js)
 *
 * Script Type:	Client
 *
 * Version:		2018.010 - Initial Release
 *
 * Author:		RSM
 *
 * Purpose:
 *
 * Script:
 * Deploy:
 *
 * Notes:	18/12/2018 Viktor Schumann - added skipping WIP check in case of  "Void Of Cheque" transactions
 *
 * Libraries:
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/search', 'N/runtime'], function(https, search, runtime) {

	var _recordType = "";
	var _translations = {
			NO_MAPPING		: {field : "custbody_wip_error_no_mapping", value : ""},
			VALIDATE_LINES	: {field : "custbody_wip_error_line_validated", value : ""},
			MULIPLE_MAPPING : {field : "custbody_wip_error_multiple_mapping", value : ""}
	};
	var what_was_checked = "";
  
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2018.010
     */
    function updateTranslations(scriptContext)
    {
    	var objTranslation = null;
    	var field = null;

    	try
    	{
        	for(var key in _translations)
        	{
        		objTranslation = _translations[key];

        		field = scriptContext.currentRecord.getField({
        			fieldId : objTranslation.field
        		});

        		objTranslation.value = field.label;
        	}
    	}
    	catch(e)
    	{
    		console.group("updateTranslations");
    		console.error(e);
    		console.groupEnd();
    	}
    }

	//********  BEFORE RETURN **********
	function beforeReturn(scriptContext, booleanValue){
		scriptContext.currentRecord.setCurrentSublistValue({
			sublistId: scriptContext.sublistId,
			fieldId: "custcol_tsa_wip_checked",
			value: true
		});
		return booleanValue;
	}

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
	 //*****************************  VALIDATE LINE ***************************
    function validateLine(scriptContext) {
		
        console.log("sublist="+scriptContext.sublistId+" | current line="+currentLine);
      
    	var transferComplete = scriptContext.currentRecord.getValue({
    		fieldId : 'custbody_tsa_wip_transfer_complete'
    	});  
		 
    	if(transferComplete){
    		scriptContext.currentRecord.setCurrentSublistValue({
    			sublistId: scriptContext.sublistId,
    			fieldId: "custcol_tsa_wip_mapping",
    			value: ""
    		});
    		return beforeReturn(scriptContext, true);
    	}

    	var postObject = {
    		internalType : scriptContext.currentRecord.getValue({
              fieldId : "ntype"
            })
    	};
    	var currentRecord = scriptContext.currentRecord;
		var currentLine = currentRecord.getCurrentSublistIndex({ sublistId: scriptContext.sublistId });
		//console.log("currentLine="+currentLine);
		
    	if(!_recordType){
    		// Pick up record type from the DOM record title
    		_recordType = document.querySelector("h1.uir-record-type").innerText;
    	}
    	postObject.recordType = _recordType;
		console.log("sublist="+scriptContext.sublistId+" | current line="+currentLine);
		
    	if(["item","expense","line"].indexOf(scriptContext.sublistId) == -1)
    		return beforeReturn(scriptContext,true);
		
		var tmp_value;
    	        var tmp_category;
		if(scriptContext.sublistId=="expense"){
			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
         	tmp_category = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category" });
          
			if((!tmp_value || tmp_value=="") && !tmp_category ){


			//if(!tmp_value || tmp_value==""){
				
				console.log("*** account is empty ***");
				return beforeReturn(scriptContext, true);	
				
				// *** lines for debug and test 
				//currentRecord.selectLine({ sublistId: 'expense', line: currentLine });
				//currentRecord.cancelLine({ sublistId: 'expense' });
				
				//currentRecord.removeLine({ sublistId: 'expense', line: currentLine, ignoreRecalc: true });
				//expense_machine.clearline(true);
				//currentRecord.setCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category", value : 1, ignoreFieldChange: true });
				
				//custcol_nondeductible_account 
				//custcol_tsa_wip_checked 
			}
		}
		
		if(scriptContext.sublistId=="item"){
			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "item" });
			if(!tmp_value || tmp_value==""){
				return beforeReturn(scriptContext, true);	
			}
		}

		
    	postObject.accountId = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "account"
		});
    	postObject.item = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "item"
		});
    	postObject.category = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "category"
		});
    	postObject.reserve = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "custcol_cseg_tsa_fundreserv"
		});
    	postObject.side = (function(){
			if(scriptContext.sublistId != "line") return;
			var amt = currentRecord.getCurrentSublistValue({
				sublistId : scriptContext.sublistId,
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
		
		console.log("postObject="+JSON.stringify(postObject));
		
		var response  = https.post({
			url : '/app/site/hosting/scriptlet.nl?script=customscript_lm_slet_wip_server&deploy=customdeploy_lm_slet_wip_server&compid=' + runtime.accountId,
			body : JSON.stringify(postObject)
		});
		
		console.log(response.body);
		currentRecord.setCurrentSublistValue({
			sublistId: scriptContext.sublistId,
			fieldId: "custcol_tsa_wip_mapping",
			value: ""
		});
		var objLine = JSON.parse(response.body);
		if(objLine.error){
			var translation = _translations[objLine.error];
			if(translation){
				alert("(1) "+translation.value);
			}
			else{
				alert("(2) "+objLine.error);
			}
			return beforeReturn(scriptContext, false);
		}
		else if(objLine.id){
			currentRecord.setCurrentSublistValue({
				sublistId: scriptContext.sublistId,
				fieldId: "custcol_tsa_wip_mapping",
				value: objLine.id
			});
			return beforeReturn(scriptContext, true);
		}
		return beforeReturn(scriptContext, true);
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
	 //*****************************  SAVE RECORD ***************************
    function saveRecord(scriptContext) {
		console.log("*** on Save started ***");
    	var transferComplete = scriptContext.currentRecord.getValue({
    		fieldId : 'custbody_tsa_wip_transfer_complete'
    	});
        scriptContext.currentRecord.setValue({
          fieldId : 'custbody_tsa_wip_mapping_error',
          value : ''
        });
    	if(transferComplete){
    		return true;
    	}
		try {
          	console.log("start WIP checking");
			checkMapping(scriptContext, "item");
          	console.log("checked item");
			checkMapping(scriptContext, "expense");
          	console.log("checked expense");
			checkMapping(scriptContext, "line");
          	console.log("checked line");
		} catch (e) {
			console.error(e);
			//alert(""+_translations.VALIDATE_LINES.value+" | checked:"+what_was_checked);
			alert(""+_translations.VALIDATE_LINES.value);
          	console.log("_transaltions.VALIDATE_LINES="+JSON.stringify(_translations.VALIDATE_LINES) );
    		return false;
		}
    	return true;
    }

    function validateTransactionBody(scriptContext){
    	if(!scriptContext.currentRecord.getSublist("apply")) return;
    	console.log("Apply Sublist Was Found!");
    	var postObject = {
        	internalType : scriptContext.currentRecord.type,
    		recordType : document.querySelector("h1.uir-record-type").innerText
    	}

    	postObject.accountId = scriptContext.currentRecord.getValue({
    		fieldId : "account"
    	});

    	postObject.reserve = scriptContext.currentRecord.getValue({
    		fieldId : "custbody_cseg_tsa_fundreserv"
    	});
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
		
    	var response  = https.post({
			url : '/app/site/hosting/scriptlet.nl?script=customscript_lm_slet_wip_server&deploy=customdeploy_lm_slet_wip_server',
			body : JSON.stringify(postObject)
		});
		console.log(response.body);

		var objLine = JSON.parse(response.body);
		if(objLine.error){
			throw objLine.error;
		}
		else if(objLine.id){
			scriptContext.currentRecord.setValue({
				fieldId: "custbody_tsa_wip_mapping",
				value: objLine.id
			});
		}
    }

    function checkMapping(scriptContext, sublistId){
    	var lc = scriptContext.currentRecord.getLineCount({sublistId:sublistId});
//      	var memo = scriptContext.currentRecord.getValue({fieldId:'memo'});
			if(lc<=0) return true;  // 16/01/2019 by Viktor S.
      
//*********** 07/12/2018 added by Viktor Schumann 
//Check if this was a Void of Cheque - no need to check WIP field
	  var source = scriptContext.currentRecord.getValue({fieldId:'transform'});
      var is_void = scriptContext.currentRecord.getValue({fieldId:'void'});
      console.log("void="+is_void+" source="+source);         
      if(source=="check" && is_void=="T"){
        //alert("saving");
        return true;
      }
      
      console.log("sublist="+sublistId);         
      
    	for(var linenum = 0; linenum < lc; linenum++){
    		//scriptContext.currentRecord.selectLine({sublistId:sublistId, line: linenum});
    		var checked = scriptContext.currentRecord.getSublistValue({
    			sublistId : sublistId,
    			fieldId: "custcol_tsa_wip_checked",
    			line: linenum
    		});
          
  			what_was_checked = sublistId;
 			console.log("sublist="+sublistId);         
          
            if(!checked){
    			throw "Invalid Sublist";
    		}

    		//scriptContext.currentRecord.commitLine({sublistId:sublistId});
    	}
    	return true;
    }

	//******************* FIELD CHANGED ******************* NOT IN USE !!! 02/03/2019 Viktor S.
   function fieldChanged(scriptContext) {
		console.log("*** CLS2 wip - field change triggered - sublist="+scriptContext.sublistId+" - field="+scriptContext.fieldId+" - line Number="+scriptContext.lineNum);

		var currentRecord = scriptContext.currentRecord;
		// console.log(JSON.stringify(currentRecord)); // currentrecord object example: {"id":42138,"type":"purchaseorder","isDynamic":true}
				
		// ******** Expense Line *******
		if(scriptContext.sublistId=="expense" && (scriptContext.fieldId=="custcol_nondeductible_account" || scriptContext.fieldId=="custcol_tsa_wip_checked") ){
			var category = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category" });
			console.log("category="+category);
			if(!category || category==""){
				currentRecord.cancelLine({ sublistId: 'expense' });
			}
/*			
			if(taxcode==taxcode_to_check){
				console.log("expense - checked tax_code=taxcode");
				var account = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
				
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: account //expense_account
				});

			}
			else{
				currentRecord.setCurrentSublistValue({
					sublistId: scriptContext.sublistId,
					fieldId: "custcol_nondeductible_account",
					value: null
				});
			}	
*/			
		}		
		
    }

    return {
    	pageInit: updateTranslations,
    	validateLine: validateLine,
//		fieldChanged: fieldChanged,
    	saveRecord: saveRecord
    };
});

