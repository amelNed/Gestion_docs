var bodyParser = require('body-parser');
var passport = require('passport');



var urlencodedParser = bodyParser.urlencoded({ extended: false });

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
  //console.log("Username: "+username);
  //console.log("Password: "+password);

	if (username && password) {
		db.query('SELECT * FROM user WHERE (userName = ? OR email = ?) AND mdp = ?', [username, username, password], function(error, results, fields) {
			if (results.length > 0) {
			//	request.session.loggedin = true;
      //	request.session.username = username;
        request.session.user_id = results[0].id_user;
        request.session.photo = results[0].photo;
        //console.log(results[0].photo)
        response.redirect('/home');
        
        
				
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
   req.session.destroy();
   //res.clearCoockie('ide');
   res.redirect('/login');

  
})

/* Require the profile user authenticated page */ 
app.get('/userProfile', function(req, res){
  user_id = req.session.user_id;
  let data = "SELECT * from user where id_user = "+user_id+"";
  db.query(data, function(err,result){
    if(err) throw err;

    res.render('admin/users/profile',{data: result});
  })
});


    
};


