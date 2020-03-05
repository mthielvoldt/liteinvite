if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const upload = multer({ dest: 'public/images/', limits: { fileSize: 10000000, fieldNameSize: 1000 } });
const fs = require('fs');

// user auth packages (3)
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
// tells express where files that are sent to the client live.  This is where we put styles.css and any client-side scripts.
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));   // lets us access body items with . notation (eg req.body.item)
app.use(express.static('public'));

// session initialization (user auth)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// passport initialization (user auth)
app.use(passport.initialize());
app.use(passport.session());    // use passport to handle the sessions


// Creates a new db if it is not already there.  Requires mongod to be running.
mongoose.connect('mongodb://localhost:27017/LiteInvite',
    { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// this is a constructor.  Needs new keyword?
const userSchema = new Schema({
    name: String,
    username: String,
    password: String,
    meetups: [ObjectId],
    guests: [ObjectId],
});
const guestSchema = new Schema({
    name: String,
    email: { type: String, required: true },
    phone: String
});
const meetupSchema = new Schema({
    name: String,
    owner: { type: ObjectId, required: true },
    desc: String,
    image: String,
    location: String,
    time: String,
    lists: [],
    guests: [ObjectId]
});

userSchema.plugin(passportLocalMongoose);   // use passport local mongoose to handle hashing and salting passwords

const Guest = mongoose.model("guest", guestSchema);
const Meetup = mongoose.model("meetup", meetupSchema);
const User = mongoose.model("User", userSchema);    // need "new"

passport.use(User.createStrategy());                // connect passport to the User collection (mongoose model)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

let active_user, message;
const defaultImage = "pine-trees-under-starry-night-sky-1539225.jpg";

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        active_user = req.user;

        Meetup.find({ _id: { $in: active_user.meetups } }, (err, foundMeetups) => {
            if (err) {
                console.log(err);
            }
            res.render("home", { user: active_user, meetups: foundMeetups });
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get('/login', function (req, res) {
    res.render("login");
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/register', function (req, res) {
    res.render("register");
});

app.get('/create', function (req, res) {
    let newMeetup = new Meetup({ owner: active_user._id, name: "", image: defaultImage });
    active_user.meetups.push(newMeetup._id);
    newMeetup.save();
    active_user.save();

    res.redirect('/edit/' + newMeetup._id);
});

// The main edit page. 
app.get('/edit/:meetId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        Meetup.findById(req.params.meetId, (err, foundMeetup) => {
            res.render("edit", { meetup: foundMeetup, message: message });
            message = "";
        });
    }
});
app.get('/guestlist/:meetId.json', function (req, res) {

    Meetup.findById(req.params.meetId, function (err, foundMeetup) {
        if (err) console.log(err);

        Guest.find({ _id: { $in: foundMeetup.guests } }, 'email', function (err, foundGuests) {
            if (err) {
                console.log(err);
            } else {
                let dummyResponse = '[{ "name": "Aimee Mann" }, { "name": "Jeremy McGrath" }, { "name": "Farnoush Saiidnia" }]';
                console.log(dummyResponse);
                console.log(foundGuests);
                res.send(JSON.stringify(foundGuests));
                //res.sendFile(__dirname + "/public/ajax-info.json");
            }
        });
    });
});

app.get('/delete/:meetId', function (req, res) {
    let meetId = req.params.meetId;
    // remove the meetupId from the user's array of meetups. 
    console.log(meetId);
    console.log(active_user.meetups);
    let newMeetups = active_user.meetups.filter((value) => (value != meetId));
    console.log(newMeetups)
    console.log("meetup deleted: " + meetId);
    active_user.meetups = newMeetups;
    console.log(active_user.meetups);

    Meetup.findByIdAndDelete(meetId, (err, foundMeetup) => {
        res.redirect('/');
    });
});

app.post('/edit/:meetId', function (req, res) {
    Meetup.findById(req.params.meetId, (err, foundMeetup) => {
        if (err) {
            console.log(err);
            return;
        }
        Object.assign(foundMeetup, req.body);
        foundMeetup.save();
        message = "Changes Saved.";
        res.redirect("/edit/" + req.params.meetId);
    });
});

app.post('/upload/:meetId', function (req, res) {
    upload.single('meetupImage')(req, res, function (err) {
        if (err) {
            console.log(err.message);
            message = "Error: " + err.message;  // display this message
            res.redirect('/edit');
        } else {
            updateImageLink();
            res.redirect('/edit');
        }
    });

    function updateImageLink() {
        Meetup.findById(req.params.meetId, (err, foundMeetup) => {
            if (err) {
                console.log(err);
                return;
            }
            // delete the old image if it isn't the default image. 
            if (foundMeetup.image != defaultImage) {
                let oldFile = "public/images/" + foundMeetup.image;
                fs.unlink(oldFile, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('successfully deleted: ' + oldFile);
                    }
                });
            }
            foundMeetup.image = req.file.filename;
            console.log(foundMeetup);
            console.log("updated meetup image link");
            foundMeetup.save();
        });
    }
});

app.post('/guest/:meetId', upload.none(), function (req, res, next) {

    // check if we alredy have that email
    let newEmail = req.body.email;
    let newEmailRegex = new RegExp("^" + newEmail, 'i');

    Guest.findOne({ email: newEmailRegex }, (err, foundGuest) => {
        if (err) {
            console.log(err);
        } else {
            let newGuest;
            // if we don't have this email in the DB, add it. 
            if (foundGuest == null) {
                newGuest = new Guest({ email: newEmail });
                newGuest.save();
                console.log("added guest: " + JSON.stringify(newGuest));
            } else {
                newGuest = foundGuest;
                console.log("guest already exists");
            }
            // add this guest's ID  to the meetup's guest-list. (if it isn't there)
            console.log("meetId: " + req.params.meetId);
            Meetup.findById(req.params.meetId, function (err, meetup) {
                if (err) { console.log(err); }

                if (meetup.guests.indexOf(newGuest._id) === -1) {
                    meetup.guests.push(newGuest._id);
                    meetup.save();
                    console.log("added guest to meetup")
                } else {
                    console.log("guest already associated with this meetup.")
                }
            });

            // add this guest's ID  to the user's guest-list (if it isn't there)
            let user = req.user;
            console.log("._id: " + user._id);

            if (user.guests.indexOf(newGuest._id) === -1) {
                user.guests.push(newGuest._id);
                user.save();
                console.log("added guest to user")
            } else {
                console.log("guest already associated with this user.")
            }
        }
    })
    res.sendStatus(200);


});

app.post('/register', function (req, res) {
    console.log(req.body);
    User.register({ username: req.body.username, name: req.body.name }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.send(err.message);
        } else {
            User.find({ username: req.body.username }, (query_error, foundUser) => {
                console.log(foundUser);
            });
            passport.authenticate("local")(req, res, function () {
                console.log("redirecting to /home");
                res.redirect('/');  // only called if authentication successful. 
            });
        }
    });
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', successRedirect: '/'
}));


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Listening on port " + port);
});