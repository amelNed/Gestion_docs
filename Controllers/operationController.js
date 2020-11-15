var bodyParser = require('body-parser');
var passport = require('passport');
var moment = require('moment')

const methodOverride = require("method-override");



var urlencodedParser = bodyParser.urlencoded({ extended: false });

/**Verify if you're connected or no */
var redirectLogin = (req, res, next)=>{
  if(!req.session.user_id){
      res.redirect('/login');
  }else{
      next();
  }
}
/**REFRESHING NOTIFS */
var refreshNotif = (req,res,next)=>{
  let notif= "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, ns.data data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and  ((n.type_notif=1 and ns.updated_at IS NULL and (ns.userIDaccepted="+req.session.user_id+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) ORDER BY created_at DESC "
  db.query(notif, (err1,result2)=>{
    if(err1) throw err1;

    req.session.notifs=result2;
    let onlynotread = "SELECT n.read_at readatNotifier, ns.read_at readNotifs ,demande_id, data, created_at, ns.id_notif, n.type_notif FROM notifier n, notifications ns WHERE (n.id_user="+req.session.user_id+") and (n.id_notificaton = ns.id_notif) and n.type_notif=1 and n.read_at IS NULL and ((ns.updated_at IS NULL and (ns.userIDaccepted="+req.session.user_id+" or ns.userIDaccepted=0)) or (n.type_notif=2 and n.read_at IS NULL)) "
          db.query(onlynotread, (err3, result3)=>{
            if(err3) throw err3;

            req.session.notReadNotifs=result3;
            next();
          });
  });
}



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
    app.get('/opList', redirectLogin,refreshNotif,function(req, res){
        var data ="SELECT * FROM operation";
        var title="Liste opérations";
        db.query(data, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            //console.log(result);
            else{
              res.render('admin/opList',{data: result,title,moment:moment});
            }
            
       
            
       });
    });

    //Return create operation page
    app.get('/opList/create', redirectLogin,refreshNotif,function(req, res){
      var title="Nouvelle opération"
        res.render('admin/createop',{title,moment:moment});
 
     });
    

     //Store the new operation
    app.post('/opcreate', urlencodedParser, function(req, res){
        
        var name = req.body.nom;
       let sql = "Insert into operation (op_nom) VALUES ('"+name+"')";
       db.query(sql, (err, result)=> {
        if(err) {res.render('admin/errorPage',{err:err})}
        else{
          req.session.message = {
            type: 'success',
            intro: 'Success:',
            message: 'Operation ajouter avec success'
        }
         

    res.redirect('/opList');

        }
       
   });


    });
    
    //Return Edit operation page
    app.get('/modifyop/:id',urlencodedParser, redirectLogin,refreshNotif,function(req, res){
    
       var title="Modifier opération"
        var ops = "SELECT * FROM operation WHERE id_op = "+req.params.id+"";
        db.query(ops, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            //console.log(result);
            else{
              res.render('admin/modifyop',{data: result,title,moment:moment});

            }
       
            
       });
        
      });

    // Store the new modifications 
      app.put('/update/:id', urlencodedParser, redirectLogin, function(req, res){
        var name = req.body.nom;
        var id = req.params.id;
        let operate = "UPDATE operation SET op_nom = '"+name+"' WHERE id_op= "+id+"";
        db.query(operate, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            else{
              req.session.message = {
                type: 'success',
                intro: 'Success:',
                message: 'Modifier avec success'
            }
             
    
        res.redirect('/opList');

            }
              
            
       });
        
      });

      //Delete an operation
      app.delete('/delete/operation/:id', function(req, res){
        var id = req.params.id;
        let delFkeys = "DELETE FROM avoir where id_op = "+id+"" ;
        db.query(delFkeys, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
            //console.log(result);
        let del = "DELETE FROM operation WHERE id_op = "+id+"";
        db.query(del, (err, result)=> {
            if(err) {res.render('admin/errorPage',{err:err})}
    
            else{
              req.session.message = {
                type: 'deleted',
                intro: 'Deleted:',
                message: 'Opération supprimer(retirer de tous les profiles)'
             }
            
       res.redirect('/opList');

            }
             
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
