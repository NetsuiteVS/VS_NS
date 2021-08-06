/**********************************************************************************************************
 * Name:			Create journal ([rsm]_cl_journal.js)
 * 
 * API Version:		2.0
 * 
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'SuiteScripts/vs_lib', 'N/translation', 'N/search', 'N/log', 'N/url', 'N/https'], 			
function(record, vs_lib, translation, search, log, url, https) {
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

        try {
        }
        catch (e) {
            vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.currentRecord.getValue({ fieldId: "id" }), e, runtime.getCurrentUser().id, scriptContext.currentRecord.type);
        }
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(context) {

        var currentRecord = context.currentRecord;
		
		if(context.fieldId=="class" || context.fieldId=="custbody_cseg_tsa_relatedpar"){}
		else{
			return true;
		}
		
        var interunit = currentRecord.getValue("custbody_tsa_inter_unit");
        if (!interunit) {
            console.log("Not creating Offsetting Journal due to custbody_tsa_inter_unit is false");
            return true;
        }

        console.log("Check related Party-unit *** Started *** context=" + JSON.stringify(context));

      	var unit = currentRecord.getValue({fieldId: "class"});
        var tsa_rel_party = currentRecord.getValue({fieldId: "custcol_cseg_tsa_relatedpar"});
		if(unit && tsa_rel_party){}
		else{
			return true;
		}

        console.log("Check related Party-unit - interunit=" + interunit + " ,tsa_rel_party=" + tsa_rel_party);

        if (!tsa_rel_party) {
            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MISSING_RELPARTY', locale: translation.Locale.CURRENT })());
            return false;
        }
      
        //Check RelParty for Unit
        var customrecord_cseg_tsa_relatedparSearchObj = search.create({
          type: "customrecord_cseg_tsa_relatedpar",
          filters:  [ ["internalid","anyof",tsa_rel_party],"AND",
                     ["custrecord_cseg_tsa_relatedpar_n101","anyof",unit]
                    ],
          columns:  [
            search.createColumn({ name: "internalid", label: "internalid" })
          ]
        });
        var rp_unit_ok=false;
        customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
          console.log("Check related Party-unit - related party unit check is ok: "+result.getValue({ name: 'internalid' }));
          rp_unit_ok=true;
        });
		
        if(!rp_unit_ok)	{
          	alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
          	return false;
        }
      
// ******** Check Offsetting Related party and Unit *********
      //Call suitelet - Unit lookup
      var suitletURL = url.resolveScript({ scriptId:'customscript_tsa_unit_rel_party_lookup', deploymentId:'customdeploy_tsa_unit_rel_party_lookup', returnExternalUrl:true, 
                                          params: { 'custscript_search_type_prm':"unit", 'custscript_id_prm':tsa_rel_party } 
                                         });
      var response = https.get({ url: suitletURL });
      console.log("Unit_lookup_Call response: " + JSON.stringify(response));
      console.log("Unit_lookup_Call returned id: " + response.body);
      var offsetting_unit=parseInt(response.body);

      //Call suitelet - Related Party lookup
      var suitletURL = url.resolveScript({ scriptId: 'customscript_tsa_unit_rel_party_lookup', deploymentId: 'customdeploy_tsa_unit_rel_party_lookup',	returnExternalUrl: true, 
                                          params: { 'custscript_search_type_prm': "relparty", 'custscript_id_prm': unit }
                                         });
      var response = https.get({ url: suitletURL });
      console.log("Related_Party_lookup_Call response: " + JSON.stringify(response));
      console.log("Related_Party_lookup_Call returned id: " + response.body);
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
            console.log("related party unit check is ok: "+result.getValue({ name: 'internalid' }));
            rp_unit_ok=true;
          });
          if(!rp_unit_ok){
              alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_OFFS_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
              return false;
          }
      }
      
// ******** End - Check Offsetting Related party and Unit *********
      

        return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(context) {
		
		try
        {	
            var currentRecord = context.currentRecord;			
		}
		catch(e)
		{
			console.log(e);
//        	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
//			Library.errorHandler('fieldChanged', e);
		}
		
    }


    return {
        //pageInit: pageInit,
        fieldChanged: fieldChanged
        //postSourcing: postSourcing
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField
        //validateLine: validateLine
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});