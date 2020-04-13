if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const nodemailer = require("nodemailer");

// user auth packages (3)
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
// tells express where files that are sent to the client live.  This is where we put styles.css and any client-side scripts.
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));   // lets us access body items with . notation (eg req.body.item)
app.use(bodyParser.text({ type: "text/plain" }));
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
    guests: [{ name: String, email: String, sent: Number, status: Number }],
});

userSchema.plugin(passportLocalMongoose);   // use passport local mongoose to handle hashing and salting passwords

const Meetup = mongoose.model("meetup", meetupSchema);
const User = mongoose.model("User", userSchema);    // need "new"

passport.use(User.createStrategy());                // connect passport to the User collection (mongoose model)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const defaultImage = "pine-trees-under-starry-night-sky-1539225.jpg";
const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log("Listening on port " + port);
});

app.get('/', (req, res) => {
    logReq(req);
    if (req.isAuthenticated()) {
        let user = req.user;

        Meetup.find({ _id: { $in: user.meetups } }, (err, foundMeetups) => {
            if (err) {
                console.log(err);
            }
            res.render("home", { user: user, meetups: foundMeetups, authenticated: true });
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get('/login', (req, res) => {
    logReq(req);
    res.render("login", { authenticated: false });
});

app.get('/logout', (req, res) => {
    logReq(req);
    req.logout();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    logReq(req);
    res.render("register", { authenticated: false });
});

app.get('/account', (req, res) => {
    logReq(req);

    if (!req.isAuthenticated()) {
        res.status(401).render('/login', { authenticated: false });
        return;
    }
    res.render('account', { message: "", authenticated: true });
});

app.get('/contact', (req, res) => {
    logReq(req);

    res.render('contact', { message: "", authenticated: req.isAuthenticated() });
});

// The main edit page, for users that own the event only. 
app.get('/events/:meetId/edit', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, (foundMeetup) => {
        res.render("edit", { meetup: foundMeetup, authenticated: true });
    });
});

// Get the event details 
app.get('/events/:meetId/details', (req, res) => {
    logReq(req);

    findMeetup(req, res, (foundMeetup) => {
        const { name, desc } = foundMeetup;
        //const details = Object.assign({}, foundMeetup, {});
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ name, desc }));
    });
});

// page for viewing event.  Does not require auth.  Optionally includes guest-id parameter. 
app.get('/events/:meetId', (req, res) => {
    logReq(req);

    findMeetup(req, res, (foundMeetup) => {

        // Read the guestId from the query string in url, then look up the guest's email
        let guestId = req.query.guest;
        let guestEmail = "";
        if (guestId != null) {
            let guest = foundMeetup.guests.find((guest) => (guest._id.toString() === guestId));
            if (guest !== undefined) guestEmail = guest.email;   // crash here after changing status.
        }
        res.render("event", { meetup: foundMeetup, guestEmail: guestEmail, authenticated: req.isAuthenticated() });
    });
});

// Gets the event's full guest-list, containing names, email and RSVP status.  Only accessible by event owner
app.get('/events/:meetId/guests-full', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, (foundMeetup) => {
        res.json(foundMeetup.guests);
    });
});

// partial guest-list.  No auth required for this, just a valid event-id. 
app.get('/events/:meetId/guests', (req, res) => {
    logReq(req);

    findMeetup(req, res, (foundMeetup) => {
        // only respond with the guests that are going, and only provide their nicknames. 
        let guestListPartial = foundMeetup.guests.filter((guest) => guest.status > 0);
        guestListPartial = guestListPartial.map((guest) => ({ name: guest.name, status: guest.status }));

        console.log("guests for this meet: " + JSON.stringify(guestListPartial));
        res.json(guestListPartial);
    });
});

// creates a new event
app.get('/create', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    let user = req.user;
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

app.get('/events/:meetId/delete', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, (foundMeetup) => {

        let meetId = req.params.meetId;
        let user = req.user;

        // remove the meetupId from the user's array of meetups. 
        let newMeetups = user.meetups.filter((value) => (value != meetId));

        if ((user.meetups.length - newMeetups.length) !== 1) {
            console.error("Meetup Deletion error");

        } else {
            console.log("Deleted 1 meetup: " + meetId);
            user.meetups = newMeetups;
            user.save();

            Meetup.findByIdAndDelete(meetId, (err, foundMeetup) => {
                res.redirect('/');
            });
        }
    });


});

app.get('/events/:meetId/invites', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, (meetup) => {
        let eventName = meetup.name;
        let organizerName = req.user.name;
        let numSent = 0;

        meetup.guests.forEach(guest => {
            if (guest.sent === 0) {
                guest.sent = 1;
                numSent += 1;

                let eventUrl = "https://liteinvite.com/events/" + meetup._id + "?guest=" + guest._id;

                let subjectString = "Invitation to " +req.user.name+ "'s event";

                let textString = "Dear " +guest.name+ ",\n" 
                    +req.user.name+ " cordially invites you to: " +meetup.name+ 
                    "\nTo see details and RSVP, visit: " +eventUrl;

                let htmlString = "<h3>Dear " +guest.name+ ",</h3><p>" 
                    +req.user.name+ " cordially invites you to: " +meetup.name+ 
                    "</p><p>To see details and RSVP: <a href='" +eventUrl+ "'>View Invitation</a>";

                let idString = "from: " +req.user.username+ " to: " +guest.email+ " re: " +meetup.name;

                let message = {
                    from: '"invitations" <invitations@liteinvite.com>',
                    replyTo: req.user.username,
                    to: guest.email,
                    subject: subjectString,
                    text: textString,
                    html: htmlString,
                    dsn: {
                        id: idString,
                        return: 'headers',
                        notify: ['success', 'failure', 'delay'],
                        recipient: 'mthielvoldt@gmail.com'
                    }
                }

                liveTransporter.sendMail(message, (err, info) => {
                    if (err) {
                        console.log('Error occurred. ' + err.message);
                        return process.exit(1);
                    }

                    console.log('Message sent: %s', info.messageId);
                    // Preview only available when sending through an Ethereal account
                    //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
            }
        });
        // update the "sent" values to reflect emails sent. 
        meetup.save();  

        if (numSent == 0) {
            res.status(204).send(numSent + " Emails sent");
        } else {
            res.send(numSent + " Emails sent");
        }
    });
});

///////////////////////////// POST routes follow //////////////////////////////

// organizer creates new guest associated with specified event.  
// Submitted as plain text containing only the email 
app.post('/events/:meetId/guests', function (req, res) {
    logReq(req);

    authFindMeetup(req, res, (meetup) => {
        let meetId = req.params.meetId;
        let newEmail = req.body.toString();     // comes in as text/plain.

        if (!validEmail(newEmail)) {
            console.log("Invalid guest email address.")
            res.status(400).send("Invalid email address");
            return;
        }

        let newGuest = { email: newEmail, name: "", status: 0, sent: 0 };
        console.log("meetup.guests", meetup.guests, "newGuest:", newGuest);

        // if this guest is already present, don't add to the array. 
        if (meetup.guests.some((guest) => guestsEqual(guest, newGuest))) {
            console.log("guest already associated with this meetup.")
            res.status(200).send("Guest already associated with this meetup.  User not created.");
        } else {
            meetup.guests.push(newGuest);
            meetup.save();
            console.log("added guest to meetup");
            res.status(201).send("created a new guest: " + JSON.stringify(newGuest) + " in event: " + meetId);
        }
    });
});

// Guest submitting their RSVP and nickname. 
app.put('/events/:meetId/guests', (req, res) => {
    logReq(req);
    console.log("\trequest body: ", req.body);

    // find the meetup
    findMeetup(req, res, (foundMeetup) => {

        // validate every field we consume. 
        let sentGuest = filterFields(req.body);
        if (sentGuest == null) return;
        
        // include "sent" field if it isn't there. 
        sentGuest = Object.assign({ sent: 1 }, sentGuest); 

        // does the meetup's guest list conain this email?
        let index = foundMeetup.guests.findIndex((guest) => (guestsEqual(guest, sentGuest)));

        if (index > -1) {
            // yes: overwrite the fields of that element.  But do not overwrite the _id. 
            Object.assign(foundMeetup.guests[index], sentGuest);
            res.status(200).send("guest data updated.");
        } else {
            // no: push this new record.  
            foundMeetup.guests.push(sentGuest);
            res.status(201).send("new guest created.");
        }
        console.log("updated guest list: ", foundMeetup.guests);
        foundMeetup.save();
    });

    // Read only certain fields from input object and validate each one. (object destructuring)
    function filterFields({ email, name, status }) {
        const rxName = /^[A-Za-z][A-Za-z\u00C0-\u00FF\'\-]+([\ A-Za-z][A-Za-z\u00C0-\u00FF\'\-]+)*/;

        if (!validEmail(email)) {
            res.status(400).send("Invalid email: guest not updated");
            return null;
        }
        if (!rxName.test(name)) {
            res.status(400).send("Invalid name: guest not updated");
            return null;
        }
        if ((status !== -1) && (status !== 0) && (status !== 1) && (status !== 2)) {
            res.status(400).send("Invalid 'status' field: guest not updated");
            return null;
        }
        return { email, name, status };
    }
});

app.delete('/events/:meetId/guests/:email', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, (foundMeetup) => {

        let guestToDelete = { email: req.params.email };

        // remove the guest with the indicated email.
        let newGuests = foundMeetup.guests.filter((guest) => !guestsEqual(guest, guestToDelete));

        if ((foundMeetup.guests.length - newGuests.length) !== 1) {
            res.status(404).send("That guest was not found.  Nothing deleted.");
            return;
        } else {
            foundMeetup.guests = newGuests;
            foundMeetup.save();
            res.status(200).send("Guest deleted: " + req.params.email);
        }
    });
});

// edit event details
app.put('/events/:meetId/details', (req, res) => {
    logReq(req);

    authFindMeetup(req, res, function (foundMeetup) {
        Object.assign(foundMeetup, req.body);
        foundMeetup.save();
        res.status(200).send("changes saved to event " + foundMeetup._id);

    });      // need to await this. 
});

// configure the upload to use the public/images dir and the meetId as the filename. 
const storage = multer.diskStorage({
    destination: 'public/images/', filename: (req, file, cb) => {
        cb(null, req.params.meetId)
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 10000000, fieldNameSize: 1000 } });

app.post('/events/:meetId/image', (req, res) => {
    logReq(req);
    upload.single('meetupImage')(req, res, function (err) {
        if (err) {
            console.log(err.message);
        }
        res.redirect('/events/' + req.params.meetId + '/edit');
    });
});

app.post('/register', (req, res) => {
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

app.post('/password', (req, res) => {
    logReq(req);
    console.log(req.body);
    const wrongOldPass = '<div class="alert alert-warning" role="alert">Current password Incorrect</div>';
    const success = '<div class="alert alert-success" role="alert">Password changed</div>';


    if (!req.isAuthenticated()) {
        res.status(401).render('/login', { authenticated: false });
        return;
    }

    // check that the original password is correct.  
    // (user already authenticated, but make sure it's not just an old session.)
    req.user.changePassword(req.body.oldPass, req.body.newPass)
        .then(() => res.render('account', { message: success, authenticated: true }))
        .catch(() => res.status(403).render('account', { message: wrongOldPass, authenticated: true }));
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', successRedirect: '/'
}));

app.post('/contact', (req, res) => {
    logReq(req);

    let message = {
        from: 'invitations@liteinvite.com',
        replyTo: req.body.from,
        to: "mthielvoldt@gmail.com",
        subject: req.body.subject,
        text: req.body.message,
        dsn: {
            id: req.body.subject,
            return: 'headers',
            notify: ['success', 'failure', 'delay'],
            recipient: 'mthielvoldt@gmail.com'
        }
    };
    liveTransporter.sendMail(message, (err, info) => {
        if (err) {
            console.log('Email Error occurred. ' + err.message);
            return;// process.exit(1);
        } else {
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.render('contact-submitted', {authenticated: req.isAuthenticated()});
        }
    });
});

///////////////////// Helper Functions ///////////////////////////////////

function logReq(req) {
    if (req.user == null) {
        console.log(req.method, req.url, ": no user");
    } else {
        console.log(req.method, req.url, ":", req.user.name, ":", req.user._id);
    }
}

function guestsEqual(guestA, guestB) {
    return (
        //guestA.name === guestB.name ||
        guestA.email === guestB.email
    );
}

function findMeetup(req, res, cb) {
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
        res.status(401).render('login', { authenticated: false });
        return null;
    } else {
        findMeetup(req, res, (foundMeetup) => {
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

function validEmail(str) {
    let emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    return emailRegex.test(str);
}

/////////////////// Email Functions ///////////////////////////////////



const liveTransportOpts = {
    host: "mail.name.com",
    port: 465,
    secure: true,
    auth: {
        user: "invitations@liteinvite.com",
        pass: process.env.EMAIL_PASS
    }
}
const testTransportOpts = {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'xi6jql37mss4srk2@ethereal.email',
        pass: 'xhgmFb3HMfRM3mpw1Q'
    }
}
const liveTransporter = nodemailer.createTransport(liveTransportOpts)
const testTransporter = nodemailer.createTransport(testTransportOpts);






