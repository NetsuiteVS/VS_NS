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
define(['N/https','N/search', 'N/runtime','N/translation'], function(https, search, runtime, translation) {

	var _recordType = "";
	var _translations = {
			NO_MAPPING		: {field : "custbody_wip_error_no_mapping", value : translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_NO_MAPPING', locale: translation.Locale.CURRENT })()},
			VALIDATE_LINES	: {field : "custbody_wip_error_line_validated", value : translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_VALIDATE_LINES', locale: translation.Locale.CURRENT })()},
			MULIPLE_MAPPING : {field : "custbody_wip_error_multiple_mapping", value : translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MULIPLE_MAPPING', locale: translation.Locale.CURRENT })()}
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
    /*
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
    */
  
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
		var recType = scriptContext.currentRecord.type;
      	console.log("*** WIP validate line started ***  recType="+recType);
		if(recType=="purchaseorder"){	return true;}
      	
    	var subs_reserve_journal_creation_enabled = scriptContext.currentRecord.getValue({ fieldId : 'custbody_subs_reserve_journal_setting' });
      	if(subs_reserve_journal_creation_enabled!=true) 
        {
          console.log("Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with YES");
          return beforeReturn(scriptContext, true);
        }
      	
		var currIndex = scriptContext.currentRecord.getCurrentSublistIndex({ sublistId: "line" });
		console.log("Reserve checking: currIndex="+currIndex);
		//if(currIndex>1){return true;}
		
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

    	var is_there_a_reserve = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "custcol_cseg_tsa_fundreserv"
		});

/*    removed due to fixed asset reserve mapping. Mapping has to be checked even with empty Reserve. The account setting could trigger the population of the reserve mapping too.
      	if(!is_there_a_reserve) 
        {
          console.log("There's no reserve in this line - Returning with YES");
          currentRecord.setCurrentSublistValue({
    			sublistId: scriptContext.sublistId,
    			fieldId: "custcol_tsa_wip_mapping",
    			value: ""
    	  });

          return beforeReturn(scriptContext, true);
        }
*/
      
      
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
			console.log("wip check - sublist is expense");
			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "account" });
         	tmp_category = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "category" });
          
			if((!tmp_value || tmp_value=="") && !tmp_category ){
				
				console.log("*** account is empty ***");
				return beforeReturn(scriptContext, true);	
				return true;	
              
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
             		
        if (scriptContext.sublistId == "item") {
			console.log("wip check - sublist is item");
            var itemType = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "custcol_tsa_vs_item_type" });
            if (itemType == '10') {
                console.log("itemTypeValue=" + itemType);
                return beforeReturn(scriptContext, true);
            }

			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : scriptContext.sublistId, fieldId : "item" });
			if(!tmp_value || tmp_value==""){
				return beforeReturn(scriptContext, true);	
                return true;	
			}
		}
		
		console.log("wip check - after expense and item sublist checks");
		
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
    	postObject.custcol_expense_type = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "custcol_expense_type"
		});
		postObject.custcol_income_type = currentRecord.getCurrentSublistValue({
			sublistId : scriptContext.sublistId,
			fieldId : "custcol_income_type"
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
			url : '/app/site/hosting/scriptlet.nl?script=customscript_lm_slet_wip_server_2&deploy=customdeploy_lm_slet_wip_server_2&compid=' + runtime.accountId,
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
				alert(translation.value);
			}
			else{
				alert(objLine.error);
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
		var recType = scriptContext.currentRecord.type;
      	console.log("*** WIP Record Save started ***  recType="+recType);
		if(recType=="purchaseorder"){ return true;}
		
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

      	var subs_reserve_journal_creation_enabled = scriptContext.currentRecord.getValue({ fieldId : 'custbody_subs_reserve_journal_setting' });
      	if(subs_reserve_journal_creation_enabled!=true) 
        {
          console.log("Reserve checking: Subsidiary Reserve Creation and Checking was Disabled - Returning with True");
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
			console.log("*** "+_translations.VALIDATE_LINES.value+" | checked:"+what_was_checked);
			console.log("_transaltions.VALIDATE_LINES="+JSON.stringify(_translations.VALIDATE_LINES) );
			alert(_translations.VALIDATE_LINES.value);
          	// if(scriptContext.currentRecord.id==59499) return true; // just for Void Journal test reason
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
      console.log("onSave wip check: void="+is_void+" source="+source);         
      if((source=="check" || source=="vendpymt" ) && is_void=="T"){ 
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
 			console.log("onSave wip check: sublist="+sublistId);         
          
            if(!checked){
    			throw "Invalid Sublist";
    		}

    		//scriptContext.currentRecord.commitLine({sublistId:sublistId});
    	}
    	return true;
    }

	//******************* FIELD CHANGED ******************* NOT IN USE !!! 02/03/2019 Viktor S.
   function fieldChanged_not_in_use(scriptContext) {
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

    function fieldChanged(scriptContext) {
		
		fieldChanged_all_lines_checked(scriptContext); //merged;
		
		var recType = scriptContext.currentRecord.type;
		
        // ************ Item **********
        if (scriptContext.sublistId == "item" && scriptContext.fieldId == "item") {
            try {
              
		console.log("Default Reserve Script - wip_validation merged:: field change triggered ***  sublist=" + scriptContext.sublistId + " - field=" + scriptContext.fieldId + " - line Number=" + scriptContext.lineNum + " ,recType="+recType);
		if(recType=="cashsale" || recType=="purchaseorder" || recType=="salesorder" || recType=="invoice" || recType=="vendorbill"){			
		}
		else return;
              
                var userObj = runtime.getCurrentUser();
                var user_sub = userObj.subsidiary;
                console.log("*** current user's roleId=" + userObj.roleId + " | user subsidiary=" + user_sub);
                //var subs_to_check = ","+runtime.getCurrentScript().getParameter({name : 'custscript_tsa_ihq_related_subsidiaries'})+",";
                //console.log("*** script parameter (from Company Preferences)=" + subs_to_check+" subs_to_check.indexOf="+subs_to_check.indexOf(","+user_sub+",") );
                //if(subs_to_check.indexOf(","+user_sub+",")==-1) return;  // if current user is not included into the IHQ subsidiaries then return 
                // Subs set at script deployment

                var currentRecord = scriptContext.currentRecord;
                var item = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "item" });
              	var record_subsidiary =  currentRecord.getText({ fieldId: "subsidiary" }).trim();
                console.log("Default Reserve Script -  item=" + item);
                if (!item || item == "") return;

                //var currentscript = runtime.getCurrentScript();

                //ZS-15/08/2019: Get default reserve from custom record
                var customDefaultReserveId;
                var customDefaultReserveValue;
                var customrecord_item_def_reserveSearchObj = search.create({
                    type: "customrecord_item_def_reserve",
                    filters: [["custrecord_item_id", "anyof", item]],
                    columns: [
                        search.createColumn({ name: "custrecord_tsa_ihq_def_reserve2", label: "Default Reserve 2" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })]
                });

                customrecord_item_def_reserveSearchObj.run().each(function (result) {

                    customDefaultReserveId = result.getValue({ name: "custrecord_tsa_ihq_def_reserve2" });;
                    customDefaultReserveValue = result.getText({ name: "custrecord_tsa_ihq_def_reserve2" });
					console.log("Default Reserve :: result="+JSON.stringify(result));
                    return true;
                });
                console.log("reserve id=" + customDefaultReserveId + ", reserve value=" + customDefaultReserveValue);

              try{
                var customrecord_cseg_tsa_fundreservSearchObj = search.create({
                   type: "customrecord_cseg_tsa_fundreserv",
                   filters:
                   [ ["internalid","anyof",customDefaultReserveId] ],
                   columns:
                   [
                      search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name" }),
                      search.createColumn({name: "scriptid", label: "Script ID"}),
                      search.createColumn({name: "name", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Name" }),
                      search.createColumn({name: "subsidiary", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Subsidiary" })
                   ]
                });
                var searchResultCount = customrecord_cseg_tsa_fundreservSearchObj.runPaged().count;
                console.log("customrecord_cseg_tsa_fundreservSearchObj result count="+searchResultCount);
                
                var subsidiary;
                var subs_ok=false;
                customrecord_cseg_tsa_fundreservSearchObj.run().each(function(result){
                  	console.log("customrecord_cseg_tsa_fundreservSearchObj result reserve result="+JSON.stringify(result));
					var unit_subsidiary=result.getValue({ name: 'subsidiary', join: 'CUSTRECORD_CSEG_TSA_FUNDRESERV_N101' }).trim();
					var unit_name=result.getValue({ name: 'name'});
					console.log("customrecord_cseg_tsa_fundreservSearchObj result - unit_subsidiary="+unit_subsidiary+", unit_name="+unit_name );
					if(unit_subsidiary==record_subsidiary) {
						subs_ok=true;
						console.log("customrecord_cseg_tsa_fundreservSearchObj - Reserve's Unit Subsidiary is OK.");
					}
					return true;
                });              
				}
				catch(e){
					log.debug("customrecord_cseg_tsa_fundreservSearchObj ERROR","error:"+e);
				}
                
				if (!subs_ok) console.log("customrecord_cseg_tsa_fundreservSearchObj - Reserve's Unit Subsidiary does NOT match the records subsidiary.");
              	if (customDefaultReserveId && customDefaultReserveId != "" && subs_ok) {

                    console.log("reserve id=" + customDefaultReserveId + ", reserve value=" + customDefaultReserveValue);

                    currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId,  fieldId: "custcol_cseg_tsa_fundreserv",  value: customDefaultReserveId });
                  	currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId,  fieldId: "custcol_vs_test_field",  value: customDefaultReserveId });
                }

                /* Rem:ZS-15/08/2019
                console.log("*** before item lookup");
                var lookup = search.lookupFields({
                    type: "item",
                    id: item,
                    columns: ['custitem_tsa_ihq_def_reserve']
                });
    
                console.log("lookup=" + lookup.custitem_tsa_ihq_def_reserve[0]);
                console.log("*** after item lookup");
    
                if (lookup.custitem_tsa_ihq_def_reserve[0] && lookup.custitem_tsa_ihq_def_reserve[0] != "") {
    
                    console.log("*** before getting value from lookup");
                    var reserve = lookup.custitem_tsa_ihq_def_reserve[0].value;
                    console.log("lookup=" + JSON.stringify(lookup) + " reserve value=" + reserve + " reserve description=" + lookup.custitem_tsa_ihq_def_reserve[0].text);
    
                    currentRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_cseg_tsa_fundreserv",
                        value: reserve
                    });
                }
                */
            }
            catch (e) {
                log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit - Error", 'Message: ' + e);
            }
            finally {
            }
        }
    }

        //#region ****************************** ALL LINES CHECKED - Field Changed ************************************* 

        function fieldChanged_all_lines_checked(scriptContext) { 

            try {
				
				var checkAll = scriptContext.currentRecord.getValue({ fieldId : "custbody_tsa_vs_check_all_res" });
				if(scriptContext.fieldId=="custbody_tsa_vs_check_all_res" && checkAll){
                  	window.scrollTo(0, 0);
                  	//var msg=message.create({ title: "WIP checking Started", message: "Please wait it could take a minute...", type: message.Type.INFORMATION }).show();
                  	window.showAlertBox('alert_info', 'WIP checking Started.', 'Please wait it could take a minute...', NLAlertDialog.TYPE_MEDIUM_PRIORITY);
					console.log("custcol_tsa_wip_checked:: start WIP checking");					
                  	setTimeout(function() { updateTsaWipCheckedForAllSublists(scriptContext);hideAlertBox('alert_info'); }, 200);
					
					//scriptContext.currentRecord.setValue({ fieldId : "custbody_tsa_vs_check_all_res", value: false, ignoreFieldChange: true });
					console.log("custcol_tsa_wip_checked:: Success");
				}
            } catch (e) {

                console.log("custcol_tsa_wip_checked:: Error: " + e);
                log.debug("custcol_tsa_wip_checked::saveRecord", e);

                return false;
            }

            return true;
        }

        //#endregion

        //#region *****************  UPDATE TSA_WIP_CHECKED FOR ALL SUBLISTS  **************************** 

        function updateTsaWipCheckedForAllSublists(scriptContext) {

            var userId = runtime.getCurrentUser().id;
            console.log("custcol_tsa_wip_checked:: userId: " + userId);

            /*
          	if (userId != 4145) {
                console.log("custcol_tsa_wip_checked:: Do not run for this user");
                return true;
            }
			*/
          
            updateTsaWipCheckedForASublist(scriptContext, "item");
            console.log("custcol_tsa_wip_checked:: Item has been checked");

            updateTsaWipCheckedForASublist(scriptContext, "expense");
            console.log("custcol_tsa_wip_checked:: Expense has been checked");

            updateTsaWipCheckedForASublist(scriptContext, "line");
            console.log("custcol_tsa_wip_checked:: Line has been checked");
			
          
            return true;
        }

        //#endregion

        //#region *****************  UPDATE TSA_WIP_CHECKED FOR A SUBLISTS  ****************************

        function updateTsaWipCheckedForASublist(scriptContext, sublistId) {

            var lineCount = scriptContext.currentRecord.getLineCount({ sublistId: sublistId });

            if (lineCount <= 0) {
                console.log("custcol_tsa_wip_checked:: This sublist has no lines: " + sublistId);
                return true;
            }

            //Check if this was a Void of Cheque - no need to check WIP field
            var source = scriptContext.currentRecord.getValue({ fieldId: 'transform' });
            var is_void = scriptContext.currentRecord.getValue({ fieldId: 'void' });
            //console.log("custcol_tsa_wip_checked:: void=" + is_void + " source=" + source);
            if (source == "check" && is_void == "T") {
                //alert("custcol_tsa_wip_checked:: saving");
                return true;
            }

            console.log("custcol_tsa_wip_checked:: Processed sublist= " + sublistId);

            var currentRecord = scriptContext.currentRecord;

            for (var i = 0; i < lineCount; i++) {
				console.log("custcol_tsa_wip_checked:: Processed sublist= " + sublistId + " ,line="+i);
                currentRecord.selectLine({ sublistId: sublistId, line: i });
              	// Actually, we don't need to call the calculation in case of doing this on fieldchange, because the commitLine (below) will trigger the onchange client script.
              	//validateLine(scriptContext,sublistId,i);
                //currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_tsa_wip_checked', value: true, ignoreFieldChange: true });
                currentRecord.commitLine({ sublistId: sublistId });
            }

            return true;
        }

        //#endregion



    return {
//      pageInit: updateTranslations,
    	validateLine: validateLine,
		fieldChanged: fieldChanged,
    	saveRecord: saveRecord
    };
});

