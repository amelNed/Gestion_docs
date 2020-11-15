var bodyParser = require('body-parser');
var passport = require('passport');
var showToast = require("show-toast");



var urlencodedParser = bodyParser.urlencoded({ extended: true });

const methodOverride = require("method-override");

const redirectLogin = (req, res, next)=>{
  if(!req.session.user_id){
      res.redirect('/login');
  }else{
      next();
  }
}

const redirectHome = (req, res, next)=>{
 if(req.session.user_id){
     res.redirect('/home');
 }else{
     next();
 }
}


module.exports = function(app){

  app.use(passport.initialize());
  app.use(passport.session());
    app.use(bodyParser.json());

    //Methode for using PUT methode
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));

      /*/ Create 'CONTACT' TABLE */
      app.get('/createcontattable', (req, res)=>{
        let sql = 'CREATE TABLE contact(id int AUTO_INCREMENT,nom varchar(20), email varchar(30), subject text, message text, read_at datetime, created_at datetime, deleted_at datetime,  PRIMARY KEY(id))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('contact table created...');
        });
        });

        /*/ Create 'TEMOIGNAGE' TABLE */
      app.get('/createtemoignagetable', (req, res)=>{
        let sql = 'CREATE TABLE temoignage(id_tem int AUTO_INCREMENT, id_user int, temoi_text text, created_at datetime, deleted_at datetime, PRIMARY KEY(id_tem),CONSTRAINT FK_usertem FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE)';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('temoignage table created...');
        });
        });
   
   
/*-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
/*/** Render the front home page  */   
app.get('/Acceuil',  function(req, res){
      var title="Acceuil"
      
      //some temoignage 
      let temList = "select u.nom, u.prenom, t.temoi_text, u.photo, p.nom nomProfil FROM temoignage t,user u, profile p WHERE t.id_user=u.id_user and u.id_profile=p.id_profile ORDER BY RAND() LIMIT 6"
      //nombre utilisateur 
      let userNumbre = "select count(id_user) nombreUsers from user where id_profile!=7 && id_profile!=5"
      //nombre clients
      let clientNumbre = "select count(id_user) nombreClient from user where id_profile=7"
      //nombre documents 
      let nbreDocs= "select count(id_type) nombreTypeDoc from typedocs"
      db.query(temList,(err,result)=>{
        if(err) throw err;
        db.query(userNumbre,(err1,result1)=>{
          if(err1) throw err1;
          db.query(clientNumbre,(err2,result2)=>{
            if(err2) throw err2;
            db.query(nbreDocs,(err3,result3)=>{
              if(err3) throw err3;
           else{

            var users= result1[0].nombreUsers;
            var clients= result2[0].nombreClient
            var docs = result3[0].nombreTypeDoc;
            res.render('front/index',{title,data:result,users,clients,docs});
           }

        
      })
      })
      })
        
      })
      
    
});

//render contact page
app.get('/contact', function(req,res){
  var title= "Contact";
  res.render('front/contact',{title})
})


/*/ Post contact message (sended)*/
app.post('/contact', urlencodedParser, function(req,res){
  var name = req.body.name; // the name of entred in the contact form 
  var email = req.body.email; // the email entred
  var subject = escape(req.body.subject); // the sujet entred
  var message = escape(req.body.message); // the message content entred 
  

  let newmsg = "insert into contact(nom, email, subject, message, created_at) values('"+name+"', '"+email+"', '"+subject+"', '"+message+"', now())";
  db.query(newmsg, (err,result)=>{
    if(err) 
    req.session.message = {
      type: 'deleted',
      intro: 'deleted:',
      message: 'Une erreur est survenue, veuillez réessayer!'
  }
   
  })

  req.session.message = {
    type: 'success',
    intro: 'Success:',
    message: 'Votre message a été envoyé avec succès!'
}
 
 
  res.redirect('/contact')

})




    
};


