const express = require('express')
var bodyParser = require("body-parser")
var dot = require("dot").process({path: "./templates"});
const app = express()
var my_ip = '0.0.0.0'
const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads/images'});
const formidable = require('formidable');

app.use('/storage', express.static('storage'))

const pgp = require('pg-promise')(/* initialization options */);

let set_arg = function(name, default_val) {
    if (!(typeof(argv[name]) == 'undefined')) {return argv[name];}
    else {return default_val;}
};

var argv = require('minimist')(process.argv.slice(2));
var port = set_arg('port', 3000)
var db_host = set_arg('db', 'localhost')
var db_port = set_arg('db_port', 5432)
var db_username = set_arg('db_user', 'postgres')
var db_pw = set_arg('db_pw', 'cZ547ioD3s')
var db_name = set_arg('db_name', 'auktionshaus')

//Connecting to DB
const cn = {
    host: db_host, // server name or IP address;
    port: db_port,
    database: db_name,
    user: db_username,
    password: db_pw
};
const db = pgp(cn);



app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req, res) {
    db.many("SELECT username FROM users ORDER BY cdate DESC LIMIT 3", [])
    .then(response => {
        db.many("SELECT name FROM categories", [])
        .then(cats => {
            db.many("SELECT * FROM auctions INNER JOIN categories ON auctions.categoryid = categories.id INNER JOIN (SELECT MAX(bid), auctid FROM bids as idauct GROUP BY auctid) AS bidentries ON auctions.auctid = bidentries.auctid", [])
            .then(entries => {
                console.log(entries)
                var unames_arr = [];
                var cats_arr = [];
                response.forEach(function(item) {unames_arr.push(item.username) });
                cats.forEach(function(item) {cats_arr.push(item.name) });
                var page = dot.index({'unames':unames_arr, 'cats': cats_arr, 'entries':entries});
                res.end(page);
            })
        })
        .catch(error => {
            console.log(error);
            var page = dot.index({'unames':[]});
            res.end(page);
        })
    })
    .catch(error => {
        console.log(error);
        var page = dot.index({'unames':[]});
        res.end(page);
    });
});

app.get('/register', function(req, res) {
    res.sendFile('./register.html', { root: __dirname });
});

app.get('/storage/*')

app.get('/style.css', function(req, res) {
    res.sendFile('./static/style.css', { root: __dirname });
});

app.post('/register',function(req,res){
    var data=req.body;
    //CHeck values, MAKE BETTER RETARD!
    db.none('INSERT INTO Users(PwHash, Email, Username) values($1, $2, $3)',[data.pwd, data.mail, data.uname])
    .then(output => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Registration successfull!");
    })
    .catch(error => {
        res.writeHead(409, {'Content-Type': 'text/plain'});
        res.end(error.constraint);
    });
});

app.post('/placebid', function(req,res) {
    var data = req.body;
    db.none('INSERT INTO bids (bid, auctid) VALUES ($1, $2)', [data.bid, data.auctid])
    .then(result => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Bid successfull!");
    })
    .catch(error => {
        console.log(error)
    })
});

app.post('/createauct',function(req,res){
    var data = req.body
    db.one('SELECT id FROM categories WHERE name LIKE $1 LIMIT 1', [data.cat])
    .then(catid => {
        console.log(catid)
        db.none('INSERT INTO auctions(description, itemname, condition, imagename, categoryid) VALUES ($1, $2, $3, $4, $5)',[data.desc, data.name, data.state, data.imagename, parseInt(catid.id)])
        .then(out => {
            db.one('SELECT auctid FROM auctions WHERE itemname LIKE $1 AND description LIKE $2 LIMIT 1', [data.name, data.desc])
            .then(result => {
                db.none('INSERT INTO bids (bid, auctid) VALUES ($1, $2)', [data.bid, result.auctid])
                .then(abc => {
                    console.log(out);
                    res.redirect('back');
                })
                .catch(err => {
                    console.log(err)
                })
            })
            .catch(err => {
                console.log(err)
            })
        })
        .catch(error => {
            //console.log(error)
            res.writeHead(409, {'Content-Type': 'text/plain'});
            res.end("Couldnt create Auction!");
        });
    })
    .catch(err => {
        console.log(err)
    });
});
app.post('/upload', function (req, res){
    var form = new formidable.IncomingForm();
    form.parse(req);
    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/storage/' + file.name;
    });
    form.on('file', function (name, file){
        console.log('Uploaded ' + file.name);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(file.name);
        res.status(200);
    });
});

app.get('/register.js', function(req, res) {
    res.setHeader("Content-Type", "text/javascript");
    res.sendFile('./static/register.js', { root: __dirname });
});

app.get('/index.js', function(req, res) {
    res.setHeader("Content-Type", "text/javascript");
    res.sendFile('./static/index.js', { root: __dirname });
});




app.listen(port,my_ip,() => console.log(`Example app listening on port ${my_ip}:${port}! DB on: ${db_host}`))