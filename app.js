const express = require('express')
var bodyParser = require("body-parser")
var dot = require("dot").process({path: "./templates"});
const app = express()
const port = 3000

const pgp = require('pg-promise')(/* initialization options */);


//Connecting to DB
const cn = {
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: 'auktionshaus',
    user: 'postgres',
    password: 'cZ547ioD3s'
};
const db = pgp(cn);



app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req, res) {
    db.many("SELECT username FROM users ORDER BY cdate DESC LIMIT 3", [])
    .then(response => {
        var page = dot.index({uname1:response[0].username,uname2:response[1].username,uname3:response[2].username});
        res.end(page);
    })
    .catch(error => {
        console.log(error);
    });
});

app.get('/register', function(req, res) {
    res.sendFile('./register.html', { root: __dirname });
});

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

app.get('/register.js', function(req, res) {
    res.setHeader("Content-Type", "text/javascript");
    res.sendFile('./static/register.js', { root: __dirname });
});

let exec_db = function(query, params) {
    return db.one(query, params);
};



app.listen(port, () => console.log(`Example app listening on port ${port}!`))