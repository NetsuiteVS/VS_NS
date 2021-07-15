/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_get_approval_users_sl2.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     
 * 
 * Date:        15/04/2021
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction', 'N/currency'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction, currency) {

        var TXN_RELATED_PROPERTIES = [];

        TXN_RELATED_PROPERTIES["Advance"] = { recordType: "customtransaction_tsa_iou2", employeeFieldName: "custbody_tsa_iouemp", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Advance
        TXN_RELATED_PROPERTIES["TSA Expense"] = { recordType: "customtransaction_tsa_non_s_expense", employeeFieldName: "", normalStatuses: ["Pending Approval"], hodStatuses: [] };//TSA Expense        
        TXN_RELATED_PROPERTIES["TSA Income"] = { recordType: "customtransaction_tsa_nonsalesincome", employeeFieldName: "", normalStatuses: ["Pending Review"], hodStatuses: [] };//TSA Income                
        TXN_RELATED_PROPERTIES["TSA Interunit"] = { recordType: "customtransaction_tsa_unit_intracompany", employeeFieldName: "custbody_tsa_vs_created_by", normalStatuses: ["Pending Approval"], hodStatuses: [] };//TSA Interunit        
        TXN_RELATED_PROPERTIES["TSA Unit Expense"] = { recordType: "customtransaction_tsa_unit_expense", employeeFieldName: "custbody_tsa_vs_created_by", normalStatuses: ["Pending Approval"], hodStatuses: [] };//TSA Unit Expense        
        TXN_RELATED_PROPERTIES["Expense Claim"] = { recordType: record.Type.EXPENSE_REPORT, employeeFieldName: "entity", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Expense Claim        
        TXN_RELATED_PROPERTIES["Journal"] = { recordType: record.Type.JOURNAL_ENTRY, employeeFieldName: "", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Journal        
        TXN_RELATED_PROPERTIES["Supplier invoice"] = { recordType: record.Type.VENDOR_BILL, employeeFieldName: "custbody_tsa_vs_created_by", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Supplier invoice        
        TXN_RELATED_PROPERTIES["Supplier invoice payment"] = { recordType: record.Type.VENDOR_PAYMENT, employeeFieldName: "custbody_tsa_vs_created_by", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Supplier invoice payment        
        TXN_RELATED_PROPERTIES["Purchase Order"] = { recordType: record.Type.PURCHASE_ORDER, employeeFieldName: "employee", normalStatuses: ["Pending Approval", "Pending Approval - HOD Reviewed"], hodStatuses: ["Pending HOD Review"] };//Purchase Order  
//Pending Supervisor Approval
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(scriptContext) {

            //#region ******************************  GET  ************************************* 

            if (scriptContext.request.method == 'GET') {
                try {

                    log.debug("get_approval_users::GET", "STARTED");

                    var TEST_MODE = false;
                    var HOD_ROLE_CATEGORY_ID = 12;//TSA Head of Department
                    var BASE_CURRENCY = "GBP";
                    var response = { normalApproval: [], hodApproval: [] };
                    var request = scriptContext.request;
                    var txn0;
                    if (TEST_MODE) {
                        try {
                            txn0 = JSON.parse(request.parameters.txn);
                            var summaryEmail = request.parameters.summary_email ? true : false;
                        }
                        catch (e) {
                            txn0 = JSON.parse('{ "type": "Purchase Order", "tranId": "PO-KYE#69", "internalId": "414997", "trandate": "23/01/2021", "entity": "Amu Press Ltd", "memo": "null", "total": "150000.00", "status": "Pending Supervisor Approval"}');
                            var summaryEmail = false;
                        }
                    }
                    else {
                        txn0 = JSON.parse(request.parameters.txn);
                        var summaryEmail = request.parameters.summary_email ? true : false;
                    }
                    var transactionType = search.lookupFields({ type: search.Type.TRANSACTION, id: txn0.internalId, columns: 'type' }).type[0].text;
					var txnRecord = record.load({ type: TXN_RELATED_PROPERTIES[transactionType].recordType, id: txn0.internalId, isDynamic:true });
                    //try {
                    //}
                    /*catch (e) {
                        log.error("send_approval_mail::execute - ERROR", "TranId=" + txn0.tranId + ". " + e.message);
                        scriptContext.response.write(JSON.stringify(response));
                        return true;
                    }*/

                    log.debug("send_approval_mail::execute", "summaryEmail=" + summaryEmail + ", internalId=" + txn0.internalId + ", type=" + transactionType + ", recordType=" + TXN_RELATED_PROPERTIES[transactionType].recordType + ", txn0.wf_new_status=" + txn0.wf_new_status);
                  
                    var txn = {
                        type: txnRecord.getValue('type'),
                        typeTxt: txnRecord.getValue('baserecordtype'),
                        typeNumeric: txnRecord.getValue('ntype'),
                        tranId: txnRecord.getValue('tranid'),
                        internalId: txnRecord.id,
                        currency: txnRecord.getText('currency'),
                        total: parseFloat(txnRecord.getValue('custbody_tsa_total_base_curr') || 0.0),
                        subsidiary: txnRecord.getValue('subsidiary'),
                        department: txnRecord.getValue('department'),
                        unit: txnRecord.getValue('class'),
                        status: txnRecord.getText('status'),
                        custStatus: txnRecord.getText('custbody_tsa_cust_aprov_stat'),
                        mixedStatus: undefined,
                        custbody_tsa_iouemp: txnRecord.getValue('custbody_tsa_iouemp'),
                        custbody_tsa_vs_created_by: txnRecord.getValue('custbody_tsa_vs_created_by'),
                        employee: txnRecord.getValue('employee'),
                        entity: txnRecord.getValue('entity')
                    };

                    txn.mixedStatus = (txn.type.indexOf("custom") > -1) ? txn.status : (txn.custStatus || "").trim(); //custRecordStatus could contains extra spaces Fe.: "Pending Approval "
                  	// in case of custom txn, the standard status field is used, with standard txns the custom status is used 
                    if (txn0.wf_new_status) txn.mixedStatus = txn0.wf_new_status;

                    txn.properties = TXN_RELATED_PROPERTIES[transactionType];
                    txn.typeDependentEmployeeId = txn.hasOwnProperty(txn.properties.employeeFieldName) ? txn[txn.properties.employeeFieldName] : undefined;


                    log.debug("get_approval_users::GET", "txn=" + JSON.stringify(txn));

                    var employeeRoleCategoryFilter = [];
                    var typeOfApprovalIsHOD = true;

                    //Get type of approve
                    if (txn.properties.normalStatuses.indexOf(txn.mixedStatus) > -1) {
                        typeOfApprovalIsHOD = false;
                    }
                    else if (txn.properties.hodStatuses.indexOf(txn.mixedStatus) == -1) {
                        log.debug("get_approval_users::GET", "FINISHED - Status is not registered:" + txn.mixedStatus);
                        scriptContext.response.write(JSON.stringify(response));
                        return true;
                    }
                    log.debug("get_approval_users::GET", "typeOfApprovalIsHOD=" + typeOfApprovalIsHOD);

                    //Load approval matrix and its main row
                    var approvalMatrix = [];
                    var approvalMatrixMainRow;//Row from the matrix where role=HOD and type=txn.type
                    var customrecord_tsa_vs_approval_matrixSearchObj = search.create({
                        type: "customrecord_tsa_vs_approval_matrix",
                        filters: [["custrecord_tsa_vs_transaction_type", "anyof", txn.typeNumeric]],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_tsa_vs_transaction_type", label: "Transaction Type" }),
                                search.createColumn({ name: "custrecord_tsa_vs_role_category", label: "Role Category" }),
                                search.createColumn({ name: "custrecord_tsa_vs_normal_approval", label: "Noraml Approval" }),
                                search.createColumn({ name: "custrecord_tsa_vs_hod_review", label: "HOD Review" }),
                                search.createColumn({ name: "custrecord_tsa_vs_limit", label: "Limit" }),
                                search.createColumn({ name: "custrecord_tsa_vs_department_check", label: "Department Check" }),
                                search.createColumn({ name: "custrecord_tsa_vs_unit_check", label: "Unit Check" }),
                                search.createColumn({ name: "custrecord_tsa_vs_supervisor", label: "Supervisor" }),
                                search.createColumn({ name: "custrecord_tsa_vs_created_by_supervisor", label: "Created by Supervisor" }),
                                search.createColumn({ name: "custrecord_tsa_vs_employee_hod", label: "Employee HOD" }),
                                search.createColumn({ name: "custrecord_tsa_vs_approval_freq", label: "Approval Frequency" })
                            ]
                    });
					
                    customrecord_tsa_vs_approval_matrixSearchObj.run().each(function (result) {
                        var roleCategory = result.getValue({ name: 'custrecord_tsa_vs_role_category', label: "Role Category"  });
                        approvalMatrix[roleCategory] = {
                            type: result.getValue({ name: 'custrecord_tsa_vs_transaction_type' }),
                            roleCategory: roleCategory,
                            normalApprovalEnabled: result.getValue({ name: 'custrecord_tsa_vs_normal_approval' }) || false,
                            hodReviewEnabled: result.getValue({ name: 'custrecord_tsa_vs_hod_review' }) || false,
                            limitCheckEnabled: result.getValue({ name: 'custrecord_tsa_vs_limit' }) || false,
                            departmentCheckEnabled: result.getValue({ name: 'custrecord_tsa_vs_department_check' }) || false,
                            unitCheckEnabled: result.getValue({ name: 'custrecord_tsa_vs_unit_check' }) || false,
                            mailToSupervisor: result.getValue({ name: 'custrecord_tsa_vs_supervisor' }) || false,
                            mailToCreatedBySupervisor: result.getValue({ name: 'custrecord_tsa_vs_created_by_supervisor' }) || false,
                            mailToEmployeeHod: result.getValue({ name: 'custrecord_tsa_vs_employee_hod' }) || false,
                            approvalFrequency: result.getValue({ name: 'custrecord_tsa_vs_approval_freq' }) || ""
                        };

                        //Create employee roleCategory filter. Add roleCategories which are enabled based on the Approval Type and the settings in the Matrix 
                        if (!typeOfApprovalIsHOD && approvalMatrix[roleCategory].normalApprovalEnabled || typeOfApprovalIsHOD && approvalMatrix[roleCategory].hodReviewEnabled) {
                            employeeRoleCategoryFilter.push(roleCategory);
                        }

                        //Set main row
                        if (approvalMatrix[roleCategory].roleCategory == HOD_ROLE_CATEGORY_ID) {
                            approvalMatrixMainRow = approvalMatrix[roleCategory];
                        }

                        log.debug("get_approval_users::GET", "approvalMatrix[" + roleCategory + "]=" + JSON.stringify(approvalMatrix[roleCategory]));

                        return true;
                    });

                    if (approvalMatrix.length == 0) {
                        log.debug("get_approval_users::GET", "FINISHED - Txn type has no matrix records:" + txn.type);
                        scriptContext.response.write(JSON.stringify(response));
                        return true;
                    }

                    log.debug("get_approval_users::GET", "employeeRoleCategoryFilter=" + employeeRoleCategoryFilter);
                    log.debug("get_approval_users::GET", "approvalMatrixMainRow=" + JSON.stringify(approvalMatrixMainRow));

                    //Get txn Employee and find it's related mail addresses if neccessary (supervisor, hod, created by supervisor)
                    if (!typeOfApprovalIsHOD && txn.properties.employeeFieldName.length > 0
                        && (approvalMatrixMainRow.mailToSupervisor || approvalMatrixMainRow.mailToCreatedBySupervisor || approvalMatrixMainRow.mailToEmployeeHod)) {

                        log.debug("get_approval_users::GET", "txn.typeTxt=" + txn.typeTxt + ", txn.internalId=" + txn.internalId + ", employeeFieldName=" + txn.properties.employeeFieldName + ", txn.typeDependentEmployeeId=" + txn.typeDependentEmployeeId);

                        if (txn.typeDependentEmployeeId) {
                            log.debug("get_approval_users::GET", "mailToSupervisor=" + approvalMatrixMainRow.mailToSupervisor + ", mailToCreatedBySupervisor=" + approvalMatrixMainRow.mailToCreatedBySupervisor + ", mailToEmployeeHod=" + approvalMatrixMainRow.mailToEmployeeHod);

                            if (approvalMatrixMainRow.mailToEmployeeHod) {
                                var txnEmployeesDepartment = search.lookupFields({ type: 'employee', id: txn.typeDependentEmployeeId, columns: 'department' });

                                if (txnEmployeesDepartment && txnEmployeesDepartment.department.length > 0) {
                                    log.debug("get_approval_users::GET", "txnEmployeesDepartment value=" + txnEmployeesDepartment.department[0].value + ", text=" + txnEmployeesDepartment.department[0].text);

                                    var mailToEmployeeHodSearchObj = search.create({
                                        type: "employee",
                                        filters: [["department", "anyof", txnEmployeesDepartment.department[0].value], "AND",
                                            ["role.custrecord_tsa_role_category", "anyof", HOD_ROLE_CATEGORY_ID], "AND",
                                            ["custentity_excude_reminder_email", "is", "F"]],
                                        columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                                    });
                                    log.debug("get_approval_users::GET", "mailToEmployeeHodSearchObj result count=" + mailToEmployeeHodSearchObj.runPaged().count);
                                    mailToEmployeeHodSearchObj.run().each(function (result) {
                                        var internalid = result.getValue({ name: 'internalid' });
                                        log.debug("get_approval_users::GET", "HOD(1) MAIL TO: txnEmployeesDepartment=" + txnEmployeesDepartment.department[0].value + ", internalid=" + internalid);
                                        response.hodApproval.push(internalid);
                                        return false;
                                    });
                                }
                            }
                            else {
                                var txnEmployeesSupervisor = search.lookupFields({ type: 'employee', id: txn.typeDependentEmployeeId, columns: 'supervisor' });
                                if (txnEmployeesSupervisor && txnEmployeesSupervisor.supervisor.length > 0) {
                                    log.debug("get_approval_users::GET", "NORMAL(1) MAIL TO: txnEmployeesSupervisor value=" + txnEmployeesSupervisor.supervisor[0].value + ", text=" + txnEmployeesSupervisor.supervisor[0].text);
                                    response.normalApproval.push(txnEmployeesSupervisor.supervisor[0].value);
                                }
                            }
                        }
                    }

                    if (employeeRoleCategoryFilter.length > 0) {
                        var employeeSearchObj2 = search.create({
                            type: "employee",
                            filters: [["subsidiary", "anyof", txn.subsidiary], "AND",
                                ["role.custrecord_tsa_role_category", "anyof", employeeRoleCategoryFilter], "AND",
                                ["custentity_excude_reminder_email", "is", "F"]],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_tsa_role_category", join: "role", label: "Role Category" }),
                                    search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                                    search.createColumn({ name: "department", label: "Department" }),
                                    search.createColumn({ name: "custentity_tsa_hod_rev_app_dep", label: "hod department" }),
                                    search.createColumn({ name: "class", label: "Unit" }),
                                    search.createColumn({ name: "purchaseorderapprovallimit", label: "Purchase Limit" }),
                                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                                    search.createColumn({ name: "currency", join: "subsidiary", label: "Currency" })
                                ]
                            //settings:[ search.createSetting({name: 'consolidationtype',value:'NONE'}) ] // you can't use this with the employee record
                        });
                        log.debug("get_approval_users::GET", "employeeSearchObj2 result count=" + employeeSearchObj2.runPaged().count);
                        //var exchange_rate=0.0000;
                        employeeSearchObj2.run().each(function (result) {
                            var employeeRoleCategory = result.getValue({ name: "custrecord_tsa_role_category", join: "role" });
                            var employeeId = result.getValue({ name: 'internalid' });
                            var employeeSubsidiary = result.getValue({ name: 'subsidiary' });
                            var employeeDepartment = result.getValue({ name: 'department' });
                            var tmp01 = result.getValue({ name: 'custentity_tsa_hod_rev_app_dep' });
                            var employeeHOD_department = tmp01.split(",");
                            var employeeUnit = result.getValue({ name: 'class' });
                            var emp_currency = result.getValue({ name: "currency", join: "subsidiary" });
                            //if(exchange_rate==0){
                            //  exchange_rate=currency.exchangeRate({ source:emp_currency, target:"GBP" });
                            //}
                            var employeePurchaseLimit = parseFloat(result.getValue({ name: 'purchaseorderapprovallimit' }) || 0); // /exchange_rate;
                            var approvalMatrixElement = approvalMatrix[employeeRoleCategory];

                            log.debug("get_approval_users::GET", "employeeRoleCategory=" + employeeRoleCategory + ", employeeId=" + employeeId + ", employeeSubsidiary=" + employeeSubsidiary + ", employeeHOD_department:" + employeeHOD_department);

                            log.debug("get_approval_users::GET", "typeOfApprovalIsHOD="+typeOfApprovalIsHOD+", departmentCheckEnabled=" + approvalMatrixElement.departmentCheckEnabled + ", employeeDepartment=" + employeeDepartment + ", txn.department=" + txn.department);
                            if (typeOfApprovalIsHOD || approvalMatrixElement.departmentCheckEnabled) {
                                if (!typeOfApprovalIsHOD && employeeDepartment != txn.department) {
                                    log.debug("get_approval_users::GET", "Approval - Department check failed");
                                    return true;
                                }
                                if (typeOfApprovalIsHOD && employeeHOD_department.indexOf(txn.department) == -1) {
                                    log.debug("get_approval_users::GET", "HOD review - Department check failed");
                                    return true;
                                }

                                //log.debug("get_approval_users::GET", "");
                            }
                            log.debug("get_approval_users::GET", "unitCheckEnabled=" + approvalMatrixElement.unitCheckEnabled + ", employeeUnit=" + employeeUnit + ", txn.unit=" + txn.unit);
                            if (approvalMatrixElement.unitCheckEnabled && employeeUnit != txn.unit) { //!typeOfApprovalIsHOD && - first I thought unit check is not necessary in case of HOD review
                                log.debug("get_approval_users::GET", "Unit check failed");
                                return true;
                            }
                            log.debug("get_approval_users::GET", "hodReviewEnabled=" + approvalMatrixElement.hodReviewEnabled + ", typeOfApprovalIsHOD=" + typeOfApprovalIsHOD);
                            if (typeOfApprovalIsHOD && !approvalMatrixElement.hodReviewEnabled) {
                                log.debug("get_approval_users::GET", "HOD review check failed");
                                return true;
                            }

                            var emp_rec = record.load({ type: "employee", id: employeeId, isDynamic: true });
                            employeePurchaseLimit = parseFloat(emp_rec.getValue("purchaseorderapprovallimit")) || 0;
                            log.debug("get_approval_users::GET", "limitCheckEnabled=" + approvalMatrixElement.limitCheckEnabled + ", employeePurchaseLimit=" + employeePurchaseLimit + ", txn.total=" + txn.total);
                            if (approvalMatrixElement.limitCheckEnabled && parseFloat(txn.total) > parseFloat(employeePurchaseLimit)) {
                                log.debug("get_approval_users::GET", "Limit check failed");
                                return true;
                            }

                            //Approval frequency check
                            var perTxnEmailEnabled = (!summaryEmail && (approvalMatrixElement.approvalFrequency == "3" || approvalMatrixElement.approvalFrequency == "1"));//3: Both; 1: Per Txn
                            var summaryEmailEnabled = (summaryEmail && (approvalMatrixElement.approvalFrequency == "3" || approvalMatrixElement.approvalFrequency == "2"));//3: Both; 2: Daily
                            if (!perTxnEmailEnabled && !summaryEmailEnabled) {
                                log.debug("get_approval_users::GET", (summaryEmail ? "Summary" : "Per Txn") + " email is not enabled for: Type=" +
                                    approvalMatrixElement.type + ", RoleCategory=" + approvalMatrixElement.roleCategory);
                                return true;
                            }

                            if (!summaryEmail && approvalMatrixElement.summaryEmailOnly) {
                                log.debug("get_approval_users::GET", "Only summary email must be sent.");
                                return true;
                            }

                            var addedTxt = " (Already added)";
                            if (typeOfApprovalIsHOD) {
                                if (response.hodApproval.indexOf(employeeId) == -1) {
                                    response.hodApproval.push(employeeId);
                                    addedTxt = "";
                                }
                                log.debug("get_approval_users::GET", "HOD(2) MAIL TO:" + employeeId + addedTxt);
                            }
                            else {
                                if (response.normalApproval.indexOf(employeeId) == -1) {
                                    response.normalApproval.push(employeeId);
                                    addedTxt = "";
                                }
                                log.debug("get_approval_users::GET", "NORMAL(2) MAIL TO:" + employeeId + addedTxt);
                            }

                            return true;
                        });
                    }
                    else {
                        log.debug("employeeSearchObj2 result count= 0 since employeeRoleCategoryFilter is empty");
                    }

                    log.debug("get_approval_users::GET", "response=" + JSON.stringify(response));

                    scriptContext.response.write(JSON.stringify(response));

                    log.debug("get_approval_users::GET", "FINISHED");
                    return true;
                }
                catch (e) {
                    log.error("get_approval_users::GET - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

            //#region******************************  POST  *************************************

            if (scriptContext.request.method == 'POST') {
                try {
                    log.debug("get_approval_users::POST", "STARTED");
                    log.debug("get_approval_users::GET", "FINISHED");
                }
                catch (e) {
                    log.error("get_approval_users::POST - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

        }

        return {
            onRequest: onRequest
        };

    });
