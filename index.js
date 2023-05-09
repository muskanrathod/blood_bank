const express = require('express');
const db = require("./mysql/dbconnection");
const userRoutes = require("./route/user-route");
var bodyParser = require('body-parser');
// const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// const cors = require('cors');
// app.use(cors({
//     origin: []
// }));

// const allowedOrigins = ['www.example1.com'];
// app.use(cors({
//   origin: function(origin, callback){
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){
//       const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   }

// }));
 
// fetch("https://reqres.in/api/users?page=2").then(req => req.json()).then(json => console.log(json))

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('images'));

app.use(userRoutes)

app.listen(3000, () => {
    console.log("Server upto port 3000")
})