/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
 
 /*
	19/12/2018 - Viktor Schumann
	
	1. Client Scripts to populate fields in case of called from Advance (pressed Create Expense button)
	2. Source Advance Balance from Advance record, custbody_tsa_ioubal. (can't source it)
 
 */
 
define(['N/url', 'N/record', 'N/log', 'N/runtime','N/currentRecord', 'N/search', 'N/http' , 'N/https', 'SuiteScripts/vs_lib.js', 'N/translation'],
  function(url, record, log, runtime, currentRecord, search, http, https, vs_lib, translation) {

  /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */	
	function parse_query_string(query) {
	  var vars = query.split("&");
	  var query_string = {};
	  for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		var key = decodeURIComponent(pair[0]);
		var value = decodeURIComponent(pair[1]);
		// If first entry with this name
		if (typeof query_string[key] === "undefined") {
		  query_string[key] = decodeURIComponent(value);
		  // If second entry with this name
		} else if (typeof query_string[key] === "string") {
		  var arr = [query_string[key], decodeURIComponent(value)];
		  query_string[key] = arr;
		  // If third or later entry with this name
		} else {
		  query_string[key].push(decodeURIComponent(value));
		}
	  }
	  return query_string;
	}
  
  function isnull(value,returnValue){
	if(!value)
	{
		return returnValue;
	}
	return value;
  }

	
//******************************** PAGE INIT 
	function pageInit(context) {

		//if (vs_lib.userSubsidiaryIsIHQ()) return true;
		
		//var rec=context.currentRecord;
		//var id=rec.getValue("id");
		var expense_record=currentRecord.get();
		
		console.log( "context.currentRecord="+JSON.stringify(context.request) ); 
				
		var query = window.location.search.substring(1);
		var qs = parse_query_string(query);
		console.log( "qs="+JSON.stringify(qs) ); 



		//********** Test Suitelet call
     	/*
		try{
			console.timeStamp();
          	
			var suiteUrl="https://forms.eu1.netsuite.com/app/site/hosting/scriptlet.nl?script=438&deploy=1&compid=825746_SB3&h=6cbbb9fc627ab96af6ce";
			var response = https.get({ url: suiteUrl });
			var body=JSON.parse(response.body);
			console.log( "response="+body.value );
			expense_record.setValue({ fieldId: 'custbody_tsa_vs_test_field_2', value: body.value, ignoreFieldChange: true, fireSlavingSync: true });
          
			console.timeStamp();
			//custbody_tsa_vs_test_field_2
		}
		catch(e){
		}
        */
		
		if ( !qs.adv && qs.adv!="") {
			console.log(" missing Advance parameter - not called from Advance");
			return true;
		}

		/*
		var adv_data = search.lookupFields({
			type: "customtransaction_tsa_iou2",
			id: parseInt(qs.adv),
			columns: ["custbody_tsa_iouemp","custbody_tsa_advareason","total","currency","department","class","custbodytsa_internalfund","custbody_tsa_ioubal"]
		});
		*/
		
		var adv_rec = record.load({ type: 'customtransaction_tsa_iou2', id: qs.adv , isDynamic: false });
		//console.log("Advance record"+JSON.stringify(adv_rec));
		var adv_rec_balance = adv_rec.getValue("custbody_tsa_ioubal");
		var adv_rec_total = adv_rec.getValue("total");
		var adv_emp	= adv_rec.getValue("custbody_tsa_iouemp"); 
		var adv_reason= adv_rec.getValue("custbody_tsa_advareason"); // on Expense report: Purpose/memo field
		//var adv_total= adv_data["total"]; // Amount
		//var adv_tsaioubal= adv_rec.getValue("custbody_tsa_ioubal");
		var adv_currency= adv_rec.getValue("currency");
		var adv_department= adv_rec.getValue("department");
		var adv_class= adv_rec.getValue("class");
		var adv_tsaboard= adv_rec.getValue("custbodytsa_internalfund");

		console.log("***** Advance balance="+adv_rec_balance+" advance total="+adv_rec_total);			
		/*
		if(adv_rec_total>0){
			expense_record.setValue({ fieldId: 'custbody_tsa_ioutotal', value: adv_rec_total, ignoreFieldChange: true, fireSlavingSync: false });
		}
		*/
		if(adv_rec_balance>0){
			expense_record.setValue({ fieldId: 'custbody_tsa_ioutotal', value: adv_rec_balance, ignoreFieldChange: true, fireSlavingSync: false });
          	console.log("***** page init | SET Advance balance="+adv_rec_balance);	
		}
		
		//var entity=adv_rec.getValue("custbody_tsa_iouemp");
		//+" advance entity="+entity
		
		
		/*
		// ********* data from saved search
		var adv_emp	=	adv_data["custbody_tsa_iouemp"][0].value; 
		var adv_reason= adv_data["custbody_tsa_advareason"]; // on Expense report: Purpose/memo field
		var adv_total= adv_data["total"]; // Amount
		var adv_currency= adv_data["currency"][0].value;
		var adv_department= adv_data["department"][0].value;
		var adv_class= adv_data["class"][0].value;
		var adv_tsaboard= adv_data["custbodytsa_internalfund"][0].value;
		var adv_tsaioubal= adv_data["custbody_tsa_ioubal"][0].value;
		console.log("******** custbody_tsa_ioubal="+adv_tsaioubal);
		*/
		
		
		console.log( "context mode="+context.mode); //+" adv_data="+JSON.stringify(adv_data)+"  emp="+adv_emp);
		//adv_data={"custbody_tsa_iouemp":[{"value":"980","text":"Abel Osoro"}]}
		console.log("form="+context.form);
		
		expense_record.setValue({ fieldId: 'entity', value: adv_emp, ignoreFieldChange: false, fireSlavingSync: true });
		expense_record.setValue({ fieldId: 'department', value: adv_department, ignoreFieldChange: false, fireSlavingSync: true });
		expense_record.setValue({ fieldId: 'class', value: adv_class, ignoreFieldChange: false, fireSlavingSync: true });
		expense_record.setValue({ fieldId: 'custbodytsa_internalfund', value: adv_tsaboard, ignoreFieldChange: false, fireSlavingSync: true });
		expense_record.setValue({ fieldId: 'custbody22', value: parseInt(qs.adv), ignoreFieldChange: false, fireSlavingSync: true }); // custbody22=advance number - on expense
		expense_record.setValue({ fieldId: 'memo', value: adv_reason, ignoreFieldChange: true, fireSlavingSync: false });
		//expense_record.setValue({ fieldId: 'custbody_tsa_vs_iou_total_orig_curr', value: adv_reason, ignoreFieldChange: true, fireSlavingSync: false });
		
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
  //********************** FIELD CHANGED *********************
	function  fieldChanged(context) {
		
		//if (vs_lib.userSubsidiaryIsIHQ()) return true;
		
		//console.log("field id="+context.fieldId);
		var expense_record=currentRecord.get();
		var amount=isnull(expense_record.getCurrentSublistValue({ sublistId: "expense", fieldId: "amount"}),0);
		var foreignamount=isnull(expense_record.getCurrentSublistValue({ sublistId: "expense", fieldId: "foreignamount"}),0);
		var exchangerate=isnull(expense_record.getCurrentSublistValue({ sublistId: "expense", fieldId: "exchangerate"}),0);
		console.log("foreignamount="+foreignamount+" ,amount="+amount+" ,exchangerate="+exchangerate);
		
		if(context.fieldId=="foreignamount" && amount!=0 && exchangerate!=0){
			var calc_amount=foreignamount*exchangerate;
			expense_record.setCurrentSublistValue({	sublistId: "expense", fieldId: "amount", value: calc_amount, ignoreFieldChange: false	});
		}
		
		
		if(context.fieldId=="custbody22" || context.fieldId=="custbody_tsa_iou_currency"){     // Advance id,  currency rate
           	console.log("field id="+context.fieldId);
			var query = window.location.search.substring(1);
			var qs = parse_query_string(query);	
			
			//var expense_record=currentRecord.get();
			var adv_id=isnull(expense_record.getValue({ fieldId: 'custbody22'}),0); // Advance id
          	
			var adv_rec_balance=expense_record.getValue({ fieldId: 'custbody_tsa_ioutotal'}); // Advance id;
			
          	console.log("qs.adv="+qs.adv+" | adv_id="+adv_id);
			// Advance field should be changed only in case of an Expense not called from Advance record, when "adv" parameter exist in query string
			// Otherwise we don't want to slow down the form
          
			if(adv_id>0){			
							
				var adv_rec = record.load({ type: 'customtransaction_tsa_iou2', id: adv_id , isDynamic: false });
				console.log("Advance record loaded");  //+JSON.stringify(adv_rec));
				var adv_rec_balance = isnull(adv_rec.getValue("custbody_tsa_ioubal"),0);
				var adv_rec_total = adv_rec.getValue("total");
				console.log("***** Advance balance="+adv_rec_balance+" advance total="+adv_rec_total);			
				/*
				if(adv_rec_total>0){
					expense_record.setValue({ fieldId: 'custbody_tsa_ioutotal', value: adv_rec_total, ignoreFieldChange: true, fireSlavingSync: false });
				}
				*/
				if(adv_rec_balance>=0){
					expense_record.setValue({ fieldId: 'custbody_tsa_ioutotal', value: adv_rec_balance, ignoreFieldChange: true, fireSlavingSync: false });
				}
			}
			
			var memo=expense_record.getValue({ fieldId: 'memo'});
			var total=expense_record.getValue({ fieldId: 'custbody_tsa_ioutotal'});
            var rate_orig=expense_record.getValue({ fieldId: 'custbody_tsa_iou_currency'});
			var rate=parseFloat(expense_record.getValue({ fieldId: 'custbody_tsa_iou_currency'}));
			
			console.log("memo="+memo+" total="+total+" rate="+rate+" rate_orig="+rate_orig);
			var value_x=0.00;
			if(rate>0){
				value_x=Math.round(parseFloat(total).toFixed(2)*rate);
			}
			
			expense_record.setValue({ fieldId: 'custbody_tsa_vs_iou_total_orig_curr', value: value_x, ignoreFieldChange: true, fireSlavingSync: false });
			
		}
		
    }

  /*
    function postSourcing(scriptContext) {
		console.log("*** Post Sourcing started *** field="+scriptContext.fieldId);
    }
*/


//********************** SAVE Record *********************
function  saveRecord(context) {
	var currentRecord=context.currentRecord;
	var advance_id=currentRecord.getValue("custbody22");
	var expense_id=currentRecord.getValue("id");
	console.log("expensereportSearchObj - expense_id="+expense_id);
	
	if(!advance_id) return true;
  	if(!expense_id) expense_id=0;
	
	var expensereportSearchObj = search.create({
	   type: "expensereport",
	   filters:
	   [
		  ["type","anyof","ExpRept"], 
		  "AND", 
		  ["formulanumeric: {custbody22.internalid}","equalto",advance_id],
		  "AND",
		  ["internalidnumber","notequalto",expense_id]
	   ],
	   columns:
	   [
		  search.createColumn({name: "trandate", label: "Date"}),
		  search.createColumn({name: "tranid", label: "Document Number"})
	   ]
	});
	var searchResultCount = expensereportSearchObj.runPaged().count;
	console.log("expensereportSearchObj - result count="+searchResultCount);
	
	if(searchResultCount>0){
		var alertMessage = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'EXPENSE_LINKED_ALREADY', locale: translation.Locale.CURRENT })();
		alert(alertMessage);
		return false;
	}
	else{
		return true;
	}
}	

	
    return {
      pageInit: pageInit,
	  fieldChanged: fieldChanged,
	  saveRecord: saveRecord	  
      //postSourcing: postSourcing
    };
});

/*
	fieldChanged: fieldChanged,
	postSourcing: postSourcing,
	sublistChanged: sublistChanged,
	lineInit: lineInit,
	validateField: validateField,
	validateLine: validateLine,
	validateInsert: validateInsert,
	validateDelete: validateDelete,
	saveRecord: saveRecord
*/
