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

app.use(express.static(path.join(__dirname,"public")));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("random sectret string for parsing"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

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