const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer')
const randomnumber = require('random-string-alphanumeric-generator')
const db = require('../mysql/dbconnection')
http = require('http');
https = require('https');
const path = require("path");
const fs = require('fs');
const { google } = require('googleapis');
const { get } = require('http');
const accountSid = "AC5313275a89d7e8a42ffcd233749c3e2a";
const authToken = "09190ae8e43d2f45eeea4eabf100fc53";
const client = require('twilio')(accountSid, authToken);
const fetch = require('node-fetch');

let secretkey = "secretkey"
let tokenHeaderKey = "header"
var ext; 
var transporter;
const GOOGLE_API_FOLDER_ID = '1kejkZJkAEfkKUKZs2qkUIdGi_xZuUDMn'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images');
      },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)  

    }
})
    
exports.uploadImg = multer({
    storage: storage,
    limits:{
        fileSize: 1024 * 1024
    }
})

// exports.cors = (req, res) => {
//     get("https://reqres.in/api/users?page=2").then(req => req.text()).then(console.log)
// }

exports.getRouteController = (req, res) => {
    // res.send("Started Blood Bank API")
    fetch("https:/bb47-103-47-46-63.ngrok-free.app/api/v1/development/home/getCountryList").then(req => req.json()).then(json => res.send(json))
}

exports.deleteData = (req, res) => {
    let sql = 'DELETE FROM mailinfo'
    db.query(sql, (err, result) => {
        if(err) throw err;
        res.send({message:"Data Cleared"})
    })
}

exports.userSignUp = (req, res) => {

    ext = path.extname(req.file.originalname)
    var oldfile = req.file.filename
    var newfile = req.file.fieldname + '-' + Date.now() + ext

    // if(ext && ext == '.jpg' || ext == '.jpeg' || ext == '.png'){
        const encoded = Buffer.from(req.body.password, 'utf8').toString('base64')

        let user = {
            name : req.body.name,
            email : req.body.email,
            number : req.body.number,
            city : req.body.city,
            bloodgroup : req.body.bloodgroup,
            type : req.body.type,
            image : `http://localhost:3000/${newfile}`,
            password : encoded
        }  
                    
        var sql = `SELECT * from userinfo where email = '${user.email}'` 
        db.query(sql, (err, result) => {
            if(err) throw err;
            if(result.length){
                fs.unlink(`./images/${oldfile}`, function(err) {
                    if( err ) {
                        console.log('ERROR: ' + err)
                    }
                })
                return res.status(400).send({message : 'Email already exist!'})
            }else{
                fs.rename(`./images/${oldfile}`,`./images/${newfile}`,  function(err) {
                    if(err){
                        res.status(409).send({'error':'Something went wrong'})
                    }else{
                        sql = 'INSERT INTO userinfo SET ?';
                        db.query(sql, user, (err, result) => {
                            if(err){
                                console.log(err);
                            }else{
                                res.status(200).send({message: 'Account Created Successfully'});
                            }
                        });
                    }
                });
            }
         })     
    // }else{
    //     fs.unlink(`./images/${oldfile}`, function(err) {
    //         if( err ) {
    //             console.log('ERROR: ' + err)
    //         }else{
    //             res.json({"message":"File Extension is not correct"})
    //         }
    //     })
    // }

}

exports.userLogin = (req, res) => {
    var email = req.body.email
    var password = Buffer.from(req.body.password, 'utf8').toString('base64')

    let sql = `SELECT * from userinfo where email = '${email}' and password = '${password}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        if(result.length){
            const token = jwt.sign({ email }, secretkey, {
                algorithm: 'HS256',
                // expiresIn: 1
            })
            return res.status(200).send({message:"Logged in successfully", token:token, id:result[0].user_id, type:result[0].type})
        }else{
            res.status(401).send({message:"Unauthorised User"})
        }
    })
}

exports.forgotPassword = (req, res) => {
    var email = req.body.email
    var otp = randomnumber.randomNumber(4)

    let sql = `UPDATE userinfo SET otp = '${otp}' where email = '${email}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        
        sentMail()
      
        var mailOptions = {
            from: 'Onlineblooddonation22@gmail.com',
            to: email,
            subject: 'Forgot Password',
            html: '<p>Your OTP for change password is '+otp+'</p>'
        };
      
        transporter.sendMail(mailOptions, function(err, info){
            if (err) {
                console.log(err);
            } else {
                return res.status(200).send({message:"Email sent to your mail id"})
            }
        });
    })

}

exports.resetPassword = (req, res) => {
    var email = req.body.email
    var otp = req.body.otp
    var newPass = Buffer.from(req.body.new_pass, 'utf8').toString('base64')

    let sql = `SELECT otp from userinfo where email = '${email}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        if(result.length){
            var reslt = JSON.parse(JSON.stringify(result))
            var dbOtp = reslt[0].otp
            if(otp == dbOtp){
                sql = `UPDATE userinfo SET password = '${newPass}', isVerified = true  where email = '${email}'`
                db.query(sql, (err, result) => {
                    if(err) throw err;
                    sql = `update userinfo set otp = NULL where email = '${email}'`
                    db.query(sql, (err, result) => {
                        if(err) throw err;
                        return res.status(200).json({message:"Reset Password Successfully"})
                    })
                })
            }else{
                return res.status(400).json({message:"Otp is not correct"})
            }
        }else{
            return res.json({message:"Not a valid email"})
        }
    })
        
}

exports.verifyToken = (req, res, next) => {
    const token = req.header(tokenHeaderKey)

    if(token == null) return res.status(400).send({message:"Token is missing"})

    jwt.verify(token, secretkey, (err, user) => {
        if(err) return res.status(400).send({message:"Invalid Token"})
        req.user = user
        next()
    })
}

exports.userDetail = (req, res) => {
    var mail = req.user.email
    var id = req.query.id
    let sql = `SELECT * FROM userinfo where user_id = '${id}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        var userInfo = {
            uid: result[0].user_id,
            name: result[0].name, 
            email: result[0].email, 
            number: result[0].number, 
            city: result[0].city, 
            image: result[0].image, 
            bloodgroup: result[0].bloodgroup, 
            type: result[0].type
        }
        res.status(200).json(userInfo)
    })
}

exports.allUserDetails = (req, res) => {
    var mail = req.user.email

    let sql = `SELECT user_id AS uid, name, email, number, city, image, bloodgroup, type FROM userinfo WHERE NOT email = '${mail}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).send(result)
    })
}

exports.compatibleWithMe = (req, res) => {
    var mail = req.user.email
    let sql =  `SELECT bloodgroup FROM userinfo WHERE email = '${mail}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        var group = result[0].bloodgroup
        sql = `SELECT user_id AS uid, name, email, number, city, image, bloodgroup, type FROM userinfo WHERE bloodgroup = '${group}' and email != '${mail}'`
        db.query(sql, (err, result) => {
            if(err) throw err;
            res.status(200).send(result)
        })
    })
}

exports.getAllByGroup = (req, res) => {
    var mail = req.user.email
    var group = req.body.group
    let sql = `SELECT user_id AS uid, name, email, number, city, image, bloodgroup, type FROM userinfo WHERE bloodgroup = '${group}' and email != '${mail}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).send(result)
    })
}

exports.sendEmail = (req, res) => {
    var mail = req.body.email
    var usermail = req.user.email
    if(mail != usermail){
        let sql = `SELECT user_id, name, number, city, bloodgroup FROM userinfo WHERE email = '${usermail}'`
        db.query(sql, (err, result) => {
            if(err) throw err;
            var uid = result[0].user_id
            var username = result[0].name
            var usernumber = result[0].number
            var usercity = result[0].city
            var usergroup = result[0].bloodgroup

            let mailinfo = {
                id : uid,
                sent_to : mail
            }

            sql = `SELECT user_id , name, type FROM userinfo WHERE email = '${mail}'`
            db.query(sql, (err, result) => {
                if(err) throw err;
                if(result.length){
                    if(result[0].type == "Donor"){
                        var name = result[0].name

                        sentMail()
      
                        var mailOptions = {
                            from: 'Onlineblooddonation22@gmail.com',
                            to: mail,
                            subject: 'BLOOD DONATION',
                            html: `<p>Hello ${name},<br>${username} would like blood donation from you. Here's his/her details:<br>
                            Name: ${username}<br>
                            Mobile Number: ${usernumber}<br>
                            Email: ${usermail}<br>
                            Blood Group: ${usergroup}<br>
                            City: ${usercity}<br>
    
                            Kindly Reach out to him/her. Thank you!<br>
                            BLOOD DONATION APP - DONATE BLOOD, SAVE LIVES!</p>`
                        };
              
                        transporter.sendMail(mailOptions, function(err, info){
                            if(err) throw err;
                            sql = `SELECT * FROM mailinfo WHERE id = '${uid}' and sent_to = '${mail}'`
                            db.query(sql, (err, result) => {
                                if(err) throw err;
                                if(!result.length){
                                    sql = 'INSERT INTO mailinfo SET ?';
                                    db.query(sql, mailinfo, (err, result) => {
                                        if(err) throw err;
                                        res.status(200).send({message: 'Mail Sent Successfully'});
                                    });
                                }else{
                                    res.status(200).send({message: 'Mail Sent Successfully'});
                                }
                            })
                        });
                    }else{
                        res.status(200).json({message:"Mail cannot be send to recipient"})
                    }
                }else{
                    res.status(401).json({message:"No user found for this Email"})
                }
            })

        })
    }else{
        res.status(200).json({message:"Cannot send mail to Self"})
    }
}

function execute_rows(query){
    return new Promise((resolve, reject) => {
        db.query(query, function(err, result, fields) {
            if (err) {
                // Returning the error
                reject(err);
                console.log(err)
                // db.end();
            }
   
            resolve(result);
            // db.end();
        });
    });
   }

exports.getSentEmailList = async (req, res) => {

    var email = req.user.email
    var array = [];
    var obj = {};

    try{
        let sql = `SELECT user_id, type FROM userinfo WHERE email = '${email}'`
        const result1 = await execute_rows(sql)
        var uid = result1[0].user_id
        if(result1[0].type == "Donor"){
            sql = `SELECT id FROM mailinfo WHERE sent_to = '${email}'`
            const result2 = await execute_rows(sql)
            for (let i in result2) {
                sql = `SELECT user_id, name, email, number, city, image, bloodgroup, type FROM userinfo WHERE user_id = '${result2[i].id}'`
                const result3 = await execute_rows(sql)
                
                obj = {
                    uid: result3[0].user_id,
                    name: result3[0].name,
                    email: result3[0].email,
                    number: result3[0].number,
                    city: result3[0].city,
                    image: result3[0].image,
                    bloodgroup: result3[0].bloodgroup,
                    type: result3[0].type 
                }
                array.push(obj)
            }
            return res.status(200).send(array)
        }else{
            sql = `SELECT sent_to FROM mailinfo WHERE id = '${uid}'`
            const result4 = await execute_rows(sql)
            for (let i in result4){
                sql = `SELECT user_id, name, email, number, city, image, bloodgroup, type FROM userinfo WHERE email = '${result4[i].sent_to}'`
                const result5 = await execute_rows(sql)
            
                obj = {
                    uid: result5[0].user_id,
                    name: result5[0].name,
                    email: result5[0].email,
                    number: result5[0].number,
                    city: result5[0].city,
                    image: result5[0].image,
                    bloodgroup: result5[0].bloodgroup,
                    type: result5[0].type 
                }
                array.push(obj)
            }
            return res.status(200).send(array)
        }
    }catch(err){
        console.log(err)
    }
}

exports.changeType = (req, res) => {
    var email = req.user.email
    var type = req.body.type
    let sql = `UPDATE userinfo SET type = '${type}' WHERE email = '${email}'`
    db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).send({message:"Type Changed Successfully"})
    })
}

exports.editProfileImage = (req, res) => {
    var email = req.user.email

    ext = path.extname(req.file.originalname)
    var oldfile = req.file.filename
    var newfile = req.file.fieldname + '-' + Date.now() + ext

    // if(ext && ext == '.jpg' || ext == '.jpeg'){

        fs.rename(`./images/${oldfile}`,`./images/${newfile}`,  function(err) {
            if(err){
                res.status(409).send({'error':'Something went wrong'})
            }else{
                var image =  `http://localhost:3000/${newfile}`
                sql = `UPDATE userinfo SET image = '${image}' WHERE email = '${email}'`;
                db.query(sql, (err, result) => {
                    if(err) throw err;
                    res.status(200).send({message:"Profile Photo Updated Successfully"})
                });
            }
        })  
                       
    // }else{
    //     fs.unlink(`./images/${oldfile}`, function(err) {
    //         if( err ) {
    //             console.log('ERROR: ' + err)
    //         }else{
    //             res.json({"message":"File Extension is not correct"})
    //         }
    //     })
    // }
}

exports.editDetails = (req, res) => {
    var email = req.user.email

    var name = req.body.name
    var number = req.body.number
    var city = req.body.city
    var group = req.body.bloodgroup

    if(name){
        if(number){
            if(city){
                if(group){
                    let sql = `UPDATE userinfo SET name = '${name}', number = '${number}', city = '${city}', bloodgroup = '${group}' WHERE email = '${email}'`
                    db.query(sql, (err, result) => {
                        if(err) throw err;
                        return res.status(200).send({message:"Details Updated Successfully"})
                    })
                }else{
                    return res.send({message:"Bloodgroup field is missing"}) 
                }
            }else{
                return res.send({message:"City field is missing"})
            }
        }else{
            return res.send({message:"Number field is missing"})
        }
    }else{
        return res.send({message:"Name field is missing"})
    }

}

exports.userLogout = (req, res) => {
    const token = req.header(tokenHeaderKey)
    res.status(200).send({message:"User Logout Successfull"})
}

function sentMail(){
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'Onlineblooddonation22@gmail.com',
          pass: 'pakfeduzopbjdxbb'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

exports.sendSmsTwilio = (req, res) => {
    var otp = randomnumber.randomNumber(6)

    client.messages
      .create({
         body: `Your otp for Blood Bank App is '${otp}'`,
         messagingServiceSid: 'MG53608227457e64f4c6e82a9463ad29d3',
         to: '+919039399650'
       })
      .then(message => res.status(200).send({message:"otp sent successfully"}));

} 

exports.uploadFile = async (req, res) => {
    var name = req.file.filename
    try{
        const auth = new google.auth.GoogleAuth({
            keyFile: './googlekey.json',
            scopes: ['https://www.googleapis.com/auth/drive']
        })

        const driveService = google.drive({
            version: 'v3',
            auth
        })

        const fileMetaData = {
            'name': name,
            'parents': [GOOGLE_API_FOLDER_ID]
        }

        const media = {
            mimeType: 'image/jpg',
            body: fs.createReadStream(`./images/${name}`)
        }

        const response = await driveService.files.create({
            resource: fileMetaData,
            media: media,
            field: 'id'
        })
    
        res.status(200).send({image:"https://drive.google.com/uc?id="+response.data.id+"&authuser=0&export=view"})

    }catch(err){
        console.log('Upload file error', err)
    }
}

exports.joinDetail = (req, res) => {
    var email = req.user.email
    let sql = `SELECT userinfo.name AS username, userinfo.email, mailinfo.sent_to 
    FROM userinfo INNER JOIN mailinfo ON userinfo.user_id = mailinfo.id 
    WHERE userinfo.email = '${email}'`

    db.query(sql, (err, result) => {
        if(err) throw err;
        var array = []
        for(i in result){
            array.push(result[i].sent_to)
        }
        res.status(200).send({sent_to:array})
    })
}


