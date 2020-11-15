var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var moment = require('moment')


var urlencodedParser = bodyParser.urlencoded({ extended: true });

const methodOverride = require("method-override");

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

    //app.use(fileUpload());

    app.use(bodyParser.json());

    /* Methode for using PUT methode*/
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    /*  CREATE (DEMANDE) TABLE */
    app.get('/createdemandetable', (req, res)=>{
        let sql = 'CREATE TABLE demande(id_demande int AUTO_INCREMENT, clientUser_id int, doc_id int, nbre_etapes int, typedocs_id int, accepter boolean, num_etape int, created_date datetime, updated_date datetime, PRIMARY KEY(id_demande), CONSTRAINT FK_clientUser FOREIGN KEY (clientUser_id) REFERENCES user(id_user) ON DELETE CASCADE,  CONSTRAINT FK_typeDoc FOREIGN KEY (typedocs_id) REFERENCES typedocs(id_type) ON DELETE CASCADE )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Demande table created...');
        });
        });


        /*  CREATE (DOCUMENTS) TABLE */
    app.get('/createdocumentstable', (req, res)=>{
        let sql = 'CREATE TABLE documents(id_doc int AUTO_INCREMENT, nom_doc varchar(50) , mime varchar(50), path varchar(50), description varchar(100), created_date datetime, deleted_date datetime, sended_date datetime, accepted_date datetime, PRIMARY KEY(id_doc) )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Documents table created...');
        });
        });

    /*  CREATE (GERER) TABLE link beetween user and documents*/
    app.get('/creategerertable', (req, res)=>{
        let sql = 'CREATE TABLE gerer( id_user int NOT NULL, id_doc int NOT NULL, date datetime, CONSTRAINT FK_user FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE, CONSTRAINT FK_document FOREIGN KEY (id_doc) REFERENCES documents(id_doc) ON DELETE CASCADE, UNIQUE (id_user, id_doc))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Gérer table created...');
        });
        });

        /*  CREATE (NOTIFICATIONS) TABLE */
    app.get('/createnotificationstable', (req, res)=>{
        let sql = 'CREATE TABLE notifications(id_notif int AUTO_INCREMENT, demande_id int , data text, read_at datetime, created_at datetime, updated_at datetime, PRIMARY KEY(id_notif) )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Notifications table created...');
        });
        });

   /*  CREATE (NOTIFIER) TABLE */
    app.get('/createnotifiertable', (req, res)=>{
        let sql = 'CREATE TABLE notifier( id_notificaton int NOT NULL, id_user int NOT NULL, read_at datetime, type_notif int, accepted boolean, CONSTRAINT FK_usernotif FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE, CONSTRAINT FK_notification FOREIGN KEY (id_notificaton) REFERENCES notifications(id_notif) ON DELETE CASCADE, UNIQUE (id_user, id_notificaton))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Notifier table created...');
        });
        });

   /* --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/ 
   
   /** Return the demande page for the client user */
   app.get('/user/demandeDocs', redirectLogin, refreshNotif,function(req,res){
           var title='Demande du document';

           let docs = "select * from typedocs";
           db.query(docs, (err, result)=>{
               if(err) {res.render('admin/errorPage',{err:err})}
               else{
                res.render('admin/documents/demandeDocs',{title, data: result,moment:moment});
               }

              
           })

       })

       /** Pass a demande */
       app.post('/user/sendDemande', urlencodedParser, function(req,res){
           
        var docname = req.body.docs;  // the name of the choosen document
        var user_id = req.session.user_id; // id of the connected user
        var user_name = req.session.nom+" "+req.session.prenom; // name of the connected user 
        
        let doctype = "select * from typedocs where nomdoc = '"+docname+"'"; // get the doc type id & all the relatif information to it
        db.query(doctype, (err,result)=>{
            if(err) {res.render('admin/errorPage',{err:err})}

        let etapes = "select * from etapes where id_type="+result[0].id_type+" and num_etape=1"; // get all the first step informations
        db.query(etapes, (err1,result1)=>{
            if(err1) {res.render('admin/errorPage',{err:err1})}
           
        //insert the new demande
           let newdemande = "INSERT INTO demande(clientUser_id,accepter,typedocs_id,num_etape,created_date,nbre_etapes) VALUES("+user_id+",0,"+result[0].id_type+",1,now(),"+result[0].nbre_etapes+")"
           db.query(newdemande,(err10,result10)=>{
               if(err10) {res.render('admin/errorPage',{err:err10})}
           })
        //require the new insert demande id
        let demandeid = "select * from demande where id_demande= (SELECT LAST_INSERT_ID()) "
        db.query(demandeid, (err2,result2)=>{
          if(err2){res.render('admin/errorPage',{err:err2})}
         
        //selectionner tout les user qui on le profile de la 1ere etapes
        let users = "select * from user where id_profile="+result1[0].id_profile+"";
        
        //insert the new notifications 
        let notif = "insert into notifications(demande_id,data,created_at) values("+result2[0].id_demande+", '"+user_name+","+docname+", ', now())";
        db.query(notif, (err3, result3)=>{
            if(err3){res.render('admin/errorPage',{err:err3})}
        })

        // get the new notification id
        let id_notif = "select * from notifications where id_notif = (SELECT LAST_INSERT_ID()) "
        db.query(id_notif, (err5, result5)=>{
          if(err5){res.render('admin/errorPage',{err:err5})}

          var id_notf = result5[0].id_notif;
          console.log('new notif id'+id_notf);

        //Send the notification to the concerned profiles
        db.query(users, (err4, result4)=>{
            if(err4) {res.render('admin/errorPage',{err:err4})}

            for (var i in result4) {
                let notifs = "INSERT INTO notifier(id_notificaton, id_user,type_notif,accepted) VALUES("+id_notf+","+result4[i].id_user+",1,0)";
                db.query(notifs, (err6, result6)=>{
                    if(err6) {res.render('admin/errorPage',{err:err6})}
                })
            }

        // inform the user (client) that the demande is sended with success 
            req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'Votre demande a été envoyer avec success!'
            }
             
          res.redirect('/admin/dashboard');
        
        })
        })
    })
        
        })
        })

       })

/*/ RETURN NOTIFICATION DETAIL PAGE*/
  app.get('/user/notifDtails/:id',redirectLogin,refreshNotif,function(req,res){
      var id = req.params.id; //The notification ID
      var title  ="Notification";
      
      let verifyReturn = "select * from notifier where id_notificaton="+id+" and id_user= "+req.session.user_id+""
      db.query(verifyReturn, (err20,result20)=>{
          if(err20){res.render('admin/errorPage',{err:err20})} 
          else{
              
            //Marque the accepted column with 1 as is checked by the user 
            let acc = "update notifier set accepted=1 where id_notificaton="+id+" and id_user="+req.session.user_id+""
            db.query(acc, (err21,result21)=>{
                if(err21) {res.render('admin/errorPage',{err:err21})}
            })
      //require the notif. informations
      let infnotif = "SELECT * from notifications where id_notif = "+id+"";
      db.query(infnotif, (err, result)=>{
          if(err){res.render('admin/errorPage',{err:err})}
          console.log(result[0].data)
      var data = result[0].data.split([',']);
      var nom_doc= data[1];
      var nom_user = data[0];
      var senderUser = data[2];
      

      console.log("user name: "+nom_user+" doc name: "+nom_doc+" sender user: "+senderUser)

      //
      let deminf = "select * from demande where id_demande ="+result[0].demande_id+""
      db.query(deminf, (err2,result2)=>{
          if(err2){res.render('admin/errorPage',{err:err2})}
          var accepted = result[0].read_at;
          var accepte_user = result[0].userIDaccepted;
          var notifsupdated = result[0].updated_at;
         
          //RETURN THE RIGHT NOTIFICATION PAGE
         if(result20[0].type_notif === 2){
             var titre = "Votre document que vous avez demander est prête "
             var type = 2;

             //marque read_at in notifier 
             let readat = "update notifier set read_at=now() where id_notificaton="+id+" and id_user="+req.session.user_id+"";
             db.query(readat, (err11, result11)=>{
                 if(err11) {res.render('admin/errorPage',{err:err11})}
             })

             let docInf = "select * from documents where id_doc = "+result2[0].doc_id+""
             db.query(docInf, (err9,result9)=>{
                 if(err9) {res.render('admin/errorPage',{err:err9})}
                 else{
                     
                    res.render('admin/users/notifpage',{title, nom_doc, senderUser,nom_user,id,accepted,titre,type,data:result9,moment:moment});
                 }

               

             })

         }else if(result20[0].type_notif === 1){
             var titre = "Demande de traitement de document: "
             var type = 1;

              //select the user_id that accepted the demande with the read_at column
          let user_id = "select * from notifier where id_notificaton = "+id+" and read_at IS NOT NULL "
          db.query(user_id, (err3, result3)=>{
             
         if(result3[0] === undefined){
            var user_accept = null;

            res.render('admin/users/notifpage',{title, nom_doc, senderUser,nom_user,id,accepted,user_accept,titre,type,accepte_user,notifsupdated,moment:moment});

         }else{


            var user_accept = result3[0].id_user;

            //select the profile id to verify if this step isn't finished yet
            let id_pro = "select * from etapes where id_type="+result2[0].typedocs_id+" and num_etape= "+result2[0].num_etape+""
            db.query(id_pro, (err4, result4)=>{
            if(result4[0] === undefined){
                var id_profile= 0;
                res.render('admin/users/notifpage',{title, nom_doc, senderUser,nom_user,id,accepted,user_accept,id_profile,titre,type,accepte_user,notifsupdated,moment:moment});

            }else{
           
            var id_profile = result4[0].id_profile;
            console.log("id profile : "+id_profile)
            console.log("conncted user profile id: "+req.session.profile_id)
            console.log("accepted user notification id: "+user_accept)
            console.log('the connected user id : '+req.session.user_id)
            console.log("accepted:"+accepted)
           
            res.render('admin/users/notifpage',{title, nom_doc, nom_user,id,accepted,user_accept,id_profile,titre,type,accepte_user,notifsupdated,moment:moment});
           
        }
    })

         }

          
        })

         }
      })
           
         


      })
          }
      })
 
  })

  /*/ --- User PROFILE ACCEPTED DEMANDE ---*/
  app.post('/user/acceptedDemande', redirectLogin,urlencodedParser,function(req,res){
      var notif_id = req.body.notifID;  //ID notification
      var id_user = req.session.user_id; //ID user that accepted the demande
      var doc_name = req.body.nom_doc;
      var title="Traitement de demande";

      console.log('Notification id: '+notif_id)
      let notif = "SELECT * from notifications where id_notif = "+notif_id+""; // All information of the notification
      db.query(notif, (err,result)=>{
          if(err){res.render('admin/errorPage',{err:err})}

          var dem_id = result[0].demande_id; // ID demande of the accepted notification
      
          let demande_inf = "SELECT * from demande WHERE id_demande ="+dem_id+""
          db.query(demande_inf, (err1, result1)=>{
              if(err1) {res.render('admin/errorPage',{err:err1})}
               
              let updDemande = "UPDATE demande SET accepter=1,updated_date=now() WHERE id_demande= "+dem_id+" " //Update the demande data
                  db.query(updDemande, (err2,result2)=>{
                      if(err2){res.render('admin/errorPage',{err:err2})}

                      let accepted_date = "UPDATE notifier SET read_at=now() WHERE id_notificaton="+notif_id+" and id_user="+id_user+"" //Marque the user who accepte the notif demande
                      db.query(accepted_date, (err3,result3)=>{
                          if(err3){res.render('admin/errorPage',{err:err3})}
                          
                          //mark that the notification been accepted 
                          let update_notif = "update notifications set read_at=now(),userIDaccepted="+id_user+" where id_notif="+notif_id+""
                          db.query(update_notif, (err5, result5)=>{
                              if(err5){res.render('admin/errorPage',{err:err5})}
                          })

                          //verify if there is a document sended to redirect
                          //if(result1[0].doc_id === NULL){

                            
                            if(result1[0].doc_id !== null){
                              //var docExist = result1[0].doc_id;
                              //select document informations
                              var docExist = result1[0].doc_id; //the id doc in demande if exist
                              let docInf = "select * from documents where id_doc= "+docExist+""
                              db.query(docInf, (err3, result3)=>{
                                  if(err3) throw err3;
                                  
                                    var docName = result3[0].nom_doc;
                                    var description= result3[0].description;
                                     
                                console.log("i'm in the if condition")
                                    res.render('admin/UserDocuments/createDocs',{title,docExist,docName,description,doc_name,notif_id,moment:moment});

                                 

                                  
                  
                              })
                              
                  
                            }else{
                                var docExist=null;
                                var docName = null;
                                var description=null
                                console.log("doc existe: "+docExist)
                                console.log("i'm here")
                              res.render('admin/UserDocuments/createDocs',{title,docExist,doc_name,notif_id,moment:moment,docName,description});
                  
                            }
                            
                            

                          
                      })
                  })

              
          })
      })
  })
    
};

 