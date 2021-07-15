/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 *	14/08/2019 Viktor S. 
 *	The beforeload function adds a field to the Item form
	
 *
 
 */
 
define(['N/record', 'N/search', 'N/email', 'N/render', 'N/format', 'N/runtime', 'N/ui/serverWidget', 'N/translation', 'SuiteScripts/vs_lib10.js'],
function(record, search, email, render, format, runtime, serverWidget, translation, vs_lib10) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {
        
		if (context.type == context.UserEventType.DELETE) return;	
		//if (context.type == context.UserEventType.VIEW){
	        //context.form.clientScriptFileId = 299984;//<< SET THIS TO YOUR SCRIPT ID
			//scriptContext.form.clientScriptModulePath = 'SuiteScripts/myClientscript.js';//
		         //var sentby_cheque = currentRecord.getValue({ fieldId: "subsidiary" });
         		 
		//}

		// custitem_tsa_vs_curr_from_subs
		var rec=context.newRecord;
		var itemId = context.newRecord.getValue("id");

		// request.getParameter('custpage_param1') //script parameter
      	var type=rec.type;
		log.debug("","hidePlusButtons started rec.type="+type); 
		
		var subsId = String(rec.getValue("subsidiary")).split(",");
		log.debug("","subs="+subsId);
		
		var currencies = [];
		getSubsData(subsId,currencies);

		currencies.forEach(function(result_cc){
				log.debug("","currencies collected="+result_cc);
		});		
		rec.setValue("custitem_tsa_vs_curr_from_subs",JSON.stringify(currencies));
		
/*		
		for(var i=0;i<200;i++){
			jQuery("#price"+i+"lnk").hide();
		}
				
		currencies.forEach(function(result_cc){
				log.debug("currencies collected="+result_cc);
				jQuery("#price"+result_cc+"lnk").show();
		});
*/
		
//*******************
		function getSubsData(subsId,currencies){
			var subsidiarySearchObj = search.create({
			   type: "subsidiary",
			   filters:
			   [
				  ["internalid","anyof",subsId]
			   ],
			   columns:
			   [
				  search.createColumn({
					 name: "name",
					 sort: search.Sort.ASC,
					 label: "Name"
				  }),
				  search.createColumn({name: "currency", label: "Currency"}),
				  search.createColumn({name: "internalid", label: "id"}),
				  search.createColumn({name: "custrecord_tsa_item_currencies", label: "Item Currencies"})
			   ]
			});
			var searchResultCount = subsidiarySearchObj.runPaged().count;
			log.debug("subsidiarySearchObj result count",searchResultCount);
			subsidiarySearchObj.run().each(function(result){
			   currencies.push(result.getValue("currency"));
			   var id1=result.getValue("internalid");
			   var a=result.getValue("custrecord_tsa_item_currencies");
			   log.debug("","id="+id1+" ,a="+a);
			   var b=a.split(",");
			   b.forEach(function(result_c){
					currencies.push(result_c);
			   });
			   return true;
			});

		}

		var click_text = "";

		var field_text="<script>";
		field_text +="function init2(){";		
		field_text +="console.log(\" currency tab hidding - init2 started\");";		
		field_text +="var currencies=JSON.parse('"+JSON.stringify(currencies)+"');";
		field_text +="for(var i=0;i<200;i++){jQuery('#price'+i+'lnk').hide();}";		
		field_text +="currencies.forEach(function(result_cc){console.log('currencies collected='+result_cc);jQuery('#price'+result_cc+'lnk').show();});}";		
		
//		field_text +="jQuery('#pricingtxt').attr('onclick',\"setTimeout(function(){ init2(); } ,500);if (NS.form.isInited() && NS.form.isValid()) ShowTab('pricing',false); return false;\");";		
		field_text +="setTimeout(function(){ jQuery('#pricingtxt').attr('onclick',\"setTimeout(function(){ init2();} ,50); if(NS.form.isInited() && NS.form.isValid()) ShowTab('pricing',false); return false; \");} ,300);";
		
		field_text +="console.log('!!!finished!!!');";	
		field_text = field_text+"</script>";
		
		
		var inject_field = context.form.addField({
			id: 'custpageinjectcode',
			type: 'INLINEHTML',
			label: 'Inject Code'
		}).defaultValue=field_text;
		
		
		//field_text += "require(['N/currentRecord'], function(currentRecord){ console.log('loaded');";			

		//field_text +="var rec = currentRecord.get();";

		//field_text +="console.log(rec.getValue('custitem_tsa_vs_curr_from_subs'));";



		
		//field_text +="jQuery('#pricingtxt').attr('onclick','');";

		
		//field_text += "init2();console.log('view mode code');";
		//field_text += " })";
	
		

		return true;
    }


    return {
        beforeLoad: beforeLoad
        //afterSubmit: afterSubmit
    };
    
}); 

/*

		var itemSearchObj = search.create({
		   type: "item",
		   filters:
		   [
			  ["internalidnumber","equalto",itemId]
		   ],
		   columns:
		   [
			  search.createColumn({ name: "itemid",sort: search.Sort.ASC,label: "Name"}),
			  search.createColumn({name: "displayname", label: "Display Name"}),
			  search.createColumn({name: "subsidiary", label: "Subsidiary"})
		   ]
		});
		var searchResultCount = itemSearchObj.runPaged().count;
		log.debug("itemSearchObj result count",searchResultCount);
		itemSearchObj.run().each(function(result){
		   
		   var subs=result.getValue("subsidiary");
		   subsId.push(subs);
		   console.log("subs="+subs);
		   return true;
		});

*/
