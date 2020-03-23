var mysql = require('mysql');

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
