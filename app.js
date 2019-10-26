var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var multer = require('multer');
var path = require('path');


let = PORT = process.env.PORT || 8080;

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'ritzzy'
});
connection.connect(function (err) {
	if (err) throw err;
	console.log("database is connected");
});

var app = express();
app.set('view engine', 'ejs');
app.use(express.static("css"));
app.use(express.static("images"));
app.use(express.static("videos"));
app.use(express.static("js"));
app.use(express.static("uploads"));
app.use(express.static("posts"));
app.use(flash());

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var storage1 = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, 'uploads/');
	},
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});

var storage2 = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, 'posts/');
	},
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
var upload = multer({ storage: storage1 });
var upload1 = multer({ storage: storage2 });


app.get("/",function(req,res){
    res.sendFile("mainpage.html",{root:__dirname});
});

app.get("/registration",function(req,res){
    res.sendFile("registration.html",{root:__dirname});
});

app.post('/reg', function (req, res) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
    var phone = req.body.phone;
    var noimage = "noimage.jpg";
	var sql = "insert into users values(null,'" + req.body.username + "','" + req.body.email + "','" + req.body.password + "','" + req.body.phone + "')";
	connection.query(sql, function (err) {
        if (err) throw err;
        var s = "insert into userprofileimages values('" + noimage + "','" + req.body.email + "')";
		connection.query(s, function (err) {
			if (err) throw err;
        res.redirect('/login');
    });
    });
});

app.post('/posts', upload1.single('postaudio'), function (req, res, next) {
if (req.session.loggedin) {
	var para=req.body.postpara;
	var today = new Date();
		var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		var dateTime = date + ' ' + time;
	var audiosrc=req.file.filename;
	var sql="insert into posts values(null,'"+req.session.email+"','"+para+"','"+audiosrc+"','"+dateTime+"')";
	connection.query(sql, function (err) {
		if (err) throw err;
		res.redirect('/profile');
	});

		 
} else {

	res.redirect('/login');
}
});


app.get("/login",function(req,res){
    res.sendFile("login.html",{root:__dirname});
});

app.post('/auth', function (req, res) {
	var email = req.body.email;
	var password = req.body.password;
	if (email && password) {
		connection.query('SELECT * FROM users WHERE BINARY  email = ? AND  BINARY  password = ?', [email, password], function (error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.email = email;
				res.redirect('/dashboard');
			} else {
				res.send('Incorrect email and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter email and Password!');
		res.end();
	}
});


app.get('/logout', function (req, res) {
	req.session.destroy(function (err) {
		if (err) throw err;
		res.redirect('/');
	});
});

app.get("/dashboard",function(req,res){
    if (req.session.loggedin) {

		var sq = "select  users.id,users.username,users.phone,users.email,userprofileimages.imagesrc  from users , userprofileimages   where  users.email='" + req.session.email + "' AND userprofileimages.email='" + req.session.email + "'   ";
		connection.query(sq, function (err, results, fields) {
		if (err) throw err;
		var sql = "select  posts.id,posts.email,posts.postpara,posts.postaudio,posts.date,userprofileimages.imagesrc  from posts INNER JOIN userprofileimages ON posts.email=userprofileimages.email";
		connection.query(sql, function (err,posts, fields) {
			if (err) throw err;

		res.render('dashboard', { result: results[0],post:posts});
		 
		});
	});
			 
		 
	} else {

		res.redirect('/login');
	}
});

app.get("/updateprofileimage",function(req,res){
    res.sendFile("updateprofileimage.html",{root:__dirname});
});


app.get("/updateprofile",function(req,res){
	if (req.session.loggedin) {
	res.sendFile("updateprofile.html",{root:__dirname});
} else {
	res.redirect('/login');
  }
});

 

app.get("/profile",function(req,res){
	if (req.session.loggedin) {

		var sq = "select  users.id,users.username,users.phone,users.email,userprofileimages.imagesrc  from users , userprofileimages   where  users.email='" + req.session.email + "' AND userprofileimages.email='" + req.session.email + "'   ";
		connection.query(sq, function (err, results, fields) {
		if (err) throw err;
		var sql="select * from  posts where email='"+req.session.email+"' ";
		connection.query(sql, function (err, pos, fields) {
			if (err) throw err;

		res.render('profile', { result: results[0],post:pos});
	       		
	  });
	});
			 
		 
	} else {

		res.redirect('/login');
	}
});
// app.post('/updateprofile',function(req,res){
// 	if (req.session.loggedin) {
// 	var username = req.body.username;
// 	var email = req.body.email;
// 	var password = req.body.password;
// 	var phone = req.body.phone;
// 	var sql="UPDATE users SET username='"+username+"',email='"+email+"',password='"+ password+"',phone='"+phone+"' WHERE email='" + req.session.email + "'";
// 	   connection.query(sql, function (err) {
// 		if (err) throw err;
// 		res.redirect('/dashboard');
// 	    });

// 	} else {
// 		res.redirect('/login');
// 	  }
// });

app.post('/updateprofileusername',function(req,res){
	if (req.session.loggedin) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var sql="UPDATE users SET username='"+username+"' WHERE email='" + req.session.email + "'";
	   connection.query(sql, function (err) {
		if (err) throw err;
		res.redirect('/updateprofile');
	    });

	} else {
		res.redirect('/login');
	  }
});

app.post('/updateprofileemail',function(req,res){
	if (req.session.loggedin) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var sql="UPDATE users SET email='"+email+"' WHERE email='" + req.session.email + "'";
	   connection.query(sql, function (err) {
		if (err) throw err;
		res.redirect('/updateprofile');
	    });

	} else {
		res.redirect('/login');
	  }
});

app.post('/updateprofilepassword',function(req,res){
	if (req.session.loggedin) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var sql="UPDATE users SET password='"+password+"' WHERE email='" + req.session.email + "'";
	   connection.query(sql, function (err) {
		if (err) throw err;
		res.redirect('/updateprofile');
	    });

	} else {
		res.redirect('/login');
	  }
});

app.post('/updateprofilephone',function(req,res){
	if (req.session.loggedin) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var sql="UPDATE users SET phone='"+phone+"' WHERE email='" + req.session.email + "'";
	   connection.query(sql, function (err) {
		if (err) throw err;
		res.redirect('/updateprofile');
	    });

	} else {
		res.redirect('/login');
	  }
});

app.post('/updateprofileimages', upload.single('updateprofileimgage'), function (req, res, next) {
	if (req.session.loggedin) {
		var fileinfo = req.file.filename;
		var s = "select * from  userprofileimages where email='" + req.session.email + "' ";
		connection.query(s, function (error, results, fields) {
			if (results == '') {
				var sql = "insert into userprofileimages values('" + fileinfo + "','" + req.session.email + "')";
				connection.query(sql, function (err) {
					if (err) throw err;
					res.redirect('http://localhost:8080/dashboard');
				});
			} else {
				var fileinfo = req.file.filename;
				sa = "UPDATE userprofileimages  SET imagesrc='" + fileinfo + "' WHERE email='" + req.session.email + "';"
				     connection.query(sa, function (err) {
					if (err) throw err;
					res.redirect('http://localhost:8080/dashboard');
				});
			}
		});
	} else {
      res.redirect('/login');
	}
});




app.listen(PORT, function (err) {
	if (err) throw err;
	console.log(`Server is running at http://127.0.0.1:${PORT}`);
});




