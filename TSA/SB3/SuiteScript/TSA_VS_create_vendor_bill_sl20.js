/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_create_vendor_bill_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Create vendor bill from invoice
 * 
 * Date:        16/10/2019
  * Parameters:
 * NAME                                         ID                                      TYPE                                    DESCRIPTION
 * Invoice ID	                    custscript_invoice_id	                 Integer Number
 ****************************************************************************************/



/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/runtime', 'N/task', 'N/url', 'N/http', 'N/https', 'SuiteScripts/vs_lib'],

    function (format, serverWidget, search, record, runtime, task, url, http, https, vs_lib) {

        var SUBSIDIARY = 'subsidiary';
        var DEPARTMENT = 'department';
        var LOCATION = 'location';
        var UNIT = 'class';
        var PARTY = 'custbody_cseg_tsa_relatedpar';
        var UNITTYPE = 'custbody_unit_type';
        var RELPARTYTYPE = 'custbody_rp_type';
        var CURRENCY = 'currency';
        var EXRATE = 'exchangerate';
        var STATUS = 'transtatus';
        var MEMO = 'memo';
        var LINE = 'item';
        var ITEM = 'item';
        var QTY = 'quantity';
        var RATE = 'rate';
        var AMOUNT = 'amount';
        var ENTITY = 'entity'
        var TRANDATE = 'trandate';
        var UNITDIVISION = 'custbody_rsm_uni_division';
        var PARTYDIVISION = 'custbody_rsm_rp_division';
        var RELPARTYSUB = 'custbody_rp_sub';
        var OFFSETENTITY = 'custbody_offset_entity';
        var RPLOCATION = 'custbody_rp_location';
        var SUBELIMIUNIT = 'custbody_trans_unit_sub_elim_unit';
        var LINKEDICTRANS = 'custbody_linked_ic_trans';
        var BOARD = 'custbodytsa_internalfund';
        var TRANID = 'tranid';
        var UNITEXCL = 'custcol_unit_excl';
        var DHQEXCL = 'custcol_dhq_excl';
        var LINUNITDIV = 'custcol_rsm_uni_division';
        var LINPARTYDIV = 'custcol_rsm_rp_division';

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(scriptContext) {

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
			

            //#region ******************************  GET  ************************************* 

            if (scriptContext.request.method == 'GET') {
                try {

                    log.debug("create_vendor_bill::GET", "STARTED");

                    var request = scriptContext.request;
                    var invoiceId = request.parameters.custscript_invoice_id;
                    //if(!invoiceId) invoiceId=317367; // test id
                  
                    log.debug('create_vendor_bill::GET',"create_vendor_bill::GET invoiceId= " + invoiceId);
                    var vendorBillId;
                    var invRec = record.load({ type: record.Type.INVOICE, id: invoiceId });

					var discount_rate = invRec.getText("discountrate");
                  	var total = invRec.getValue("subtotal");
					var discount_percent = 0.00;
					var discount_amount = 0.00;
					if(discount_rate.indexOf("%")>0){
						discount_percent = parseFloat( discount_rate.substring(0,discount_rate.indexOf("%")) );
					}
					
					if(discount_rate && discount_rate.indexOf("%")==-1){ // but 
						discount_amount = parseFloat( discount_rate);
                      	discount_percent = parseFloat((discount_amount/total)*100); //.toFixed(2);
					}
					
                    var mSub = invRec.getValue(SUBSIDIARY);
                    var mdepartment = invRec.getValue(DEPARTMENT);
                    var mRelPar = invRec.getText(PARTY);
                    var mRelPar_value = parseInt(invRec.getValue({ fieldId: PARTY })); // added by VS

//**** get related Party shared key 		
						var relparty = mRelPar_value;
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
						}
//**** get related Party shared key - end
					
                    var mUnit = invRec.getText(UNIT);
                    var mUnit_value = parseInt(invRec.getValue({ fieldId: UNIT })); // added by VS

                    var mCurrency = invRec.getValue(CURRENCY);
                    var mMemo = invRec.getValue(MEMO);
                  	var trandate = invRec.getValue("trandate");
                    var billRecID = null;

                    var rLocation = invRec.getValue(RPLOCATION);
                    var rEntity = invRec.getValue(OFFSETENTITY);
                  	var rOffsettingEntitySub = invRec.getValue("custbody_tsa_offsetting_subs");
                  
                    log.debug('create_vendor_bill::GET','Body mSub-' + mSub + ', mRelPar-' + mRelPar + ', mUnit-' + mUnit + ', mCurrency-' + mCurrency + " | Unit Value:" + JSON.stringify(mUnit_value) + " | relParty Value:" + JSON.stringify(mRelPar_value)+", rOffsettingEntitySub="+rOffsettingEntitySub);
                  
                    var rSubEliUnit = invRec.getValue(SUBELIMIUNIT);
                    var rSub = invRec.getValue(RELPARTYSUB);
                    var rSubCur = null;
                    var rSubRecord = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: rSub,
                        columns: ['currency']
                    });
                    if (rSubRecord) {
                        rSubCur = rSubRecord.currency[0].value;
                    }

                    var unit_entity = search.lookupFields({
                        type: "classification",
                        id: mUnit_value,
                        columns: ['custrecord_tsa_offsetting_entity']
                    });
					var uEntity;
                    if (unit_entity) {
                        uEntity = unit_entity.custrecord_tsa_offsetting_entity[0].value;
                    }

                    var billRec = record.create({
                        type: record.Type.VENDOR_BILL,
                        isDynamic: true
                    });
                  
                  	//billRec.setValue(SUBSIDIARY, rSub); //  rOffsettingEntitySub
                  
					if(uEntity){ billRec.setValue(ENTITY, uEntity); }
					else{
						//billRec.setValue(ENTITY, rEntity);
                        log.error({
                            title: "Error",
                            details: "Offsetting Entity is missing from Unit:"+mUnit_value
                        });
                        vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, e, runtime.getCurrentUser().id, scriptContext.newRecord.type); 
					}
					
                    billRec.setValue(SUBSIDIARY, rSub); //  rOffsettingEntitySub
					billRec.setValue({ fieldId: "location" , value: location_found});
                  	billRec.setValue(TRANDATE, trandate);
                    billRec.setValue(DEPARTMENT, mdepartment);
                    billRec.setValue(MEMO, mMemo);
                  	billRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
                    //billRec.setValue(BOARD, 5);
                    billRec.setValue(TRANID, invRec.getValue(TRANID));
                    //log.debug('Bill Rec', "Entity"+rEntity+" Subs:"+rSub+" Dep:"+mdepartment);
                  
                    /*if (rSubCur != mCurrency){
                        billRec.setValue(CURRENCY, rSubCur);
                    }*/
                    billRec.setValue(CURRENCY, mCurrency);
                    //{ fieldId: "custbody_tsa_vs_account_list_storage", value: json_result, ignoreFieldChange: true, fireSlavingSync: false }
                    //billRec.setValue({ fieldId: UNIT, value: mRelPar_value });
                    //billRec.setValue({ fieldId: PARTY, value: mUnit_value });

                    // #region ******  Call suitelet - Unit lookup *********
                    var suitletURL = url.resolveScript({
                        scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl: true,
                        params: { 'custscript_search_type_prm': "unit", 'custscript_id_prm': mRelPar_value }
                    });
                    var response = https.get({ url: suitletURL });
                    log.debug('create_vendor_bill::GET',"Related_Party_lookup_Call response: " + JSON.stringify(response));
                    log.debug('create_vendor_bill::GET',"Related_Party_lookup_Call returned id: " + response.body);
                    billRec.setValue(UNIT, parseInt(response.body));
                    // #endregion		 

                    // #region ******  Call suitelet - Related Party lookup *********
                    var suitletURL = url.resolveScript({
                        scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl: true,
                        params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': mUnit_value } //"3KYA THQ : DIV : Coast : COR : Changamwe"
                    });
                    var response = https.get({ url: suitletURL });
                    log.debug('create_vendor_bill::GET',"Related_Party_lookup_Call response: " + JSON.stringify(response));
                    log.debug('create_vendor_bill::GET',"Related_Party_lookup_Call returned id: " + response.body);
                    billRec.setValue({ fieldId: PARTY, value: parseInt(response.body) });
                    // #endregion

                    /*
                        billRec.setText(PARTY, mUnit);
                            billRec.setText(UNIT, mRelPar);
                              */


                    for (var i = 0; i < invRec.getLineCount({ sublistId: LINE }); i++) {
                        var item = invRec.getSublistValue({ sublistId: LINE, fieldId: ITEM, line: i });
                        var qty = invRec.getSublistValue({ sublistId: LINE, fieldId: QTY, line: i });
                        var rate = invRec.getSublistValue({ sublistId: LINE, fieldId: RATE, line: i });
						rate = rate*(1+discount_percent/100); // discount is negative hence the "+"
						rate = rate.toFixed(2);
                        var amount = invRec.getSublistValue({ sublistId: LINE, fieldId: AMOUNT, line: i });
						amount = amount*(1+discount_percent/100); // discount is negative hence the "+"
						amount = amount.toFixed(2);
						
                        log.debug('create_vendor_bill::GET', 'Line item-' + item + ', qty-' + qty+" , rate="+rate+" , amount="+amount);

                        billRec.selectNewLine({ sublistId: LINE });
                        billRec.setCurrentSublistValue({
                            sublistId: LINE,
                            fieldId: ITEM,
                            value: item
                        });
                        billRec.setCurrentSublistValue({
                            sublistId: LINE,
                            fieldId: QTY,
                            value: qty
                        });
                        billRec.setCurrentSublistValue({
                            sublistId: LINE,
                            fieldId: RATE,
                            value: rate
                        });
                        billRec.setCurrentSublistValue({
                            sublistId: LINE,
                            fieldId: AMOUNT,
                            value: amount
                        });
                        billRec.setCurrentSublistValue({
                            sublistId: LINE,
                            fieldId: LOCATION,
                            value: rLocation
                        });
                        billRec.commitLine({ sublistId: LINE });
                    }

                    try {
                        billRec.setValue(LINKEDICTRANS, invRec.id);
                        billRecID = billRec.save();
                        log.debug('create_vendor_bill::GET', 'Bill created successfully. New billRecID= ' + parseInt(billRecID));
                      	if(billRecID && billRecID>0){
                          	var id = record.submitFields({ type: record.Type.INVOICE, id: invRec.id, 
                                            values: { custbody_linked_ic_trans: billRecID },  options: { enableSourcing: false, ignoreMandatoryFields : true } });
/*
                            var invRec = record.load({ type: record.Type.INVOICE, id:invoiceId, isDynamic: false });
                          	//invRec.setValue({ custbody_linked_ic_trans: billRecID });
                          	invRec.setValue({ fieldId:"custbody_linked_ic_trans", value:billRecID });
                          	invRec.save();*/
                        }
                    } catch (e) {
                        log.error({
                            title: e.name,
                            details: e.message
                        });
                        vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.newRecord.id, e, runtime.getCurrentUser().id, scriptContext.newRecord.type);
                    }

                    var returnValue = JSON.stringify({ 'billId': parseInt(billRecID) });

                    scriptContext.response.write(returnValue);
                }
                catch (e) {
                    log.debug("create_vendor_bill::GET - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

        }

        return {
            onRequest: onRequest
        };

    });
