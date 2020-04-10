if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require('fs');

// user auth packages (3)
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
// tells express where files that are sent to the client live.  This is where we put styles.css and any client-side scripts.
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));   // lets us access body items with . notation (eg req.body.item)
app.use(express.json({ inflate: true, strict: true, type: 'application/json' }))
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

const meetupSchema = new Schema({
    name: String,
    owner: { type: ObjectId, required: true },
    desc: String,
    image: String,
    location: String,
    time: String,
    lists: [],
    guests: [{ name: String, email: String, status: Number }],
});

userSchema.plugin(passportLocalMongoose);   // use passport local mongoose to handle hashing and salting passwords

const Meetup = mongoose.model("meetup", meetupSchema);
const User = mongoose.model("User", userSchema);    // need "new"

passport.use(User.createStrategy());                // connect passport to the User collection (mongoose model)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

let message = "";
const defaultImage = "pine-trees-under-starry-night-sky-1539225.jpg";
const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log("Listening on port " + port);
});

app.get('/', function (req, res) {
    logReq(req);
    if (req.isAuthenticated()) {
        let user = req.user;

        Meetup.find({ _id: { $in: user.meetups } }, (err, foundMeetups) => {
            if (err) {
                console.log(err);
            }
            res.render("home", { user: user, meetups: foundMeetups });
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get('/login', function (req, res) {
    logReq(req);
    res.render("login");
});

app.get('/logout', function (req, res) {
    logReq(req);
    req.logout();
    res.redirect('/');
});

app.get('/register', function (req, res) {
    logReq(req);
    res.render("register");
});

// The main edit page, for users that own the event only. 
app.get('/events/:meetId/edit', function (req, res) {
    logReq(req);

    authFindMeetup(req, res, (foundMeetup)=> {
        res.render("edit", { meetup: foundMeetup, message: message });
        message = "";
    });
});

// Get the event details 
app.get('/events/:meetId/details', function (req, res) {
    logReq(req);
    Meetup.findById(req.params.meetId, (err, foundMeetup) => {
        if (err) { console.log(err); }
        if (foundMeetup == null) {
            console.log("couldn't find meetId: " + req.params.meetId)
            res.status(404).send("Coudn't find that event");    // not found. 
        } else {
            const {name, desc} = foundMeetup;
            //const details = Object.assign({}, foundMeetup, {});
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({name, desc}));
        }
    });
});

// page for viewing event.  Does not require auth.  Optionally includes guest-id parameter. 
app.get('/events/:meetId', function (req, res) {
    logReq(req);
    Meetup.findById(req.params.meetId, (err, foundMeetup) => {
        if (err) { console.log(err); }
        if (foundMeetup == null) {
            console.log("couldn't find meetId: " + req.params.meetId)
            res.sendStatus(404);    // not found. 
        } else {
            if (req.query.guestid == null) {
                res.render("event", { meetup: foundMeetup, message: message, guestEmail: "" });
                message = "";
            } else {
                console.log(req.query.guestid);
                res.sendStatus(200);
            }

        }
    });
});

// Gets the event's full guest-list, containing names, email and RSVP status.  Only accessible by event owner
app.get('/events/:meetId/guests-full', function (req, res) {
    logReq(req);
    if (!req.isAuthenticated()) {
        res.status(403).send("please sign in to view full guest-list");
        return;
    }

    Meetup.findById(req.params.meetId, function (err, foundMeetup) {
        if (err) console.log(err);

        if (foundMeetup == null) {
            res.status(404).send("sorry, I can't find that event.");
            return;
        }
        if (foundMeetup.owner.toString() !== req.user._id.toString()) {
            res.status(403).send("Only an event organizer can view the full guest list.")
            return;
        }

        console.log("guests for this meet: " + JSON.stringify(foundMeetup.guests));
        res.json(foundMeetup.guests);
    });
});

// partial guest-list.  No auth required for this, just a valid event-id. 
app.get('/events/:meetId/guests', function (req, res) {
    logReq(req);
    Meetup.findById(req.params.meetId, function (err, foundMeetup) {
        if (err) console.log(err);

        if (foundMeetup == null) {
            res.status(404).send("sorry, I can't find that event.");
            return;
        }

        // only respond with the guests that are going, and only provide their nicknames. 
        let guestListPartial = foundMeetup.guests.filter((guest) => guest.status > 0);
        guestListPartial = guestListPartial.map((guest) => ({ name: guest.name, status: guest.status }));

        console.log("guests for this meet: " + JSON.stringify(guestListPartial));
        res.json(guestListPartial);
    });
});

// creates a new event
app.get('/create', function (req, res) {
    logReq(req);
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    let user = req.user;
    // add user authentication

    let newMeetup = new Meetup({ owner: user._id, name: "", image: defaultImage });
    user.meetups.push(newMeetup._id);
    newMeetup.save();

    // use a promise to make sure the save is complete before redirecting. 
    user.save()
        .then(() => {
            console.log("Saved new meetup.")
            res.redirect('/events/' + newMeetup._id + '/edit');
        });
});

app.get('/delete/:meetId', function (req, res) {
    logReq(req);
    let meetId = req.params.meetId;
    let active_user = req.user;
    // remove the meetupId from the user's array of meetups. 
    let newMeetups = active_user.meetups.filter((value) => (value != meetId));

    if ((active_user.meetups.length - newMeetups.length) !== 1) {
        console.error("Meetup Deletion error");

    } else {
        console.log("Deleted 1 meetup: " + meetId);
        active_user.meetups = newMeetups;

        Meetup.findByIdAndDelete(meetId, (err, foundMeetup) => {
            res.redirect('/');
        });
    }
});

///////////////////////////// POST routes follow //////////////////////////////

// creates new guest associated with specified event. 
app.post('/events/:meetId/guests', function (req, res) {
    logReq(req);
    let meetId = req.params.meetId;
    let newGuest = req.body;
    res.send("create a new guest: " + JSON.stringify(newGuest) + " in event: " + meetId);

    Meetup.findById(req.params.meetId, function (err, meetup) {
        if (err) { console.log(err); }

        // if this guest is already present, don't add to the array. 
        if (meetup.guests.some((guest) => guestsEqual(guest, newGuest))) {
            console.log("guest already associated with this meetup.")
        } else {
            meetup.guests.push(newGuest);
            meetup.save();
            console.log("added guest to meetup");
        }
    });
});

// edit event details
app.put('/events/:meetId/details', function (req, res) {
    logReq(req);

    authFindMeetup(req,res, function(foundMeetup) {
        Object.assign(foundMeetup, req.body);
        foundMeetup.save();
        res.status(200).send("changes saved to event " + foundMeetup._id);
        
    });      // need to await this. 
});

// configure the upload to use the public/images dir and the meetId as the filename. 
const storage = multer.diskStorage( { destination: 'public/images/', filename: (req, file, cb) => {
    cb(null, req.params.meetId) } });
const upload = multer({ storage:storage, limits: { fileSize: 10000000, fieldNameSize: 1000 } });

app.post('/events/:meetId/image', function (req, res) {
    logReq(req);
    upload.single('meetupImage')(req, res, function (err) {
        if (err) {
            console.log(err.message);
            message = "Error: " + err.message;  // display this message
        } 
        res.redirect('/events/' + req.params.meetId + '/edit');
    });
});

// This is the event organizer adding guests. 
app.post('/events/:meetId/guests-save', upload.none(), function (req, res, next) {
    logReq(req);

    // add authentication check
    // add check that user owns this event. 

    // add this guest's ID  to the meetup's guest-list. (if it isn't there)
    Meetup.findById(req.params.meetId, function (err, meetup) {
        if (err) { console.log(err); }

        // if this guest is already present, don't add to the array. 
        if (meetup.guests.some((guest) => guestsEqual(guest, newGuest))) {
            console.log("guest already associated with this meetup.")
        } else {
            meetup.guests.push({ id: newGuest._id, status: 0 });    // XXX newGuest not defined
            meetup.save();
            console.log("added guest to meetup");
        }
    });

    // add this guest's ID  to the user's guest-list (if it isn't there)
    let active_user = req.user;

    if (active_user.guests.some((guest) => guestsEqual(guest, newGuest))) {
        console.log("guest already associated with this user.")
    } else {
        active_user.guests.push(newGuest);  //XXX newGuest not defined
        active_user.save();
        console.log("added guest to user")
    }
    res.status(200).send("guest saved");
});

app.post('/register', function (req, res) {
    logReq(req);

    //console.log(req.body); // this seems like a security issue. It prints the password.
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


///////////////////// Helper Functions ///////////////////////////////////

function logReq(req) {
    if (req.user == null) {
        console.log( req.method, req.url, ": no user" );
    } else {
        console.log( req.method, req.url, ":", req.user.name, ":", req.user._id);
    }
}

function guestsEqual(guestA, guestB) {
    return (
        guestA.name === guestB.name ||
        guestA.email === guestB.email
    );
}

function findMeetup(req,res,cb) {
    Meetup.findById(req.params.meetId, function (err, foundMeetup) {
        if (err) {
            console.log("ERROR  Error searching for meetup by Id.  meetID:" + req.params.meetId);
            console.log("message:  " + err.message); 
            console.log("reason:  " + err.reason);
            res.status(500).send("<h3>It's not you, it's us.</h3><p>We encountered an error while searching for that event.</p>");
            return null;
        }
        if (foundMeetup == null) {
            console.log("NOT-FOUND  Meetup not found: " + req.params.meetId);
            res.status(404).send("sorry, we can't find that event.");
            return null;
        }
        cb(foundMeetup);
    });
}

// checks user is authenticated, finds event, checks that user owns event. 
function authFindMeetup(req, res, cb) {   

    if (!req.isAuthenticated()) {
        console.log("NO-AUTH  user not authenticated.");
        res.status(401).render('login');
        return null;
    } else {
        findMeetup(req,res,(foundMeetup)=> {
            if (foundMeetup.owner.toString() !== req.user._id.toString()) {
                console.log("*FORBIDDEN*  User does not own the meetup user:" + req.user._id + " meetId:" + req.params.meetId);
                res.status(403).send('<h3>Forbidden</h3><p>Did you maybe sign in as a different user in another tab?</p><a href="/">Home</a>');
                return null;
            } else {
                cb(foundMeetup);
            }
        });
    }
}