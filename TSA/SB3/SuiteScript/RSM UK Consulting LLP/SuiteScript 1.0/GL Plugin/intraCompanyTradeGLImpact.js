/*************************************************************************************
 * Name:        Intra Company Trade GL Impact (intraCompanyTradeGLImpact.js)
 *
 * Script Type: customGLImpact script
 *
 * Client:      The Salvation Army
 * 
 * API Version:	1.0
 *
 * Version:		1.0.0	- 14/12/2018 - Initial release - RAL
 * 				
 * Author:      FHL
 *
 * Purpose:     To customise the GL impact on intra-company sales.
 *
 * Script:      customscript_intracoglimpact
 * Deploy:      customdeploy_
 *
 * Notes:
 *
 * Dependencies: Library.FHL.js
 *************************************************************************************/

var errMsg = '';
/**
 * Function used as entry point to GL Impact plug-in scripts
 * @since 1.0.0
 * @public
 * @param {Object} transaction - the transaction this plug-in is running on
 * @param {Object} standardLines - The lines on the GL impact prior to customisation
 * @param {Object} customLines - An object used to add and retain custom lines on a GL impact 
 * @returns null
 */
function customizeGlImpact(transaction, standardLines, customLines)
{
	var lines = []; 
	var unitInformation = {};
  	var id = transaction.getId();
    nlapiLogExecution('debug', 'GL Plugin Triggered', "*** GL Plugin Start *** id="+id);
  
  /* //this is necessary only if lines are loaded from saved search
  	if(!id){
      nlapiLogExecution('debug', 'GL Plugin Triggered', "Transaction id is null. Exit.");    
      return true;
    }
  */
	try
    {
        unitInformation.relatedParty = transaction.getFieldText('custbody_rp_type').toUpperCase(); 
        unitInformation.interUnit = transaction.getFieldValue('custbody_tsa_inter_unit');

        nlapiLogExecution('debug', "customizeGlImpact",'unitInformation.interUnit:' + unitInformation.interUnit+" ,unitInformation.relatedParty="+unitInformation.relatedParty);

        if (unitInformation.interUnit=="T")
        {
            //lines = getSalesLinesV2(transaction, id);
          	lines = getSalesLines(transaction, standardLines);
			
			unitInformation.relatedPartyType = getUnitType(unitInformation.relatedParty);
			unitInformation.currentUnit = transaction.getFieldText('custbody_unit_type').toUpperCase();
			unitInformation.currentUnitType = getUnitType(unitInformation.currentUnit);
			unitInformation.customer = transaction.getFieldValue('entity');
			
			for(var i = 0; i < lines.length; i ++){
				amendGLLine(lines[i], standardLines, customLines, unitInformation);
			}
		}
	}
	catch(e)
	{
      	createErrorLog(transaction, e.message);
		Library.errorHandler('customizeGLImpact', e);
	}
	finally
	{
		if(errMsg)
		{
			throwError();
		}
	}
}

/**
 * Cancels out the standard income line and credits the related party item account
 * @since 1.0.0
 * @private
 * @param {Object} line - information about an item line.
 * @param {Object} standardLines - the lines that standard NetSuite adds to he GL Impact.
 * @param {Object} customLines - An object allowing the addition of custom GL lines.
 * @param {Object} unitInformation - an object containing information about the buying and selling units..
 * @returns null
 */
function amendGLLine(line, standardLines, customLines, unitInformation)
{
	var cancellingLine = null;
	var correctingLine = null;
	var tradeAccount = '';
	
	try
	{
		tradeAccount = getIntraCompanyAccount(line.incomeAccount, unitInformation);
		nlapiLogExecution('debug', 'amendGLline', "line="+JSON.stringify(line));
		if(tradeAccount)
		{
			cancellingLine = customLines.addNewLine();
			cancellingLine.setAccountId(Number(line.incomeAccount));
			cancellingLine.setDebitAmount(line.amount);
			cancellingLine.setLocationId(Number(line.location));
			cancellingLine.setEntityId(Number(unitInformation.customer));
			cancellingLine.setMemo('Cancels the standard income account.');

			correctingLine = customLines.addNewLine();
			correctingLine.setAccountId(Number(tradeAccount));
			correctingLine.setCreditAmount(line.amount);
			correctingLine.setLocationId(Number(line.location));
			correctingLine.setEntityId(Number(unitInformation.customer));
			correctingLine.setMemo('New income account');
		}
	} 
	catch(e)
	{
		Library.errorHandler('amendGLLine', e);
	}
}

/**
 * gets the account to be used instead of the standard income account.
 * @since 1.0.0
 * @private
 * @param {String} incomeAccount - the standard account used by NetSuite.
 * @param {String} unitInformation - object containing information about the selling and buying units.
 * @returns {String} intraCompanyAccount - the account to be used for Intra-company trades. 
 */
function getIntraCompanyAccount(incomeAccount, unitInformation)
{
	var intraCompanyAccount = '';
	var filters = [];
	var columns = [];
	var results = [];
	
	try
	{
		nlapiLogExecution('debug', 'unitInformation', JSON.stringify(unitInformation));
		filters.push(nlobjSearchFilter('custrecord_uat_itemglaccount', null, 'is', incomeAccount));
		filters.push(nlobjSearchFilter('custrecord_uat_unittype', null, 'is', unitInformation.currentUnitType));
		filters.push(nlobjSearchFilter('custrecord_uat_relatedpartytype', null, 'is', unitInformation.relatedPartyType));
		filters.push(nlobjSearchFilter('isinactive', null, 'is', 'F'));
		columns.push(new nlobjSearchColumn('custrecord_uat_glaccount', null, null));
		results = nlapiSearchRecord('customrecord_tsa_unit_activity_types', null, filters, columns);
		
		if(results)
		{
			for(var i = 0; i < results.length; i ++)
			{
				intraCompanyAccount = results[i].getValue('custrecord_uat_glaccount');
				if(checkAccountIsActive(intraCompanyAccount))
				{
					break;
				}
				else
				{
					intraCompanyAccount = '';
				}
			}
			
			if(!intraCompanyAccount)
			{
				errMsg = 'Please contact your Administrator. There is no active Intra-company trade account for one or more items on this transaction.';
			}
		}
		else
		{
			errMsg = 'No TSA Interunit Mapping record for this combination.'+' ,itemGlAccount='+incomeAccount+' ,unitType='+unitInformation.currentUnitType+' ,relPartyType='+unitInformation.relatedPartyType;
		}
	}
	catch(e)
	{
		Library.errorHandler('getIntraCompanyAccount', e);
	}
	return intraCompanyAccount;
}

/**
 * Checks to see if the account is active
 * @since 1.0.0
 * @private
 * @param {integer} accountId - the ID of the account to be checked
 * @returns {boolean} active - is the account active or not
 */
function checkAccountIsActive(accountId)
{
	var activeChar = 'T';
	var active = false;
	
	try
	{
		activeChar = nlapiLookupField('account', accountId, 'isinactive');
		if(activeChar == 'F')
		{
			active = true;
		}
	} 
	catch(e)
	{
		Library.errorHandler('checkAccountIsActive', e);
	}
	return active;
}

/**
 * Gets the internal ID of the given unit type.
 * @since 1.0.0
 * @private
 * @param {String} unitType - The unit type to find the internal ID for
 * @returns {int} unitId - the ID of the unit.
 */
function getUnitTypeId(unitType)
{
	var unitTypeId = '';
	//nlapiLogExecution('debug', "getUnitTypeId",'unitType:' + unitType);
	try
	{
		switch(unitType)
		{
			case 'THQ':
				unitTypeId = 2; // Library.lookUpParameters('GL plugin - units', 'THQ Value');
				break;
			case 'DHQ':
				unitTypeId = 1; // Library.lookUpParameters('GL plugin - units', 'DHQ Value');
				break;
			case 'UNIT': 
				unitTypeId = 3; //Library.lookUpParameters('GL plugin - units', 'Unit Value');
				break;
			default:
				nlapiLogExecution('error', 'Invalid Unit Type', "The provided unit type doesn't exist");
		}
	}
	catch(e)
	{
		Library.errorHandler('getUnitTypeId', e);
	}
	return unitTypeId;
}

/**
 * Determines what type of unit the trade goes to.
 * @since 1.0.0
 * @private
 * @param {String} entity - the entity to extract the unit type from.
 * @returns {int} unitTypeId - the type of unit that is purchasing.
 */
function getUnitType(entity)
{
	var stringLength = 0;
	var lastLetters = '';
	var unitType = '';
	var unitTypeId = 0;
	
	try
	{
		//stringLength = entity.length;
		//lastLetters = entity.substr(stringLength - 3);
		lastLetters = entity;
		nlapiLogExecution('debug', "getUnitType",'entity:' + entity);
		switch(lastLetters)
		{
			case 'THQ':
			case 'DHQ':
				unitType = lastLetters;
				break;
			
			default:
				unitType = 'UNIT';
				break;
		}
		unitTypeId = getUnitTypeId(unitType); // 1=DHQ, 2=THQ, 3=Unit
	}
	catch(e)
	{
		Library.errorHandler('getRelatedPartyType', e);
	}
	return unitTypeId;
}

/**
 * Gets an array of objects containing relevant information about sales lines
 * @private
 * @since 1.0.0
 * @param {Object} transaction - the record on which this plug-in will run.
 * @returns {Array} lines - the lines from the transaction
 */
function getSalesLinesV2(transaction, id) {
    var lines = [];
    var singleLine = {};
    var totalLines = 0;
    var exchange_rate = parseFloat(transaction.getFieldValue('exchangerate'));
    if (!exchange_rate) exchange_rate = 1;
	
    nlapiLogExecution('debug','getSalesLinesV2','txn id='+id);  	
    var transactionSearch = nlapiSearchRecord("transaction", null,
        [
      		["internalid", "anyof", id], "AND", ["account.type", "anyof", "Income"], "AND", ["customgl", "is", "F"]
      		//, "AND", ["fxamount","notequalto","0.00"]
      		//["internalid", "anyof", id], "AND", ["account.type", "anyof", "Income"], "AND", ["customgl", "is", "F"], "AND", [["fxamount","notequalto","0.00"],"OR",["amount","notequalto","0.00"]]
        ],
        [   new nlobjSearchColumn("item"),
            new nlobjSearchColumn("fxamount"),
            new nlobjSearchColumn("location"),
            new nlobjSearchColumn("incomeaccount", "item", null)
        ]
    );

    if (transactionSearch == null){
      	nlapiLogExecution('debug','getSalesLinesV2','totalLines.count=0 - Exit');
        return lines;
    }

    try {
        totalLines = transactionSearch.length;
        nlapiLogExecution('debug', 'totalLines.count:', totalLines);
        for (var i = 1; i <= totalLines; i++) {
            var searchresult = transactionSearch[i - 1];
            var columns = searchresult.getAllColumns();
            lines[i - 1] = {};
            lines[i - 1].item = searchresult.getValue(columns[0]);
            lines[i - 1].amount = searchresult.getValue(columns[1]) * exchange_rate;
            nlapiLogExecution('debug', 'amount:', lines[i - 1].amount);
            lines[i - 1].location = searchresult.getValue(columns[2]);
            lines[i - 1].incomeAccount = searchresult.getValue(columns[3]);
        }
        nlapiLogExecution('debug', 'lines', JSON.stringify(lines));
    }
    catch (e) {
        Library.errorHandler('getSalesLinesV2', e);
    }
    return lines;
}

/**
 * Gets an array of objects containing relevant information about sales lines
 * @private
 * @since 1.0.0
 * @param {Object} transaction - the record on which this plug-in will run.
 * @returns {Array} lines - the lines from the transaction
 */
function getSalesLines(transaction,standardLines)
{
	try
	{

		var lines = [];
		var singleLine = {};
		var totalLines = 0;

		var linecount = standardLines.getCount();
      	nlapiLogExecution('debug', 'getSalesLines', 'Standard Lines count ='+linecount);
		if (linecount == 0) {
			nlapiLogExecution('debug', 'getSalesLines', 'line count was zero - Exit');
			return;  // no work to complete
		}
		
		var j=0;
		var incomeAccounts = [];
		for (var i=0; i<linecount; i++) {

			//get the value of NetSuite's GL posting
			var line =  standardLines.getLine(i);
			//if ( !line.isPosting() ) continue; // not a posting item
			if ( line.getId() == 0 ) continue; // summary lines; ignore

			//build a unique key that spans the account, class, dept, and location
			//var cls = line.getClassId();
			//var loc = line.getLocationId();
			//var dep = line.getDepartmentId();

			//determine the amount.  debits will be positive.   Add it to the summary map
			var stLine = standardLines.getLine(i);
			nlapiLogExecution('debug', 'getSalesLines', 'stLine='+JSON.stringify(stLine));
			var account = stLine.getAccountId();
			if ( !account ) continue; 
			var acc_type="";
			if(incomeAccounts.indexOf(account)>-1){ // saving gonvernance units
				acc_type="Income";
			}
			else{
				acc_type=nlapiLookupField('account',account,'type');
			}
			nlapiLogExecution('debug', 'getSalesLines', 'account type='+acc_type);
			if(acc_type=="Income"){
				var amount = Math.abs(parseFloat(stLine.getDebitAmount()||0) + (parseFloat(stLine.getCreditAmount()||0)));
				lines[j] = {};
				lines[j].amount = amount;
				lines[j].location = stLine.getLocationId();
				lines[j].incomeAccount = account;
				incomeAccounts.push(account);
				nlapiLogExecution('debug', 'getSalesLines - Income lines j='+(j),JSON.stringify(lines[j]));
				j++;
			}
		}

	}
	catch(e)
	{
		Library.errorHandler('getSalesLines', e);
	}
	return lines;
}


/**
 * Throws an error
 * Try/catch block omitted as it is necessary for the script to break here
 * @since 1.0.0
 * @private
 * @returns null
 */
function throwError()
{
	var error = null;
	error = nlapiCreateError('INVD_UAT_REC', errMsg, true);
	throw error;
}

function createErrorLog(transaction, message) {
    try {

        var record = nlapiCreateRecord('customrecord_tsa_error_log');

        record.setFieldValue('custrecord_tsa_script_id', "intraCompanyTradeGLImpact");
        record.setFieldValue('custrecord_tsa_trans_id', transaction.getId());
        record.setFieldValue('custrecord_tsa_record_id', transaction.getId());
        record.setFieldValue('custrecord_tsa_record_type', transaction.getRecordType());
        record.setFieldValue('custrecord_tsa_error_message', message);
        record.setFieldValue('custrecord_tsa_error_status', 1);
        record.setFieldValue('custrecord_tsa_ui_user', nlapiGetUser());

        nlapiSubmitRecord(record, true);
    }
    catch (e) {
        nlapiLogExecution("ERROR", "intraCompanyTradeGLImpact::createErrorLog", e.message);
    }
}

/* backup "mass" for any case
function getSalesLines(transaction,standardLines)
{
	try
	{

		var lines = [];
		var singleLine = {};
		var totalLines = 0;
		var exchange_rate = parseFloat(transaction.getFieldValue('exchangerate'));
		if(!exchange_rate) exchange_rate=1;

	//  calculate/set discount rate and amount
		var discount_rate = transaction.getFieldValue('discountrate');
		var discount_percent = 0.00;
		var discount_amount = 0.00;
		if(discount_rate){
		  if(discount_rate.indexOf("%")>0){
			discount_percent = parseFloat( discount_rate.substring(0,discount_rate.indexOf("%")) );
		  }

		  if(discount_rate.indexOf("%")==-1){
			discount_amount = parseFloat( discount_rate );
		  }
		}
	nlapiLogExecution('debug', 'getSalesLines','discount_percent='+discount_percent);

//  calculate/set discount rate and amount - end  
		var linecount = standardLines.getCount();
		//if (linecount == 0) return;  // no work to complete
		var j=0;
		var incomeAccounts = [];
		for (var i=0; i<linecount; i++) {

			//get the value of NetSuite's GL posting
			var line =  standardLines.getLine(i);
			if ( !line.isPosting() ) continue; // not a posting item
			if ( line.getId() == 0 ) continue; // summary lines; ignore

			//build a unique key that spans the account, class, dept, and location
			//var cls = line.getClassId();
			//var loc = line.getLocationId();
			//var dep = line.getDepartmentId();

			//determine the amount.  debits will be positive.   Add it to the summary map
			var stLine = standardLines.getLine(i);
			nlapiLogExecution('debug', 'getSalesLines', 'stLine='+JSON.stringify(stLine));
			var account = stLine.getAccountId();
			if ( !account ) continue; 
			var acc_type="";
			if(incomeAccounts.indexOf(account)>-1){ // saving gonvernance units
				acc_type="Income";
			}
			else{
				acc_type=nlapiLookupField('account',account,'type');
			}
			nlapiLogExecution('debug', 'getSalesLines', 'account type='+acc_type);
			if(acc_type=="Income"){
				var amount = Math.abs(parseFloat(stLine.getDebitAmount()||0) + (parseFloat(stLine.getCreditAmount()||0)));
				lines[j] = {};
				lines[j].amount = amount;
				lines[j].location = stLine.getLocationId();
				lines[j].incomeAccount = account;
				incomeAccounts.push(account);
				nlapiLogExecution('debug', 'getSalesLines - Income lines j='+(j),JSON.stringify(lines[j]));
				j++;
			}
		}

	/*		
			totalLines = transaction.getLineItemCount('item');
			for(var i = 1; i <= totalLines; i ++)
			{
				var amount_fx=0;
				try{
					var x=(i-1)*3+1;
					var stLine = standardLines.getLine(x);
					nlapiLogExecution('debug', 'getSalesLines', 'stLine='+stLine);
					var amount = parseFloat(stLine.getDebitAmount()||0) + (parseFloat(stLine.getCreditAmount()||0) * parseFloat(-1));
				}
				catch(e){
					nlapiLogExecution('debug', 'getSalesLines', JSON.stringify(e));
				}

				lines[i - 1] = {};
				lines[i - 1].item = transaction.getLineItemValue('item', 'item', i);
				//amount_fx = transaction.getLineItemValue('item', 'amount', i)*exchange_rate;
	  //          	if(discount_percent){
	  //        		amount_fx = amount_fx*(1+discount_percent/100);
	 //			amount_fx = amount_fx.toFixed(2);
	 //           }
	 //			lines[i - 1].amount = amount_fx;
				lines[i - 1].amount = amount;
				lines[i - 1].location = transaction.getLineItemValue('item', 'location', i);
				lines[i - 1].incomeAccount = nlapiLookupField('item', lines[i - 1].item, 'incomeaccount');
				nlapiLogExecution('debug', 'getSalesLines - lines i-1='+(i-1),JSON.stringify(lines[i-1]));
			}
			nlapiLogExecution('debug', 'getSalesLines', JSON.stringify(lines));
			
	}
	catch(e)
	{
		Library.errorHandler('getSalesLines', e);
	}
	return lines;
}
*/
