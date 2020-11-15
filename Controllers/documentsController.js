var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var HtmlDocx = require('html-docx-js');
var moment = require('moment')

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'documentelectronique13@gmail.com',
    pass: 'document 123'
  }
});


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

//var fileUploadd = require('express-fileupload');
//var busboy = require("then-busboy");

/*/ Verify if you're connected or no */
var redirectLogin = (req, res, next)=>{
    if(!req.session.user_id){
        res.redirect('/login');
    }else{
        next();
    }
}

/**REFRESHING NOTIFS */
var refreshNotif = (req,res,next)=>{
    let notif= "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, ns.data data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and  ((n.type_notif=1 and ns.updated_at IS NULL and (ns.userIDaccepted="+req.session.user_id+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) ORDER BY created_at DESC "
    db.query(notif, (err1,result2)=>{
      if(err1) throw err1;
  
      req.session.notifs=result2;
      let onlynotread = "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and n.type_notif=1 and n.read_at IS NULL and ((ns.updated_at IS NULL and (ns.userIDaccepted="+req.session.user_id+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) "
            db.query(onlynotread, (err3, result3)=>{
              if(err3) throw err3;
  
              req.session.notReadNotifs=result3;
              next();
            });
    });
  }


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
   app.post('/send/document',redirectLogin, urlencodedParser, function(req, res){
    console.log(req.body.description);
    var title="Documents";
    var notif_id = req.body.notifID;
    var doc_name = req.body.docname; 
    var user_name = req.session.nom+" "+req.session.prenom; // name of the connected user 
    console.log("nom document: "+doc_name);
    var docName=req.body.docnamee;
    var docExist= req.body.docexit;
    var description= req.body.desc;
    console.log("doc received info: "+description+" "+docExist+" "+docName)

    

    try {
        if(!req.files) {
        
            var message = req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Pas de document importer!'
            }
             
            res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name,message,description,docExist,docName,moment:moment})
        }
        else if(req.body.description === ""){
            var message= req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Veuillez inserer une description du fichier!'
            }
            res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name, message,description,docExist,docName,moment:moment})
        }
        else {
            
                    

  
            var file = req.files.document;
            var description= req.body.description;
            var file_name =file.name;
            var mime = file.mimetype;
            var id_user = req.session.user_id;
           
            var data = file.data;

            console.log("file name: "+file.name)

           
            
        
             if(file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.mimetype ==="text/plain" || file.mimetype==="application/pdf" || file.mimetype==="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ){
                file.mv('static/admin/documents/'+file.name, function(err) {
                  
                    if (err)
             
                      return res.status(500).send(err);
                      
                           var path = 'C:/xampp/htdocs/GestionDocs/static/admin/documents/'+file.name;
                           let newdoc = "INSERT INTO documents(nom_doc,mime,path,description,created_date) VALUES('"+file.name+"','"+mime+"','"+path+"','"+description+"', now())";
                           db.query(newdoc, function(err, result){
                               if(err) {res.render('admin/errorPage',{err:err})}
                            });

                            //Select the last document id inserted
                            let slect_doc ="SELECT * from documents where id_doc= (SELECT LAST_INSERT_ID())"
                            db.query(slect_doc, (err, result)=>{
                                if(err) {res.render('admin/errorPage',{err:err})}
                                
                                var doc_id= result[0].id_doc; //the lasted doc id
                                //insert it in gerer table
                                let gerer="INSERT INTO gerer(id_user, id_doc,date) values("+req.session.user_id+", "+doc_id+",now())"
                                db.query(gerer,(err1, result1)=>{
                                    if(err1) {res.render('admin/errorPage',{err:err1})}
                                })

                                //select id_demande from notifications
                                let notifs_inf = "select * from notifications where id_notif="+notif_id+"";
                                db.query(notifs_inf,(err2,result2)=>{
                                    if(err2) {res.render('admin/errorPage',{err:err2})}

                                    var id_dem = result2[0].demande_id;
                                    //select the demande info
                                    let dem_inf = "select * from demande where id_demande="+id_dem+""
                                    db.query(dem_inf, (err3,result3)=>{
                                        if(err3) {res.render('admin/errorPage',{err:err3})}

                                        var data1 = result2[0].data.split([',']);
                                        var nom_doc= data1[1];
                                        var nom_userclient = data1[0];

                                        //update notifications updated_at to show that this step is over
                                        let finishnotifs="update notifications set updated_at= now() where id_notif="+notif_id+""
                                        db.query(finishnotifs,(err32,result32)=>{
                                            if(err32) {res.render('admin/errorPage',{err:err32})}
                                        })

                                        
                                        var  numnextStep = parseInt(result3[0].num_etape, 10)+1;
                                        if(parseInt(numnextStep,10 ) <= parseInt(result3[0].nbre_etapes,10)){
                                            //select the profile of the next step
                                            let profEtape = "select * from etapes where num_etape="+numnextStep+" and id_type= "+result3[0].typedocs_id+" "
                                            db.query(profEtape, (err4,result4)=>{
                                                if(err4) {res.render('admin/errorPage',{err:err4})}

                                                //update demande info
                                                let update_dem = "update demande set doc_id="+doc_id+", accepter=0, num_etape="+numnextStep+", updated_date=now() where id_demande="+id_dem+""
                                                db.query(update_dem, (err5,result5)=>{
                                                    if(err5) {res.render('admin/errorPage',{err:err5})}
                                                })

                                                //create notifications
                                                let new_notif = "insert into notifications(demande_id,data,created_at) values("+id_dem+",'"+nom_userclient+","+nom_doc+","+user_name+"',now())"
                                                db.query(new_notif, (err6, result6)=>{
                                                    if(err6) {res.render('admin/errorPage',{err:err6})}
                                                })

                                                //Select the last id notification
                                                let not = "select * from notifications where id_notif= (SELECT LAST_INSERT_ID())"
                                                db.query(not, (err7,result7)=>{
                                                    if(err7) {res.render('admin/errorPage',{err:err7})}

                                                    var notif_id = result7[0].id_notif;

                                                    //select all the user with the same profile as the next step 
                                                    let users = "select * from user where id_profile = "+result4[0].id_profile+""
                                                    db.query(users, (err9, result9)=>{
                                                        if(err9) {res.render('admin/errorPage',{err:err9})}

                                                        for (var i in result9) {
                                                            let notifs = "INSERT INTO notifier(id_notificaton, id_user,type_notif) VALUES("+notif_id+","+result9[i].id_user+",1)";
                                                            db.query(notifs, (err10, result10)=>{
                                                                if(err10){res.render('admin/errorPage',{err:err10})}
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
                                             let new_notif = "insert into notifications(demande_id,data,created_at) values("+id_dem+",'"+user_name+","+nom_doc+"',now())"
                                             db.query(new_notif, (err6, result6)=>{
                                                 if(err6) {res.render('admin/errorPage',{err:err6})}
                                             })
                                             let not = "select * from notifications where id_notif= (SELECT LAST_INSERT_ID())"
                                             db.query(not, (err7,result7)=>{
                                                if(err7) {res.render('admin/errorPage',{err:err7})}

                                               //update demande info
                                               let update_dem = "update demande set doc_id="+doc_id+", accepter=0, num_etape="+result3[0].nbre_etapes+", updated_date=now() where id_demande="+id_dem+""
                                               db.query(update_dem, (err5,result5)=>{
                                                   if(err5) {res.render('admin/errorPage',{err:err5})}
                                               })
                                                var notif_id = result7[0].id_notif;

                                                    
                                                        let notifs = "INSERT INTO notifier(id_notificaton, id_user,type_notif) VALUES("+notif_id+","+result3[0].clientUser_id+",2)";
                                                        db.query(notifs, (err10, result10)=>{
                                                            if(err10) {res.render('admin/errorPage',{err:err10})}
                                                        })

                                                //Send email to the user that he's document is ready
                                                let userr = "SELECT * from user where id_user= "+result3[0].clientUser_id+""  
                                                db.query(userr, (err10, result10)=>{
                                                    if(err10) {res.render('admin/errorPage',{err:err10})}

                                                    else{
                                                        var email= result10[0].email;

                                                        var mailOptions = {
                                                            from: 'documentelectronique13@gmail.com',
                                                            to: email,
                                                            subject: 'Document electronique',
                                                            text: 'Votre document est prêt.'
                                                          };
                                                          
                                                          transporter.sendMail(mailOptions, function(error, info){
                                                            if (error) {
                                                              console.log(error);
                                                            } else {
                                                              console.log('Email sent: ' + info.response);
                                                        
                                                            }
                                                          });

                                                    }
                                                   
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
                res.render('admin/UserDocuments/createDocs',{title,notif_id,doc_name,message,moment:moment})
             }
            
                
            
        
     
           
        }} catch (err) {
            res.render('admin/errorPage',{err:err})
        
    }
  
    
 });


 /*/ List documents of the connected user*/
 app.get('/user/doclist',redirectLogin, refreshNotif,function(req,res){

    var id_user = req.session.user_id; //the connected ID user
    var title = "Mes documents"

    //if the connected is the admin
    if(req.session.profile_id===5){
        let docs = "select * from documents d, gerer g where g.id_doc=d.id_doc and d.deleted_date IS NULL ORDER BY d.created_date DESC"
        db.query(docs,(err,result)=>{
            if(err){res.render('admin/errorPage',{err:err})}
            else{
                //select user who created each documents 
                let userDocs= "select * from user u, gerer g, documents d where (u.id_user=g.id_user and d.id_doc=g.id_doc) and d.deleted_date IS NULL ORDER BY d.created_date DESC "
                db.query(userDocs,(err2,result2)=>{
                    if(err2){res.render('admin/errorPage',{err:err2})}
                
                var supprimer=1;
                var archive=1;
                res.render('admin/documents/listeDocs',{data:result, title,moment:moment,supprimer,archive,datauser:result2})
            })

            }

        })

    }else if(req.session.profile_id===7){
        //select the received document 
        let myDoc="select d.mime,d.nom_doc,d.description,d.created_date, d.id_doc FROM notifier n, notifications ns, documents d, demande dm WHERE n.id_user="+id_user+" and n.type_notif=2 and n.id_notificaton=ns.id_notif and ns.demande_id=dm.id_demande and dm.doc_id=d.id_doc ORDER BY d.created_date DESC "
        db.query(myDoc,(err11, result11)=>{
            if(err11){res.render('admin/errorPage',{err:err11})}
            else{
                console.log("result11: "+result11)
                var supprimer = 1;
                var archive =1;
                
                res.render('admin/documents/listeDocs',{data:result11, title,moment:moment,supprimer,archive})
            }
        })

    }else{

    let docs = "select  d.mime,d.nom_doc,d.description,d.created_date, d.id_doc from documents d, gerer g where g.id_user="+id_user+" and g.id_doc=d.id_doc and d.deleted_date IS NULL"
    db.query(docs, (err,result)=>{
        if(err) {res.render('admin/errorPage',{err:err})}
        else{
            let suppOp="select * from avoir a, operation o where a.id_profile="+req.session.profile_id+" and o.op_nom='Supprimer' and a.id_op=o.id_op"
            let archiOp="select * from avoir a, operation o where a.id_profile="+req.session.profile_id+" and o.op_nom='Archiver' and a.id_op=o.id_op"
            db.query(suppOp,(err1,result1)=>{

            db.query(archiOp,(err2,result2)=>{
                console.log('result1 '+result1)
                console.log('result 2'+result2)
                if(result1.length<1 && result2.length<1){
                    console.log('if 1')
                    var supprimer=0;
                    var archive=0;
                    
                    res.render('admin/documents/listeDocs',{data:result, title,moment:moment,supprimer,archive})
                }
                else if(result1.length<1 && result2.length>0){
                    console.log('else if 1')
                    var archive =1;
                    var supprimer=0;
                
                    res.render('admin/documents/listeDocs',{data:result, title,moment:moment,archive,supprimer})

                }else if(result1.length>0 && result2.length<1){
                    console.log('else if 2')
                    var supprimer=1;
                    var archive=0;
                    res.render('admin/documents/listeDocs',{data:result, title,moment:moment,supprimer,archive})
                }else if(result1.length>0 && result2.length>0){
                    console.log('else if 3')
                    var supprimer=1;
                    var archive=1;
                    res.render('admin/documents/listeDocs',{data:result, title,moment:moment,supprimer,archive})
                }else if(err2 || err1){
                    console.log('else if 4')
                    var err="Error"
                    res.render('admin/errorPage',{err:err})

                }
            })
            
            

        })
        }
        


    })
}

 })

 /** Render achieved page documents page */
 app.get('/user/archivedocs',redirectLogin, refreshNotif,function(req,res ){
    var id_user = req.session.user_id; //the connected ID user
    var title = "Documents archivés"

    let docsarch = "select * from documents d, gerer g where g.id_user="+id_user+" and g.id_doc=d.id_doc and d.deleted_date IS NOT NULL"
    db.query(docsarch, (err,result)=>{
        if(err) {res.render('admin/errorPage',{err:err})}

        else{
            res.render('admin/documents/archiveDocs',{data:result, title,moment:moment})
        }
        


    })

/*/* archive a document*/
app.get('/sendtoarchieve/:id',redirectLogin, refreshNotif,urlencodedParser,function(req, res){
   
    var id = req.params.id;

    let archdoc = "update documents set deleted_date=now() where id_doc= "+id+"";
    db.query(archdoc, (err,result)=>{
        if(err){res.render('admin/errorPage',{err:err})}
        else{
            res.redirect('/user/doclist');
        }

        
    })

})


 })

 /*/ DELETE documents */
 app.delete('/delete/doc/:id', function(req, res){
     var id_document= req.params.id; //ID of the documents to delete

     //delete the document 
     let delDoc ="DELETE FROM documents WHERE id_doc="+id_document+"";
     db.query(delDoc,(err,result)=>{
         if(err){res.render('admin/errorPage',{err:err})}

         else{
            req.session.message = {
                type: 'deleted',
                intro: 'Deleted:',
                message: 'Document Supprimer'
             }
            
            res.redirect('/user/doclist');
         }
     })

 });

 
};

 