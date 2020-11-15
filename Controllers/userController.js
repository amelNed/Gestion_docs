var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var moment = require('moment')


var urlencodedParser = bodyParser.urlencoded({ extended: true });

const methodOverride = require("method-override");

//var fileUpload = require('express-fileupload');
//var busboy = require("then-busboy");

/** Verify if you're connected or no  */
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
   
    /*  CREATE (USER) TABLE */
    app.get('/createusertable', (req, res)=>{
        let sql = 'CREATE TABLE user(id_user int AUTO_INCREMENT,nom varchar(255),prenom varchar(255),ville varchar(50), email varchar(220), numTel varchar(30), numCarte varchar(225), address varchar(200), userName varchar(40), mdp varchar(100), photo varchar(200), id_profile int, date_creation datetime, date_validation datetime, date_suppression datetime, PRIMARY KEY(id_user), CONSTRAINT FK_profile FOREIGN KEY (id_profile) REFERENCES profile(id_profile) )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('user table created...');
        });
        });

    /*  CREATE (AVOIR) TABLE */
    app.get('/createavoirtable', (req, res)=>{
        let sql = 'CREATE TABLE avoir( id_profile int NOT NULL, id_op int NOT NULL, FOREIGN KEY (id_profile) REFERENCES profile(id_profile) ON DELETE CASCADE, FOREIGN KEY (id_op) REFERENCES operation(id_op) ON DELETE CASCADE, UNIQUE (id_profile, id_op))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('avoir table created...');
        });
        });

   /* --------------------------------------------------------------------------------------------------------------*/ 
        /*  RETURN THE USERS LISTE PAGE */
    app.get('/usersList', redirectLogin,refreshNotif,function(req, res){
        var title="liste utilisateurs";
        let users = "SELECT * FROM user";
        db.query(users, function(err, result){
            if(err) {res.render('admin/errorPage',{err:err})}
           else{

            res.render('admin/users/usersList',{data: result,title,moment:moment});
           }
            

        })
    
    });

        /*  RETURN THE CREATE USER PAGE */
    app.get('/usersList/create', redirectLogin,refreshNotif,function(req, res){
        var title="Nouveau utilisateur";
        let prof = "SELECT * FROM profile ";
        db.query(prof, function(err, result){
            if(err) {res.render('admin/errorPage',{err:err})}
           else{
            res.render('admin/users/create',{data: result,title,moment:moment});

           }
            

        })
        
 
     });

   /*  POST THE NEW USER DATA */
   app.post('/create/user', urlencodedParser, function(req, res){
      //console.log(req.body);

     let idpro= "SELECT id_profile FROM profile WHERE nom= '"+req.body.profile+"'";
     var nom = req.body.nom;
     var prenom = req.body.prenom;
     var numCarte = req.body.numiden;
     var address = req.body.address;
     var numTel = req.body.numtel;
     var email = req.body.email;
     var username= req.body.username;
     var pw = req.body.pwd;
     var ville = req.body.ville;
     
     if (!req.files)
     return res.status(400).send('No files were uploaded.');

    var file = req.files.photo;
    var img_name=file.name;

     if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                      
    file.mv('static/admin/user-images/'+file.name, function(err) {
                  
       if (err)

         return res.status(500).send(err);
         db.query(idpro, function(err, result){
             if(err) {res.render('admin/errorPage',{err:err})}
            else{
                let userr= "INSERT INTO user(nom, prenom, ville, email, numTel, numCarte, address, userName, mdp, photo, id_profile, date_creation) VALUES('"+nom+"', '"+prenom+"', '"+ville+"', '"+email+"', '"+numTel+"', '"+numCarte+"', '"+address+"', '"+username+"', '"+pw+"', '"+img_name+"', "+result[0].id_profile+", now())";
                db.query(userr, function(err, result1){
                    if(err) {res.render('admin/errorPage',{err:err})}
                });
              
            
           
            req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'Utilisateur créer!'
            }
             
        res.redirect('/usersList');

            }
                

        });

          
        
            });
      } else {
         message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
         res.render('/usersList/create',{message: message,moment:moment});
       }
      
      
   });

   /** RETURN THE EDIT USER PAGE */
   app.get('/edit/user/:id',redirectLogin,refreshNotif,urlencodedParser, function(req, res){
       var id = req.params.id;
       var edit = req.body.id;

       console.log('user id '+req.session.user_id)
       console.log(id==req.session.user_id )
       console.log(id==2 )

       //if(id===req.session.user_id || req.session.user_id=== 2) //for not everyone can access the update page only the user or the admin
     
       if(id==req.session.user_id || req.session.user_id==2){
        
       var title="Modifier utilisateur";
       let user = "select * from user where id_user = "+id+"";
       db.query(user, function(err, result){
           if(err) {res.render('admin/errorPage',{err:err})}
        
        let prof = "SELECT * from profile";
        db.query(prof, function(req, result1){
            if(err) {res.render('admin/errorPage',{err:err})}

            else{
                res.render('admin/users/edit',{data: result, data1: result1,title,moment:moment});

            }
         
        })
       })
}else{
    var err="You can't have this page"
    res.render('admin/errorPage',{err:err})
}
    
   });

   /**STORE THE NEW USER UPDATE */
   app.put('/update/store/user/:id', urlencodedParser,function(req, res){

    let idpro= "SELECT id_profile FROM profile WHERE nom= '"+req.body.profile+"'";
    var nom = req.body.nom;
    var prenom = req.body.prenom;
    var numCarte = req.body.numiden;
    var address = req.body.address;
    var numTel = req.body.numtel;
    var email = req.body.email;
    var username= req.body.username;
    var pw = req.body.pwd;
    var ville = req.body.ville;
    var id = req.params.id;

    if (!req.files){
        db.query(idpro, function(err, result){
            if(err) {res.render('admin/errorPage',{err:err})}
           
               let edituser = "UPDATE user SET nom= '"+nom+"', prenom=  '"+prenom+"', ville=  '"+ville+"', email='"+email+"', numTel= '"+numTel+"', numCarte= '"+numCarte+"', address='"+address+"', userName=  '"+username+"', mdp= '"+pw+"', id_profile ="+result[0].id_profile+"  where id_user = "+id+" ";
               db.query(edituser, function(err, result1){
                   if(err) {res.render('admin/errorPage',{err:err})}
               });
             
           
            });
    }else{
        var file = req.files.photo;
    var img_name=file.name;

     if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
        file.mv('static/admin/user-images/'+file.name, function(err) {
                  
            if (err)
     
              return res.status(500).send(err);
              db.query(idpro, function(err, result){
                if(err) {res.render('admin/errorPage',{err:err})}
                console.log("Profile id: "+result[0].id_profile)
               
                   let edituser = "UPDATE user SET nom= '"+nom+"', prenom=  '"+prenom+"', ville=  '"+ville+"', photo= '"+img_name+"', email='"+email+"', numTel= '"+numTel+"', numCarte= '"+numCarte+"', address='"+address+"', userName=  '"+username+"', mdp= '"+pw+"', id_profile ="+result[0].id_profile+" where id_user = "+id+" ";
                   db.query(edituser, function(err, result1){
                       if(err) {res.render('admin/errorPage',{err:err})}
                   });
                 
              
           });



        
    });
}
    }

    req.session.message = {
        type: 'success',
        intro: 'Success:',
        message: 'User modifier avec success!'
    }
     
res.redirect('/usersList');


   });

   /**DELETE A USER */
   app.delete('/delete/user/:id', function(req, res){
       var id= req.params.id;

    let img_del= "SELECT photo FROM user WHERE id_user= "+id+"";
    db.query(img_del,function(err,result){
        if(err) {res.render('admin/errorPage',{err:err})}

        fs.unlink('static/admin/user-images/'+result[0].photo, function (err) {
            if (err) throw err;
            // if no error, file has been deleted successfully
            console.log('File deleted!');
        });
    })
       let del = "DELETE FROM user WHERE id_user = "+id+"";
       
       db.query(del,function(err, result){
           if(err) {res.render('admin/errorPage',{err:err})}

           else{
            req.session.message = {
                type: 'deleted',
                intro: 'Deleted:',
                message: 'Utilisateur supprimer'
             }
            
            res.redirect('/usersList');

           }
           
       })

   });

  /**notifications page */
  app.get('/user/notification', redirectLogin,refreshNotif,function(req,res){
      var id_user = req.session.user_id;
      var title ="Tous les notifications"
      

      //select all the otifications that are accepted by this user and not traited
      let demacpp ="SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and n.type_notif=1 and (n.read_at IS NOT NULL) and (ns.updated_at IS NULL and ns.userIDaccepted="+req.session.user_id+")  ORDER BY created_at DESC"
      //select all the notifications not already accepted
      let dem = "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and type_notif=1 and (n.read_at IS NULL) and n.id_notificaton=ns.id_notif and ns.updated_at IS NULL and (ns.userIDaccepted=0) ORDER BY created_at DESC"
      //select all notifs traited and accepted by this user
      let myNotifs ="SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and type_notif=1 and (n.read_at IS NOT NULL) and n.id_notificaton=ns.id_notif and (ns.updated_at IS NOT NULL) and (ns.userIDaccepted="+req.session.user_id+") ORDER BY created_at DESC"

      db.query(demacpp, (err,result)=>{
          if(err){res.render('admin/errorPage',{err:err})}
          db.query(dem,(err1,result1)=>{
              if(err1){res.render('admin/errorPage',{err:err1})}
              db.query(myNotifs,(err2,result2)=>{
                  if(err2){res.render('admin/errorPage',{err:err2})}
              
              else{

        //array list docs names no accepted demandes       
        var array2=[];
        if(result!== undefined){
          for (var i in result) {
            
            var data = result[i].data.split([',']);
             array2.push(data[1]);
             console.log("nom doc: "+data[1]+" "+i)
          }

        }

        //array list docs name no traited demandes
        var array3=[];
        if(result1!== []){
          for (var i in result1) {
            
            var data = result1[i].data.split([',']);
             array3.push(data[1]);
             console.log("nom doc no accpted: "+data[1]+" "+i)
          }

        }

        //array list docs traited by this user
        var array1=[];
        if(result2!== []){
          for (var i in result2) {
            
            var data = result2[i].data.split([',']);
             array1.push(data[1]);
             console.log("nom doc no accpted: "+data[1]+" "+i)
          }

        }

                  res.render('admin/notifications',{title,data:result1,data1:result,nom_doc:array3,nom_doc2:array2,moment:moment,data3:result2,nom_doc3:array1})
              }
            })
          })
      })
  })
   
    
};

 