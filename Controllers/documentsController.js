var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var HtmlDocx = require('html-docx-js');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

//var fileUploadd = require('express-fileupload');
//var busboy = require("then-busboy");




module.exports = function(app){
   
    app.use(passport.initialize());
    app.use(passport.session());

    //app.use(fileUploadd());

    app.use(bodyParser.json());

    /* Methode for using PUT methode*/
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
 
   /* --------------------------------------------------------------------------------------------------------------*/ 
    
   /* Documents page*/
  /* app.get('/admin/documents', function(req, res){
    var title="Documents";
    let docs= "SELECT * FROM document";
    db.query(docs, function(err, result){
        if(err) throw err;
        var data = result;
        res.render('admin/documents/document',{data:data, title})
    })

    
   });*/

   /*  SAVE DOCUMENT */
   app.post('/send/document', urlencodedParser, function(req, res){
    console.log(req.body.description);
    var title="Documents";
    var notif_id = req.body.notifID;
    var doc_name = req.body.docname; 
    var user_name = req.session.nom+" "+req.session.prenom; // name of the connected user 
    console.log("nom document: "+doc_name);


    try {
        if(!req.files) {
        
            var message = req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Pas de document importer!'
            }
             
            res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name,message})
        }
        else if(req.body.description === ""){
            var message= req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Veuillez inserer une description du fichier!'
            }
            res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name, message})
        }
        else {
  
            var file = req.files.document;
            var description= req.body.description;
            var file_name =file.name;
            var mime = file.mimetype;
            var id_user = req.session.user_id;
           
            var data = file.data;
           
            
        
             if(file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||file.mimetype == "image/png" || file.mimetype == "image/gif" || file.mimetype ==="text/plain" ){
                file.mv('static/admin/documents/'+file.name, function(err) {
                  
                    if (err)
             
                      return res.status(500).send(err);
                      
                           var path = 'C:/xampp/htdocs/GestionDocs/static/admin/documents/'+file.name;
                           let newdoc = "INSERT INTO documents(nom_doc,mime,path,description,created_date) VALUES('"+file.name+"','"+mime+"','"+path+"','"+description+"', now())";
                           db.query(newdoc, function(err, result){
                               if(err) throw err;
                            });

                            //Select the last document id inserted
                            let slect_doc ="SELECT * from documents where id_doc= (SELECT LAST_INSERT_ID())"
                            db.query(slect_doc, (err, result)=>{
                                if(err) throw err;
                                
                                var doc_id= result[0].id_doc; //the lasted doc id
                                //insert it in gerer table
                                let gerer="INSERT INTO gerer(id_user, id_doc,date) values("+req.session.user_id+", "+doc_id+",now())"
                                db.query(gerer,(err1, result1)=>{
                                    if(err1) throw err1;
                                })

                                //select id_demande from notifications
                                let notifs_inf = "select * from notifications where id_notif="+notif_id+"";
                                db.query(notifs_inf,(err2,result2)=>{
                                    if(err2) throw err2;

                                    var id_dem = result2[0].demande_id;
                                    //select the demande info
                                    let dem_inf = "select * from demande where id_demande="+id_dem+""
                                    db.query(dem_inf, (err3,result3)=>{
                                        if(err3) throw err3;

                                        
                                        var  numnextStep = parseInt(result3[0].num_etape, 10)+1;
                                        if(parseInt(numnextStep,10 ) <= parseInt(result3[0].nbre_etapes,10)){
                                            //select the profile of the next step
                                            let profEtape = "select * from etapes where num_etape="+numnextStep+" and id_type= "+result3[0].typedocs_id+" "
                                            db.query(profEtape, (err4,result4)=>{
                                                if(err4) throw err4;

                                                //update demande info
                                                let update_dem = "update demande set doc_id="+doc_id+", accepter=0, num_etape="+numnextStep+", updated_date=now() where id_demande="+id_dem+""
                                                db.query(update_dem, (err5,result5)=>{
                                                    if(err5) throw err5;
                                                })

                                                //create notifications
                                                let new_notif = "insert into notifications(demande_id,data,created_at) values("+id_dem+",'"+user_name+","+doc_name+"',now())"
                                                db.query(new_notif, (err6, result6)=>{
                                                    if(err6) throw err6;
                                                })

                                                //Select the last id notification
                                                let not = "select * from notifications where id_notif= (SELECT LAST_INSERT_ID())"
                                                db.query(not, (err7,result7)=>{
                                                    if(err7) throw err7;

                                                    var notif_id = result7[0].id_notif;

                                                    //select all the user with the same profile as the next step 
                                                    let users = "select * from user where id_profile = "+result4[0].id_profile+""
                                                    db.query(users, (err9, result9)=>{
                                                        if(err9) throw err9;

                                                        for (var i in result9) {
                                                            let notifs = "INSERT INTO notifier(id_notificaton, id_user,type_notif) VALUES("+notif_id+","+result9[i].id_user+",1)";
                                                            db.query(notifs, (err10, result10)=>{
                                                                if(err10) throw err10;
                                                            })
                                                        }

                                                    })
                                                })
                                            })

                                            //finish step 
                                            req.session.message = {
                                                type: 'success',
                                                intro: 'Success:',
                                                message: 'Demande envoyer avec succès!'
                                            }
                                             
                                          res.redirect('/admin/ListeCycle');

                                        }else{

                                             //create notifications
                                             let new_notif = "insert into notifications(demande_id,data,created_at) values("+id_dem+",'"+user_name+","+doc_name+"',now())"
                                             db.query(new_notif, (err6, result6)=>{
                                                 if(err6) throw err6;
                                             })
                                             let not = "select * from notifications where id_notif= (SELECT LAST_INSERT_ID())"
                                             db.query(not, (err7,result7)=>{
                                                if(err7) throw err7;

                                               //update demande info
                                               let update_dem = "update demande set doc_id="+doc_id+", accepter=0, num_etape=0, updated_date=now() where id_demande="+id_dem+""
                                               db.query(update_dem, (err5,result5)=>{
                                                   if(err5) throw err5;
                                               })
                                                var notif_id = result7[0].id_notif;

                                                    
                                                        let notifs = "INSERT INTO notifier(id_notificaton, id_user,type_notif) VALUES("+notif_id+","+result3[0].clientUser_id+",2)";
                                                        db.query(notifs, (err10, result10)=>{
                                                            if(err10) throw err10;
                                                        })
                                            

                                                
                                            })
                                                    //finish step 
                                                     req.session.message = {
                                                        type: 'success',
                                                        intro: 'Success:',
                                                         message: 'Fichier envoyer avec succès!'
                                                        }
                                                                                         
                                                    res.redirect('/admin/ListeCycle');
                                            



                                        }
                                    })

                                    
                                })
                                


                            })
                         
                    
                
            });
            
            
             }else{
               var message = req.session.message = {
                    type: 'error',
                    intro: 'error:',
                    message: 'Le ficher doit etre .docx word document!'
                }
                res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name,message})
             }
            
                
            
        
    }} catch (err) {
        res.status(500).send(err);
    }
  
    
 });

 
};

 