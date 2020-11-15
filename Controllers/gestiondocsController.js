var bodyParser = require('body-parser');
var moment  = require('moment')

var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

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
    app.use(bodyParser.json());

    //Methode for using PUT methode
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    //type document table creation
    app.get('/typedocs', (req, res)=>{
        let sql = 'CREATE TABLE typedocs(id_type int AUTO_INCREMENT,nomdoc varchar(255), nbre_etapes int, PRIMARY KEY(id_type))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('type document table created...');
        });
        });

    //etpes document table creation
    app.get('/etapes', (req, res)=>{
        let sql = 'CREATE TABLE etapes(id_etapes int AUTO_INCREMENT,num_etape int, id_profile int, id_type int, etape_suivante boolean, PRIMARY KEY(id_etapes), CONSTRAINT FK_typeetape FOREIGN KEY (id_type) REFERENCES typedocs(id_type) ON DELETE CASCADE)';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('Etapes table created...');
        });
        });
/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
  app.get('/admin/createdocycle', redirectLogin,refreshNotif, function(req,res){

    var title="Nouveau cycle de type de document";
    var updat=0;
    
    res.render('admin/cycleVie/createStep',{title,updat,moment:moment});

  });

  /* Store the new document infos and require the steps page */
  app.post('/admin/storedoc', redirectLogin,urlencodedParser, function(req, res){
    var docname= req.body.nom;
    var nbreSteps = req.body.nombre;
    var updat=0;
    

    

    if(docname!==null && nbreSteps!==null){

      let newdoc = "INSERT INTO typedocs(nomdoc,nbre_etapes) VALUES('"+docname+"', "+nbreSteps+")";
      db.query(newdoc, (err, result)=> {
         if(err) {res.render('admin/errorPage',{err:err})}
         else{
           var title= "Renseigner les étapes";
           var profile = "SELECT * FROM profile";
           db.query(profile, (err1, result1)=>{
             if(err1) {res.render('admin/errorPage',{err:err1})}
             else{
              let id = " select * from typedocs where id_type=(SELECT LAST_INSERT_ID()) and nbre_etapes="+nbreSteps+"";
              db.query(id,(err2, result2)=>{
                 if(err2) {res.render('admin/errorPage',{err:err2})}
                 else{
                  var id_doc = result2[0].id_type;
                  console.log("id document: "+id_doc);
                  console.log("nbreSteps: "+nbreSteps);
                  var preID=result2[0].id_type;
                  console.log("PREVIEWS ID: "+preID)
                 
                  var numstep=1;
                 res.render('admin/cycleVie/etapesPage',{title,data: result1, id_doc,numstep, nbreSteps,updat,preID,moment:moment});

                 }
                 

              })
              
             }
            
            
           })
       }
    });
  }

  });

  /*/ back to create type doc */
  app.get('/admin/backCreateCycle/:id',redirectLogin,refreshNotif,urlencodedParser,function(req,res){
    var title="Nouveau cycle de type de document";
    var updat=1;
    var id_type= req.params.id;

    //select type doc name to modified
    let nameType="select * from typedocs where id_type="+id_type+"";
    db.query(nameType,(err,result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}

      else{
        var nomtype= result[0].nomdoc;
      var nbretype=result[0].nbre_etapes;

      res.render('admin/cycleVie/createStep',{title,updat,nomtype,nbretype,id_type,moment:moment});

      }
      

    })
  })

  
  /*/*update type doc informations*/
  app.put('/admin/storedoc/:id', redirectLogin,urlencodedParser,function(req, res){
    var title="Renseigner les étapes"
    var updat=0;
    var id_doc= req.params.id; //ID type document
    var doc_name = req.body.nom;
    var nbreSteps= req.body.nombre;
    var numstep=1;

    //Les profils
    let profil="select * from profile "
    let updatetypedoc="update typedocs set nomdoc='"+doc_name+"',nbre_etapes="+nbreSteps+" where id_type="+id_doc+" "
    db.query(updatetypedoc,(err,result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}
    })
    db.query(profil,(err1,result1)=>{
       if(err1) {res.render('admin/errorPage',{err:err1})}
       else{
        var preID=id_doc;
        res.render('admin/cycleVie/etapesPage',{title,data: result1, id_doc,numstep, nbreSteps,updat,preID,moment:moment})
       }
      

    })


    


  });

  /*store steps-------------*/
  app.post('/admin/storesteps', urlencodedParser, function(req, res){

    var id_doc = req.body.docId;  //id type document
    var numestep = req.body.numstep; // numéro etape actuelle 
    var nbreSteps = req.body.nbreSteps; //nombre etapes type document
    var nomProfile= req.body.profile; //nom profil choisit

    var updat=0;
    
    console.log("step first insert: "+id_doc+","+numestep+","+nbreSteps+","+nomProfile)
  

    // if it's already specyfied the docement and steps nombre
  if(nomProfile !== null &&  parseFloat(numestep) <= parseFloat(nbreSteps) && id_doc!==null){

    console.log('i am here in the loop ')
    
    let idProfile = "SELECT id_profile FROM profile WHERE nom= '"+nomProfile+"'";
    db.query(idProfile, (err, result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}
      var idpro = result[0].id_profile;
      
      if(parseFloat(numestep)!== parseFloat(nbreSteps)){

        console.log("numstep:"+numestep);
        
        console.log('1 value to insert:'+parseInt(numestep, 10)+","+idpro+","+id_doc+",1")
        let newStep = "INSERT INTO etapes(num_etape,id_profile,id_type,etape_suivante) VALUES("+parseInt(numestep, 10)+","+idpro+","+id_doc+",1)";
        db.query(newStep,(err1, result1)=>{
          if(err1) {res.render('admin/errorPage',{err:err1})}

        })

        let pID =  " select * from etapes where id_etapes=(SELECT LAST_INSERT_ID()) and id_type="+id_doc+"";
        db.query(pID, (err4,result4)=>{
          if(err4) {res.render('admin/errorPage',{err:err4})}

          var preID = result4[0].id_etapes;
        

          var profile = "SELECT * FROM profile";
         db.query(profile, (err2, result2)=>{
           if(err2) {res.render('admin/errorPage',{err:err2})}

          var title="Renseigner les étapes";
         var numstep= parseInt(numestep, 10)+1;
         
         if((parseInt(numestep,10)+1 ) <= parseInt(nbreSteps,10)){

          res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat,moment:moment});
         }
         //else it's finished all the steps
          else{
      req.session.message = {
        type: 'success',
        intro: 'Success:',
        message: 'Nouveau cycle de vie du document créer!'
    }
     
  res.redirect('/admin/ListeCycle');
    }
       

        })
      })
     
    }else{
      console.log('2 value to insert:'+parseInt(numestep, 10)+","+idpro+","+id_doc+",0")
      let newStep = "INSERT INTO etapes(num_etape,id_profile,id_type,etape_suivante) VALUES("+parseInt(numestep, 10)+","+idpro+","+id_doc+",0)";
      db.query(newStep,(err1, result1)=>{
        if(err1) {res.render('admin/errorPage',{err:err1})}
      })

        let pID =  " select * from etapes where id_etapes=(SELECT LAST_INSERT_ID()) and id_type="+id_doc+"";
        db.query(pID, (err4,result4)=>{
          if(err4) {res.render('admin/errorPage',{err:err4})} 
          var preID = result4[0].id_etapes;

        var profile = "SELECT * FROM profile";
       db.query(profile, (err2, result2)=>{
         if(err2) {res.render('admin/errorPage',{err:err2})}

         
      
      })
       if((parseInt(numestep,10)+1 ) <= parseInt(nbreSteps,10)){
        var numstep= parseInt(numestep, 10)+1;
        var title="Renseigner les étapes";
        res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat,moment:moment});
       }//If it's finished all the steps
        else{
    req.session.message = {
      type: 'success',
      intro: 'Success:',
      message: 'Nouveau cycle de vie du document créer!'
  }
   
res.redirect('/admin/ListeCycle');
  }
        

      })
    
    }
      

    })
  }
  
  
  


  });

  /**Back previews step to updated */
  app.get('/admin/previewStep/:id', redirectLogin,refreshNotif,urlencodedParser,function(req, res){
      var idetape = req.params.id; //id previews step
      var updat=1;
      var title= "Renseigner les étapes";
      
      let profil = "select * from profile";
      let stepInfo = "select * from etapes where id_etapes= "+idetape+"";
      
      db.query(stepInfo,(err,result)=>{
        if(err){res.render('admin/errorPage',{err:err})}
      
        let typedocInfo = "select * from typedocs where id_type = "+result[0].id_type+"";
        db.query(typedocInfo, (err1,result1)=>{
          if(err1){res.render('admin/errorPage',{err:err1})}

          var ne = (result[0].num_etape)-1;

          
          console.log("num etape precedente: "+ne)

         
             
            db.query(profil,(err4,result4)=>{
              if(err4) {res.render('admin/errorPage',{err:err4})}

              var id_doc=result[0].id_type;
              var numstep = result[0].num_etape;
              var nbreSteps = result1[0].nbre_etapes;

              if(ne!==0){
              let pID = "select * from etapes where id_type= "+result[0].id_type+" and num_etape="+ne+""
              db.query(pID,(err2, result2)=>{
                if(err2) throw err2;

            var preID=result2[0].id_etapes;
           

            
            console.log('The info send:'+preID+","+id_doc+","+numstep+","+nbreSteps)
            

            res.render('admin/cycleVie/etapesPage',{title,data: result4, nbreSteps, id_doc,numstep,preID,updat,idetape,moment:moment});

            })
          }else{
            var preID=result[0].id_type;
           
            res.render('admin/cycleVie/etapesPage',{title,data: result4, nbreSteps, id_doc,numstep,preID,updat,idetape,moment:moment});

          }
            
          })

        })
      })
     
     
      
     
  });
  

  /** A back step update */
  app.put('/admin/updateStep/:id', redirectLogin, urlencodedParser,function(req, res){
    var idstep = req.params.id; //id_etapes actuelle

    var numestep = req.body.numstep; // Le numero de la'étape actuelle  
    var nbreSteps = req.body.nbreSteps; //Le nombre initial de tout les étapes 
    var nomProfile= req.body.profile; //le nom du profile de cette étape
    var id_doc= req.body.docId; // Id du type document
    var title = "Renseigner les étapes"; 
    var updat=0;

    console.log("update a step: "+id_doc+","+numestep+","+nbreSteps+","+nomProfile+","+idstep)
    
    let profil = "select *  from profile"
    let id_profile= "select * from profile where nom= '"+nomProfile+"' ";

    db.query(id_profile,(err, result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}

      let updatstep = "update etapes set id_profile="+result[0].id_profile+" where id_etapes="+idstep+""
      db.query(updatstep,(err1,result1)=>{
        if(err1) {res.render('admin/errorPage',{err:err1})}
       })

       db.query(profil,(err2, result2)=>{
         if(err2) {res.render('admin/errorPage',{err:err2})}
         
         else{
          var preID=idstep;  
          var numstep= parseInt(numestep,10)+1;
          res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat,moment:moment});

         }
         
       })

      
    })
    

   
  });

  /*/ -----RETURN THE LIST OF DOCUMENTS*/
  app.get('/admin/ListeCycle',redirectLogin,refreshNotif, function(req,res){

    title="Les cycles de type de document"
    let docs= "select * from typedocs"
    db.query(docs,(err, result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}
    else{
      res.render('admin/cycleVie/stepListe',{title,data: result,moment:moment});
    }  
      

    })

  })

  /*/ Details of the type document */
  app.get('/admin/detailsDoc/:id',redirectLogin, refreshNotif,function(req,res){
    var id = req.params.id; //type document ID
    var title = "Details cycle de type de document"

    let stepsdetails = "select p.nom, e.num_etape, e.etape_suivante from etapes e,profile p where id_type= "+id+" and p.id_profile=e.id_profile ORDER BY e.num_etape ASC"; //select all the steps informations
    db.query(stepsdetails, (err, result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}

      let docinfo = "select * from typedocs where id_type= "+id+"";
      db.query(docinfo, (err1 ,result1)=>{
        if(err1) {res.render('admin/errorPage',{err:err})}
      
        else{
          var docname = result1[0].nomdoc;
        var nbretapes = result1[0].nbre_etapes;

       
        res.render('admin/cycleVie/details',{title, data:result,docname,nbretapes,moment:moment})

        }
        
      })

     
    })

  })

  /*/ Delete this type document & steps */
  app.delete('/delete/docycle/:id', function(req, res){

    var id = req.params.id; //the doc type ID

    let delsteps = "DELETE FROM etapes where id_type = "+id+"" ; //delete all the steps of this type doc
    db.query(delsteps, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
        //console.log(result);
    let del = "DELETE FROM typedocs WHERE id_type = "+id+"";
    db.query(del, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
        else{
          req.session.message = {
            type: 'deleted',
            intro: 'Deleted:',
            message: 'Type document supprimé'
         }
        
   res.redirect('/admin/ListeCycle');

        }

         
    });    
   });

  });
};