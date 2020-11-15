var bodyParser = require('body-parser');
var passport = require('passport');
var moment = require('moment')


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
     res.redirect('/admin/dashboard');
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
   
    //operation table creation (not created yet this table)
    app.get('/createprofiletable', (req, res)=>{
        let sql = 'CREATE TABLE connected(id_connect int AUTO_INCREMENT,date_connection datetime, id_user int, PRIMARY KEY(id_profile, FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('profile table created...');
        });
        });

/*-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   app.get('/login', redirectHome, function(req, res){
  
      res.render('admin/login/login');
    
});

app.post('/login', urlencodedParser, redirectHome, function(request, response) {
    
  var password = request.body.password;
  var username = request.body.username;
  

	if (username && password) {
		db.query('SELECT * FROM user WHERE (userName = ? OR email = ?) AND mdp = ?', [username, username, password], function(error, results, fields) {
			if (results.length > 0) {
			
        request.session.user_id = results[0].id_user;
        request.session.photo = results[0].photo;
        request.session.nom = results[0].nom;
        request.session.prenom = results[0].prenom;
        request.session.profile_id = results[0].id_profile;
        request.session.username = results[0].userName;
        request.session.moment = moment;
        request.session.email = results[0].email;
        // SELECT THE PROFILE OF THE USER

        console.log("The user profile id: "+results[0].id_profile)
        let proff= "SELECT nom FROM profile WHERE id_profile= '"+results[0].id_profile+"'";
        db.query(proff, function(err, result1){
          if(err) throw err;

        //select notifs -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        request.session.profile = result1[0].nom; //nom profil du user connecter
        let notif= "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, ns.data data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+request.session.user_id+") and (n.id_notificaton = ns.id_notif) and  ((n.type_notif=1 and ns.updated_at IS NULL and (ns.userIDaccepted="+results[0].id_user+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) ORDER BY created_at DESC "
        db.query(notif, (err1,result2)=>{
          if(err1) throw err1;
           console.log(result2)
          
        
          request.session.notifs = result2;
          console.log("Nombre notifications: "+request.session.notifs.length)

          let onlynotread = "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+request.session.user_id+") and (n.id_notificaton = ns.id_notif) and  (( n.type_notif=1 and n.read_at IS NULL and ns.updated_at IS NULL and (ns.userIDaccepted="+results[0].id_user+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) "
          db.query(onlynotread, (err3, result3)=>{
            if(err3) throw err3;
   
            request.session.notReadNotifs = result3;
            console.log("Nombre notifications: "+request.session.notReadNotifs.length)

            //SELECT THE MESSAGES 
            let noreadmsg ="select * from message where id_destinataire="+results[0].id_user+" and read_at IS NULL"
            let allMessages = "select * from message where id_destinataire="+results[0].id_user+" ORDER BY sended_date DESC"
            db.query(allMessages,(err44,result44)=>{
              console.log(result44);
              request.session.messages = result44;

              db.query(noreadmsg,(err9,result9)=>{

             request.session.nbreNoRead = result9.length;
            

          //SELECT THE MESSAGES notif-------------------------------------------------------------------------------------------------------
          if(results[0].id_user === 2){

            let allMsg = "select * from contact ORDER BY created_at DESC"
            db.query(allMsg, (err4, result4)=>{
              if(err4) throw err4;

              request.session.contacts = result4;

              let noReadMsg = "select * from contact where read_at IS NULL ORDER BY created_at DESC"
              db.query(noReadMsg, (err5,result5)=>{
                if(err5) throw err5;

                
                request.session.nbreNoRead =parseInt(request.session.nbreNoRead,10)+parseInt(result5.length,10);

                response.redirect('/admin/dashboard');
              })
            })

          } else{
            request.session.contacts=null;
            
            response.redirect('/admin/dashboard');

          }  
        })       
        })
         

          })
         
        
        })
      });
         
        
        
        
        
        
				
			} else {
        request.session.message = {
          type: 'error',
          intro: 'error:',
          message: 'Incorrect Username and/or Password!'
      }
       
         response.redirect('/login');
			}			
		
		});
	} else {
    request.session.message = {
      type: 'error',
      intro: 'error:',
      message: 'Please enter Username and Password!'
  }
   
     response.redirect('/login');
}
  });

// route for user logout
app.get('/logout', redirectLogin, (req, res) => {
   req.logout();
  // res.clearCoockie('ide');
   req.session.destroy();
   
   res.redirect('/login');

  
})

/* Require the profile user authenticated page */ 
app.get('/userProfile', function(req, res){
  user_id = req.session.user_id;
  var title="Profile"
  let data = "SELECT * from user where id_user = "+user_id+"";
  db.query(data, function(err,result){
    if(err) throw err;

    res.render('admin/users/profile',{data: result,title,moment:moment});
  })
});


    
};


