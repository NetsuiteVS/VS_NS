/****************************************************************************************
 * Name:		SuiteScript 1.0 Client ([LM]cls_iou_transaction.js)
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
 * Notes:
 *
 * Libraries:
 ****************************************************************************************/

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord customtransaction_tsa_iou2
 *
 * @public
 * @param 	{String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function iouPageInit(type)
{
	var transactionStatus = "";
	var context = null;
	var currentUserRole = "";

	try
	{
		context = nlapiGetContext();
		currentUserRole = context.getRole();

		transactionStatus = nlapiGetFieldValue("transtatus");

		if(transactionStatus == "H")
		{
			nlapiSetLineItemDisabled("line","amount",true);
		}
		else if(type == "create")
		{
			loadAccount();
		}
	}
	catch(e)
	{
		console.group("iouPageInit");
		console.error(e);
		console.groupEnd();
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord customtransaction_tsa_iou2
 *
 * @public
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function iouPostSourcing(type, name)
{
	if(name == "subsidiary" || name == "currency")
	{
		loadAccount();
	}
}

/**
 * Searches for the default IOU/Advance account and populates
 * it in the new line item.
 *
 * @private
 * @returns  {Void}
 * @since	 1.0.0
 */
function loadAccount()
{
	var subsidiary = nlapiGetFieldValue("subsidiary"),
	currency = nlapiGetFieldValue("currency");

	if(!subsidiary || !currency)
	{
		return;
	}

	var results = nlapiSearchRecord("account", null,
			[new nlobjSearchFilter("custrecord_tsa_acc_currency", null, "contains", nlapiGetFieldText("currency")),
			 new nlobjSearchFilter("subsidiary", null, "anyof", nlapiGetFieldValue("subsidiary")),
			 new nlobjSearchFilter("custrecord_tsa_default_iou", null, "is", "T")]);
	for(var x in results)
	{
		console.log("Post sourcing - Load Account="+results[x].id+" Current Line="+nlapiGetCurrentLineItemIndex('line'));
      	
      	if(nlapiGetCurrentLineItemIndex('line')==2){
         	nlapiSelectLineItem('line',1);
        }
      	if(nlapiGetCurrentLineItemIndex('line')!=2) nlapiSetCurrentLineItemValue("line", "account", results[x].id, false, true);
      
		break;
	}
}

(function displayPartialAmountPopup(){
	if(getParameter("e")) return;
	var el = document.querySelector("#custpageworkflow219");
    el || (el = document.querySelector("#custpageworkflow211"));
	if(el){
		el.addEventListener("click", onPartialAmountReceived, true);
		window.clickString = el.getAttribute("onclick");
		el.setAttribute("onclick", "");
	}
	function onPartialAmountReceived(event){
	    var recordId = getParameter("id");
		nlExtOpenWindow("/app/site/hosting/scriptlet.nl?script=customscript_lm_slet2_iou_partial&deploy=customdeploy_lm_slet2_iou_partial&iou=" + recordId, "partial_amt",
				350, 200, null, false, "Partial Amount",{beforeclose: function(win){
					//eval("(function(){ " + window.clickString +"}())");
                    window.location.reload();
				}}, null);
	}
}());