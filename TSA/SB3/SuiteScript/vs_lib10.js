/*******************************************************
 * Name: 		vs_lib10.js
 *
 * Script Type:	Library
 *
 * API Version:	1.0
 *
 * Version:		1.0.0
 * 
 * Date:        10/09/19
 *
 * Author: 		VS
 *
 * Purpose: 	Share useful functionality
 * 
 ********************************************************/

var vs_lib10 = (function () {

    // #region **************  CHECK IF USER SUBSIDIARY IS IHQ  ********************

	/**
	 * @scope Public
	 */
    function userSubsidiaryIsIHQ() {
        try {

            var ihqSubsidiaries = ";Parent Company;SAIT;ROAS;SALT collage;SAIT Elimination;";
            var userId = nlapiGetContext().getUser();

            nlapiLogExecution("ERROR", "vs_lib10::userSubsidiaryIsIHQ", 'userId= ' + userId);

            var employeeSearch = nlapiSearchRecord("employee", null,
                [["internalid", "anyof", userId]],
                [new nlobjSearchColumn("subsidiarynohierarchy")]
            );

            if (employeeSearch != null && employeeSearch.length > 0) {
                var searchresult = employeeSearch[0];
                var columns = searchresult.getAllColumns();
                var subsidiary = searchresult.getText(columns[0]);
                var subsidiaryIsIHQ = ihqSubsidiaries.includes(";" + subsidiary + ";");

                nlapiLogExecution("ERROR", "vs_lib10::userSubsidiaryIsIHQ", "User's subsidiary= " + subsidiary);
                nlapiLogExecution("ERROR", "vs_lib10::userSubsidiaryIsIHQ", "User's subsidiary is IHQ= " + subsidiaryIsIHQ);

                return subsidiaryIsIHQ;
            }

            nlapiLogExecution("ERROR", "vs_lib10::userSubsidiaryIsIHQ", 'No user found on the following id: ' + userId);

            return false;
        }
        catch (e) {
            nlapiLogExecution("ERROR", "vs_lib10::userSubsidiaryIsIHQ", e.message);
        }
    }
        
    // #endregion

    return {
        userSubsidiaryIsIHQ: userSubsidiaryIsIHQ
    };
})();

