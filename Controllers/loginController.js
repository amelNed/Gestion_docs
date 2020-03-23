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
        let sql = 'CREATE TABLE connected(id_connect int AUTO_INCREMENT,username varchar(100), date_c datetime, date_suppression datetime, date_modication datetime, PRIMARY KEY(id_profile))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('profile table created...');
        });
        });



    
};