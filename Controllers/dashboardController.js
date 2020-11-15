var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var moment = require('moment');


var urlencodedParser = bodyParser.urlencoded({ extended: true });

const methodOverride = require("method-override");

//var fileUpload = require('express-fileupload');
//var busboy = require("then-busboy");

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
app.get('/admin/dashboard', redirectLogin, refreshNotif,function(req,res){
  var title="Dashboard";

  let all_dem = "select count(id_demande) as allDem from demande" // count all the demande commited
  let all_user = "select count(id_user) as allUsers from user"  // count all the users exist in the application
  let todysub = "select count(id_user) as recent_user from user where DATE(date_creation) = CURDATE()" // count all the commend of today
  let demans= "select * from demande where clientUser_id = "+req.session.user_id+" and nbre_etapes>num_etape ORDER BY created_date LIMIT 4"; //select the demands of the connected user & show how much time before it'll finish 
  let someUser="select u.nom,u.prenom,p.nom nomprofil, u.photo, u.id_user FROM user u,profile p WHERE p.id_profile=u.id_profile ORDER BY RAND() LIMIT 4" //select 4 random user 

  //Clients documents reiceived
  let myDoc="select d.mime,d.nom_doc,d.description,d.created_date, d.id_doc FROM notifier n, notifications ns, documents d, demande dm WHERE n.id_user="+req.session.user_id+" and n.type_notif=2 and n.id_notificaton=ns.id_notif and ns.demande_id=dm.id_demande and dm.doc_id=d.id_doc ORDER BY d.created_date DESC LIMIT 5"

  db.query(all_dem, (err,result)=>{
    if(err) throw err;
     var nbreDem = result[0].allDem

     console.log(nbreDem)

    db.query(all_user, (err1,result1)=>{
      if(err1) {res.render('admin/errorPage',{err:err1})}

      var nbreUser = result1[0].allUsers;

      db.query(todysub, (err2, result2)=>{
      if(err2) {res.render('admin/errorPage',{err:err2})}
      var recentuser = result2[0].recent_user;

      var months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Otobre", "Novembre", "Décembre"];
      var today = new Date();
      var datetoday =today.getDate()+' '+months[(today.getMonth())]+' '+today.getFullYear();

      //select all the otifications that are accepted by this user and not traited
      let demacpp ="SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and n.type_notif=1 and (n.read_at IS NOT NULL) and (ns.updated_at IS NULL and ns.userIDaccepted="+req.session.user_id+")  ORDER BY created_at DESC LIMIT 5"

      //select all the notifications not already accepted
      let dem = "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and type_notif=1 and (n.read_at IS NULL) and n.id_notificaton=ns.id_notif and ns.updated_at IS NULL and (ns.userIDaccepted=0) ORDER BY created_at DESC LIMIT 5"
      db.query(dem, (err3,result3)=>{
        if(err3) {res.render('admin/errorPage',{err:err3})}
        
        db.query(demacpp,(err66,result66)=>{
          if(err66) {res.render('admin/errorPage',{err:err66})}

        


        var array2=[];
        if(result66!== undefined){
          for (var i in result66) {
            
            var data = result66[i].data.split([',']);
             array2.push(data[1]);
             console.log("nom doc: "+data[1]+" "+i)
          }

        }

        var array3=[];
        if(result3!== []){
          for (var i in result3) {
            
            var data = result3[i].data.split([',']);
             array3.push(data[1]);
             console.log("nom doc no accpted: "+data[1]+" "+i)
          }

        }

       
      
      console.log(result3);
      

      
        db.query(demans, (err5,result5)=>{
          if(err5) throw err5;

          var array=[];
          var array4=[];
          var pourcent = 0;
          for (var i in result5) {
            console.log("i: "+i+" num etape: "+result5[i].num_etape+" nombre etapes: "+result5[i].nbre_etapes )
            pourcent= (parseInt(result5[i].num_etape,10)*100)/parseInt(result5[i].nbre_etapes,10);
            console.log(parseInt(pourcent,10)+'%');
            array4.push(parseInt(result5[i].num_etape,10));
            array.push(parseInt(pourcent,10));
           
        }

        console.log(((today.getMonth())-1))
        //count last month demand
        let lastMD = "select count(id_demande) as last_demande from demande where MONTH(created_date) ="+today.getMonth()+" and YEAR(created_date)="+today.getFullYear()+""
        db.query(lastMD,(err6, result6)=>{
          if(err6) {res.render('admin/errorPage',{err:err6})}
          var nbreDLM = result6[0].last_demande;
          var lastMonth = months[(today.getMonth())-1];

        //execut the random user result
        
        db.query(someUser,(err22,result22)=>{
          let msgMessage = "select * from message where id_destinataire="+req.session.user_id+" and read_at IS NULL"
          db.query(msgMessage,(err33,result33)=>{

          if(err33){res.render('admin/errorPage',{err:err33})}

       
        
        //if the connected is the admin
        if(req.session.user_id === 2){
          let msgs ="select * from contact WHERE read_at IS NULL ORDER BY created_at DESC LIMIT 10"
          db.query(msgs,(err4,result4)=>{
            if(err4) {res.render('admin/errorPage',{err:err4})}
            console.log(result4)

            res.render('admin/dashboard',{title,nbreDem,nbreUser,recentuser,datetoday,data:result3,msgss:result4,pourcent:array,nbreDLM,lastMonth,nom_doc:array2,data2:result66,nom_doc2:array3,data3:result22,moment:moment,data4:result33,numEtape:array4});

          })
        }
     
     
       else{
         db.query(myDoc,(err65,result65)=>{
          if(err65){res.render('admin/errorPage',{err:err65})}
         else{
          var msgss=[];
          res.render('admin/dashboard',{title,nbreDem,nbreUser,recentuser,datetoday,data:result3,pourcent:array,nbreDLM,lastMonth,nom_doc:array2,data2:result66,nom_doc2:array3,msgss,data3:result22,moment:moment,data4:result33,numEtape:array4,data5:result65});
         }
         

        })
         
       }
      })

      })
      })
    })
    })
  })
    })
    })
  })

})

/*/ * Accepte without refreshing*/
app.post('/admin/acceptenotif',urlencodedParser,refreshNotif, function(req,res){
  var id_notif = req.body.notifID;
  var id_user = req.session.user_id
  var typePage = req.body.typePage;

  console.log(id_notif)
  let acceptedemande = "update notifier set read_at=now() where id_notificaton="+id_notif+" and id_user="+id_user+""
  db.query(acceptedemande,(err,result)=>{
    if(err) {res.render('admin/errorPage',{err:err})}

    let updnotfs="update notifications set userIDaccepted="+id_user+" where id_notif="+id_notif+""
    db.query(updnotfs,(err5,result5)=>{
      if(err5) {res.render('admin/errorPage',{err:err5})}
    

    console.log('demand accepted')
    console.log('page type: '+typePage)
    if( parseInt(typePage,10) ===1){
      res.redirect('/admin/dashboard');
    }else{
      res.redirect('/user/notification');
    }

    
  })
    
  })
})


/** POST the temoignage  */
app.post('/sendtemoignage',redirectLogin,urlencodedParser,function(req,res){
  var tem_text= escape(req.body.temoitext);

  let inserttem = "insert into temoignage(id_user,temoi_text,created_at) values("+req.session.user_id+",'"+tem_text+"',now())";
  db.query(inserttem,(err,result)=>{
    if(err) throw err;

    message = req.session.message = {
      type: 'success',
      intro: 'success:',
      message: 'Temoignage envoyer!'
  }

    res.redirect('/admin/dashboard');
  })
})

/** List temoignage */
app.get('/admin/ListTem',redirectLogin ,function(req,res){
  var title="Témoignages";
  
  //Select the temoignage
  let temList ="select * from temoignage t, user u where u.id_user=t.id_user ORDER BY created_at DESC"
  db.query(temList,(err,result)=>{
    if(err){res.render('admin/errorPage',{err:err})}
    else{
      res.render('admin/Emails/listTem',{title,data:result,moment:moment})
    }
  })
})

/**DELETE temoignage */
app.delete('/delete/temoignage/:id', function(req, res){
  var id= req.params.id; //temoignage id

  //Delete temoignage
  let delTem = "DELETE FROM temoignage WHERE id_tem="+id+""
  db.query(delTem,(err,result)=>{
    if(err){res.render('admin/errorPage',{err:err})}
    else{

      req.session.message = {
        type: 'deleted',
        intro: 'Deleted:',
        message: 'Temoignage Supprimer'
     }
    
    res.redirect('/admin/ListTem');
    }
  })

});

/*/Etats des demandes de ce client */
app.get('/etatsDemande',redirectLogin,refreshNotif,function(req,res){
  var title="Etats des Demandes"
  let demans= "select * from demande where clientUser_id = "+req.session.user_id+" and nbre_etapes>num_etape ORDER BY created_date DESC"; //select the demands of the connected user & show how much time before it'll finish 
  db.query(demans, (err5,result5)=>{
    if(err5) {res.render('admin/errorPage',{err:err5})}
    else{
      var array=[];
      var array4=[];
      var pourcent = 0;
      for (var i in result5) {
        console.log("i: "+i+" num etape: "+result5[i].num_etape+" nombre etapes: "+result5[i].nbre_etapes )
        pourcent= (parseInt(result5[i].num_etape,10)*100)/parseInt(result5[i].nbre_etapes,10);
        console.log(parseInt(pourcent,10)+'%');
        array4.push(parseInt(result5[i].num_etape,10));
        array.push(parseInt(pourcent,10));
      
    }
    res.render('admin/users/etatsDemande',{title,pourcent:array,numEtape:array4,moment:moment,data:result5})

    }
 
});

})
};

 