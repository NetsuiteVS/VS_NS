/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_unit_related_party_lookup_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check reserve subs vs item subsidiary

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        //#region *************************************  ON REQUEST  *********************************************


        function onRequest(context) {
			
			
		
//******************  MAIN ******************
          
            if (context.request.method == 'GET') {
                
                try {
                    var returnValue = "-1";
                    var SUBS_PRM = context.request.parameters.custscript_subs_prm;
                    var RESERVE_PRM = context.request.parameters.custscript_reserve_prm;

                    log.debug("unit-reserve check:onRequest", "SUBS_PRM=" + SUBS_PRM);
                    log.debug("unit-reserve check:onRequest", "RESERVE_PRM=" + RESERVE_PRM);

                    if (!RESERVE_PRM || RESERVE_PRM.length == 0) {
                        context.response.write(-1);
                    }
					
//**********

                var subsidiary = JSON.parse(SUBS_PRM);
              	//var record_subsidiary = currentRecord.getText({ fieldId: "subsidiary" });
				var customDefaultReserveId = RESERVE_PRM;
                log.debug("Default Reserve Script"," SUBS_PRM="+SUBS_PRM+" ,customDefaultReserveId="+customDefaultReserveId+" , subsidiary="+subsidiary);
				
                //var currentscript = runtime.getCurrentScript();

				try{
				  
					for(var i=0; i<subsidiary.length; i++){
						log.debug("Default Reserve Script","** Cycle - subs check - i="+i+" subsidiary[i]="+subsidiary[i]);
						
						//if(!subs_exists_in_unit) break;				

						var customrecord_cseg_tsa_fundreservSearchObj = search.create({
						   type: "customrecord_cseg_tsa_fundreserv",
						   filters:
						   [ ["internalid","anyof",customDefaultReserveId] ],
						   columns:
						   [
							  search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name" }),
							  search.createColumn({name: "scriptid", label: "Script ID"}),
							  search.createColumn({name: "name", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Name" }),
							  search.createColumn({name: "internalid", join: "CUSTRECORD_CSEG_TSA_FUNDRESERV_N101", label: "Unit Internalid" })
						   ]
						});
						var searchResultCount = customrecord_cseg_tsa_fundreservSearchObj.runPaged().count;
						log.debug("Default Reserve Script"," i="+i+" , result count="+searchResultCount);
						
						var subs_exists_in_unit=false;
						customrecord_cseg_tsa_fundreservSearchObj.run().each(function(result){
							if(!subs_exists_in_unit){
								var unit_internalid=parseInt(result.getValue({ name: 'internalid', join: 'CUSTRECORD_CSEG_TSA_FUNDRESERV_N101' }));
								var unit_name=result.getValue({ name: 'name'});
								log.debug("Default Reserve Script"," i="+i+", result - unit_internalid="+unit_internalid+", unit_name="+unit_name );
								
								//********* Load Record ********
								var unit_record = record.load({ type: "classification", id: unit_internalid , isDynamic: false });
								var unit_subs = unit_record.getValue({ fieldId:'subsidiary' });
								log.debug("Default Reserve Script"," i="+i+", Loaded Unit - unit_subs="+unit_subs);
								
								for(var j=0; j<unit_subs.length; j++){
									if(subsidiary[i]==unit_subs[j]) subs_exists_in_unit=true;
									log.debug("Default Reserve Script"," i="+i+", j="+j+" unit_subs[j]="+unit_subs[j]+" , subs_exists_in_unit="+subs_exists_in_unit);
								}
							}
							return true;
						});
						
						if(!subs_exists_in_unit){
							returnValue = subsidiary[i];
						}
						
					} //for()                              
				}
				catch(e){
					console.log(e);
					log.debug("customrecord_cseg_tsa_fundreservSearchObj ERROR","error:"+e);
				}
					
					
//*********			
					//if(subs_exists_in_unit) returnValue=1;
                    log.debug("unit-reserve check:onRequest", "returnValue=" + returnValue);
					//if(returnValue=="-1") 
						
                    context.response.write(returnValue);
                }
                catch (e) {
                    log.debug("Error", 'Message: ' + e);
                }
                finally {
                }

            }

            if (context.request.method == 'POST') {               
            }
        }

        //#endregion

        return {
            onRequest: onRequest
        };

    });
