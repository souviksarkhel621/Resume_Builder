const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const pdf = require('html-pdf');
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
var fs = require('fs');
var options = {
  format: 'A4'
};
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true,
}));
mongoose.connect("mongodb://localhost:27017/souvikDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
const userSchema = mongoose.Schema({
  email: String,
  password: String,
  otp: String,
  isvarified: String

});

const User = mongoose.model("User", userSchema);

var smtpTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "Give Your Own Gmail Id",
    pass: "****Give Your Own Gmail Password****"
  }
});
var smtpTransportx = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "Give Your Own Gmail Id",
    pass: "****Give Your Own Gmail Password****"
  }
});


var otp, mailOptions, host, link,otpOptions;


app.get("/forgetpass", function(req, res) {
  res.render("forgotpassmail");
});
app.post("/forgotpassrequest",function(req,res){

  User.findOne({
      email: req.body.email
    }, function(err, foundUser) {
      if (err) {
        console.log(err);
      }
      else {
        if (foundUser) {
          if(foundUser.otp === req.body.otp)
          {

            User.updateOne({
              email: req.body.email
            },{
              $set: {
                password: req.body.password
              }
            }, {
              upsert: true
            }, function(err) {
              if (err) console.log(err);
              else console.log("Password Changed");
            })
            //console.log(req.body.password);
            res.render("loginpage");
          }
          else{
            res.send("<h1>Please enter otp Correctly</h1>")

        }}
        else {
          res.send("<h1>Sorry You are not registered with us. </h1>")
        }
      }
    });


});
app.post("/forgetpassword", function(req, res) {
User.findOne({
    email: req.body.username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        var newotp = Math.floor((Math.random() * 100000) + 54);
        otpOptions = {
          from: "yourgmailid",
          to: req.body.username,
          subject: "Hi your password reset code is Here",
          html: "Your OTP is :- " + newotp + "."
        }
        console.log(otpOptions);
        smtpTransportx.sendMail(otpOptions, function(error, response) {
          if (error) {
            console.log(error);
          }

        });
        res.render("password_reset_otp", {
          emailentered: req.body.username
        });
        console.log(foundUser.otp+" -->"+newotp);
        User.updateOne({
          email: req.body.username
        },{
          $set: {
            otp: newotp
          }
        }, {
          upsert: true
        }, function(err) {
          if (err) console.log(err);
          else console.log("NEW OTP SENT");
        })
      }
      else {
        res.send("<h1>Sorry You are not registered with us. </h1>")
      }
    }
  });
});

app.get("/build", function(req, res) {
  res.sendFile(__dirname + "/file/index.html");
});
app.get("/", function(req, res) {
  res.render("homepage");
});
app.get("/login", function(req, res) {
  res.render("loginpage");
});
app.get("/register", function(req, res) {
  res.render("registerpage");
});

app.post("/otpvarify", function(req, res) {
  User.findOne({
    email: req.body.email
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundUser.otp + "-" + req.body.otp);
      if (foundUser.otp === req.body.otp) {


        User.updateOne({
          email: req.body.email
        }, {
          $set: {
            isvarified: "YES"
          }
        }, {
          upsert: true
        }, function(err) {
          if (err) console.log(err);
          else console.log("User Varified");
        })

        res.sendFile(__dirname + "/file/index.html");
      } else {
        res.send("<h1>Please Enter OTP Correctly</h1>");
      }
    }
  });
});





app.post("/register", function(req, res) {
  var datetime = new Date();
  User.findOne({
    email: req.body.email
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {

      if (foundUser) {
        res.render("loginpage");
      } else {
        otp = Math.floor((Math.random() * 100000) + 54);
        mailOptions = {
          from: "SendermailID",
          to: req.body.email,
          subject: "Hi your varification code is Here",
          html: "Your OTP is :- " + otp + "."
        }
        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, function(error, response) {
          if (error) {
            console.log(error);
          }
        });
        res.render("otppage", {
          emailentered: req.body.email
        });
        var newUser = new User({
          _Id: datetime,
          email: req.body.email,
          password: req.body.password,
          isvarified: "NO",
          otp: otp
        })
        newUser.save(function(err) {
          if (err) {
            console.log(err);
          } else {

          }
        });
      }
    }
  });

});


app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({
    email: username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {

      if (foundUser) {
        if (foundUser.password === password) {
          if (foundUser.isvarified === "YES") res.sendFile(__dirname + "/file/index.html");
          else res.render("otppage", {
            emailentered: username
          });
        } else {
          res.send("<h1>Please Enter Correct Password</h1>");
        }
      } else {
        res.render("registerpage");
      }
    }
  });



});


app.post("/", function(req, res) {
  if (req.body.view == "webview") {
    res.render("cv" + req.body.fav_template, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      aboutyou: req.body.aboutyou,
      cname: req.body.cname,
      startingdate: req.body.startingdate,
      endingdate: req.body.endingdate,
      pwjd: req.body.pwjd,
      ugdegree: req.body.ugdegree,
      ugcollege: req.body.ugcollege,
      ugyear: req.body.ugyear,
      ugdept: req.body.ugdept,
      ugscore: req.body.ugscore,
      hscourse: req.body.hscourse,
      hsschool: req.body.hsschool,
      hsyear: req.body.hsyear,
      hsstream: req.body.hsstream,
      hsscore: req.body.hsscore,
      scourse: req.body.scourse,
      ssclname: req.body.ssclname,
      syear: req.body.syear,
      sscore: req.body.sscore,
      skills: req.body.skills,
      awards: req.body.awards
    });
  } else {
    res.render("cv" + req.body.fav_template, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        pincode: req.body.pincode,
        aboutyou: req.body.aboutyou,
        cname: req.body.cname,
        startingdate: req.body.startingdate,
        endingdate: req.body.endingdate,
        pwjd: req.body.pwjd,
        ugdegree: req.body.ugdegree,
        ugcollege: req.body.ugcollege,
        ugyear: req.body.ugyear,
        ugdept: req.body.ugdept,
        ugscore: req.body.ugscore,
        hscourse: req.body.hscourse,
        hsschool: req.body.hsschool,
        hsyear: req.body.hsyear,
        hsstream: req.body.hsstream,
        hsscore: req.body.hsscore,
        scourse: req.body.scourse,
        ssclname: req.body.ssclname,
        syear: req.body.syear,
        sscore: req.body.sscore,
        skills: req.body.skills,
        awards: req.body.awards
      },
      function(err, html) {
        pdf.create(html, options).toFile('./demopdf.pdf', function(err, result) {
          if (err) {
            return console.log(err);
          } else {
            //console.log(res);
            var datafile = fs.readFileSync('./demopdf.pdf');
            res.header('content-type', 'application/pdf');
            res.send(datafile);
          }
        });
      })
  }

});

app.listen(3000, function() {
  console.log("Server is Ready To Run");
})
