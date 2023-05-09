const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: '3306',
    password: '12345',
    database: 'bloodbank'
})

db.connect((err) =>{
    if(err){
        console.log(err);
    }else{
        console.log('Database Connected Successfully');
    } 
});

module.exports = db;