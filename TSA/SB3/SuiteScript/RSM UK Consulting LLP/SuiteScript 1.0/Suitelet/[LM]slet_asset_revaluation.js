/****************************************************************************************
 * Name:		SuiteScript 1.0 Suitelet ([LM]slet_asset_revaluation.js)
 *
 * Script Type:	Suitelet
 *
 * Version:		2018.010 - 05/06/2018 - Initial Release - LM
 *
 * Author:		RSM
 *
 * Purpose:		Load original Asset Revaluation suitelet page as iframe and hide transaction reference field.
 *
 * Script:		customscript_lm_slet_asset_revaluation
 * Deploy:		customdeploy_lm_slet_asset_revaluation
 *
 * Notes:
 *
 * Libraries:
 ****************************************************************************************/

/**
 * Main entry function for suitelet.
 *
 * @public
 * @param	{nlobjRequest} request Request object
 * @param	{nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 * @since	1.0.0
 */
function buildPage(request, response)
{
	var form = null;
	var htmlField = null;
	var iframeHTML = "";

	try
	{
		iframeHTML = '<iframe id="assetrevalsu" src="/app/site/hosting/scriptlet.nl?script=390&deploy=1&ifrmcntnr=T" width="100%" style="border:0;height:100em"></iframe>';

		iframeHTML += '<script>';

		// get iframeOnLoad function source code as string.
		iframeHTML += iframeOnLoad.toString();

		// create a global variable to attach onload event listener and for use in iframeOnLoad function
		iframeHTML += "var suIframe = document.getElementById('assetrevalsu');suIframe.onload = iframeOnLoad;"

		iframeHTML += '</script>';

		form = nlapiCreateForm("Asset Revaluation", false);

		htmlField = form.addField("custpage_iframe", "inlinehtml", " ", null, null);

		htmlField.setDefaultValue(iframeHTML);

		response.writePage(form);
	}
	catch(e)
	{
		nlapiLogExecution("DEBUG", "buildPage", e);
	}
}

/**
 * Function to be called when iframe window is loaded.
 */
function iframeOnLoad()
{
	var iframeURL = "";

	try
	{
		// Attach an event listener to iframe onload window event.
		suIframe.contentWindow.onunload = function(){
			// Hide iframe window as we do not want to see flashes of page with NetSuite navigation menu and header.
			jQuery(suIframe).hide();
			// Show a wait message box rather than blank screen
			Ext.MessageBox.wait("loading....", "Please wait");
		};

		// Get iframe url
		iframeURL = this.contentWindow.location.href;
		if(iframeURL.indexOf("ifrmcntnr") == -1)
		{
			// Iframe will show netsuite page with netsuite header and navigation.
			// Add an iframe parameter to the iframe url. This hides netsuite page header in iframe window.
			this.contentWindow.location.href = iframeURL + "&ifrmcntnr=T";
		}
		else if(iframeURL.indexOf("script=260") > -1)
		{
			window.location.href = iframeURL;
		}
		else
		{
			// Hide the transaction reference field
			suIframe.contentWindow.eval("nlapiSetFieldDisplay('custpage_revaluationmemo', false);");
			// Show the iframe window with loaded page.
			jQuery(suIframe).show();
			// Hide the wait message box.
			Ext.MessageBox.hide();
		}
	}
	catch(e)
	{
		console.error(e);
	}
}
