var bodyParser = require('body-parser');
var passport = require('passport');
var moment = require("moment");


var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'documentelectronique13@gmail.com',
    pass: 'document 123'
  }
});






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
/***------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
//create (message) table 
app.get('/createmessagetable', (req, res)=>{
  let sql = 'CREATE TABLE message(id_msg int AUTO_INCREMENT, id_destinataire int, id_expediteur int, message text, subject text, sended_date datetime, read_at datetime, PRIMARY KEY(id_msg), CONSTRAINT FK_senderID FOREIGN KEY (id_expediteur) REFERENCES user(id_user) ON DELETE CASCADE, CONSTRAINT FK_destinateirID FOREIGN KEY (id_destinataire) REFERENCES user(id_user) ON DELETE CASCADE )';
  db.query(sql, (err, result)=> {
       if(err) throw err;
       console.log(result);
       res.send('message table created...');
  });
  });
 
/*-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
/*/** Render List emails page  */   
app.get('/messagesnonlus',redirectLogin, refreshNotif, function(req, res){

    var title ="Messages non lus"

    let msgs="select * from message where read_at IS NULL and id_destinataire="+req.session.user_id+" ORDER BY sended_date DESC"
    db.query(msgs, (err,result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}

      else if(req.session.user_id===2){
        let contactmsg = "select * from contact where read_at IS NULL ORDER BY created_at DESC"
  
        db.query(contactmsg,(err1,result1)=>{
          if(err1) {res.render('admin/errorPage',{err:err1})}
          
         else{
          res.render('admin/Emails/ListEmail', {title,data:result,data2:result1,moment:moment})
         }
          

        })
    
      }
      else{
        var data2=[]
        res.render('admin/Emails/ListEmail', {title,data:result,moment:moment,data2:data2})
      }
    
        

    });
    
});

/*/*  Render read it messages */
app.get('/messageslus', redirectLogin, refreshNotif,function(req,res){
  var title="Messages lus"
  
  let msgs="select * from message where read_at IS NOT NULL and id_destinataire="+req.session.user_id+" ORDER BY sended_date DESC"
  db.query(msgs, (err,result)=>{
    if(err) {res.render('admin/errorPage',{err:err})}

    else if(req.session.user_id===2){
      let contactmsg = "select * from contact where read_at IS NOT NULL ORDER BY created_at DESC"

      db.query(contactmsg,(err1,result1)=>{
        if(err1) {res.render('admin/errorPage',{err:err1})}
        
       else{
        res.render('admin/Emails/ListEmail', {title,data:result,data2:result1,moment:moment})
       }
        

      })
  
    }
    else{
      var data2=[]
      res.render('admin/Emails/ListEmail', {title,data:result,moment:moment,data2:data2})
    }
  
      

  });
})

/*/** Render Read contact message page  */   
app.get('/readcontactmessage/:id',redirectLogin,refreshNotif, urlencodedParser,function(req, res){

  var title ="Message"
  var id_msg= req.params.id;
  var msgtype=1;

  if(req.session.user_id===2){

    let msg = "select * from contact where id="+id_msg+""
    db.query(msg,(err,result)=>{
      if(err) throw err;

       var msgContent =unescape(result[0].message);
       var subContent =unescape(result[0].subject);

      if(result[0].read_at === null){
        let update_readat ="update contact set read_at = now() where id= "+id_msg+""
        db.query(update_readat, (err1,result1)=>{
          if(err1) throw err1;

          else{
            res.render('admin/Emails/readMsg', {title,data:result,msgContent,subContent,moment:moment,msgtype});
          }
          
        })
      }

      res.render('admin/Emails/readMsg', {title,data:result,msgContent,subContent,moment:moment,msgtype});

    })
    

  }else{
    var err="une erreur est survenue"
    res.render('admin/errorPage',{err})
  }

    
  
});

/** Render Sended Messages */
app.get('/messageEnvoyes', redirectLogin, refreshNotif,function(req,res){
var title="Message Envoyés";
var title ="Messages non lus"

    let msgs="select * from message where id_expediteur="+req.session.user_id+" ORDER BY sended_date DESC"
    db.query(msgs, (err,result)=>{
      if(err) {res.render('admin/errorPage',{err:err})}

      else{

        res.render('admin/Emails/envoyesMsg', {title,data:result,moment:moment})
      }
    
        

    });
    
})
/*/  Render Read Message message page */
app.get('/readEmail/:id', redirectLogin, refreshNotif, urlencodedParser,function(req,res){
  var id_msg = req.params.id;
  var title="Message";
  var id_user = req.session.user_id;
  var msgtype=2;

  let msgexit = "select * from message where (id_destinataire="+id_user+" or 	id_expediteur="+id_user+") and id_msg="+id_msg+" "
  db.query(msgexit, (err,result)=>{
    if(result === undefined){
      res.render('admin/errorPage',{err:err})

    }else{
      let expName = "select * from user where id_user="+result[0].id_expediteur+""
      db.query(expName,(err2,result2)=>{

        //if message not read yet
      if(result[0].id_destinataire===id_user && result[0].read_at===null){
        let markreadit = "update message set read_at=now() where id_destinataire="+id_user+" and id_msg="+id_msg+" "
        db.query(markreadit, (err1,result1)=>{
          if(err1){res.render('admin/errorPage',{err:err1})}
          else{
           
           var username = result2[0].userName;
            
            res.render('admin/Emails/readMsg', {title,data:result,moment:moment,msgtype,username});
         
          }
        })
      }else{
        var username = result2[0].userName;
        res.render('admin/Emails/readMsg', {title,data:result,moment:moment,msgtype,username});
      }
    })
    }
  })

})

/*/** Render new email page  */   
app.get('/newEmail',redirectLogin,refreshNotif, function(req, res){

  var title ="Nouveau message"

    res.render('admin/Emails/newEmail', {title,moment:moment});
  
});

/** SEND EMAIL from page */
app.post("/sendMail",urlencodedParser , function(req, res){

  var sendedTo = req.body.to;
  var subject = req.body.subject;
  var message = req.body.message;
  var myEmail = req.session.email;

  console.log("sended to: "+sendedTo)

  let seeIfNotContact = "select * from user where userName='"+sendedTo+"'"
  db.query(seeIfNotContact,(err2,result2)=>{
    console.log("user result: "+result2)
    //if the receiver is not a user 
    if(result2 === undefined || result2[0].id_profile===7){
      var mailOptions = {
        from: 'amelnedjar31@gmail.com',
        to: sendedTo,
        subject: subject,
        text: message
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          res.render('admin/errorPage',{err:error})
        } else {
          console.log('Email sent: ' + info.response);
    
          req.session.message = {
            type: 'success',
            intro: 'success',
            message: 'Message envoyé!'
                     }
            res.redirect('/messagesnonlus');
        }
      });
      
    }else{
       var specialsebject = escape(subject);
       var specialmsg = escape(message);
       var destUserId=result2[0].id_user;

      //send the message
      let newmesg = "insert into message(id_destinataire, id_expediteur, message, subject, sended_date) values("+destUserId+", "+req.session.user_id+", '"+specialmsg+"', '"+specialsebject+"', now())"
      db.query(newmesg, (err3,result3)=>{
        if(err3){res.render('admin/errorPage',{err:err3})}

        else{

          req.session.message = {
            type: 'success',
            intro: 'success',
            message: 'Message envoyé!'
                     }
            res.redirect('/messagesnonlus');
          
        }
      })

    }
 



})
})

/** Delete message */
app.delete('/delete/message/:id', redirectLogin, urlencodedParser,  function(req, res){
  var id_msg = req.params.id; //id message mean to be deleted
  var msgtype = req.body.msgtype;
  console.log('in the delete function ')
 

  if(parseInt(msgtype,10)===1){
 
    let deletemsg="DELETE FROM contact where id = "+id_msg+""
    db.query(deletemsg,(err,result)=>{
      
      if(err){

        req.session.message = {
          type: 'deleted',
          intro: 'deleted',
          message: 'Erreur de suppression'
                   }
          res.redirect('/messagesnonlus');
       

      }else{
        req.session.message = {
          type: 'success',
          intro: 'success',
          message: 'Message supprimé !'
                   }
          res.redirect('/messagesnonlus');

      }
    })

  }else if(parseInt(msgtype,10)===2){

    let deletemsg="delete from message where id_msg="+id_msg+""
    db.query(deletemsg,(err,result)=>{
      if(err){

        req.session.message = {
          type: 'deleted',
          intro: 'deleted',
          message: 'Erreur de suppression'
                   }
          res.redirect('/messagesnonlus');
       

      }else{
        req.session.message = {
          type: 'success',
          intro: 'success',
          message: 'Message supprimé !'
                   }
          res.redirect('/messagesnonlus');

      }
    })

  }
   
});



    
};


