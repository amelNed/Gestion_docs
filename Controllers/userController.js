var bodyParser = require('body-parser');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

var fileUpload = require('express-fileupload');
var busboy = require("then-busboy");




module.exports = function(app){

    app.use(fileUpload());

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
    app.get('/usersList', function(req, res){
        let users = "SELECT * FROM user";
        db.query(users, function(err, result){
            if(err) throw err;
           
            res.render('admin/users/usersList',{data: result});

        })
    
    });

        /*  RETURN THE CREATE USER PAGE */
    app.get('/usersList/create', function(req, res){
        let prof = "SELECT * FROM profile ";
        db.query(prof, function(err, result){
            if(err) throw err;
           
            res.render('admin/users/create',{data: result});

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
             if(err) throw err;
            for(i in result){
                let userr= "INSERT INTO user(nom, prenom, ville, email, numTel, numCarte, address, userName, mdp, photo, id_profile, date_creation) VALUES('"+nom+"', '"+prenom+"', '"+ville+"', '"+email+"', '"+numTel+"', '"+numCarte+"', '"+address+"', '"+username+"', '"+pw+"', '"+img_name+"', "+result[i].id_profile+", now())";
                db.query(userr, function(err, result1){
                    if(err) throw err;
                });
              
            }
           
            req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'profile créer!'
            }
             
        res.redirect('/usersList');

        });

          
        
            });
      } else {
         message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
         res.render('/usersList/create',{message: message});
       }
      
      
   });

   /** RETURN THE EDIT USER PAGE */
   app.get('/edit/user/:id', function(req, res){
       var id = req.params.id;
       let user = "select * from user where id_user = "+id+"";
       db.query(user, function(err, result){
           if(err) throw err;
        
        let prof = "SELECT * from profile";
        db.query(prof, function(req, result1){
            if(err) throw err;

         res.render('admin/users/edit',{data: result, data1: result1});
        })
       })
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
            if(err) throw err;
           for(i in result){
               let edituser = "UPDATE user SET nom= '"+nom+"', prenom=  '"+prenom+"', ville=  '"+ville+"', email='"+email+"', numTel= '"+numTel+"', numCarte= '"+numCarte+"', address='"+address+"', userName=  '"+username+"', mdp= '"+pw+"', id_profile ="+result[i].id_profile+"  where id_user = "+id+" ";
               db.query(edituser, function(err, result1){
                   if(err) throw err;
               });
             
           }
       });
    }else{
        var file = req.files.photo;
    var img_name=file.name;

     if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
        file.mv('static/admin/user-images/'+file.name, function(err) {
                  
            if (err)
     
              return res.status(500).send(err);
              db.query(idpro, function(err, result){
                if(err) throw err;
               for(i in result){
                   let edituser = "UPDATE user SET nom= '"+nom+"', prenom=  '"+prenom+"', ville=  '"+ville+"', photo= '"+img_name+"', email='"+email+"', numTel= '"+numTel+"', numCarte= '"+numCarte+"', address='"+address+"', userName=  '"+username+"', mdp= '"+pw+"', id_profile ="+result[i].id_profile+" where id_user = "+id+" ";
                   db.query(edituser, function(err, result1){
                       if(err) throw err;
                   });
                 
               }
           });



        
    });
}
    }

    req.session.message = {
        type: 'success',
        intro: 'Success:',
        message: 'profile créer!'
    }
     
res.redirect('/usersList');


   });

   /**DELETE A USER */
   app.delete('/delete/profile/:id', function(req, res){
       var id= req.params.id;
       let del = "DELETE FROM user WHERE id_user = "+id+"";
       db.query(del,function(err, result){
           if(err) throw err;
           req.session.message = {
            type: 'deleted',
            intro: 'Deleted:',
            message: 'Profile supprimer'
         }
        
        res.redirect('/usersList');
       })

   });
    
};