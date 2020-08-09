var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyparser = require('body-parser');
var fileUpload = require('express-fileupload');

var operationController = require('./Controllers/operationController');
var userController = require('./Controllers/userController');
var profileController = require('./Controllers/profileController');
var loginController = require('./Controllers/loginController');
var documentController = require('./Controllers/documentController');
var gestiondocsController = require('./Controllers/gestiondocsController');
var demandedocsController = require('./Controllers/demandedocsController');
var documentsController = require('./Controllers/documentsController');

app.use(fileUpload());

// Authentification (login)
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

//flash notification
const cookiePArser = require('cookie-parser');

var flush = require('connect-flash');

//passwort initialisation
app.use(passport.initialize());
app.use(passport.session());


//mysqlstore
var options = {
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'gestion_docs' 
};
var sessionStore = new MySQLStore(options);




//create a connection
var db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'gestion_docs' 
});

//connect
db.connect((err)=> {
    if(err){
        throw err;
    }
    console.log('mySql connected...');
  });
global.db = db;


//notifications flash
//app.use(bodyParser.json());
app.use(cookiePArser());
app.use(session({
    name: 'ide',
    secret: 'fgdfgdfg',
    cookie: {maxAge: 1000 * 60 * 60 * 2},
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
}));
app.use(flush());

app.use((req, res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

app.use((req, res, next)=>{
    res.locals.user_id = req.session.user_id;
    res.locals.photo = req.session.photo;
    res.locals.profile = req.session.profile;
    res.locals.nom = req.session.nom;
    res.locals.prenom = req.session.prenom;
    res.locals.notifs = req.session.notifs
    res.locals.profile_id = req.session.profile_id;
    res.locals.notReadNotifs = req.session.notReadNotifs;
   // delete req.session.user_id;
  //  delete req.session.photo;
    next();
})

//var db = require('./db_connection');
//db(app);




//fire operation controller
operationController(app);

//fire user controller
userController(app);

//fire profile controller
profileController(app);

//fire login controller
loginController(app);

//fire documents controller
documentController(app);

//Gestion de documents controller
gestiondocsController(app);

//Gestion demande du document 
demandedocsController(app);

//Gestion des documents (the use it one)
documentsController(app);


//set up the template engine
app.set('view engine', 'ejs');

//static files
app.use('/static', express.static(__dirname + '/static'));


var redirectLogin = (req, res, next)=>{
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

//Route to dashboard
app.get('/home', redirectLogin, function(req, res){
    //console.log(req.user);
    //console.log(req.isAuthenticated())
    var title='HOME'
     console.log(req.session.user_id)
    res.render('admin/dashboard',{title});

});





//listen to a port
app.listen(3000);
console.log('you are listening to the port 3000');