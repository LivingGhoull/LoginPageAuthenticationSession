const express = require("express")
const app = express()
const path = require("path")
const mysql = require("mysql2")
require("dotenv").config()

//Creates a session and is able to store it in a mysql db
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);

app.use(express.urlencoded({extended: false}))
app.use(express.json())

/** View engine 
 * ? view engine takes for exemple the ejs file and render it to a html file 
 * * We do not need to set views path sense it is alredy made to finde the folder called views 
 * * and only meant if the folder is called somthing else or the path is diffrent*/
//app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

//the db options
const options = {
    host: process.env.HOST,
    user: process.env.USER,
    database: process.env.DATABASE
}
const conn = mysql.createConnection(options)
const sessionStore = new MySQLStore(options);

const filePath = __dirname + '/views/'

//Session middelware
app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: false,
    cookie: { maxAge: 300000 },
    resave: false,
    store: sessionStore
}))

//Authentication middelware
const isAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next()
    } else {
        res.redirect('/login')
    }
}

//Checks the authentication middelware before running the code
app.get('/', isAuth, (req, res) => {
    conn.query("SELECT * FROM sessions WHERE session_id = ?", 
    [req.session.id], (err, result) =>{
        let obj = JSON.parse(result[0].data)
        res.render('index', {name: `${obj.user.username}`})
    })
})

app.get('/login', (req, res) =>{
    res.sendFile(filePath+'login.html')
})

//When trying to sign in
app.post('/login', (req, res) =>{
    const {username, password} = req.body
    if (req.session.authenticated) {
        res.redirect('/')
    }
    else {
        conn.query("SELECT * FROM user WHERE username= ? AND password= ?", 
        [username, password], (err, result) =>{
            if (err) {
                console.log('err in query')
                res.redirect('/login')
            }
            else if (result.length > 0) {
                req.session.authenticated = true
                req.session.user = {
                    username,
                }
                res.redirect('/')
            } else {
                res.redirect('/login')
            }
        })
    }
})

//If a site is not reconised render to the error site
app.get('*', function(req, res){
    res.sendFile(filePath+'error.html')
})

app.listen(3000, () =>{
    console.log("Listen to the port")
})