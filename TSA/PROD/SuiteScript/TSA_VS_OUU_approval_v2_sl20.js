/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_OUU_approval_v2_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Offline Unit Upload custom record Approval

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/url', 'N/http', 'N/https', 'N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/task', 'N/config'],

    function (url, http, https, serverWidget, search, redirect, record, format, runtime, file, format, task, config) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        var sublistID = 'custpage_sublist';

        function onRequest(context) {

            if (context.request.method == 'GET') {

                try {

                    log.debug("ouu_approval_v2", "Script started - GET");

                    var roleId = runtime.getCurrentUser().roleId.toLowerCase();
                  	var role = runtime.getCurrentUser().role;
                    var user = runtime.getCurrentUser().id;
                    var accountId = runtime.accountId.replace("_", "-");
                    //user.subsidiary                    

                    //Get approve button state (custrecord_tsa_off_unload_app)
                    var enable_approve_button = true;
                    if (!roleId.equals("administrator")) {
                        var suitletURL = url.resolveScript({
                            scriptId: 'customscript_tsa_vs_appr_btn_state_sl2',
                            deploymentId: 'customdeploy_tsa_vs_appr_btn_state_sl2',
                            returnExternalUrl: true,
                            params: { 'role': role }
                        });
                        var response = https.get({ url: suitletURL });
                        enable_approve_button = response.body == "true";
                    }
                    log.debug("ouu_approval_v2", "role=" + role + ", enable_approve_button=" + enable_approve_button + " user=" + user);
                  	
                    /*
                                        if (!roleId.equals("administrator") && !roleId.equals("customrole_ihqapp_board")) {
                                            log.debug("ouu_approval_v2", "Only users with IHQ Board or Administrator Role are eligible to use the Board Approval.");
                                            context.response.write("Only users with IHQ Board or Administrator Role are eligible to use the Board Approval.");
                                            return false;
                                        }
                    */

                    var request = context.request;
                    //var selectedSearch = request.parameters.selected_search;
                    //log.debug("ouu_approval_v2", "selectedSearch:" + selectedSearch + " ,nameFilter:" + nameFilter);

                    //Create form
                    var form = serverWidget.createForm({ title: "TSA Offline Unit Upload Approval" });
                    //form.clientScriptFileId = 393846; //SB2 - TSA_VS_OUU_approval_cs20.js
                    //form.clientScriptFileId = 384827; //SB3
					form.clientScriptFileId = 396006; //PROD
					
                    var tab = form.addTab({ id: 'custpage_tab_list', label: "Uploaded Transactions" });

                    //Add filters
                    form.addFieldGroup({ id: 'custpage_fieldgroup_filters', label: "FILTERS" });
                    form.addField({ id: 'custpage_datefrom_filter', type: serverWidget.FieldType.DATE, label: "Date FROM", container: 'custpage_fieldgroup_filters' });
                    form.addField({ id: 'custpage_dateto_filter', type: serverWidget.FieldType.DATE, label: "Date TILL", container: 'custpage_fieldgroup_filters' });
                    var unitFilterField = form.addField({ id: 'custpage_unit_filter', type: serverWidget.FieldType.SELECT, label: "UNIT", container: 'custpage_fieldgroup_filters' });
                    var ownerFilterField = form.addField({ id: 'custpage_owner_filter', type: serverWidget.FieldType.SELECT, label: "OWNER", container: 'custpage_fieldgroup_filters' });

                    //Set Unit filter 
                    unitFilterField.addSelectOption({ value: "", text: "" });
                    ownerFilterField.addSelectOption({ value: "", text: "" });

                    //serverWidget.SublistType.INLINEEDITOR; serverWidget.SublistType.LIST
                    var sublist = form.addSublist({ id: sublistID, type: serverWidget.SublistType.LIST, label: 'Uploaded Transactions to Approve', tab: 'custpage_tab_list' });
                    sublist.addButton({ id: 'custpage_mark_all', label: 'Mark All', functionName: "markAll()" });
                    sublist.addButton({ id: 'custpage_unmark_all', label: 'Unmark All', functionName: "unmarkAll()" });
                    //sublist.addButton({ id: 'custpage_approve2', label: 'Approve', functionName: "saveRecord2()" });

                    sublist.addField({ id: 'custpage_checked', label: 'Selected', type: serverWidget.FieldType.CHECKBOX });
                    var linkField = sublist.addField({ id: 'custpage_link_url', label: "OUU record", type: serverWidget.FieldType.URL }).updateDisplayType({ displayType: 'DISABLED' });
                    linkField.linkText = "View";
                    sublist.addField({ id: 'custpage_internalid', label: 'Id', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_date', label: 'Date', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_approval_status', label: 'Approval Status', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_memo', label: 'Memo', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_bank_pay_type', label: 'Bank Pay Type', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_bank_account', label: 'Bank Account', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_usage', label: 'Usage', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_inc_exp', label: 'Income/Expense', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_amount', label: 'Amount', type: serverWidget.FieldType.CURRENCY }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_currency', label: 'Currency', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_unit', label: 'Unit', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_related_party', label: 'RelatedParty', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    //sublist.addField({ id: 'custpage_error', label: 'Error', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    //sublist.addField({ id: 'custpage_error_desc', label: 'Error Description', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_owner', label: 'Record Owner', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    //sublist.addField({ id: 'custpage_offset_acc', label: 'Offset Account', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    //sublist.addField({ id: 'custpage_offset_rsrv', label: 'Offset Reserve', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    //sublist.addField({ id: 'custpage_offset_bank', label: 'Offset Bank', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });					
                    // hidden fields 
                    sublist.addField({ id: 'custpage_internalid_h', label: 'internalid', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_approval_status_h', label: 'approval status', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_memo_h', label: 'memo', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });

                    var filters =
                        [
                            ["custrecord_tsa_ouu_approval_status", "anyof", "2", "2"], // "@NONE@"]
                            "AND",
                            ["custrecord_tsa_ouu_error", "is", "F"]
                            //custrecord_tsa_ouu_error
                            //3=Approved, 2=Pending Approval, 1=Pending Submission, 4=Rejected, 
                            //5=HOD Rejected, 6=Pending Approval - HOD Reviewed, 8=Approved - HOD Reviewed,7=Pending HOD Review, 9=Rejected - HOD Reviewed
                        ];

                    //Date filters
                    log.debug("ouu_approval_v2", "dateFrom=" + context.request.parameters.dateFrom + ", dateTo=" + context.request.parameters.dateTo
                        + ", owner=" + context.request.parameters.owner + ", unit=" + context.request.parameters.unit);

                    var dateFromFilterValue;
                    var dateToFilterValue;
                    var dateFromFilterValue_server;
                    var dateToFilterValue_server;
                    var defaultValues = {};

                    if (context.request.parameters.dateFrom) {
                        //var splittedDate = context.request.parameters.dateFrom.split("/");
                        dateFromFilterValue = parseDateBasedOnUserPreference(context.request.parameters.dateFrom, "YYYY-MM-DD", "String", "User Preference", 0, 0, 0);
                        //dateFromFilterValue = format.parse({ value: new Date(splittedDate[2], splittedDate[1] - 1, splittedDate[0]), type: format.Type.DATE });
                        //dateFromFilterValue = format.parse({ value: new Date(splittedDate[2], splittedDate[1] - 1, splittedDate[0]), type: dateformat });
                        //dateFromFilterValue = parseDateBasedOnUserPreference(context.request.parameters.dateFrom, true, false, true, false);
                        log.debug("ouu_approval_v2", "dateFromFilterValue=" + dateFromFilterValue);
                    }
                    if (context.request.parameters.dateTo) {
                        dateToFilterValue = parseDateBasedOnUserPreference(context.request.parameters.dateTo, "YYYY-MM-DD", "String", "User Preference", 0, 0, 0);
                        log.debug("ouu_approval_v2", "dateFromFilterValue=" + dateToFilterValue);
                        //var splittedDate = context.request.parameters.dateTo.split("/");
                        //dateToFilterValue = format.parse({ value: new Date(splittedDate[2], splittedDate[1] - 1, splittedDate[0]), type: format.Type.DATE });
                        //dateToFilterValue = format.parse({ value: new Date(splittedDate[2], splittedDate[1] - 1, splittedDate[0]), type: dateformat });
                        //dateToFilterValue_server = parseDateBasedOnUserPreference(context.request.parameters.dateTo, true, true, false);
                        //log.debug("ouu_approval_v2", "dateToFilterValue_server=" + dateToFilterValue_server);
                        //dateToFilterValue_server = parseDateBasedOnUserPreference(context.request.parameters.dateTo, true, false, false);
                        //log.debug("ouu_approval_v2", "dateToFilterValue_server=" + dateToFilterValue_server);
                        //dateToFilterValue_server = parseDateBasedOnUserPreference(context.request.parameters.dateTo, false, true, false);
                        //log.debug("ouu_approval_v2", "dateToFilterValue_server=" + dateToFilterValue_server);
                        //dateToFilterValue_server = parseDateBasedOnUserPreference(context.request.parameters.dateTo, false, false, true);
                        //log.debug("ouu_approval_v2", "dateToFilterValue_server=" + dateToFilterValue_server);
                    }

                    if (context.request.parameters.dateFrom) {
                        filters.push("AND");
                        if (context.request.parameters.dateTo) {
                            filters.push(["custrecord_tsa_ouu_date", "within", dateFromFilterValue, dateToFilterValue]);
                            defaultValues['custpage_dateto_filter'] = dateToFilterValue;
                        }
                        else {
                            filters.push(["custrecord_tsa_ouu_date", "onorafter", dateFromFilterValue]);
                        }
                        defaultValues['custpage_datefrom_filter'] = dateFromFilterValue;
                    }
                    else if (context.request.parameters.dateTo) {
                        filters.push("AND");
                        filters.push(["custrecord_tsa_ouu_date", "onorbefore", dateToFilterValue]);
                        defaultValues['custpage_dateto_filter'] = dateToFilterValue;
                    }

                    //Owner and Unit filters' default values will be set later
                    //Owner filter
                    var filterForFilters = filters.slice();//Deep copy
                    if (context.request.parameters.owner) {
                        filters.push("AND");
                        filters.push(["formulatext: {owner}", "contains", context.request.parameters.owner]);
                    }

                    //Unit filter
                    if (context.request.parameters.unit) {
                        filters.push("AND");
                        filters.push(["custrecord_tsa_ouu_unit", "anyof", context.request.parameters.unit]);
                    }

                    //Populate the list
                    var customrecord_tsa_ouu_groupSearchObj = search.create({
                        type: "customrecord_tsa_ouu_group",
                        filters: filters,
                        columns:
                            [
                                search.createColumn({ name: "internalid", sort: search.Sort.ASC, label: "Id" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_approval_status", label: "Approval Status" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_bank_acc", label: "Bank Account" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_account", label: "Account" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_inc_exp", label: "Income/Expense" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_debit", label: "Debit Amount" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_credit", label: "Credit Amount" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_currency", label: "Currency" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_date", label: "Date" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_department", label: "Department" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_error_desc", label: "Error Description" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_error", label: "Error?" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_lin_journal", label: "Linked Journal" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_memo", label: "Memo" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_processed", label: "Processed" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_project", label: "Project" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_rp", label: "Related Party" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_rp_type", label: "Related Party Type" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_reserve", label: "Reserve" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_subsidiary", label: "Subsidiary" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_unit", label: "Unit" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_unit_type", label: "Unit Type" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_usage", label: "Usage" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_amount", label: "Amount" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_bank_pay_type", label: "Bank Pay Type" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_offset_account", label: "Offset Account" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_offset_reserve", label: "Offset Reserve" }),
                                search.createColumn({ name: "custrecord_tsa_ouu_offset_bank", label: "Offset Bank" }),
                                search.createColumn({ name: "owner", label: "Owner" })
                            ]
                    });
                    var i = -1;
                  	var searchResultCount = customrecord_tsa_ouu_groupSearchObj.runPaged().count;
					log.debug("","transactionSearchObj result count="+searchResultCount);
                    customrecord_tsa_ouu_groupSearchObj.run().each(function (result) {
                        //log.debug("",JSON.stringify(result));
                        var internalid = result.getValue({ name: 'internalid' });
                        var date = result.getValue({ name: 'custrecord_tsa_ouu_date' });
                        var appr_status = result.getValue({ name: 'custrecord_tsa_ouu_approval_status' });
                        var bank_acc = result.getValue({ name: 'custrecord_tsa_ouu_bank_acc' });
                        var account = result.getValue({ name: 'custrecord_tsa_ouu_account' });
                        var inc_exp = result.getValue({ name: 'custrecord_tsa_ouu_inc_exp' });
                        var currency = result.getValue({ name: 'custrecord_tsa_ouu_currency' });
                        var department = result.getValue({ name: 'custrecord_tsa_ouu_department' });
                        var error_desc = result.getValue({ name: 'custrecord_tsa_ouu_error_desc' });
                        var error_flag = result.getValue({ name: 'custrecord_tsa_ouu_error' });
                        var linked_jrnl = result.getValue({ name: 'custrecord_tsa_ouu_lin_journal' });
                        var memo = result.getValue({ name: 'custrecord_tsa_ouu_memo' });
                        var processed = result.getValue({ name: 'custrecord_tsa_ouu_processed' });
                        var project = result.getValue({ name: 'custrecord_tsa_ouu_project' });
                        var rel_party = result.getValue({ name: 'custrecord_tsa_ouu_rp' });
                        var rp_type = result.getValue({ name: 'custrecord_tsa_ouu_rp_type' });
                        var reserve = result.getValue({ name: 'custrecord_tsa_ouu_reserve' });
                        var subsidiary = result.getValue({ name: 'custrecord_tsa_ouu_subsidiary' });
                        var unit = result.getValue({ name: 'custrecord_tsa_ouu_unit' });
                        var unit_type = result.getValue({ name: 'custrecord_tsa_ouu_unit_type' });
                        var usage = result.getValue({ name: 'custrecord_tsa_ouu_usage' });
                        var amount = result.getValue({ name: 'custrecord_tsa_ouu_amount' });
                        var bank_p_type = result.getValue({ name: 'custrecord_tsa_ouu_bank_pay_type' });
                        var owner = result.getValue({ name: 'owner' });
                      
                      	if(owner==user) return true;
						i++;
                      
                        var appr_status = result.getText({ name: 'custrecord_tsa_ouu_approval_status' });
                        var bank_acc = result.getText({ name: 'custrecord_tsa_ouu_bank_acc' });
                        var account = result.getText({ name: 'custrecord_tsa_ouu_account' });
                        var inc_exp = result.getText({ name: 'custrecord_tsa_ouu_inc_exp' });
                        var currency = result.getText({ name: 'custrecord_tsa_ouu_currency' });
                        var department = result.getText({ name: 'custrecord_tsa_ouu_department' });
                        var error_desc = result.getText({ name: 'custrecord_tsa_ouu_error_desc' });
                        var error_flag = result.getText({ name: 'custrecord_tsa_ouu_error' });
                        //var linked_jrnl = result.getText({ name: 'custrecord_tsa_ouu_lin_journal' });
                        var processed = result.getText({ name: 'custrecord_tsa_ouu_processed' });
                        var project = result.getText({ name: 'custrecord_tsa_ouu_project' });
                        var rel_party = result.getText({ name: 'custrecord_tsa_ouu_rp' });
                        var rp_type = result.getText({ name: 'custrecord_tsa_ouu_rp_type' });
                        var reserve = result.getText({ name: 'custrecord_tsa_ouu_reserve' });
                        var subsidiary = result.getText({ name: 'custrecord_tsa_ouu_subsidiary' });
                        var unit = result.getText({ name: 'custrecord_tsa_ouu_unit' });
                        var unit_type = result.getText({ name: 'custrecord_tsa_ouu_unit_type' });
                        var usage = result.getText({ name: 'custrecord_tsa_ouu_usage' });
                        var bank_p_type = result.getText({ name: 'custrecord_tsa_ouu_bank_pay_type' });
                        var offset_acc = result.getText({ name: 'custrecord_tsa_ouu_offset_account' });
                        var offset_rsrv = result.getText({ name: 'custrecord_tsa_ouu_offset_reserve' });
                        var offset_bank = result.getText({ name: 'custrecord_tsa_ouu_offset_bank' });
                        var owner = result.getText({ name: 'owner' });
                        var link = "https://" + accountId + ".app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=578&id=" + internalid + "&amp;whence=";
                        //var owner 		= result.getText({ name: 'owner' });						
                        //log.debug("","rel_party="+rel_party);

                        //var link = "https://" + accountId + ".app.netsuite.com/app/accounting/transactions/transaction.nl?id=" + internalId + "&amp;whence=";

                        sublist.setSublistValue({ id: "custpage_checked", value: "F", line: i });
                        sublist.setSublistValue({ id: 'custpage_link_url', value: link, line: i });
                        sublist.setSublistValue({ id: 'custpage_internalid', value: internalid, line: i });
                        sublist.setSublistValue({ id: 'custpage_date', value: date, line: i });
                        if (appr_status) sublist.setSublistValue({ id: 'custpage_approval_status', value: appr_status, line: i });
                        if (memo) sublist.setSublistValue({ id: 'custpage_memo', value: memo, line: i });
                        if (bank_p_type) sublist.setSublistValue({ id: 'custpage_bank_pay_type', value: bank_p_type, line: i });
                        if (bank_acc) sublist.setSublistValue({ id: 'custpage_bank_account', value: bank_acc, line: i });
                        if (usage) sublist.setSublistValue({ id: 'custpage_usage', value: usage, line: i });
                        if (inc_exp) sublist.setSublistValue({ id: 'custpage_inc_exp', value: inc_exp, line: i });
                        if (amount) sublist.setSublistValue({ id: 'custpage_amount', value: amount, line: i });
                        if (currency) sublist.setSublistValue({ id: 'custpage_currency', value: currency, line: i });
                        if (unit) sublist.setSublistValue({ id: 'custpage_unit', value: unit, line: i });
                        if (rel_party) sublist.setSublistValue({ id: 'custpage_related_party', value: rel_party, line: i });
                        if (error_flag) sublist.setSublistValue({ id: 'custpage_error', value: error_flag, line: i });
                        if (error_desc) sublist.setSublistValue({ id: 'custpage_error_desc', value: error_desc, line: i });
                        if (offset_acc) sublist.setSublistValue({ id: 'custpage_offset_acc', value: offset_acc, line: i });
                        if (offset_rsrv) sublist.setSublistValue({ id: 'custpage_offset_rsrv', value: offset_rsrv, line: i });
                        if (offset_bank) sublist.setSublistValue({ id: 'custpage_offset_bank', value: offset_bank, line: i });
                        if (owner) sublist.setSublistValue({ id: 'custpage_owner', value: owner, line: i });


                        // hidden fields 
                        sublist.setSublistValue({ id: 'custpage_internalid_h', value: internalid, line: i });
                        if (appr_status) sublist.setSublistValue({ id: 'custpage_approval_status_h', value: appr_status, line: i });
                        if (memo) sublist.setSublistValue({ id: 'custpage_memo_h', value: memo, line: i });


                        return true;
                    });

                    //Populate and set unit filter
                    var unitSearchObj = search.create({
                        type: "customrecord_tsa_ouu_group", filters: filterForFilters,
                        columns: [search.createColumn({ name: "custrecord_tsa_ouu_unit", label: "Unit", summary: "GROUP" })]
                    });
                    unitSearchObj.run().each(function (result) {
                        unitFilterField.addSelectOption({ value: result.getValue({ name: 'custrecord_tsa_ouu_unit', summary: "GROUP" }), text: result.getText({ name: 'custrecord_tsa_ouu_unit', summary: "GROUP" }) });
                        return true;
                    });
                    if (context.request.parameters.unit) {
                        defaultValues['custpage_unit_filter'] = context.request.parameters.unit;
                    }

                     //Populate and set owner filter
                    var ownerSearchObj = search.create({
                        type: "customrecord_tsa_ouu_group", filters: filterForFilters,
                        columns: [search.createColumn({ name: "owner", label: "Owner", summary: "GROUP" })]
                    });
                    ownerSearchObj.run().each(function (result) {
                        ownerFilterField.addSelectOption({ value: result.getText({ name: 'owner', summary: "GROUP" }), text: result.getText({ name: 'owner', summary: "GROUP" }) });
                        return true;
                    });                    
                    if (context.request.parameters.owner) {
                        defaultValues['custpage_owner_filter'] = context.request.parameters.owner;
                    }

                    form.updateDefaultValues(defaultValues);

                    log.debug("ouu_approval_v2", "filters=" + filters);

                    if(enable_approve_button) form.addSubmitButton({ label: "Approve" });

                    log.debug("ouu_approval_v2", "Script finished");

                    context.response.writePage(form);
                }
                catch (e) {
                    log.debug("Error", 'Message: ' + e);
                }
                finally {
                }

            }
            else if (context.request.method == 'POST'){
				try {
					log.debug("ouu_approval_v2 POST", "Script started - POST ");

					var request = context.request;
                    var sublist_data = request.parameters.custpage_sublistdata;
					var sublist_lines = sublist_data.split("\u0002");
					var recordLineCount = sublist_lines.length;
					var selectedSearch = request.parameters.custpage_saved_searches;
					log.debug("ouu_approval_v2 POST", "recordLineCount:" + recordLineCount);
					//log.debug("ouu_approval_v2 POST", "selectedSearch:" + selectedSearch);

                    //Find all marked line and check if their statuses are Pending Approve yet
                    var filterInternalIds = [];
                    var internalIdsToApprove = [];
                    for (var i = 0; i < recordLineCount; i++) {
                        var fields = sublist_lines[i].split("\u0001");
                        log.debug("ouu_approval_v2 POST", "fields=" + JSON.stringify(fields));
                        var isChecked = fields[0];
                        if (isChecked == "T" && fields[2]) {
                            filterInternalIds.push(parseInt(fields[2]));
                        }
                    }
                    
                    search.create({ 							// search condition filters the selected lines on "pending approval" status
                        type: "customrecord_tsa_ouu_group",
                        filters:
                            [
                                ["custrecord_tsa_ouu_approval_status", "anyof", "2"],
                                "AND",
                                ["internalid", "anyof", filterInternalIds]
                            ],
                        columns: [ search.createColumn({ name: "internalid", sort: search.Sort.ASC, label: "Id" }) ]
                    }).run().each(function (result) {
                        var internalid = result.getValue({ name: 'internalid' });
                        internalIdsToApprove.push(internalid);
                        return true;
                        });

                    log.debug("ouu_approval_v2 POST", "internalIdsToApprove:" + internalIdsToApprove);

                    //Approve lines
                    for (var i = 0; i < internalIdsToApprove.length; i++) {
                        try {

                            log.debug("ouu_approval_v2 - POST", "Update internalId:" + internalIdsToApprove[i]);

                            logGovernanceMonitoring("Update");

                            var rid=record.submitFields({
                            	type: "customrecord_tsa_ouu_group",
                            	id: internalIdsToApprove[i],
                            	values: {
                            		custrecord_tsa_ouu_approval_status: 3
                            	},
                            	options: {
                            		enableSourcing: false,
                            		ignoreMandatoryFields: true
                            	}
                            });

                            log.debug("ouu_approval_v2 POST", "after submitfield - internalId:" + internalIdsToApprove[i] + ", rid=" + rid);
                        }
                        catch (e) {
                            log.debug("ouu_approval_v2 POST", "internalId:" + internalIdsToApprove[i] + " - Error:" + e.message);
                        }
                    }

					log.debug("ouu_approval_v2 POST", "Initiate Scheduled task to Process OUU records.");					
					var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
					scriptTask.scriptId = 'customscript_tsa_vs_sc_offline_upload_ss';
					//scriptTask.params = {custscript_rsm_bill_id: context.newRecord.id};
					var scriptTaskId = scriptTask.submit();
					log.debug("ouu_approval_v2 POST", "Task id="+scriptTaskId);

					redirect.toSuitelet({ scriptId: 'customscript_tsa_ouu_approval', deploymentId: 'customdeploy_tsa_ouu_approval' }); //, parameters: { 'selected_search': selectedSearch }
				}
				catch (e) {
					log.debug("Error", 'Message: ' + e);
				}
				finally {
				}
			}
            
        }

        function logGovernanceMonitoring(caller) {
            var script = runtime.getCurrentScript();
            log.debug("ouu_approval_v2::logGovernanceMonitoring", caller + " - Remaining Usage = " + script.getRemainingUsage());
        }

        function addCommas(nStr) {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }


        var dateFormatMapping;
        var inputDateFormatProps;
        var outputDateFormatProps;
        /**
        * Converts a Date to a given format and type. 
        * Month in Date to convert must be start by 1 not 0. Fe. in case of January: 1, 01, Jan, January. IMPORTANT! Only English Month names can be used.
        * In input and output format you can use the following: 
        *      Separators: '/' ; '.' ; '-' ; ', ' Last separator contains a space char too!
        *      Expressions: 'D' ; 'DD' ; 'M' ; 'MM' ; 'Mon' ; 'MONTH' ; 'YYYY' 
        *
        * @param {Object} date - Date or String. (Fe.: new Date() OR "2022.Feb.01")
        * @param {String} inputFormat - Used only when date parameter's type is String. You can use "User Preference" only at server side. (Fe.: "YYYY.Mon.DD", "User Preference")
        * @param {String} outputType - Possible values are: "String" or "Date"
        * @param {String} outputFormat - Used only when outputType is String. You can use "User Preference" only at server side. (Fe.: "YYYY.Mon.DD", "User Preference")
        * @param {Integer} addDay - Day(s) to add to input date.
        * @param {Integer} addMonth - Month(s) to add to input date.
        * @param {Integer} addYear - Year(s) to add to input date.
        * @Since 2015.2
        */
        function parseDateBasedOnUserPreference(date, inputFormat, outputType, outputFormat, addDay, addMonth, addYear) {

            //Define possible date format conversions at first call
            if (!dateFormatMapping) {
                dateFormatMapping = [];
                dateFormatMapping["D"] = { values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"] };
                dateFormatMapping["DD"] = { values: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"] };
                dateFormatMapping["M"] = { values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]};
                dateFormatMapping["MM"] = { values: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] };
                dateFormatMapping["MON"] = { values: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
                dateFormatMapping["MONTH"] = { values: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
            }

            var inputType = (typeof date.getMonth === 'function') ? "Date" : "String";
            inputFormat = inputType == "Date" ? "" : inputFormat.toUpperCase();
            outputFormat = outputType == "Date" ? "" : outputFormat.toUpperCase();

            log.debug("createDateFormatProp()", "date=" + date + ", inputType=" + inputType + ", inputFormat=" + inputFormat + ", outputType=" + outputType + ", outputFormat=" + outputFormat
                + ", addDay=" + addDay + ", addMonth=" + addMonth + ", addYear=" + addYear);

            //Init Date formats to use. 
            var userPreferenceFormat;
            if (typeof config !== 'undefined') {
                var companyInfo = config.load({ type: config.Type.USER_PREFERENCES });
                userPreferenceFormat = companyInfo.getValue({ fieldId: 'DATEFORMAT' }).toUpperCase();
                inputFormat = inputFormat == "USER PREFERENCE" ? userPreferenceFormat : inputFormat;
                outputFormat = outputFormat == "USER PREFERENCE" ? userPreferenceFormat : outputFormat;

                if (inputFormat == "USER PREFERENCE" || outputFormat == "USER PREFERENCE") {
                    log.debug("createDateFormatProp()", "In a client side script you cannot use 'user preference' format");
                    return "";
                }
            }
            else if (inputFormat == "USER PREFERENCE" || outputFormat == "USER PREFERENCE") {
                log.debug("createDateFormatProp()", "In a client side script you cannot use 'user preference' format");
                return "";
            }

            //If format doesn't changes use previously processed values
            if (inputFormat.length > 0) {
                inputDateFormatProps = createDateFormatProp(inputFormat, inputDateFormatProps);
                //log.debug("parseDateBasedOnUserPreference()", "inputFormat=" + inputFormat + ", inputDateFormatProps=" + JSON.stringify(inputDateFormatProps));
            }

            if (outputFormat.length > 0) {
                outputDateFormatProps = createDateFormatProp(outputFormat, outputDateFormatProps);
                //log.debug("parseDateBasedOnUserPreference()", "outputFormat=" + outputFormat + ", outputDateFormatProps=" + JSON.stringify(outputDateFormatProps));
            }

            //If input type is String, convert it to Date 
            var outputDate;
            if (inputType.toLowerCase() == "date") {
                outputDate = date;
            }
            else {

                var splittedDate = date.replace(".", "/").replace(".", "/").replace(/-/g, "/").replace(/, /g, "/").split("/");
                var day = splittedDate[inputDateFormatProps.dayPosition];
                var month = splittedDate[inputDateFormatProps.monthPosition];
                var year = splittedDate[inputDateFormatProps.yearPosition];

                //Convert to integer
                day = day[0] == 0 ? day[1] : day;//Remove leading zeros
                monthIndex = dateFormatMapping[inputDateFormatProps.monthFormat].values.indexOf(month);//Converts month to 0 based integer

                //Create new date
                outputDate = new Date(parseInt(year), parseInt(monthIndex), parseInt(day));
            }

            //Modifiy date if asked by parameter
            if (addDay && addDay > 0) { outputDate.setDate(outputDate.getDate() + addDay); }
            if (addMonth && addMonth > 0) { outputDate.setMonth(outputDate.getMonth() + addMonth); }
            if (addYear && addYear > 0) { outputDate.setFullYear(outputDate.getFullYear() + addYear); }

            //If output type is Date lets return
            if (outputType.toLowerCase() == "date") {
                log.debug("parseDateBasedOnUserPreference()", "Return outputDate=" + outputDate);
                return outputDate;
            }
            //log.debug("parseDateBasedOnUserPreference()", "outputDate=" + outputDate);

            //Create return date string in the asked format
            var outputDateStr = outputFormat;
            outputDateStr = outputDateStr.replace(outputDateFormatProps.dayFormat, dateFormatMapping[outputDateFormatProps.dayFormat].values[outputDate.getDate() - 1]);
            outputDateStr = outputDateStr.replace(outputDateFormatProps.monthFormat, dateFormatMapping[outputDateFormatProps.monthFormat].values[outputDate.getMonth()]);
            outputDateStr = outputDateStr.replace(outputDateFormatProps.yearFormat, outputDate.getFullYear());

            log.debug("parseDateBasedOnUserPreference()", "outputDateStr=" + outputDateStr);

            return outputDateStr;
        }

        function createDateFormatProp(dateFormat, dateFormatProps) {

            if (!dateFormatProps || dateFormatProps.dateFormat != dateFormat) {

                dateFormatProps = {};
                dateFormatProps.dateFormat = dateFormat;

                var unifiedDateFormat = dateFormat.replace(".", "/").replace(".", "/").replace(/-/g, "/").replace(/, /g, "/").split("/");
                dateFormatProps.dayFormat = unifiedDateFormat[0][0] == "D" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "D" ? unifiedDateFormat[1] : unifiedDateFormat[2]);
                dateFormatProps.monthFormat = unifiedDateFormat[0][0] == "M" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "M" ? unifiedDateFormat[1] : unifiedDateFormat[2]);
                dateFormatProps.yearFormat = unifiedDateFormat[0][0] == "Y" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "Y" ? unifiedDateFormat[1] : unifiedDateFormat[2]);

                dateFormatProps.dayPosition = unifiedDateFormat[0][0] == "D" ? 0 : (unifiedDateFormat[1][0] == "D" ? 1 : 2);
                dateFormatProps.monthPosition = unifiedDateFormat[0][0] == "M" ? 0 : (unifiedDateFormat[1][0] == "M" ? 1 : 2);
                dateFormatProps.yearPosition = unifiedDateFormat[0][0] == "Y" ? 0 : (unifiedDateFormat[1][0] == "Y" ? 1 : 2);
            }
            return dateFormatProps;
        }

        return {
            onRequest: onRequest
        };

    });