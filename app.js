const express = require("express");
const app = express();
const {Admins, Elections, Questions, Options, Voters} = require("./models");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const LocalStratergy = require("passport-local");
const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const flash = require("connect-flash");
const { request } = require("http");
const { response } = require("express");

app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("random sectret string for parsing"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(session({
    secret: "my-super-secret-key-5694063250764129",
    cookie:{
        maxAge: 24*60*60*1000, //24hours
    },
}));

app.use((request, response, next)=>{
    response.locals.messages = request.flash();
    next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname,"views"));
app.set("view engine", "ejs");


//passport session for admin
passport.use("admin-local",new LocalStratergy({
    usernameField: "email",
    passwordField: "password",
},
(username, password, done) =>{
    Admins.findOne({ where: { email: username }})
    .then(async (user) =>{
        const check = await bcrypt.compare(password, user.password);
        if(check){
            return done(null, user);
        } else{
            return done(null, false, {message: "Invalid Password"});
        }
    })
    .catch((error)=>{
        console.log(error); //remove final console log if no error
        return done(null, false,{message: "Please register/SignUp to LogIn !"});
    })
}));


//passport session for voter

passport.use("voter-local",new LocalStratergy({
    usernameField: "voterID",
    passwordField: "password",
    passReqToCallback: true,
},
(request, username, password, done)=>{
    Voters.findOne({where: {voterID: username, electionID: request.params.id},})
    .then(async(voter)=>{
        const check = await bcrypt.compare(password, voter.password);
        if(check){
            return done(null, voter);
        } else {
            return done(null, false, { message: "Invalid Password" });
        }
    })
    .catch((error)=>{
        console.log(error);
        return done(null, false, {message: "Your are not given permission to Vote!!",});
    });
}));

passport.serializeUser((user, done) => {done(null, user);});
passport.deserializeUser((obj, done) => {done(null, obj);});

// dashboard page
app.get("/",(request,response)=>{
    response.render("landingPage");
})

// signup page frontend
app.get("/signup",(request,response)=>{
    response.render("adminSignup",{csrf: request.csrfToken()});
})

//loginpage//refer Prathams line number 117 app.js
// login page frontend
app.get("/login",(request, response)=>{
    if(request.user && request.user.id){
        return response.redirect("/landingPage");
    }
    response.render("adminLogin", { csrf: request.csrfToken() });
})

//admin  home page frontend
app.get("/dashboard",connectEnsureLogin.ensureLoggedIn(),
  async(request,response)=>{
    const loggedInAdminID = request.user.id;
    const admin = await Admins.findByPk(loggedInAdminID);
    const elections = await Elections.findAll({where: {adminID: request.user.id},});
    response.render("dashboard",{
        username: admin.name,
        elections: elections,
        csrf: request.csrfToken(),
    });
  }
);

//create new Admin(Signing Up)
app.post("/addAdmin",async(request, response)=>{
    if (request.body.name.length === 0) {
        request.flash("error", "Name cannot be empty!");
        return response.redirect("/adminSignup");
    }
    if(request.body.email.trim().length === 0){
        request.flash("error", "Email address cannot be empty!");
        return response.redirect("/adminSignup");
    }
    if (request.body.password.length === 0) {
        request.flash("error", "Password cannot be empty!");
        return response.redirect("/adminSignup");
    }
    const admin = await Admins.findOne({ where: { email: request.body.email } });
    if (admin) {
        request.flash("error", "Email already exists!");
        return response.redirect("/adminSignup");
    }

    const hashpswd = await bcrypt.hash(request.body.password, 10);
    try{
        const user = await Admins.create({
            adminName: request.body.name,
            email: request.body.email,
            password: hashpswd,
        });
        request.login(user, (err)=>{
            if(err){
                console.log(err);
                response.redirect("/");
            }
            else{
                // request.flash("success","Sign up successful");
                response.redirect("/dashboard");
            }
        });
    } catch(error){
        request.flash("error", "Email ID is already in use!");
        return response.redirect("/adminSignup")
    }

})



//login page
// app.get("/", (request, response) => {
//     if (request.user) {
//       return response.redirect("/dashboard");
//     }
//     response.render("/");
//   });

// admin dashboard page frontend

// app.post("/adminLogin",passport.authenticate("Admins",{
//     failureRedirect:"/",
//     failureFlash: true,
// }),
// (request,response)=>{
//     response.redirect("/dashboard");
// });

app.post("/session",passport.authenticate("admin-local", {failureRedirect: "/",failureFlash: true,}),
  function (request, response) {
    response.redirect("/dashboard");
  }
);

module.exports=app;