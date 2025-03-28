if(process.env.NODE_ENV != "production") {
  require('dotenv').config()
}
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const port=8080;
const path=require("path");
const methodOverride = require('method-override');
const ejsMate=require("ejs-Mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");


const User=require("./models/user.js");

const listingsRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const mongoose_url="mongodb://127.0.0.1:27017/wanderlust";
const db_url=process.env.ATLAS_DB_URL;
main().then(() => {
  console.log("Connected to mongo DataBase");
}).catch(err=> {
  console.log("err",err);
});
async function main() {
  mongoose.connect(db_url);
};


app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const sessionOptions={
  secret:"mysupersecretstring",
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  },
}

app.use(session(sessionOptions));
app.use(flash());

//authentication and authorization
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
});

// app.get("/registerUser", async (req,res) => {
//   let fakeUser=new User({
//     email:"abhishek@gmail.com",
//     username:"abhiydv",
//   });
//   let newUser=await User.register(fakeUser,"abhishek@2023");
//   res.send(newUser);
// });
app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);

app.all("*",(req,res,next) => {
  next(new ExpressError("500","PAGE NOT FOUND"));
});

app.use((err,req,res,next) => {
  let { status=500,message="SOME ERROR OCCURRED" }=err;
  res.status(500).render("error.ejs",{err});
});

app.listen(port,(req,res) => {
  console.log(`App is listening at port ${port}`);
});
