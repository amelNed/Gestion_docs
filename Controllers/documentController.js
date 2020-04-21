var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var HtmlDocx = require('html-docx-js');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

const methodOverride = require("method-override");

//var fileUploadd = require('express-fileupload');
//var busboy = require("then-busboy");




module.exports = function(app){
   
    app.use(passport.initialize());
    app.use(passport.session());

    //app.use(fileUploadd());

    app.use(bodyParser.json());

    /* Methode for using PUT methode*/
    app.use(methodOverride("_method", {
        methods: ["POST", "GET"]
      }));
   
    /*  CREATE (document) TABLE */
    /*app.get('/createdocumenttable', (req, res)=>{
        let sql = 'CREATE TABLE document(id_doc int AUTO_INCREMENT,nom varchar(255),mime varchar(255),data blob, date_created datetime, date_updated datetime, PRIMARY KEY(id_doc) )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('document table created...');
        });
        });*/
        /*  CREATE (edito wysiwyg) TABLE */
    app.get('/createeditortable', (req, res)=>{
        let sql =  "CREATE TABLE editor(id int(11) NOT NULL AUTO_INCREMENT,content text COLLATE utf8_unicode_ci NOT NULL,created datetime NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('document table created...');
        });
        });
       

      /*Create document table to store directly the document with path*/
      app.get('/createdocumenttable', (req, res)=>{
        let sql = 'CREATE TABLE document(id_doc int AUTO_INCREMENT,nom varchar(255),mime varchar(255),path varchar(255),description text, date_created datetime, date_updated datetime, PRIMARY KEY(id_doc) )';
        db.query(sql, (err, result)=> {
             if(err) throw err;
             console.log(result);
             res.send('document table created...');
        });
        });  
   /* --------------------------------------------------------------------------------------------------------------*/ 
    
   /* Documents page*/
   app.get('/admin/documents', function(req, res){
    var title="Documents";
    let docs= "SELECT * FROM document";
    db.query(docs, function(err, result){
        if(err) throw err;
        var data = result;
        res.render('admin/documents/document',{data:data, title})
    })

    
   });

   /*  SAVE DOCUMENT */
   app.post('/save/document', urlencodedParser, function(req, res){
    console.log(req.body.description);
    try {
        if(!req.files) {
        
            req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Pas de document importer!'
            }
             
        res.redirect('/admin/documents');
        }
        else if(req.body.description === ""){
            req.session.message = {
                type: 'error',
                intro: 'error:',
                message: 'Veuillez inserer une description du fichier!'
            }
            res.redirect('/admin/documents');
        }
        else {
  
            var file = req.files.document;
            var description= req.body.description;
            var file_name =file.name;
            var mime = file.mimetype;
           
            var data = file.data;
           
            
        
             if(file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||file.mimetype == "image/png" || file.mimetype == "image/gif" || file.mimetype ==="text/plain" ){
                file.mv('static/admin/documents/'+file.name, function(err) {
                  
                    if (err)
             
                      return res.status(500).send(err);
                      
                           var path = 'C:/xampp/htdocs/GestionDocs/static/admin/documents/'+file.name;
                           let newdoc = "INSERT INTO document(nom,mime,path,description,date_created) VALUES('"+file.name+"','"+mime+"','"+path+"','"+description+"', now())";
                           db.query(newdoc, function(err, result1){
                               if(err) throw err;
                                req.session.message = {
                                  type: 'success',
                                  intro: 'success:',
                                  message: 'Document importer avec successé!'
                                           }
             
                             res.redirect('/admin/documents');
                           });
                         
                    
                
            });
            
             }else{
                req.session.message = {
                    type: 'error',
                    intro: 'error:',
                    message: 'Le ficher doit etre .docx word document!'
                }
                res.redirect('/admin/documents');
             }
            
                
            
        
    }} catch (err) {
        res.status(500).send(err);
    }
  
    
 });

 /** Create document */
 app.get('/textcreate',function(req,res){
     let data = "SELECT * FROM editor";
     var title="New document"
     db.query(data,function(err, result){
         if(err) throw err;
        
        res.render('admin/documents/docspage',{data: result, title});

     })
    
 })

  
 /**DELETE DOCUMENT */
 app.delete('/delete/document/:id', function(req, res){
    var id= req.params.id;
    
    let deldoc="SELECT * FROM document where id_doc = "+id+"";
    db.query(deldoc,function(err,result){
        if(err) throw err;

        fs.unlink('static/admin/documents/'+result[0].nom, function (err) {
            if (err) throw err;
            // if no error, file has been deleted successfully
            console.log('File deleted!');
        });
    })
    
    let del = "DELETE FROM document WHERE id_doc = "+id+"";
    
    db.query(del,function(err, result){
        if(err) throw err;
         
        req.session.message = {
         type: 'deleted',
         intro: 'deleted:',
         message: 'Document supprimer!'
      }
     
     res.redirect('/admin/documents');
    })

});
    /** STORE a what tou see is what you get text */
    app.post('/store/text', urlencodedParser, function(req, res){

        var editorText = req.body.editor;
        var submit= req.body.submit;
        if(editorText !==""){
            if(submit === "Save as word document"){
             var html = editorText;

              var docx = HtmlDocx.asBlob(html);
      
       var filename=req.body.filename;
       
        var filename1 = filename+'.docx';

        fs.writeFile('static/admin/documents/'+filename1, docx, function (err) {
            if (err) return console.log(err);
            console.log('stored with success!');
          });

        let newdoc = "INSERT INTO document(nom,mime,path,date_created) VALUES('"+filename1+"','application/vnd.openxmlformats-officedocument.wordprocessingml.document','static/admin/documents/', now())";
        db.query(newdoc, function(err, result1){
            if(err) throw err;
             req.session.message = {
               type: 'success',
               intro: 'success:',
               message: 'Document importer avec successé!'
                        }

          res.redirect('/admin/documents');
        });      


            }
            else if(submit === "SUBMIT"){
                let inserttext = "INSERT INTO editor (content, created) VALUES ('"+editorText+"', NOW())";
                db.query(inserttext,function(err, result){
                    if(err) throw err;
                    req.session.message = {
                        type: 'success',
                        intro: 'success:',
                        message: 'Text inserted successfuly!'
                     }
                    
                    res.redirect('/textcreate');
    
                })

            }
           
        }else{
            req.session.message = {
                type: 'erro',
                intro: 'erro:',
                message: 'you should write some text!'
             }
            
            res.redirect('/textcreate');

        }
    })

    /**RETURN THE CREATE DOCUMENT PAGE */
   app.get('/create/document', function(req, res){
       var title="Create document"
        res.render('admin/documents/createDoc',{title});
   })
};

 