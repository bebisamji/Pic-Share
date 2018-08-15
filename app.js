/* PicShare application
Created by Bebito Samji for Programming for Digital Media */

//modules required
const express = require('express');
const multer = require('multer'); //alternate for fileupload
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const dateFormat = require('dateformat');

// define our port and database connection
const port = 8081;
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sampleDB'
});

connection.connect(function(error) {
    if(!!error) {
      console.log('Error');
    } else {
      console.log('Connected');
    }
});

//Set The Storage Engine for multer
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
  //  cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  cb(null,file.fieldname + '-' + file.originalname);
  }
});

//Initialize Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

//Checking File Type
function checkFileType(file, cb){
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extensions
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mimetype
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

//Initialize app
const app = express();

//EJS
app.set('view engine', 'ejs');

//Public Folder
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: "atwcoHFDR7468lghsggnvhgIJD7",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

//Basic route
app.get('/', function(req, res) {
  
  connection.query("SELECT * FROM userinfo", function(error, rows, fields) {
          if(!!error) {
            console.log("Error");
          } else {
            console.log("Success");
          }
    });

});

app.get('/test', function(req, res) {

  var sql = ` SELECT * from photos `;
  connection.query(sql, function(err, results) {
    if(err) {
      res.send('Error');
    }else {
        res.render('welcome', {"images":results});
        console.log(results);
    }
  });

});

//Route for the homepage of the user
app.get('/home', function(req, res) {
  if (req.session.username) {
      //console.log("check");
      res.render('home', {"username": req.session.username});
  } else {
      console.log("failed");
      res.redirect("index.html");
  }
});

//Route for going to the upload link
app.get('/image', function(req, res) {
  if(req.session.username) {
    res.render('index', {"username": req.session.username});
  } else {
    console.log("its here!!!");
    res.redirect("index.html");
  }
});

//Route for going to the profile page
app.get('/profile', function(req, res) {
    // determine if the user is logged in here
    if (req.session.username) {
        //console.log("check");
        res.render('profile', {"username": req.session.username});
    } else {
        //console.log("failed");
        res.redirect("index.html");
    }
});

//Route for register
app.post('/register', function(req, res) {

  var first_name = req.body.firstname;
  var last_name = req.body.lastname;
  var user = req.body.username;
  var mail = req.body.email;
  var pass = req.body.password;

  var sql = ` INSERT INTO userinfo (firstname, lastname, username, email, password)
  VALUES ('${first_name}', '${last_name}', '${user}', '${mail}', '${pass}' )`;

  connection.query(sql, function (error, result) {
    if(error) {
      res.redirect("reg_success.html");
    } else {
      res.redirect("reg_success.html");
  }
 });
});

//Route for login
app.post('/login', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;

    var sql = ` SELECT password FROM userinfo WHERE username = '${user}' `;

    connection.query(sql, function(err, results) {
      console.log(results);
      if(err) {
        res.send("Database error");
      } else if ((results.length > 0) && (results[0].password == pass)) {
        console.log("hello");
        req.session.username = user;
        //res.redirect("/");
        if (req.session.username) {
            console.log("Found a session cookie");
            res.render('home', {"username": req.session.username});
        } else {
            res.redirect("invalid.html");
        }
      } else {
        //res.render('msg', {"msg": "Invalid Login"});
        res.redirect("invalid.html");
      }
    });
});

//Route for uploading images
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        var timestamp = new Date();
        timestamp = dateFormat(timestamp, "yyyy-mm-dd HH:MM:ss");
        console.log(timestamp);
      //  var time = ` SELECT CURRENT_TIMESTAMP() `;
        var sql = ` INSERT INTO photos (author,date,photo)
        VALUES ('${req.session.username}','${timestamp}','${req.file.filename}') `;

        connection.query(sql, function(err, results) {
          if(err) {
            console.log("Fail");
          } else {
            console.log("Success");
          }
        });

        res.render('index', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
        console.log(req.file);
      }
    }
  });
});

//Route for going to the gallery
app.get('/photos', (req, res) => {
   var sql = ` SELECT * from photos `;
   connection.query(sql, function(err, results) {
     if(err) {
       res.send('Error');
     }else {
       if(req.session.username != null) {
         res.render('photos', {"user":req.session.username, "loggedin": "true", "images":results});
         console.log(results);
       } else {
         res.render('photos', {"loggedin":"false", "images": results});
       }
     }
   });
});

//Route for logging out
app.get("/logout", function(req, res) {
    delete req.session.username;
    console.log("session deleted");
    res.redirect("index.html");
    //request.session.destroy();
});

//Make the app listen for requests
app.listen(port);

//Output a useful message to the server admin
console.log("Server running on http://localhost:"+port);
