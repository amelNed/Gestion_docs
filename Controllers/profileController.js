var bodyParser = require('body-parser');
var moment = require('moment')

var urlencodedParser = bodyParser.urlencoded({ extended: false });

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
    app.use(bodyParser.json());

    //Methode for using PUT methode
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    //operation table creation
    app.get('/createprofiletable', (req, res)=>{
        let sql = 'CREATE TABLE profile(id_profile int AUTO_INCREMENT,nom varchar(255), date_creation datetime, date_suppression datetime, date_modication datetime, PRIMARY KEY(id_profile))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('profile table created...');
        });
        });
/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
    /** Return the profile list page */    
    app.get('/profileList',redirectLogin,refreshNotif,function(req, res){
        var title="Liste Profils";
        let data = "SELECT * FROM profile";
        db.query(data, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            //console.log(result);
            else{
                res.render('admin/profile/profileList',{data: result,title,moment:moment});
            }
            
            
       });
    
    });

    /* Return create page */
    app.get('/profileList/create', redirectLogin,refreshNotif,function(req, res){
        
        let data = "SELECT * FROM operation";
        db.query(data, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            //console.log(result);
            else{
                var title= "Create Profil"
                res.render('admin/profile/create',{data: result, title,moment:moment});

            }
          
            
       });
        
     });

     /* POST THE NEW PROFILE DATA */
     app.post('/createprofile', urlencodedParser, function(req, res){
        var [operations]  = req.body.operation;
        var name = req.body.nom;
      
        var prof = "INSERT INTO profile(nom,date_creation) VALUES('"+name+"', now())";
         db.query(prof, (err, result)=> {
            if(err){res.render('admin/errorPage',{err:err})}
          });

         var idpro = "SELECT id_profile FROM profile WHERE nom = '"+name+"'  " ;
         db.query(idpro, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
        
            for (var i in req.body.operation) {
                let idop= "SELECT id_op from operation where op_nom = '"+req.body.operation[i]+"' ";
                db.query(idop, (err, result1)=> {
                    if(err) {res.render('admin/errorPage',{err:err})}

                    for (var i in result1 ){
                     let having = "INSERT INTO avoir(id_profile, id_op) VALUES("+result[i].id_profile+","+result1[i].id_op+")";
                      db.query(having, (err, result2)=> {
                        if(err) {res.render('admin/errorPage',{err:err})}
                   // console.log('inserer');
                    });
                    //console.log('id operation'+result[i].id_profile);
                    //console.log('profile id'+result1[i].id_op);

                    }
                    

                });     
               // console.log(req.body.operation[i]);  
            }
            req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'profile créer!'
            }
             
        res.redirect('/profileList');
            
        });

       
   });

   /**return page modification of profile*/
   app.get('/edit/:id',redirectLogin,refreshNotif, urlencodedParser,function(req, res){
       var id= req.params.id;
       var title= "Modify Profil"
    var data ="SELECT * FROM profile WHERE id_profile = "+id+"";
    db.query(data, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
       
   var data1 ="SELECT * FROM operation ";
    db.query(data1, (err, result1)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
        
   var data2 ="SELECT * FROM avoir where id_profile = "+id+" ";
    db.query(data2, (err, result2)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
     else{
        res.render('admin/profile/edit',{data: result, data1: result1, data2: result2,title,moment:moment});
     }   
   
});
});
});

});

// Store the new modifications 
app.put('/profile/update/:id', redirectLogin,urlencodedParser,function(req, res){
    var name = req.body.nom;
    var id = req.params.id;

    let prof = "UPDATE profile SET nom = '"+name+"' , date_modication=now() WHERE id_profile = "+id+"";
    db.query(prof, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
    });   
    
    let deleteold = "DELETE FROM avoir WHERE id_profile = "+id+"";
    db.query(deleteold, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
    });  
        
    for (var i in req.body.operation) {
        let idop= "SELECT id_op from operation where op_nom = '"+req.body.operation[i]+"' ";
        db.query(idop, (err, result1)=> {
            if(err){res.render('admin/errorPage',{err:err})}

            for (var i in result1 ){
             let having = "INSERT INTO avoir(id_profile, id_op) VALUES("+id+","+result1[i].id_op+")";
              db.query(having, (err, result2)=> {
                if(err) {res.render('admin/errorPage',{err:err})}
           
            });
          
            }
            

        });   
       
    }
   
        req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'Modifier avec success'
            }
             
    
        res.redirect('/profileList');
      
  });

  //Delete a profil
  app.delete('/delete/profile/:id', redirectLogin,function(req, res){
    var id = req.params.id;
    let delFkeys = "DELETE FROM avoir where id_profile = "+id+"" ;
    db.query(delFkeys, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
        //console.log(result);
    let del = "DELETE FROM profile WHERE id_profile = "+id+"";
    db.query(del, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
else{
    req.session.message = {
        type: 'deleted',
        intro: 'Deleted:',
        message: 'Profile supprimer'
     }
    
res.redirect('/profileList');
}
       
    });    
   });
   });

   //Show 
   app.get('/show/profile/:id', redirectLogin,refreshNotif,urlencodedParser,function(req, res){
    var id= req.params.id;
    if(id!==null){
        var title= "Details Profil"
        var data ="SELECT * FROM profile WHERE id_profile = "+id+"";
        db.query(data, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
           
       var data1 ="SELECT * FROM operation ";
        db.query(data1, (err, result1)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            
       var data2 ="SELECT * FROM avoir where id_profile = "+id+" ";
        db.query(data2, (err, result2)=> {
            if(err){res.render('admin/errorPage',{err:err})}
            else{
                res.render('admin/profile/show',{data: result, data1: result1, data2: result2,title,moment:moment});
            }
            
       
       });
       });
       });

    }else{
        res.redirect('/home');
    }
   

});


    
};