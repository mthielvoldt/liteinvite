
const passport = require("passport");

const db = require("./db");     

passport.use(db.User.createStrategy());                // connect passport to the User collection (mongoose model)
passport.serializeUser(db.User.serializeUser());
passport.deserializeUser(db.User.deserializeUser());

module.exports = passport;