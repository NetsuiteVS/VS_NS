/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_VS_update_offline_upload_ue.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Update Offline Upload custom record.
 * 
 * Date:        12/01/2021
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'N/translation', 'N/file', 'N/url'],
    function (url, record, log, search, runtime, http, https, translation, file, url) {

        //#region ******************************  BEFORE SUBMIT  ************************************* 

        /**
         * Function definition to be triggered before record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type

3 - Please add CSV import validation:
You cannot add a project without a reserve. (This would only happen if above sourcing returns a null value)
Project is valid for the transaction Unit.
Reserve is valid for the transaction Unit.
You cannot add a project activity code without a project.

         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            var newRecord = scriptContext.newRecord;

//            try { 

                log.debug("update_offline_upload::beforeSubmit()", "Started");

                if (scriptContext.type != scriptContext.UserEventType.CREATE
                    && scriptContext.type != scriptContext.UserEventType.XEDIT
                    && scriptContext.type != scriptContext.UserEventType.EDIT) return;

                var EXPENSE = "1";
                var INCOME = "2";
                var INTERUNIT = "3";
                var CASH_PAY_TYPE = "1";

                var unit = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_unit' });
                var relatedParty = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_rp' });
                var incomeOrExpense = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_inc_exp' });
                var iuCategory = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_iu_category' });
                var account = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_account' });
                var bankAccount = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_bank_acc' });
                var payType = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_bank_pay_type' });
                var unitType = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_unit_type' });
                var relatedPartyType = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_rp_type' });
          
                var project = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_project' });
                var reserve = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_reserve' });
                var cost_centre = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_cost_centre' });
                var project_activity_code = newRecord.getValue({ fieldId: 'custrecord_tsa_ouu_pac' });
              
                log.debug("before checks", "relatedParty="+relatedParty+", incomeOrExpense="+incomeOrExpense+", iuCategory="+iuCategory);
                log.debug("before checks", "bankAccount="+bankAccount+", payType="+payType+", unit="+unit+" ,unitType="+unitType+" ,relatedPartyType="+relatedPartyType);
				log.debug("before checks", "project="+project+", reserve="+reserve+" ,cost_centre="+cost_centre+" ,project_activity_code="+project_activity_code);
          		//custrecord_tsa_def_res
          
                if (project_activity_code && !project) {
                    throw new Error("Project has to be selected when Project Activity Code is populated.");
                }

          		//Check Project for Unit
          		if(project){ // check project for unit
                    var customrecord_cseg_tsa_projectSearchObj = search.create({
                      type: "customrecord_cseg_tsa_project",
                      filters:
                      [
						["internalid","anyof",project],
						"AND",
                        ["custrecord_cseg_tsa_project_n101","anyof",unit]
                      ],
                      columns:
                      [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                        search.createColumn({ name: "scriptid", label: "Script ID" }),
                        search.createColumn({ name: "custrecord_tsa_def_res", label: "Default Reserve" })
                      ]
                    });
                    var searchResultCount = customrecord_cseg_tsa_projectSearchObj.runPaged().count;
                  	var unit_not_enabled = true;
                    log.debug("checks 01","Project & Unit check result count="+searchResultCount);
                    customrecord_cseg_tsa_projectSearchObj.run().each(function(result){
                      unit_not_enabled = false;
                      return true;
                    });
                    if(unit_not_enabled){
                      throw new Error("Project is not valid for Unit");
                    }
                }
                 
          		if(!reserve && project){ //Check Project of Reserve
                    var customrecord_cseg_tsa_projectSearchObj = search.create({
                      type: "customrecord_cseg_tsa_project",
                      filters:
                      [
                        ["internalidnumber","equalto",project]
                      ],
                      columns:
                      [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                        search.createColumn({ name: "scriptid", label: "Script ID" }),
                        search.createColumn({ name: "custrecord_tsa_def_res", label: "Default Reserve" })
                      ]
                    });
                    var searchResultCount = customrecord_cseg_tsa_projectSearchObj.runPaged().count;
                    log.debug("checks 02","Project's Reserve result count="+searchResultCount);
                    customrecord_cseg_tsa_projectSearchObj.run().each(function(result){
                      reserve=result.getValue({name:'custrecord_tsa_def_res'});
                      newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_reserve', value: reserve, ignoreFieldChange: true });
                      return true;
                    });
                  if(!reserve){
                    throw new Error("Default Reserve is missing on the Project record.");
                  }
                }

          		if(reserve){ //Check Reserve for Unit
                    var customrecord_cseg_tsa_fundreservSearchObj = search.create({
                       type: "customrecord_cseg_tsa_fundreserv",
                       filters:
                       [
						["internalid","anyof",reserve],
						"AND",					   
                        ["custrecord_cseg_tsa_fundreserv_n101","anyof",unit]
                       ],
                       columns:
                       [
                          search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name" }),
                          search.createColumn({name: "scriptid", label: "Script ID"})
                       ]
                    });
                    var searchResultCount = customrecord_cseg_tsa_fundreservSearchObj.runPaged().count;
                  	var unit_not_enabled = true;
                    log.debug("checks 03","Reserve result count="+searchResultCount);
                    customrecord_cseg_tsa_fundreservSearchObj.run().each(function(result){
                       unit_not_enabled=false;
                       return true;
                    });
                  if(unit_not_enabled){
                    throw new Error("Reserve is not valid for Unit.");
                  }                  
				}          
          

                //Set Usage
                var usage;
                if (relatedParty) { usage=INTERUNIT; }
                else if (incomeOrExpense==EXPENSE) { usage=EXPENSE; }
                else if (incomeOrExpense) { usage=INCOME; }

                if (usage) {
                    newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_usage', value: usage, ignoreFieldChange: true });
                }
                log.debug("update_offline_upload::beforeSubmit()", "usage=" + usage);

                //Set Account
                if (!account){
                    if (iuCategory && usage){
                        var tsaUnitActivityFilters = [
                            ["custrecord_tsa_uat_iu_cat", "anyof", iuCategory],
                            "AND",
                            ["custrecord_uat_formusage", "anyof", usage]
                        ];
                        if (usage==INTERUNIT){
                            if (incomeOrExpense && unitType && relatedPartyType){
                                tsaUnitActivityFilters.push("AND");
                                tsaUnitActivityFilters.push(["custrecord_ic_indicator", "anyof", incomeOrExpense]);
                                tsaUnitActivityFilters.push("AND");
                                tsaUnitActivityFilters.push(["custrecord_uat_unittype", "anyof", unitType]);
                                //tsaUnitActivityFilters.push("AND");
                                //tsaUnitActivityFilters.push(["custrecord_uat_relatedpartytype", "anyof", relatedPartyType]);
                            }
                            else {
                                throw new Error("One or more required field is empty: INCOME/EXPENSE, UNIT TYPE, RELATED PARTY TYPE");
                            }
                        }
                        log.debug("update_offline_upload::beforeSubmit()", "tsaUnitActivityFilters=" + JSON.stringify(tsaUnitActivityFilters));
                        var customrecord_tsa_unit_activity_typesSearchObj = search.create({
                            type: "customrecord_tsa_unit_activity_types",
                            filters: tsaUnitActivityFilters,
                            columns: [search.createColumn({ name: "custrecord_uat_glaccount", label: "GL Account" }),
                                      search.createColumn({ name: "custrecord_uat_relatedpartytype", label: "relatedpartytype" }),
                                      search.createColumn({ name: "internalid", label: "internalid" })
                                     ]
                        });
                      	var searchResultCount = customrecord_tsa_unit_activity_typesSearchObj.runPaged().count;
                        customrecord_tsa_unit_activity_typesSearchObj.run().each(function (result){
                          	var search_rel_party_type = Number(result.getValue({ name: 'custrecord_uat_relatedpartytype' }));
							var int_id = result.getValue({ name: 'internalid' });
                          	log.debug("update_offline_upload::search_result", "internalid="+int_id+", search_rel_party_type="+search_rel_party_type+", searchResultCount="+searchResultCount);
                            if (!account || (account && search_rel_party_type==relatedPartyType) ){
                                account = Number(result.getValue({ name: 'custrecord_uat_glaccount' }));
                                log.debug("update_offline_upload", "account="+account+", internalid="+int_id+", search_rel_party_type="+search_rel_party_type);
                            }
                          	return true;
                        });

                        if (account) {
                            newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_account', value: account, ignoreFieldChange: true });
                            log.debug("update_offline_upload::set the account", "account=" + account);
                        }
                        else {
                            throw new Error("Interunit mapping is missing.");
                        }
                    }
                    else {
                        throw new Error("One or more required field is empty: IU CATEGORY, USAGE");
                    }
                }

                //Set Bank Account
                if (!bankAccount){
                    if (unit){

                        //Find unit's related party (Unit record isn't contains DEFAULT CASH ON HAND field
                        var sharedKey = search.lookupFields({ type: 'classification', id: unit, columns: 'custrecord_tsa_iu_shared_key_unit' });
                        log.debug("update_offline_upload::beforeSubmit()", "sharedKey=" + JSON.stringify(sharedKey));
                        if (sharedKey && sharedKey.custrecord_tsa_iu_shared_key_unit) {

                            var sharedKeyId = Number(sharedKey.custrecord_tsa_iu_shared_key_unit[0].value);
                            log.debug("update_offline_upload::beforeSubmit()", "sharedKeyId=" + sharedKeyId);
                            var unitRelatedParty = search.lookupFields({ type: 'customrecord_tsa_iu_shared_key', id: sharedKeyId, columns: 'custrecord_tsa_iusk_rp_stored' });
                            log.debug("update_offline_upload::beforeSubmit()", "unitRelatedParty=" + JSON.stringify(unitRelatedParty));
                            if (!unitRelatedParty || !unitRelatedParty.custrecord_tsa_iusk_rp_stored) {
                                throw new Error("Following required field is empty: IU SHARED KEY (UNIT).RELATED PARTY");
                            }
                        }
                        else {
                            throw new Error("Following required field is empty: UNIT.IU SHARED KEY (UNIT)");
                        }

                        //Find Bank Account of Unit's Related Party.
                        var defaultBank = search.lookupFields({
                            type: 'customrecord_cseg_tsa_relatedpar', id: Number(unitRelatedParty.custrecord_tsa_iusk_rp_stored[0].value),
                            columns: ['custrecord_tsa_def_cash_on_hand','custrecord_tsa_def_bank']
                        });
                        log.debug("update_offline_upload::beforeSubmit()", "defaultBank=" + JSON.stringify(defaultBank));

                        if (!defaultBank.custrecord_tsa_def_cash_on_hand[0] || !defaultBank.custrecord_tsa_def_bank[0]) {
                            throw new Error("Cash or Bank account on Unit's corresponding Related Party is not populated. Related Party ID=" + unitRelatedParty.custrecord_tsa_iusk_rp_stored[0].value);
                        }

                        if (payType == CASH_PAY_TYPE){
                            newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_bank_acc', value: defaultBank.custrecord_tsa_def_cash_on_hand[0].value, ignoreFieldChange: true });
                            log.debug("update_offline_upload::beforeSubmit()", "defaultBank=" + defaultBank.custrecord_tsa_def_cash_on_hand[0].value);
                        }
                        else{
                            newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_bank_acc', value: defaultBank.custrecord_tsa_def_bank[0].value, ignoreFieldChange: true });
                            log.debug("update_offline_upload::beforeSubmit()", "defaultBank=" + defaultBank.custrecord_tsa_def_bank[0].value);
                        }						
						
                    }
                    else {
                        throw new Error("Following required field is empty: UNIT");
                    }
                }
				
				if(relatedParty){ // in case of interunit
					/* Income(DR bank) -	Cash, RelParty - custrecord_tsa_def_cash_on_hand
										Bank, RelParty - custrecord_tsa_def_bank
										Undeposited Fund, RelParty - custrecord_tsa_def_cash_on_hand , AccounId=118 149401 Undeposited Funds
								
					   Expense(CR Bank)-	Cash, Undeposited Fund
										Bank, RelParty - custrecord_tsa_def_bank
					*/

				//**** Get Bank and Cash account of Related Party ****
							var result_cash;
							var result_bank;
							
                  			//Check RelParty for Unit
							var customrecord_cseg_tsa_relatedparSearchObj = search.create({
							  type: "customrecord_cseg_tsa_relatedpar",
							  filters:  [ ["internalid","anyof",relatedParty],"AND",
                                          ["custrecord_cseg_tsa_relatedpar_n101","anyof",unit]
                                        ],
							  columns:  [
								search.createColumn({ name: "internalid", label: "internalid" })
							  ]
							});
                  			var rp_unit_ok=false;
							customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                              rp_unit_ok=true;
							});
							if(!rp_unit_ok) throw new Error("Related Party is not available for the selected Unit.");

						// ******** Check Offsetting Related party and Unit *********
							  //Call suitelet - Unit lookup
							  var suitletURL = url.resolveScript({ scriptId:'customscript_tsa_unit_rel_party_lookup', deploymentId:'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl:true, 
																  params: { 'custscript_search_type_prm':"unit", 'custscript_id_prm':tsa_rel_party } 
																 });
							  var response = https.get({ url: suitletURL });
							  log.debug("","Unit_lookup_Call response: " + JSON.stringify(response));
							  log.debug("","Unit_lookup_Call returned id: " + response.body);
							  var offsetting_unit=parseInt(response.body);

							  //Call suitelet - Related Party lookup
							  var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
																  params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': unit }
																 });
							  var response = https.get({ url: suitletURL });
							  log.debug("","Related_Party_lookup_Call response: " + JSON.stringify(response));
							  log.debug("","Related_Party_lookup_Call returned id: " + response.body);
							  var offsetting_relparty=parseInt(response.body);
							  
							  //Check RelParty for Unit
							  if(offsetting_relparty && offsetting_unit){
								  var customrecord_cseg_tsa_relatedparSearchObj = search.create({
									type: "customrecord_cseg_tsa_relatedpar",
									filters:  [ ["internalid","anyof",offsetting_relparty],"AND",
											   ["custrecord_cseg_tsa_relatedpar_n101","anyof",offsetting_unit]
											  ],
									columns:  [
									  search.createColumn({ name: "internalid", label: "internalid" })
									]
								  });
								  var rp_unit_ok=false;
								  customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
									log.debug("","related party unit check is ok: "+result.getValue({ name: 'internalid' }));
									rp_unit_ok=true;
								  });
								  if(!rp_unit_ok){
									  throw new Error(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_OFFS_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
									  return false;
								  }
							  }
							  
						// ******** End - Check Offsetting Related party and Unit *********
                  
                  			//Check RelParty for default bank and cash accounts
							var customrecord_cseg_tsa_relatedparSearchObj = search.create({
							  type: "customrecord_cseg_tsa_relatedpar",
							  filters:  [ ["internalid","anyof",relatedParty] ],
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
							if(!result_cash || !result_bank) throw new Error("Cash or Bank account on Related Party is not populated.");							
					//**** Get Bank and Cash account of Related Party END ****

							if (payType == CASH_PAY_TYPE){
								newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_offset_bank', value: result_cash, ignoreFieldChange: true });								
								log.debug("update_offline_upload::beforeSubmit()", "offset cash=" + result_cash);
							}
							else{
								newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_offset_bank', value: result_bank, ignoreFieldChange: true });								
								log.debug("update_offline_upload::beforeSubmit()", "offset bank=" + result_bank);								
							}						
					
							var offsetReturn = getOffsetAccount('Offset', account, unitType, relatedPartyType);								
							var offsetAccountIs = offsetReturn[0];
							log.debug({title: '',details: 'offsetAccountIs='+offsetReturn[0]});
							if(!offsetAccountIs) throw new Error("Offset Account mapping is missing.");
							newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_offset_account', value: offsetAccountIs, ignoreFieldChange: true });									
				}

                log.debug("update_offline_upload::beforeSubmit()", "Finished");

                return true;
/*            }
            catch (e) {
                newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_error', value: true, ignoreFieldChange: true });
                newRecord.setValue({ fieldId: 'custrecord_tsa_ouu_error_desc', value: e.message, ignoreFieldChange: true });
                log.debug("update_offline_upload::beforeSubmit() - ERROR", e.message);
            }
            finally {
            }
*/
            return true;
        }
        //#endregion

		function getOffsetAccount(formUsage, account, unitType, RelPartyType){
			var offAccount		= 0;
			var offAccountResult	= null;
			var offAccountSearch	= null;
			try	{
				log.debug({title: 'Offset Account lookup', details: "formUsage="+formUsage+", account="+account+", unitType="+unitType+", RelPartyType="+RelPartyType });
				offAccountSearch = search.create({
					type: "customrecord_tsa_unit_activity_types",
					   filters:
					   [
						  ["isinactive","is","F"], 
						  "AND", 
						  ["formulatext: {custrecord_uat_formusage}","is",formUsage], 
						  "AND", 
						  ["custrecord_tsa_ini_gl_account","is",account], 
						  "AND", 
						  ["custrecord_uat_unittype","is",unitType], 
						  "AND", 
						  ["custrecord_uat_relatedpartytype","is",RelPartyType]
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
				log.error('getOffsetAccount', e);
			}

			return retVals;
		}
		

        return {
            beforeSubmit: beforeSubmit
        };

    });
