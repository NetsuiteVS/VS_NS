/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_unit_related_party_lookup_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Lookup "linked" Unit/Related Party 

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
		
			// #region **** find functions ***			

//****** Find Unit Id from Shared Key *******
        	function find_unit_id_from_shared_key(shared_key){
				var return_result="-1";
                var classificationSearchObj = search.create({
                  type: "classification",
                  filters:
                  [
                    //["internalid","anyof",code],
                    ["custrecord_tsa_iu_shared_key_unit", "is", shared_key]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_unit_id_from_shared_key", "Looked up unit shared_key:"+shared_key);
				
                classificationSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_unit_id_from_shared_key", "unit internalid: " + result.getValue({ name: "internalid" }));
                  return_result = result.getValue({ name: "internalid" });
                  return false;
                });
              	return return_result;
            }

//****** Find Related Party Id from Shared Key *******
        	function find_related_party_id_from_shared_key(shared_key){
				var return_result="-1";
                var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                  type: "customrecord_cseg_tsa_relatedpar",
                  filters:
                  [
                    ["custrecord_tsa_iu_shared_key_rp", "is", shared_key]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_related_party_id_from_shared_key", "Looked up Related Party shared_key:"+shared_key);
                customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_related_party_id_from_shared_key", "Related Party internalid: " + result.getValue({ name: "internalid" }));
                  return_result = result.getValue({ name: "internalid" });
                  return false;
                });
				return return_result;
            }

//******** Find Shared Key of Related Party ********
        	function find_related_party_shared_key(id){
				var return_result="-1";
                var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                  type: "customrecord_cseg_tsa_relatedpar",
                  filters:
                  [
                    ["internalid","anyof",id],
					//["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "custrecord_tsa_iu_shared_key_rp", label: "shared_key" })
                  ]
                });
				
				log.debug("unit_related_party_lookup::find_related_party_shared_key", "Looked up Related Party id:"+id);
				
                customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup:find_related_party_shared_key", "custrecord_tsa_iu_shared_key_rp: " + result.getValue({ name: "custrecord_tsa_iu_shared_key_rp" }));
                  return_result = result.getValue({ name: "custrecord_tsa_iu_shared_key_rp" });
                  return false;
                });
				return return_result;
            }

// ******* Find Shared Key of UNIT *******
        	function find_unit_shared_key(id){
				var return_result="-1";
                var classificationSearchObj = search.create({
                  type: "classification",
                  filters:
                  [
                    ["internalid","anyof",id],
                    //["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "custrecord_tsa_iu_shared_key_unit", label: "shared_key" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_unit_shared_key", "Looked up unit id:"+id);
                classificationSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_unit_shared_key", "custrecord_tsa_iu_shared_key_unit : " + result.getValue({ name: "custrecord_tsa_iu_shared_key_unit" }));
                  return_result = result.getValue({ name: "custrecord_tsa_iu_shared_key_unit" });
                  return false;
                });
              	return return_result;
            }



        	function find_unit_id(name){
				var return_result="-1";
                var classificationSearchObj = search.create({
                  type: "classification",
                  filters:
                  [
                    //["internalid","anyof",code],
                    ["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_unit_id", "Looked up unit name:"+name);
				
                classificationSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_unit_id", "unit internalid: " + result.getValue({ name: "internalid" }));
                  return_result = result.getValue({ name: "internalid" });
                  return false;
                });
              	return return_result;
            }

        	function find_unit_name(id){
				var return_result="-1";
                var classificationSearchObj = search.create({
                  type: "classification",
                  filters:
                  [
                    ["internalid","anyof",id],
                    //["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "name", label: "name" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_unit_name", "Looked up unit id:"+id);
                classificationSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_unit_name", "unit name : " + result.getValue({ name: "name" }));
                  return_result = result.getValue({ name: "name" });
                  return false;
                });
              	return return_result;
            }


        	function find_related_party_id(name){
				var return_result="-1";
                var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                  type: "customrecord_cseg_tsa_relatedpar",
                  filters:
                  [
                    ["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                  ]
                });
				log.debug("unit_related_party_lookup::find_related_party_id", "Looked up Related Party name:"+name);
                customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup::find_related_party_id", "Related Party internalid: " + result.getValue({ name: "internalid" }));
                  return_result = result.getValue({ name: "internalid" });
                  return false;
                });
				return return_result;
            }

        	function find_related_party_name(id){
				var return_result="-1";
                var customrecord_cseg_tsa_relatedparSearchObj = search.create({
                  type: "customrecord_cseg_tsa_relatedpar",
                  filters:
                  [
                    ["internalid","anyof",id],
					//["formulatext: {name}", "is", name]
                  ],
                  columns:
                  [
                    search.createColumn({ name: "name", label: "name" })
                  ]
                });
				
				log.debug("unit_related_party_lookup::find_related_party_name", "Looked up Related Party id:"+id);
				
                customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
                  log.debug("unit_related_party_lookup:find_related_party_name", "Related Party name: " + result.getValue({ name: "name" }));
                  return_result = result.getValue({ name: "name" });
                  return false;
                });
				return return_result;
            }

          
			// #endregion **** find functions ***

//******************  MAIN ******************
          
            if (context.request.method == 'GET') {
                
                try {
                    var returnValue = "-1";
                    var SEARCH_TYPE_PRM = context.request.parameters.custscript_search_type_prm;
                    var ID_PRM = context.request.parameters.custscript_id_prm;

                    log.debug("unit_related_party_lookup::onRequest", "SEARCH_TYPE_PRM: " + SEARCH_TYPE_PRM);
                    log.debug("unit_related_party_lookup::onRequest", "ID_PRM: " + ID_PRM);

                    if (!ID_PRM || ID_PRM.length == 0) {
                        context.response.write(-1);
                    }

                    if (SEARCH_TYPE_PRM.toLowerCase() == "unit") {

						var shared_key=find_related_party_shared_key(ID_PRM);
						log.debug("unit_related_party_lookup::onRequest (1)", "related party shared_key: " + shared_key);
						returnValue = find_unit_id_from_shared_key(shared_key);						
						
						//old matching based on names
						if(returnValue=="-1"){
							var name=find_related_party_name(ID_PRM);
							log.debug("unit_related_party_lookup::onRequest (2)", "related party name: " + name);
							returnValue = find_unit_id(name);
						}
                    }
                    else if (SEARCH_TYPE_PRM.toLowerCase() == "relparty") {
						returnValue = find_related_party_id_from_shared_key( find_unit_shared_key(ID_PRM) );
						//old matching based on names
						if(returnValue=="-1"){
							returnValue = find_related_party_id( find_unit_name(ID_PRM) );
						}
                    }
                    else {
                        throw error.create({
                            name: 'PARAMETER ERROR',
                            message: "custscript_search_type_prm parameter must be on of these two values: Unit, RelParty."
                        });
                    }

                    log.debug("unit_related_party_lookup::onRequest (3)", "returnValue: " + returnValue);
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
