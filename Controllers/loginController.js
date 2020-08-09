var bodyParser = require('body-parser');
var passport = require('passport');



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
        // SELECT THE PROFILE OF THE USER

        console.log("The user profile id: "+results[0].id_profile)
        let proff= "SELECT nom FROM profile WHERE id_profile= '"+results[0].id_profile+"'";
        db.query(proff, function(err, result1){
          if(err) throw err;

        //console.log('Le nom du profile: '+result1[0].nom)
        request.session.profile = result1[0].nom;
        let notif = "SELECT n.read_at demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE n.id_user="+request.session.user_id+" and n.id_notificaton = ns.id_notif ORDER BY created_at DESC"
        db.query(notif, (err1,result2)=>{
          if(err1) throw err1;
        
          request.session.notifs = result2;
          console.log("Nombre notifications: "+request.session.notifs.length)

          let onlynotread = "select n.read_at demande_id, data, created_at, ns.id_notif, n.type_notif from notifier n, notifications ns where n.id_user="+request.session.user_id+" and n.id_notificaton = ns.id_notif and n.read_at IS NULL and ns.read_at IS NULL ORDER BY created_at DESC"
          db.query(onlynotread, (err3, result3)=>{
            if(err3) throw err3;
   
            request.session.notReadNotifs = result3;
            console.log("Nombre notifications: "+request.session.notReadNotifs.length)
            response.redirect('/home');

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

    res.render('admin/users/profile',{data: result,title});
  })
});


    
};


