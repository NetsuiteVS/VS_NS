/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 
 /*
	Date:	19/12/2018
	Author:	Viktor Schumann
	
	This scritp adds the Expense Button to the Advance form when the Status is: 
	C Pending Expense allocation 
	
	
 */
/*
record type: customtransaction_tsa_iou2
examples;
status: "Pending Expense allocation"
statusRef: "statusC"
 
A Approved 						A 		Indonesian: DisetujuiTEST 					Latin American Spanish: Aprobado
B Pending Approval 				B 		Indonesian: Persetujuan ditunda 				Latin American Spanish: Pendiente de Aprobación 
C Pending Expense allocation 	C Yes 	Indonesian: Alokasi pengeluaran ditunda 	Latin American Spanish: Asignación de Gastos Pendiente
D Pending Submission 			D 		Indonesian: Pengajuan Ditunda 				Latin American Spanish: Pendiente de Envío
E Advance Request Approved 		E 		Indonesian: Permintaan Panjar disetujui 		Latin American Spanish: Solicitud de Vale Aprobada
F Request for Advance 			F 		Indonesian: Permintaan untuk Panjar 			Latin American Spanish: Solicitud de Vale de Caja
G Advance Rejected 				G 		Indonesian: Panjar Uang mUka ditolak 			Latin American Spanish: Vale de Caja Rechazado
H Pending Cash allocation 		H 		Indonesian: Alokasi kas ditunda 				Latin American Spanish: Entrega de Efectivo Pendiente
I Expense Allocated 			I Yes 	Indonesian: Pengeluaran dialokasikan 		Latin American Spanish: Gastos Asignados
J Advance Complete 				J Yes 	Indonesian: Panjar Sudah lengkap 			Latin American Spanish: Vale de Caja Completo
K IOU Rejected OLD


*/
 
define(['N/record', 'N/log', 'N/search', 'N/url', 'N/runtime', 'N/translation', 'SuiteScripts/vs_lib.js'],
  function(record, log, search, url, runtime, translation, vs_lib) {
	  
    function beforeLoad(context) {
      if(context.type == "view") {
                  
		var userObj = runtime.getCurrentUser();
		log.debug("", "role: " + userObj.role+" "+userObj.roleId+" current user:"+userObj.id);
				
        //context.form.clientScriptFileId = 26328 ; // this file number has to be changed on every account (SB1...SB5 or Prod)
		context.form.clientScriptModulePath = "./TSA_Advance_client_scripts.js";
		
		var status=context.newRecord.getValue("status");
		var statusRef=context.newRecord.getValue("statusRef");
		var adv_given_to=context.newRecord.getValue("custbody_tsa_iouemp");
        var created_by_user=context.newRecord.getValue("custbody_tsa_vs_created_by");
		var expense_number = context.newRecord.getValue("custbody32"); //Expense Number = custbody32
        
		log.debug("", "advance given to user:" + adv_given_to+" created by user="+created_by_user);
		
		if(userObj.roleId=="administrator" || userObj.roleId=="customrole_tsa_cashier" || adv_given_to==userObj.id || created_by_user==userObj.id){} else{return;} // ********  EXIT Point - I prefer positive logic in complex condition
		
		//C=Pending Expense allocation 
		if( statusRef!="statusC" || expense_number) return true;   // ******** EXIT point
		
        /*
        var call_string= ' var scheme = "https://"; ';
		   call_string+= ' var host = url.resolveDomain({ hostType: url.HostType.APPLICATION }); ';
		   call_string+= ' var url_x = url.resolveRecord({ recordType: "expensereport", recordId: null, isEditMode: true }); ';
		
		var rec=currentRecord.get();
		
		var id=rec.getValue("id");
		
		console.log("full url="+scheme+host+url_x+" expense form called...almost... id="+id);
		window.open(url_x+"&adv="+id);
        */

        // custcollection__tsa_collection_01
        // CREATE_EXPENSE  
        var button_text = translation.get({collection: 'custcollection__tsa_collection_01', key: 'CREATE_EXPENSE', locale: translation.Locale.CURRENT })();
        log.debug("", "button text:" + button_text);
        
        context.form.addButton({
          id: 'custpage_call_expense',
          label: button_text ,
          functionName: 'call_expense_form'
        });
		
		log.debug( "", "status="+status+" | statusRef="+statusRef );		
		log.debug( "", JSON.stringify(context.newRecord.status));
      }
	  
    }
	
    return {
      beforeLoad: beforeLoad,
    };
  }
);


