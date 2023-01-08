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

app.use(express.static("images"));
app.use(passport.initialize());
app.use(passport.session());



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

app.set("views", path.join(__dirname,"views"));
app.set("view engine", "ejs");

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


//loginpage(landing page)
app.get("/",(request, response)=>{
    if(request.user && request.user.id){
        return response.redirect("/home");
    }
    response.render("adminLogin", { csrf: request.csrfToken() });
})

//SignUp page
app.get("/adminSignup", (request,response)=>{
    response.render("adminSignup", {csrf: request.csrfToken()});
});

//create new Admin(Signing Up)
app.post("/addAdmin",async(request, response)=>{
    if (request.body.name.length === 0) {
        request.flash("error", "Username cannot be empty!");
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
        const admin = await Admins.create({
            name: request.body.name,
            email: request.body.email,
            password: hashpswd,
        });
        request.login(user, (err)=>{
            if(err){
                console.log(err);
                response.redirect("/");
            }
            else{
                request.flash("success","Sign up successful");
                response.redirect("/home");
            }
        });
    } catch(error){
        request.flash("error", error.message);
        return response.redirect("/adminSignup")
    }

})

//Logging In the Admin
app.get("/home", connectEnsureLogin.ensureLoggedIn(),
    async(request,response)=>{
        const loggedInAdminID = request.user.id;
        const admin = await Admins.findByPk(loggedInAdminID);
        const elections = await Elections.findAll({where: { adminID: request.user.id },});
        response.render("/home", {
            username: admin.name,
            elections: elections,
            csrf: request.csrfToken(),
        });
    }
)
module.exports=app;