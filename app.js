var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyparser = require('body-parser');

var operationController = require('./Controllers/operationController');
var userController = require('./Controllers/userController');
var profileController = require('./Controllers/profileController');


//flash notification
const cookiePArser = require('cookie-parser');
const session = require('express-session');
var flush = require('connect-flash');


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
    secret: 'secret',
    cookie: {maxAge: 60000},
    resave: false,
    saveUninitialized: false,
}));
app.use(flush());

app.use((req, res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
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



//set up the template engine
app.set('view engine', 'ejs');

//static files
app.use('/static', express.static(__dirname + '/static'));

//Route to dashboard
app.get('/admin/dashboard', function(req, res){
  
    res.render('admin/dashboard');
});



//listen to a port
app.listen(3000);
console.log('you are listening to the port 3000');