var bodyParser = require('body-parser');
var passport = require('passport');


const methodOverride = require("method-override");



var urlencodedParser = bodyParser.urlencoded({ extended: false });




module.exports = function(app){
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(bodyParser.json());

  //Methode for using PUT methode
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    //operation table creation
    app.get('/createoptable', (req, res)=>{
        let sql = 'CREATE TABLE operation(id_op int AUTO_INCREMENT,op_nom varchar(255), PRIMARY KEY(id_op))';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('operation table created...');
        });
        });
/*------------------------------------------------------------------------------------------------------------------------------------*/
    app.get('/opList', authenticationMiddleware(), function(req, res){
        var data ="SELECT * FROM operation";
        db.query(data, (err, result)=> {
            if(err) throw err;
            //console.log(result);
            
       res.render('admin/opList',{data: result});
            
       });
    });

    //Return create operation page
    app.get('/opList/create', function(req, res){
        res.render('admin/createop');
 
     });
    

     //Store the new operation
    app.post('/opcreate', urlencodedParser, function(req, res){
        
        var name = req.body.nom;
       let sql = "Insert into operation (op_nom) VALUES ('"+name+"')";
       db.query(sql, (err, result)=> {
        if(err) throw err;
        
        req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'Operation ajouter avec success'
            }
             
    
        res.redirect('/opList');
   });


    });
    
    //Return Edit operation page
    app.get('/modifyop/:id',urlencodedParser, function(req, res){

        var ops = "SELECT * FROM operation WHERE id_op = "+req.params.id+"";
        db.query(ops, (err, result)=> {
            if(err) throw err;
            //console.log(result);
            
       res.render('admin/modifyop',{data: result});
            
       });
        
      });

    // Store the new modifications 
      app.put('/update/:id', urlencodedParser,function(req, res){
        var name = req.body.nom;
        var id = req.params.id;
        let operate = "UPDATE operation SET op_nom = '"+name+"' WHERE id_op= "+id+"";
        db.query(operate, (err, result)=> {
            if(err) throw err;
                req.session.message = {
                    type: 'success',
                    intro: 'Success:',
                    message: 'Modifier avec success'
                }
                 
        
            res.redirect('/opList');
            
       });
        
      });

      //Delete an operation
      app.delete('/delete/operation/:id', function(req, res){
        var id = req.params.id;
        let delFkeys = "DELETE FROM avoir where id_op = "+id+"" ;
        db.query(delFkeys, (err, result)=> {
            if(err) throw err;
            //console.log(result);
        let del = "DELETE FROM operation WHERE id_op = "+id+"";
        db.query(del, (err, result)=> {
            if(err) throw err;
    
             req.session.message = {
                type: 'deleted',
                intro: 'Deleted:',
                message: 'Opération supprimer(retirer de tous les profiles)'
             }
            
       res.redirect('/opList');
        });    
       });
       
       });
    

};

passport.serializeUser(function(user_id, done) {
    done(null,user_id);
  });
  
  passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
   
  });

function authenticationMiddleware () {  
	return (req, res, next) => {
		//console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        console.log(req.isAuthenticated());
        if(req.isAuthenticated()){
            console.log("i am in the if condition")
            return next();
        }
        
       
          res.redirect('/login')
	}
}
