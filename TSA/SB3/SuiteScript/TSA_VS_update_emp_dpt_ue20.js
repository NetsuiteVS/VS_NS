/****************************************************************************************
 * Name:		SuiteScript 2.0 UserEvent (TSA_Update_Employee_With_Department_ue20.js)
 *
 * Script Type:	User Event
 *
 * Author:		Viktor Schumann
 * 
 * Date:        13/08/2019
 *
 * Purpose:     Update employee's custentity_ihq_department_list_txt field with department content

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 */

define(['N/url', 'N/record', 'N/log', 'N/search', 'N/runtime', 'N/http', 'N/https', 'SuiteScripts/vs_lib10.js'],
    function (url, record, log, search, runtime, http, https, vs_lib10) {

        function afterSubmit(scriptContext) {

            try {

                log.debug("TSA_Update_Employee_With_Department_ue20::afterSubmit", "Started");

                var oldRecord = scriptContext.oldRecord;
                var nameAndId = oldRecord.getValue({ fieldId: 'name' }) + "-" + oldRecord.getValue({ fieldId: 'id' }) + ",";
                var oldRecordDptIs = oldRecord.getValue({ fieldId: 'custrecord_ihq_dept_is' });
                var oldRecordDptUs = oldRecord.getValue({ fieldId: 'custrecord_ihq_dept_us' }); 
				var oldRecordDptUs2 = oldRecord.getValue({ fieldId: 'custrecord_ihq_dept_us2' });
                var oldRecordDptHod = oldRecord.getValue({ fieldId: 'custrecord_ihq_dept_hod' });

                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "nameAndId=" + nameAndId);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "oldRecordDptIs=" + oldRecordDptIs);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "oldRecordDptUs=" + oldRecordDptUs + " ,oldRecordDptUs2=" + oldRecordDptUs2);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "oldRecordDptHod=" + oldRecordDptHod);

                var newRecord = scriptContext.newRecord;
                var newRecordDptIs = newRecord.getValue({ fieldId: 'custrecord_ihq_dept_is' });
                var newRecordDptUs = newRecord.getValue({ fieldId: 'custrecord_ihq_dept_us' });
				var newRecordDptUs2 = newRecord.getValue({ fieldId: 'custrecord_ihq_dept_us2' });
                var newRecordDptHod = newRecord.getValue({ fieldId: 'custrecord_ihq_dept_hod' });

                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "newRecordDptIs=" + newRecordDptIs);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "newRecordDptUs=" + newRecordDptUs + " ,newRecordDptUs2=" + newRecordDptUs2);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "newRecordDptHod=" + newRecordDptHod);


                updateEmployee(oldRecordDptIs, newRecordDptIs, newRecordDptUs, newRecordDptHod, newRecordDptUs2, nameAndId);
                updateEmployee(oldRecordDptUs, newRecordDptUs, newRecordDptIs, newRecordDptHod, newRecordDptUs2, nameAndId);
				updateEmployee(oldRecordDptUs2, newRecordDptUs2, newRecordDptIs, newRecordDptHod, newRecordDptUs, nameAndId);
                updateEmployee(oldRecordDptHod, newRecordDptHod, newRecordDptIs, newRecordDptUs, newRecordDptUs2, nameAndId);

                return true;
            }
            catch (e) {
                log.debug("TSA_Update_Employee_With_Department_ue20::afterSubmit", 'Message: ' + e);
            }
            finally {
            }
        }

        //************************************  UPDATE EMPLOYEE  *************************************
        function updateEmployee(oldEmployeeId, newEmployeeId, othernewEmployee1Id, othernewEmployee2Id, othernewEmployee3Id, nameAndId) {

            log.debug("TSA_Update_Employee_With_Department_ue20::updateEmployee", "started");

            //if (oldEmployeeId == newEmployeeId) {
            //    return true;
            //}

            log.debug("TSA_Update_Employee_With_Department_ue20::updateEmployee", "state 1");

            //Remove department from old employee if he/she wasn't set in other new employee field
            if (oldEmployeeId && oldEmployeeId.length > 0 && oldEmployeeId != newEmployeeId
                && oldEmployeeId != othernewEmployee1Id && oldEmployeeId != othernewEmployee2Id && oldEmployeeId != othernewEmployee3Id) {
                var oldEmployee = record.load({ type: record.Type.EMPLOYEE, id: oldEmployeeId, isDynamic: true });
                var updatedEmployeeDepartment = oldEmployee.getValue({ fieldId: "custentity_ihq_department_list_txt" }).replace(nameAndId, "");

                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "oldEmployee=" + oldEmployee);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "updatedEmployeeDepartment=" + updatedEmployeeDepartment);

                oldEmployee.setValue({ fieldId: "custentity_ihq_department_list_txt", value: updatedEmployeeDepartment, ignoreFieldChange: true });
                oldEmployee.save({ enableSourcing: false, ignoreMandatoryFields: true });
            }

            //Add department to new employee if it wasn't added yet
            if (newEmployeeId && newEmployeeId.length > 0) {
                var newEmployee = record.load({ type: record.Type.EMPLOYEE, id: newEmployeeId, isDynamic: true });
                var employeeDepartmentToUpdate = newEmployee.getValue({ fieldId: "custentity_ihq_department_list_txt" });

                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "newEmployee=" + newEmployee);
                log.debug("TSA_Update_Employee_With_Department_ue20::afterLoad", "employeeDepartmentToUpdate=" + employeeDepartmentToUpdate);

                if (employeeDepartmentToUpdate.indexOf(nameAndId) == -1) {
                    newEmployee.setValue({ fieldId: "custentity_ihq_department_list_txt", value: employeeDepartmentToUpdate + nameAndId, ignoreFieldChange: true });
                    newEmployee.save({ enableSourcing: false, ignoreMandatoryFields: true });
                }
            }
        }

        return {
            afterSubmit: afterSubmit
        };

    });
