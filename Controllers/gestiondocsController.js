var bodyParser = require('body-parser');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

var redirectLogin = (req, res, next)=>{
    if(!req.session.user_id){
        res.redirect('/login');
    }else{
        next();
    }
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
  app.get('/admin/createdocycle', function(req,res){

    var title="New document cycle";
    
    res.render('admin/cycleVie/createStep',{title});

  });

  /* Store the new document infos and require the steps page */
  app.post('/admin/storedoc', urlencodedParser, function(req, res){
    var docname= req.body.nom;
    var nbreSteps = req.body.nombre;
    var updat=0;
    var preID=0;

    

    if(docname!==null && nbreSteps!==null){

      let newdoc = "INSERT INTO typedocs(nomdoc,nbre_etapes) VALUES('"+docname+"', "+nbreSteps+")";
      db.query(newdoc, (err, result)=> {
         if(err) throw err;
         else{
           var title= "renseigner les étapes";
           var profile = "SELECT * FROM profile";
           db.query(profile, (err1, result1)=>{
             if(err1) throw err1;
             else{
              let id = " select * from typedocs where id_type=(SELECT LAST_INSERT_ID()) and nbre_etapes="+nbreSteps+"";
              db.query(id,(err2, result2)=>{
                 if(err2) throw err2;
                 var id_doc = result2[0].id_type;
                 console.log("id document: "+id_doc);
                 console.log("nbreSteps: "+nbreSteps);
                
                 var numstep=1;
                res.render('admin/cycleVie/etapesPage',{title,data: result1, id_doc,numstep, nbreSteps,updat,preID});

              })
              
             }
            
            
           })
       }
    });
  }

  

 

    

  });

  /*store steps-------------*/
  app.post('/admin/storesteps', urlencodedParser, function(req, res){

    var id_doc = req.body.docId;
    var numestep = req.body.numstep;
    var nbreSteps = req.body.nbreSteps;
    var nomProfile= req.body.profile;

    var updat=0;
    
    console.log("step first insert: "+id_doc+","+numestep+","+nbreSteps+","+nomProfile)
  

    // if it's already specyfied the docement and steps nombre
  if(nomProfile !== null &&  parseFloat(numestep) <= parseFloat(nbreSteps) && id_doc!==null){

    console.log('i am here in the loop ')
    
    let idProfile = "SELECT id_profile FROM profile WHERE nom= '"+nomProfile+"'";
    db.query(idProfile, (err, result)=>{
      if(err) throw err;
      var idpro = result[0].id_profile;
      
      if(parseFloat(numestep)!== parseFloat(nbreSteps)){

        console.log("numstep:"+numestep);
        
        console.log('1 value to insert:'+parseInt(numestep, 10)+","+idpro+","+id_doc+",1")
        let newStep = "INSERT INTO etapes(num_etape,id_profile,id_type,etape_suivante) VALUES("+parseInt(numestep, 10)+","+idpro+","+id_doc+",1)";
        db.query(newStep,(err1, result1)=>{
          if(err1) throw err1;

        let pID =  " select * from etapes where id_etapes=(SELECT LAST_INSERT_ID()) and id_type="+id_doc+"";
        db.query(pID, (err4,result4)=>{
          if(err4) throw err4;

          var preID = result4[0].id_etapes;
        

          var profile = "SELECT * FROM profile";
         db.query(profile, (err2, result2)=>{
           if(err2) throw err2;

          var title="Renseigner les étapes";
         var numstep= parseInt(numestep, 10)+1;
         
         if((parseInt(numestep,10)+1 ) <= parseInt(nbreSteps,10)){

          res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat});
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
      })
    }else{
      console.log('2 value to insert:'+parseInt(numestep, 10)+","+idpro+","+id_doc+",0")
      let newStep = "INSERT INTO etapes(num_etape,id_profile,id_type,etape_suivante) VALUES("+parseInt(numestep, 10)+","+idpro+","+id_doc+",0)";
      db.query(newStep,(err1, result1)=>{
        if(err1) throw err1;

        let pID =  " select * from etapes where id_etapes=(SELECT LAST_INSERT_ID()) and id_type="+id_doc+"";
        db.query(pID, (err4,result4)=>{
          if(err4) throw err4; 
          var preID = result4[0].id_etapes;

        var profile = "SELECT * FROM profile";
       db.query(profile, (err2, result2)=>{
         if(err2) throw err2;

         
      
      })
       if((parseInt(numestep,10)+1 ) <= parseInt(nbreSteps,10)){
        var numstep= parseInt(numestep, 10)+1;
        var title="Renseigner les étapes";
        res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat});
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
    })
    }
      

    })
  }
  
  
  


  });

  /**Back previews step to updated */
  app.get('/admin/previewStep/:id', urlencodedParser,function(req, res){
      var idetape = req.params.id;
      var updat=1;
      var title= "Renseigner les étapes";
      
      let profil = "select * from profile";
      let stepInfo = "select * from etapes where id_etapes= "+idetape+"";
      
      db.query(stepInfo,(err,result)=>{
        if(err) throw err;
      
        let typedocInfo = "select * from typedocs where id_type = "+result[0].id_type+"";
        db.query(typedocInfo, (err1,result1)=>{
          if(err1) throw err1;

          var ne = (result[0].num_etape)-1;
          console.log("num etape precedente: "+ne)

          let pID = "select * from etapes where id_type= "+result[0].id_type+" and num_etape="+ne+""
          db.query(pID,(err2, result2)=>{
            if(err2) throw err2;
             
            db.query(profil,(err4,result4)=>{
              if(err4) throw err4;

            var preID=result2[0].id_etapes;
            var id_doc=result[0].id_type;
            var numstep = result[0].num_etape;
            var nbreSteps = result1[0].nbre_etapes;

            
            console.log('The info send:'+preID+","+id_doc+","+numstep+","+nbreSteps)
            

            res.render('admin/cycleVie/etapesPage',{title,data: result4, nbreSteps, id_doc,numstep,preID,updat,idetape});

            })
            
          })

        })
      })
     
     
      
     
  });
  

  /** A back step update */
  app.put('/admin/updateStep/:id', urlencodedParser,function(req, res){
    var idstep = req.params.id; //id_etapes actuelle

    var numestep = req.body.numstep; // Le numero de la'étape actuelle  
    var nbreSteps = req.body.nbreSteps; //Le nombre initial de tout les étapes 
    var nomProfile= req.body.profile; //le nom du profile de cette étape
    var id_doc= req.body.docId; // Id du type document
    var title = "Renseigner les étapes"; 
     
    console.log("update a step: "+id_doc+","+numestep+","+nbreSteps+","+nomProfile+","+idstep)
    

    let id_prof = "select * from profile where nom = '"+nomProfile+"' " 
    let profil= "select * from profile"
    let infoStep = "select * from etapes where id_etapes= "+idstep+"";

    db.query(id_prof,(err,result)=>{
      if(err) throw err;
      

      let upStep = "UPDATE  etapes SET id_profile= "+result[0].id_profile+" WHERE id_etapes= "+idstep+" "
      db.query(upStep,(err1, result1)=>{
        if(err1) throw err1;
        
      })
      db.query(profil,(err2,result2)=>{
        if(err2) throw err2;

      db.query(infoStep,(err4, result4)=>{
        if(err4) throw err4;
        var numstep= parseFloat(numestep)+1;
        var nums = parseFloat(numestep,10)-1;

        console.log('next step num:'+numstep)
        console.log('preview step num:'+nums)

        let nextstep = "select * from etapes where num_etape = "+parseInt(numstep,10) +" and id_type="+id_doc+" ";
        let prevID = "select * from etapes where num_etape = "+parseInt(nums,10)+" and id_type="+id_doc+"";

        
          

          db.query(prevID, (err6,result6)=>{
            if(err6) throw err6;

            db.query(nextstep,(err5, result5)=>{
              if(err5) throw result5;

            if(result5[0].id_etapes !== null){
              console.log('the next already insert !')
              var updat= 0;
              var preID= result6[0].id_etapes;
              res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat});
            }else{
              console.log('the next step not insert yet !')
              var updat= 1;
              var preID= result6[0].id_etapes;
              var idetape= result5[0].id_etapes;
              res.render('admin/cycleVie/etapesPage',{title,data: result2, nbreSteps, id_doc,numstep,preID,updat,idetape});
            }
          
        })
      })

      })
      })

      
    })
   
    
    console.log("i'm in the update function!")

  });

  /*/ -----RETURN THE LIST OF DOCUMENTS*/
  app.get('/admin/ListeCycle', function(req,res){

    title="Les cycles des documents"
    let docs= "select * from typedocs"
    db.query(docs,(err, result)=>{
      if(err) throw err;
      
      res.render('admin/cycleVie/stepListe',{title,data: result});

    })

  })
};