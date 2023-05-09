const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const user = require("../controller/user-controller")

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('images'));

router.get ("/cors", user.getRouteController)

// router.get ("/cors", user.cors)

router.get("/deleteData", user.deleteData)

router.post("/user/signup", user.uploadImg.single('image'), user.userSignUp)

router.post("/user/login", user.userLogin)

// router.get("/user/validateToken", user.authenticatetoken, user.verifyToken)

router.post("/user/forgotPassword", user.forgotPassword)

router.post("/user/resetPassword", user.resetPassword)

router.get("/userDetail", user.verifyToken, user.userDetail)

router.get("/allUserDetails", user.verifyToken, user.allUserDetails)

router.get("/user/compatible", user.verifyToken, user.compatibleWithMe)

router.post("/user/allByGroup", user.verifyToken, user.getAllByGroup)

router.post("/user/sendMail", user.verifyToken, user.sendEmail)

router.get("/user/getAllEmailList", user.verifyToken, user.getSentEmailList)

router.post("/user/typeChange", user.verifyToken, user.changeType)

router.post("/user/editProfileImage", user.verifyToken, user.uploadImg.single('image'), user.editProfileImage)

router.post("/user/editDetails", user.verifyToken, user.editDetails)

router.get("/user/logout", user.verifyToken, user.userLogout)

router.get("/sendMessage", user.sendSmsTwilio)

router.post("/uploadPhoto", user.uploadImg.single('image'), user.uploadFile)

router.get("/getJoin", user.verifyToken, user.joinDetail)

module.exports = router;