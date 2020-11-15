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
   
/*/----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/    
app.get('/user/searchResult', redirectLogin,refreshNotif,urlencodedParser, function(req, res){
  var title = "Resultat de la Recherche";
  var searchword = req.param("search");

  console.log(searchword)

  //Search documents
  let docs = "select * from documents d, gerer g where ((nom_doc LIKE '%"+searchword+"') or (nom_doc LIKE '%"+searchword+"%') or (nom_doc LIKE '"+searchword+"%') or(description LIKE '%"+searchword+"') or (description LIKE '%"+searchword+"%') or (description LIKE '"+searchword+"%')) and g.id_user= "+req.session.user_id+" and g.id_doc=d.id_doc ORDER BY g.date DESC"
  db.query(docs, (err,result)=>{
     console.log(result)
     console.log("word: "+searchword);

     //search users
     let user = "select * from user where ((nom LIKE '%"+searchword+"') or (nom LIKE '%"+searchword+"%') or (nom LIKE '"+searchword+"%'))  or ((prenom LIKE '%"+searchword+"') or (prenom LIKE '%"+searchword+"%') or (prenom LIKE '"+searchword+"%')) "
     db.query(user, (err1,result1)=>{
       console.log(result1);

       //select all demandes 
    let alldem="select * from demande d,user u, typedocs t WHERE (( d.typedocs_id=t.id_type and u.id_user=d.clientUser_id) and ((u.id_user=d.clientUser_id ) and ((u.nom LIKE '%"+searchword+"') or (u.nom LIKE '%"+searchword+"%') or (u.nom LIKE '"+searchword+"%'))  or ((u.prenom LIKE '%"+searchword+"') or (u.prenom LIKE '%"+searchword+"%') or (u.prenom LIKE '"+searchword+"%')))) ORDER BY d.created_date DESC"
      db.query(alldem,(err2,result2)=>{

        res.render('admin/searchResult',{title, data:result,data2:result1,moment:moment,data3:result2})
       
      })
     })


     
  })

})

/*/ display user details*/
app.get("/displayResultU/:id",redirectLogin,refreshNotif,urlencodedParser,function(req,res){
  var userID = req.params.id;
  var type= 1;
  var title="Details"

  if(req.session.profile_id!==7){
    let details = "select * from user where id_user="+userID+""
  db.query(details,(err,result)=>{
    if(err) {res.render('admin/errorPage',{err:err})}


  let nompro = "select * from profile where id_profile="+result[0].id_profile+""
    db.query(nompro, (err1,result1)=>{
    if(err1) {res.render('admin/errorPage',{err:err1})}
    
   
    else{
      var nomprofi = result1[0].nom;
    res.render('admin/detailSearch',{title,type,data:result,nomprofi,moment:moment});
  }
  })  
  })

  }
  
  
})

/*/ Display document info*/
app.get('/displayResultD/:id',redirectLogin,refreshNotif,urlencodedParser,function(req,res){
 var id_doc = req.params.id;
  var title = "Details";
  var type=2;
  
  //select doc info 
  let docinfo="select * FROM documents  WHERE id_doc="+id_doc+""
  db.query(docinfo, (err,result)=>{
    if(err) {res.render('admin/errorPage',{err:err})}

    //select all users 
    let users="select u.nom, u.prenom, u.userName, g.date FROM user u, gerer g where g.id_doc="+id_doc+" and g.id_user=u.id_user"
    db.query(users,(err1,result1)=>{
      if(err1) {res.render('admin/errorPage',{err:err1})}

      else{
        res.render('admin/detailSearch',{title,type,data2:result,data3:result1,moment:moment});
      }
      
    })
  })

})

/*/ Display All demandes to admin*/
app.get('/admin/gererDemandes',redirectLogin,refreshNotif, function(req,res){
  var title="Demandes"

  //select all demandes 
  let alldem="select * from demande d,user u, typedocs t WHERE (u.id_user=d.clientUser_id and d.typedocs_id=t.id_type) ORDER BY d.created_date DESC"
  db.query(alldem,(err, result)=>{
    if(err){res.render('admin/errorPage',{err:err})}
    else{
     
      
      res.render('admin/cycleVie/gererDemandes',{title,data:result,moment:moment});
    }
  })
})

/*/ DELETE demande*/
app.delete('/admin/deleteDemande/:id', function(req, res){
  var id_dem = req.params.id;

  //delete the demande 
  let delDemande = "DELETE FROM demande where id_demande="+id+"";
  db.query(delDemande,(err,result)=>{
    if(err){res.render('admin/errorPage',{err:err})}
    else{
      req.session.message = {
        type: 'deleted',
        intro: 'Deleted:',
        message: 'Demande Supprimer'
     }
    
    res.redirect('/user/searchResult');
    }
  })
});


};

 