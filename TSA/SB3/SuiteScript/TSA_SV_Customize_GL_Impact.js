/*************************************************************************************
 *
 * Script Type: customGLImpact script
 *
 * Client:      The Salvation Army
 * 
 * API Version:	1.0
 *
 * Version:		1.0.0	- 11/06/2018 - Initial release
 * 				
 * Author:      Viktor Schumann
 *
 * Purpose:     To customise the GL impact on supplier invoice sales.
 *
 * Script:      customscript_customizeGlImpact
 * Deploy:      customdeploy_
 *
 * Notes:
 *
 * Dependencies:
 *************************************************************************************/

var errMsg = '';
var itemResult;
var glImpactResult;

/**
 * Function used as entry point to GL Impact plug-in scripts
 * @since 1.0.0
 * @public
 * @param {Object} transaction - the transaction this plug-in is running on
 * @param {Object} standardLines - The lines on the GL impact prior to customisation
 * @param {Object} customLines - An object used to add and retain custom lines on a GL impact 
 * @returns null
 */
function customizeGlImpact(transaction, standardLines, customLines, book) {
    
    var id = transaction.getId();
    var tsa_gl_correction_req;

    try {
		nlapiLogExecution('DEBUG', 'customizeGlImpact', '*** TSA non-rec GL impact script Started ***');
		var nonRecoverableTaxCode = nlapiGetContext().getSetting('SCRIPT', 'custscript_ihq_non_recoverable_tax_code');
        tsa_gl_correction_req = parseInt(transaction.getFieldValue('custbody_tsa_gl_correction_req')); 


        nlapiLogExecution('DEBUG', 'customizeGlImpact', 'tsa_gl_correction_req=' + tsa_gl_correction_req);
		if(!id){
          	nlapiLogExecution('DEBUG', 'customizeGlImpact', 'id is not defined - EXIT plugin ');
          	return true;
        }
                              
        /* 12/-3/2020 removed by VS
      	if (tsa_gl_correction_req == 0) {
			nlapiLogExecution('DEBUG', 'customizeGlImpact', ' req=0 hence it is not triggered by our script... bye-bye...');
            return;
        }
		*/

        getItemResultSet(id, nonRecoverableTaxCode);
      	nlapiLogExecution('DEBUG', 'customizeGlImpact-4', ' after getItemResult ,itemResult='+JSON.stringify(itemResult));
        getGlImpactResultSet(id);      	
      	if(!glImpactResult){
          nlapiLogExecution('DEBUG', 'customizeGlImpact-4.a','No glImpactResult - Exit');
          return true;
        } 
      
		nlapiLogExecution('DEBUG', 'customizeGlImpact-5', ' glImpactResult.length=' + glImpactResult.length + " | glImpactResult=" + JSON.stringify(glImpactResult) + " | itemResult="+JSON.stringify(itemResult) );
		
		
        //General checking...
        if (!itemResult || itemResult.length == 0 || !glImpactResult) {
            return;
        }

        if (itemResult.length * 2 < glImpactResult.length) {
            errMsg = 'There must be at least two gl impact line for every item line!';
            throw error;
        }
		nlapiLogExecution('DEBUG','customizeGlImpact-6',"");
      
        //Amount check & segment empty check
        var segment_exist=false;
        for (var i = 0; i < itemResult.length; i++) {
            var itemTaxAmount = Math.abs(itemResult[i].getValue("taxamount"));
            var gliOneAmount = Math.abs(glImpactResult[i * 2].getValue("amount"));
            var gliTwoAmount = Math.abs(glImpactResult[(i * 2) + 1].getValue("amount"));

            if (itemTaxAmount != gliOneAmount || itemTaxAmount != gliTwoAmount) {
                errMsg = 'custom GL impact: No matching amount!';
				nlapiLogExecution('DEBUG','customizeGlImpact-7', "itemTaxAmount="+itemTaxAmount+" | gliOneAmount="+gliOneAmount+" | gliTwoAmount="+gliTwoAmount);
                throw error;
            }
          
          		var reserveId = itemResult[i].getValue("internalid", "CUSTCOL_CSEG_TSA_FUNDRESERV");
              	var related_partyId = itemResult[i].getValue("internalid","CUSTCOL_CSEG_TSA_RELATEDPAR");
                var project_Id = itemResult[i].getValue("internalid", "CUSTCOL_CSEG_TSA_PROJECT");
                var ihq_property_Id = itemResult[i].getValue("internalid", "line.cseg_ihq_property");
                if (reserveId || related_partyId || project_Id || ihq_property_Id) segment_exist=true;
        }
      
      	if(!segment_exist){
        	nlapiLogExecution('DEBUG','customizeGlImpact-7.5',"All custom segments are empry. Exiting GL plugin");
          	return true;
        }

        nlapiLogExecution('DEBUG','customizeGlImpact-8',"");
      
		for (var x=1; x<3; x++){ //1=Adding inverted records 2=Adding new custom GL lines | This is just to have the custom GL lines in readable format
			nlapiLogExecution('DEBUG','customizeGlImpact-9',"x="+x);
          
          	for (var i = 0; i < glImpactResult.length; i++) {
				var gliRecord = glImpactResult[i];
				var account = glImpactResult[i].getValue("account");
				var amount = glImpactResult[i].getValue("amount");
				var location = glImpactResult[i].getValue("location");
				var departmentId = glImpactResult[i].getValue("department");
				var credit = glImpactResult[i].getValue("creditamount");
				var debit = glImpactResult[i].getValue("debitamount");
				var memo = glImpactResult[i].getValue("memo");
				var line = glImpactResult[i].getValue("line");
				
				var reserveId = itemResult[Math.floor(i / 2)].getValue("internalid", "CUSTCOL_CSEG_TSA_FUNDRESERV");
              	var related_partyId = itemResult[Math.floor(i / 2)].getValue("internalid","CUSTCOL_CSEG_TSA_RELATEDPAR");
                var project_Id = itemResult[Math.floor(i / 2)].getValue("internalid", "CUSTCOL_CSEG_TSA_PROJECT");
                //var interdept_elim_Id = itemResult[Math.floor(i / 2)].getValue("internalid", "CUSTCOL_CSEGINTERDEPT_ELIM");
                var ihq_property_Id = itemResult[Math.floor(i / 2)].getValue("internalid", "line.cseg_ihq_property");

				var _class = glImpactResult[i].getValue("class");

				if(x==1){ // 1=Adding inverted records
					var newNegationLine = customLines.addNewLine();
                  	nlapiLogExecution('DEBUG','customizeGlImpact-9.X==1',"account="+account+" , _class="+_class+" , location="+location+" , departmentId="+departmentId+" , credit="+credit+" , debit="+debit+ " , Math.floor(i / 2)="+Math.floor(i / 2));
					newNegationLine.setAccountId(parseInt(account));
					newNegationLine.setClassId(parseInt(_class));
					if(location) newNegationLine.setLocationId(parseInt(location));
					newNegationLine.setDepartmentId(parseInt(departmentId));
					if (credit && credit > 0) {
						newNegationLine.setDebitAmount(parseFloat(credit));
					}
					else {
						newNegationLine.setCreditAmount(parseFloat(debit));
					}
					newNegationLine.setMemo(memo+" Inverted(i="+i+", line="+line+")");
				}

				if(x==2){ //2=Adding new custom GL lines
					var newCustomLine = customLines.addNewLine();
                  	nlapiLogExecution('DEBUG','customizeGlImpact-9.X==2',"account="+account+" , _class="+_class+" , location="+location+" , departmentId="+departmentId+" , credit="+credit+" , debit="+debit);
					newCustomLine.setAccountId(parseInt(account));
					newCustomLine.setClassId(parseInt(_class));
					if(location) newCustomLine.setLocationId(parseInt(location));
					newCustomLine.setDepartmentId(parseInt(departmentId));
					if (credit && credit > 0) {
						newCustomLine.setCreditAmount(parseFloat(credit));
					}
					else {
						newCustomLine.setDebitAmount(parseFloat(debit));
					}
					newCustomLine.setMemo(memo+" ReCreated(i="+i+", line="+line+")");
                  	nlapiLogExecution('DEBUG','customizeGlImpact-10',"reserveId="+reserveId+" , related_party="+related_partyId+" , Project="+project_Id+" , Property="+ihq_property_Id);
                  
                  	if( (i % 2)==1 ){ // reserve should be populated on the destination account only. Not sure this is true for the other segments too but probably yes... we will see...
                      if( reserveId ) newCustomLine.setSegmentValueId('cseg_tsa_fundreserv', parseInt(reserveId));
                      if( related_partyId ) newCustomLine.setSegmentValueId('cseg_tsa_relatedpar', parseInt(related_partyId));
                      if( project_Id ) newCustomLine.setSegmentValueId('cseg_tsa_project', parseInt(project_Id));
                      //if( interdept_elim_Id ) newCustomLine.setSegmentValueId('cseginterdept_elim', parseInt(interdept_elim_Id));
                      if( ihq_property_Id ) newCustomLine.setSegmentValueId( 'cseg_ihq_property', parseInt(ihq_property_Id) );
                    }
				}
			} 
		}
		nlapiLogExecution('DEBUG', 'customizeGlImpact', '*** TSA non-rec GL impact script FINISHED ***');
    }
    catch (e) {
        var message = "Transaction id= " + id;
        if (errMsg && errMsg.length > 0) {
            message += "Error message: " + errMsg;
        }
		if(e.message){ message += " JSON(e)="+JSON.stringify(e);}
			
        nlapiLogExecution('Error', 'customizeGlImpact', "Error! " + message ); //+ " JSON(e)="+JSON.stringify(e) 

        nlapiSendEmail(nlapiGetContext().getUser(), 'wiksch@gmail.com', 'Error at customizeGlImpact', message, null, null, null, null);
    }
    finally {
        //(COMMENTED)
        //Compare correction fields values...
        //if (tsa_gl_correction_req != tsa_gl_correction_done) {
        //    nlapiSubmitField(transaction.getRecordType(), id, 'custbody_tsa_gl_correction_done', tsa_gl_correction_req);
        //    return;
        //}

        if (errMsg) {
            throwError();
        }
    }
}

function getItemResultSet(id, nonRecoverableTaxCode) {
    itemResult = nlapiSearchRecord("transaction", null,
        [
            ["mainline", "is", "F"],
            "AND",
//            ["item.type", "anyof", "InvtPart", "Group", "Kit", "NonInvtPart", "OthCharge", "Service"],
            ["taxline","is","F"],
            "AND",      
            //["posting", "is", "T"],
            //"AND",
            ["internalidnumber", "equalto", id],
            "AND",
            ["taxitem", "anyof", nonRecoverableTaxCode]
        ],
        [
            new nlobjSearchColumn("account"),
            new nlobjSearchColumn("taxamount"),
            new nlobjSearchColumn("expenseaccount", "item", null),
            new nlobjSearchColumn("amount"),
            new nlobjSearchColumn("creditamount"),
            new nlobjSearchColumn("debitamount"),
            new nlobjSearchColumn("tranid"),
            new nlobjSearchColumn("memo"),
            new nlobjSearchColumn("posting"),
            new nlobjSearchColumn("line"),
      		new nlobjSearchColumn("linesequencenumber").setSort(false),
            new nlobjSearchColumn("name", "CUSTCOL_CSEG_TSA_FUNDRESERV", null),
            new nlobjSearchColumn("department"),
            new nlobjSearchColumn("taxcode"),
            new nlobjSearchColumn("custcol_sv_non_recoverable_tax_lines"),
            new nlobjSearchColumn("internalid", "CUSTCOL_CSEG_TSA_FUNDRESERV", null),
      		new nlobjSearchColumn("internalid", "CUSTCOL_CSEG_TSA_RELATEDPAR", null),
      		new nlobjSearchColumn("internalid", "CUSTCOL_CSEG_TSA_PROJECT", null),
      		//new nlobjSearchColumn("internalid", "CUSTCOL_CSEGINTERDEPT_ELIM", null),
      		new nlobjSearchColumn("internalid", "line.cseg_ihq_property", null)
        ]
    );
  	
}

function getGlImpactResultSet(id) {

    //Get all the GL impact lines in actual transaction
    glImpactResult = nlapiSearchRecord("transaction", null,
        [
            ["mainline", "is", "F"],
            "AND",
//            ["item.type", "noneof", "InvtPart", "Group", "Kit", "NonInvtPart", "OthCharge", "Service"],
//            "AND", 
		    ["customgl","is","T"],
            "AND",
            //["posting", "is", "T"],
            //"AND",
            ["internalidnumber", "equalto", id],
            "AND",
            ["memo", "startswith", "Non-Deductible Tax"]
        ],
        [
            new nlobjSearchColumn("account"),
            new nlobjSearchColumn("taxamount"),
            new nlobjSearchColumn("expenseaccount", "item", null),
            new nlobjSearchColumn("department"),
            new nlobjSearchColumn("amount"),
            new nlobjSearchColumn("creditamount"),
            new nlobjSearchColumn("debitamount"),
            new nlobjSearchColumn("tranid"),
            new nlobjSearchColumn("memo"),
            new nlobjSearchColumn("posting"),
            new nlobjSearchColumn("line"),
      		new nlobjSearchColumn("linesequencenumber").setSort(false),
            new nlobjSearchColumn("location"), 
            new nlobjSearchColumn("name", "CUSTCOL_CSEG_TSA_FUNDRESERV", null),
            new nlobjSearchColumn("class")
        ]
    );   
}

/**
 * Throws an error
 * Try/catch block omitted as it is necessary for the script to break here
 * @since 1.0.0
 * @private
 * @returns null
 */
function throwError() {
    var error = null;
    error = nlapiCreateError('INVD_UAT_REC', errMsg, true);
    throw error;
}

