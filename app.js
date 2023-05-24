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

const saltRounds = 10;

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
        const result = await bcrypt.compare(password, user.password);
        if(result){
            return done(null, user);
        } else{
            return done(null, false, {message: "Invalid Password"});
        }
    })
    .catch((error)=>{
        // console.log(error);
        return done(null, false,{message: "Please register/SignUp to LogIn !"});
    })
}));


//passport session for voter
passport.use("voter-local",new LocalStratergy({
    usernameField: "voterID",
    passwordField: "password",
    passReqToCallback: true, //ckeck with and without
},
(request, voterID, password, done)=>{ //made some changes using rohithlingkar
    Voters.findOne({where: {voterID: username, electionID: request.params.id},})
    // Voters.findOne({where: { voterID: username },})
    .then(async(voter)=>{
    // .then(async(user)=>{
        const result = await bcrypt.compare(password, voter.password);
        if(result){
            return done(null, voter);
        } else {
            return done(null, false, { message: "Invalid Password" });
        }
    })
    .catch((error)=>{
        // console.log(error);
        return done(null, false, {
            message: "Your are not given permission to Vote!!",
        });
    });
}));

passport.serializeUser((user, done) => {
    // console.log(user);
    // console.log("Serialize the user with ID: ",user.id);
    done(null, user);});

passport.deserializeUser((obj, done) => {
    // console.log("obj: ",obj);
    // console.log("deserializing user",obj.id);
    done(null, obj);});

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
    try{
        const loggedInAdminID = request.user.id;
        // console.log("loggedinAdminID: ",loggedInAdminID);
        const admin = await Admins.findByPk(loggedInAdminID);
        const electionList = await Elections.findAll({where: {adminID: request.user.id},});
        if(request.accepts("html")){
            // console.log({ electionList });
            // response.json(electionList);
            response.render("dashboard",{
                username: admin.adminName,
                elections: electionList,
                csrf: request.csrfToken(),
            });
        }else{
            response.json({ electionList });
        } 
    } catch (error){
        console.log(error);
    }
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

    const hashpswd = await bcrypt.hash(request.body.password, saltRounds);
    try{
        const user = await Admins.create({
            adminName: request.body.name,
            email: request.body.email,
            password: hashpswd,
        });
        request.login(user, (err)=>{
            if(err){
                console.log(err);
            }
            else{
                // request.flash("success","Sign up successful");
                response.redirect("/dashboard");
            }
        });
    } catch(error){
        // request.flash("error", "Email ID is already in use!");
        return response.redirect("/adminSignup")
    }

})

//create new election
app.post("/election",connectEnsureLogin.ensureLoggedIn(),
async (request,response)=>{
    if(request.body.name.trim().length===0){
        console.log("Election name cannot be emoty");
        return response.redirect("/dashboard");
    }
    const loggedInAdminID = request.user.id;
    console.log("LoggedInAdminID---------",loggedInAdminID);
    const admin = await Admins.findByPk(loggedInAdminID);
    console.log("loggedAdmin:----",admin);
    const username = admin.adminName;
    console.log("loggedAdminName:----",username);
    console.log("electionName:----",request.body.name);
    const result = await Elections.findOne({
        where:{adminID: loggedInAdminID, electionName: request.body.name},
    });

    console.log("result--------",result);

    if(result){
        console.log("***************Election name is already used************");
        return response.redirect("/dashboard");
    }

    try{
        const electionName = request.body.name;
        await Elections.add(electionName, loggedInAdminID);
        response.redirect("/dashboard");
    }catch(error){
        console.log("Line 214 error:*****")
        console.log(error);
        response.send(error);
    }
});

//election home Page
// app.get("/election", connectEnsureLogin.ensureLoggedIn(),
//   async (request, response) => {
//     const loggedInAdminID = request.user.id;
//     const elections = await Elections.findAll({ where: { adminID: loggedInAdminID }, });
//     return response.json({ elections });
//   }
// );

// election home page
app.get("/election/:id", connectEnsureLogin.ensureLoggedIn(),async (request, response) => {
    const loggedInAdminID = request.user.id;
    const admin = await Admins.findByPk(loggedInAdminID);
    const electionsDetails = await Elections.findByPk(request.params.id);

    if (loggedInAdminID !== elections.adminID) {
      return response.render("error", {errorMessage: "You are not authorized to view this page",});
    }
    
    const votersList = await Voters.findAll({
        where: { electionID: request.params.id },
    });
    const questionsList = await Questions.findAll({
      where: { electionID: request.params.id },
    });

    response.render("electionHome", {
      election: electionsDetails,
      username: admin.name,
      questions: questionsList,
      voters: votersList,
      csrf: request.csrfToken(),
    });
  }
);

// create new election
app.post("/election", connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // if (request.body.name.trim().length === 0) {
    // //   request.flash("error", "Enter election name");
    // //   return response.redirect("/elections/new");
    // }
    const loggedInAdminID = request.user.id;
    // const election = await Elections.findOne({
    //   where: { adminID: loggedInAdminID, name: request.body.name },
    // });

    // if (election) {
    //   request.flash("error", "Election name is already used!");
    //   return response.redirect("/elections/new");
    // }

    try {
      await Elections.add(loggedInAdminID, request.body.name);
      response.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      response.send(error);
    }
  }
);


// delete election
app.delete("/election/:id", connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminID = request.user.id;
    const electionDetails = await Elections.findByPk(request.params.id);

    if (adminID !== electionDetails.adminID) {
      console.log("You are not authorized to perform this operation");
      return response.redirect("/landingPage");
    }

    // get all questions of that election
    const questionsList = await Questions.findAll({
      where: { electionID: request.params.id },
    });

    // delete all options and then questions of that election
    questionsList.forEach(async (Question) => {
      const options = await Options.findAll({
        where: { questionID: Question.id },
      });
      options.forEach(async (option) => {
        await Option.destroy({ where: { id: option.id } });
      });
      await Questions.destroy({ where: { id: Question.id } });
    });
    // delete voters of the election
    const votersList = await Voters.findAll({
        where: { electionID: request.params.id },
      });
      votersList.forEach(async (voter) => {
        await Voters.destroy({ where: { id: voter.id } });
      });
  
      try {
        await Elections.destroy({ where: { id: request.params.id } });
        return response.json({ ok: true });
      } catch (error) {
        console.log(error);
        response.send(error);
      }
});
 




app.get("/elections/:id/results",async (request,response)=>{
    const election = await Elections.findByPk(request.params.id);
    if(!election.isElectionLive || (request.user && request.user.isAdmin)){
        response.render("results")
    }else{
        response.send("Election is not yet ended.");
    }
});

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

app.post("/session",passport.authenticate("admin-local", {
    failureRedirect: "/login",
    failureFlash: true,
}),
  (request, response)=> {
    response.redirect("/dashboard");
  }
);

module.exports=app;