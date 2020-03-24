var bodyParser = require('body-parser');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");




module.exports = function(app){
    app.use(bodyParser.json());

    //Methode for using PUT methode
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    //operation table creation
    app.get('/createprofiletable', (req, res)=>{
        let sql = 'CREATE TABLE connected(id_connect int AUTO_INCREMENT,date_connection datetime, id_user int, PRIMARY KEY(id_profile, FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('profile table created...');
        });
        });



    
};