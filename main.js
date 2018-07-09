var express = require('express');
var app = express();
var multer = require('multer');
var fs = require("fs");
const fsPromises = require('fs').promises;
var cookieParser = require('cookie-parser');
var path = require('path');
app.use(cookieParser());
var whichIm = 0;
var imMax = 0;
app.set('view engine', 'pug');

app.use(express.static('curruser'));

var upload = multer({dest: '/tmp/'});

app.get('/test', function (req, res) {
	var data = fs.readFileSync('users_clean.txt');
	var textByLine = data.toString().split(" ");
	var msg = new Array();
	var check = 0;
	for (var i = 0; i < textByLine.length; i++) {
		if (textByLine[i] != 'user' && textByLine[i] != "") {
			msg.push(textByLine[i] + " ");
			check++;
		}
	}
	if (check < 5) {
		for (var q = check; q < 5; q++) {
			msg.push('-- ');
			console.log(msg);
		}
	}
	res.render('index', { title: 'Test', message1: msg[0], message2: msg[1], message3: msg[2], message4: msg[3], message5: msg[4] });
})

app.get("/--", function (req, res) {
	res.redirect('/test');
})

app.get('/signup', function(req, res) {
	//send html for signup page
	res.sendFile( __dirname + "/" + "signup.htm");
})

app.get('/loginused', function(req, res) {
	//send html for page that informs when a username is taken
	res.sendFile( __dirname + "/" + "loginused.htm");
})

app.get('/signProc', function (req, res) {
	//register an account
	response1 = {
		//scan username
		user:req.query.user
	};
	response2 = {
		//scan password
		password:req.query.password
	};
	//add username into temporary username folder
	fs.appendFileSync('users.txt', JSON.stringify(response1));
	//add password into temporary password folder
	fs.appendFileSync('pass.txt', JSON.stringify(response2));
	//used to hold users before they are stored into permanent file
	var users = new Array();
	//used to check if a username is taken
	var useCheck = new Array();
	//used if a username is taken to change action of program
	var check = 0;
	//read data from the temporary user file
	var data = fs.readFileSync('users.txt');
	//split the data such that it is easier to read
	var textByLine = data.toString().split(/{|}|"|user|:/)
	//read names into the array for the file ignoring blank spaces
	for (var i = 0; i < textByLine.length; i++) {
		if (textByLine[i] != "") {
			users.push("user" + " " + textByLine[i] + " ");
			useCheck.push(textByLine[i]);
		}
	}
	//reading the permanent username folder to check if a duplicate username
	var data2 = fs.readFileSync('users_clean.txt');
	//making the read data readable
	var textByLine2 = data2.toString().split(" ");
	for (var q = 0; q < textByLine2.length; q++) {
		//check if we have a duplicate username	
		if (textByLine2[q] == useCheck[0]) {
			check = 1;
			break;
		}
	}
	//clear the temporary user file such that it is clean for next use
	fs.writeFileSync('users.txt', '');
	if (check != 1) {
		//if it isn't a duplicate username read the username into the permanent username folder
		fs.appendFileSync('users_clean.txt', users);
	}
	console.log("users.txt cleared");
	//used to read passwords into the permanent password folder
	var pass = new Array();
	//read the data from the temporary password folder
	var data3 = fs.readFileSync('pass.txt');
	//make it readable
	var textByLine3 = data3.toString().split(/{|}|"|password|:/)
	for (var i = 0; i < textByLine3.length; i++) {
		//find the actual passwords
		if (textByLine3[i] != "") {
			pass.push("pw" + " " + textByLine3[i] + " ");
		}
	}
	//clear temporary password folder		
	fs.writeFileSync('pass.txt', '');
	if (check != 1) {
		//if the username isn't a duplicate read password into permanent password folder
		fs.appendFileSync('pass_clean.txt', pass);
	}
	console.log("pass.txt cleared");	
	if (check == 1) {
		//if username is a duplicate direct to the page informing user of such
		res.redirect('/loginused');
	} else if (check == 0) {
		//otherwise redirect to homepage and make new user's directory
		fs.mkdir(__dirname + "/"+ useCheck[0], function(err) {
			if (err) {
				return console.error(err);
			}
		})
		res.redirect('/');
	}
})

app.get('/login', function(req, res) {
	res.sendFile(__dirname + "/" + "login.htm");
})

app.get('/logProc', function(req, res) {
	//first check user credentials
	var data = fs.readFileSync('users_clean.txt');
	var data2 = fs.readFileSync('pass_clean.txt');
	var textByLine = data.toString().split(" ");
	var textByLine2 = data2.toString().split(" ");
	var check = -1;
	var user = req.query.user;
	for (var i = 0; i < textByLine.length; i++) {
		if (user == textByLine[i]) {
			check = i;
			break;
		}
	}
	if (check == -1) {
		res.redirect('/loginfailed');
	} else if (textByLine2[check] == req.query.password) {
		res.cookie('user', user);
		res.cookie('wi', 1); 
		res.redirect('/dash');
	} else {
		res.redirect('/loginfailed');
	}
})

app.get('/dash', function(req, res) {
	if (fs.existsSync(__dirname + '/' + req.cookies['user'] + '/' + req.cookies['user'] + "profpic.jpg")) {
		var rStream = fs.createReadStream(__dirname + '/' + req.cookies['user'] + '/' + req.cookies['user'] + "profpic.jpg");
		var wStream = fs.createWriteStream(__dirname + '/' + "curruser" + '/' + 'images' + '/' + "profpic.jpg");
		rStream.pipe(wStream);
	} else {
		var rStream = fs.createReadStream(__dirname + '/' + 'defaultprofile' + '/' + 'defprof.jpg');
		var wStream = fs.createWriteStream(__dirname + '/' + "curruser" + '/' + 'images' + '/' + "profpic.jpg");
		rStream.pipe(wStream);
	}
	res.sendFile(__dirname + "/" + "dash.htm");
})

app.get('/loginfailed', function(req, res) {
	res.sendFile(__dirname + "/" + "loginfailed.htm");
})

app.get('/logout', function(req, res) {
	res.sendFile(__dirname + "/" + "logout.htm");
})

app.get('/logoutconf', function(req, res) {
	if(req.query.conf == "Yes" || req.query.conf == "yes") {
		res.clearCookie('user');
		res.clearCookie('wi');
		fs.unlinkSync(__dirname + '/' + "curruser" + '/' + 'images' + '/' + "profpic.jpg");
		res.redirect('/');
	} else  if (req.query.conf == "No" || req.query.conf == "no"){
		res.redirect('/dash');
	} else {
		res.redirect('/logout');
	}
})

app.get('/upload', function(req, res) {
	if (fs.existsSync(__dirname + '/' + req.cookies['user'] + '/' + req.cookies['user'] + "profpic.jpg")) {
		res.sendFile(__dirname + "/" + "upconf.htm");
	} else {
		res.redirect('/uploadform');
	}
})

app.get('/uploadform', function(req, res) {
	res.sendFile(__dirname + "/" + "upload.htm");
})

app.post('/file_upload', upload.single('file'), function(req, res) {
	var name = req.cookies['user'] + 'profpic.jpg';
	var file = __dirname + '/' + req.cookies['user'] + '/' + name;
	if (fs.existsSync(file)) {
		fs.unlinkSync(file);
	}
	fs.rename(req.file.path, file, function (err) {
		if (err) {
			console.log(err);
			res.send(500);
		} else {
			res.redirect('/');
		}
	});
})

app.get('/uplib', function(req, res) {
	res.sendFile(__dirname + "/" + "uplib.htm");
})

app.post('/view_upload', upload.single('file'), function(req, res) {
	var file = __dirname + '/' + 'curruser' + '/' + 'archive' + '/' + '1' + '.jpg';
	var i = 1;
	while (fs.existsSync(file)) {
		i++;
		file = __dirname + '/' + 'curruser' + '/' + 'archive' + '/' + i + '.jpg';
	}
	fs.rename(req.file.path, file, function (err) {
		if (err) {
			console.log(err);
			res.send(500);
		} else {
			imMax++;
			res.redirect('/');
		}
	});
})

app.get('/view', function(req, res) {
	var files = fs.readdirSync(__dirname + '/' + 'curruser' + '/' + 'archive' + '/');
	var rStream = fs.createReadStream(__dirname + '/' + 'curruser' + '/' + 'archive' + '/' + req.cookies['wi'] + '.jpg');
	var wStream = fs.createWriteStream(__dirname + '/' + 'curruser' + '/' + 'currdisplay' + '/' + 'curr.jpg');
	rStream.pipe(wStream);
	res.sendFile(__dirname + '/' + 'view.htm');
})

app.get('/viewp', function(req, res) {
	var check = parseInt(req.cookies['wi'], 10);
	if (req.cookies['wi'] != 1) {
		res.cookie('wi', check-1);
	} else {
		res.cookie('wi', imMax);
	}
	var files = fs.readdirSync(__dirname + '/' + 'curruser' + '/' + 'archive' + '/');
	var rStream = fs.createReadStream(__dirname + '/' + 'curruser' + '/' + 'archive' + '/' + req.cookies['wi'] + '.jpg');
	var wStream = fs.createWriteStream(__dirname + '/' + 'curruser' + '/' + 'currdisplay' + '/' + 'curr.jpg');
	rStream.pipe(wStream);
	res.sendFile(__dirname + '/' + 'view.htm');
})

app.get('/viewn', function(req, res) {
	var check = parseInt(req.cookies['wi'], 10);
	if (check != imMax) {
		res.cookie('wi', check+1);
	} else {
		res.cookie('wi', 1);
	}
	var files = fs.readdirSync(__dirname + '/' + 'curruser' + '/' + 'archive' + '/');
	var rStream = fs.createReadStream(__dirname + '/' + 'curruser' + '/' + 'archive' + '/' + req.cookies['wi'] + '.jpg');
	var wStream = fs.createWriteStream(__dirname + '/' + 'curruser' + '/' + 'currdisplay' + '/' + 'curr.jpg');
	rStream.pipe(wStream);
	res.sendFile(__dirname + '/' + 'view.htm');
})

app.get('/', function(req, res) {
	try {
		var A = 0;
		console.log(req.cookies['user'].toString());
	} catch (e) {
		if (e instanceof TypeError) {
			A = 1;
		}
	} finally {
		if (A == 0) {
			res.redirect('/dash');
		} else {
			res.sendFile(__dirname + "/" + "home.htm");
		}
	}
})

var server = app.listen(8081, function () {
	
	var host = server.address().address
	var port = server.address().port

	var files = fs.readdirSync(__dirname + '/' + 'curruser' + '/' + 'archive' + '/')	

	for(var i in files) {
   		if(path.extname(files[i]) === ".jpg") {
       			imMax++
   		}
	}

	console.log(imMax)
	console.log("App listening at http://%s:%s", host, port)
})