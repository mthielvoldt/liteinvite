if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
console.log("%s environment", process.env.NODE_ENV);

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const session = require("express-session");

const db = require('./db');
const passport = require('./passport');
const utils = require('./utils');
const mailer = require('./mailer');


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


const defaultImage = "pine-trees-under-starry-night-sky-1539225.jpg";


app.get('/', (req, res) => {
    utils.logReq(req);
    if (req.isAuthenticated()) {
        let user = req.user;

        db.Meetup.find({ _id: { $in: user.meetups } }, (err, foundMeetups) => {
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
    utils.logReq(req);
    res.render("login", { authenticated: false });
});

app.get('/logout', (req, res) => {
    utils.logReq(req);
    req.logout();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    utils.logReq(req);
    res.render("register", { authenticated: false });
});

app.get('/account', (req, res) => {
    utils.logReq(req);

    if (!req.isAuthenticated()) {
        res.status(401).render('login', { authenticated: false });
        return;
    }
    res.render('account', { message: "", authenticated: true });
});

app.get('/contact', (req, res) => {
    utils.logReq(req);

    res.render('contact', { message: "", authenticated: req.isAuthenticated() });
});

// The main edit page, for users that own the event only. 
app.get('/events/:meetId/edit', (req, res) => {
    utils.logReq(req);

    utils.authFindMeetup(req, res, (foundMeetup) => {
        res.render("edit", { meetup: foundMeetup, authenticated: true });
    });
});

// Get the event details 
app.get('/events/:meetId/details', (req, res) => {
    utils.logReq(req);

    utils.findMeetup(req, res, (foundMeetup) => {
        const { name, desc } = foundMeetup;
        //const details = Object.assign({}, foundMeetup, {});
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ name, desc }));
    });
});

// page for viewing event.  Does not require auth.  Optionally includes guest-id parameter. 
app.get('/events/:meetId', (req, res) => {
    utils.logReq(req);

    utils.findMeetup(req, res, (foundMeetup) => {

        // Read the guestId from the query string in url, then look up the guest's email
        let guestId = req.query.guest;
        let guestEmail = "";
        let guestName = "";
        if (guestId != null) {
            let guest = foundMeetup.guests.find((guest) => (guest._id.toString() === guestId));
            if (guest !== undefined) {
                guestEmail = guest.email;
                guestName = guest.name;
            }
        }
        res.render("event", { meetup: foundMeetup, guestEmail: guestEmail, guestName: guestName, authenticated: req.isAuthenticated() });
    });
});

// Gets the event's full guest-list, containing names, email and RSVP status.  Only accessible by event owner
app.get('/events/:meetId/guests-full', (req, res) => {
    utils.logReq(req);

    utils.authFindMeetup(req, res, (foundMeetup) => {
        res.json(foundMeetup.guests);
    });
});

// partial guest-list.  No auth required for this, just a valid event-id. 
app.get('/events/:meetId/guests', (req, res) => {
    utils.logReq(req);

    utils.findMeetup(req, res, (foundMeetup) => {

        let guestListPartial = utils.getPartialGuestList(foundMeetup)
        console.log("guests for this meet: " + JSON.stringify(guestListPartial));
        res.json(guestListPartial);
    });
});

// creates a new eventf
app.get('/create', (req, res) => {
    utils.logReq(req);
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    let user = req.user;
    let newMeetup = new db.Meetup({ owner: user._id, name: "", image: defaultImage });
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
    utils.logReq(req);

    utils.authFindMeetup(req, res, (foundMeetup) => {

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

            db.Meetup.findByIdAndDelete(meetId, (err, foundMeetup) => {
                res.redirect('/');
            });
        }
    });


});

app.get('/events/:meetId/invites', (req, res) => {
    utils.logReq(req);

    utils.authFindMeetup(req, res, (meetup) => {
        let eventName = meetup.name;
        let organizerName = req.user.name;
        let numSent = 0;

        meetup.guests.forEach(guest => {
            if (guest.sent === 0) {
                guest.sent = 1;
                numSent += 1;
                mailer.sendInvitation(meetup, guest, req.user.name)
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


app.get('/events/:meetId/comments', (req, res) => {
    utils.logReq(req);

    utils.findMeetup(req, res, (foundMeetup) => {
        res.json(prepComments(foundMeetup));
    });
});

app.post('/events/:meetId/comments', async (req, res) => {
    utils.logReq(req);
    console.log(req.body);

    // does req contain a name? 
    if (!req.body.name || req.body.name === "") {
        res.status(400).send("Please RSVP with your nickname before you comment");
        return;
    }

    const date = new Date();
    let newComment = {...req.body, 
        date: date.toLocaleDateString()};

    utils.findMeetup(req, res, (foundMeetup) => {
        foundMeetup.comments.push(newComment);
        foundMeetup.save( (err, meetup) => {
            res.json(prepComments(meetup));     // do this after save so we can get the new comment's ID. 
        });
    });
});

function prepComments(meetup) {
    return meetup.comments.map(
        (comment) => ({ name: comment.name, date: comment.date, text: comment.text, id: comment.id }));
}

///////////////////////////// POST routes follow //////////////////////////////

// organizer creates new guest associated with specified event.  
// Submitted as plain text containing only the email 
app.post('/events/:meetId/guests', function (req, res) {
    utils.logReq(req);

    utils.authFindMeetup(req, res, (meetup) => {
        let meetId = req.params.meetId;
        let newEmail = req.body.toString();     // comes in as text/plain.

        if (!utils.validEmail(newEmail)) {
            console.log("Invalid guest email address.")
            res.status(400).send("Invalid email address");
            return;
        }

        let newGuest = { email: newEmail, name: "", status: 0, sent: 0 };
        console.log("meetup.guests", meetup.guests, "newGuest:", newGuest);

        // if this guest is already present, don't add to the array. 
        if (meetup.guests.some((guest) => utils.guestsEqual(guest, newGuest))) {
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
    utils.logReq(req);
    console.log("\trequest body: ", req.body);
    let responseObj = { message: "", guestList: [] };

    // find the meetup
    utils.findMeetup(req, res, (foundMeetup) => {

        // validate every field we consume. 
        let sentGuest = filterFields(req.body);
        if (sentGuest == null) return;

        // include "sent" field if it isn't there. 
        sentGuest = Object.assign({ sent: 1 }, sentGuest);

        // does the meetup's guest list contain this email?
        let index = foundMeetup.guests.findIndex((guest) => (utils.guestsEqual(guest, sentGuest)));

        if (index > -1) {
            // yes: overwrite the fields of that element.  But do not overwrite the _id. 
            Object.assign(foundMeetup.guests[index], sentGuest);
            responseObj.message = "guest data updated.";
            res.status(200);
        } else {
            // no: push this new record.  
            foundMeetup.guests.push(sentGuest);
            responseObj.message = "new guest created.";
            res.status(201);
        }
        console.log("updated guest list: ", foundMeetup.guests);
        responseObj.guestList = utils.getPartialGuestList(foundMeetup);
        res.json(responseObj);
        foundMeetup.save();
    });

    // Read only certain fields from input object and validate each one. (object destructuring)
    function filterFields({ email, name, status }) {

        if (!utils.validEmail(email)) {
            res.status(400).send("Invalid email: guest not updated");
            return null;
        }
        if (!utils.validName(name)) {
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
    utils.logReq(req);

    utils.authFindMeetup(req, res, (foundMeetup) => {

        let guestToDelete = { email: req.params.email };

        // remove the guest with the indicated email.
        let newGuests = foundMeetup.guests.filter((guest) => !utils.guestsEqual(guest, guestToDelete));

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
    utils.logReq(req);

    utils.authFindMeetup(req, res, function (foundMeetup) {
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
    utils.logReq(req);
    upload.single('meetupImage')(req, res, function (err) {
        if (err) {
            console.log(err.message);
        }
        res.redirect('/events/' + req.params.meetId + '/edit');
    });
});

app.post('/register', (req, res) => {
    utils.logReq(req);

    //console.log(req.body); // this seems like a security issue. It prints the password.

    // validate the input fields.
    if (!utils.validName(req.body.name)) {
        res.status(400).send("Invalid name: user not created");
        return null;
    }
    if (!utils.validEmail(req.body.username)) {
        res.status(400).send("Invalid email: user not created");
        return null;
    }
    if (!utils.validPassword(req.body.password)) {
        res.status(400).send("Invalid password: user not created");
        return null;
    }

    db.User.register({ username: req.body.username, name: req.body.name }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.status(409).send(err.message);
        } else {
            db.User.find({ username: req.body.username }, (query_error, foundUser) => {
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
    utils.logReq(req);
    console.log(req.body);
    const wrongOldPass = '<strong>Current password incorrect.</strong>  Your password has not been changed.';
    const success = 'Password changed';


    if (!req.isAuthenticated()) {
        res.status(401).render('/login', { authenticated: false });
        return;
    }

    // check that the original password is correct.  
    // (user already authenticated, but make sure it's not just an old session or a CSRF attack.)
    req.user.changePassword(req.body.oldPass, req.body.newPass)
        .then(() => res.render('account', { alertType: "success", message: success, authenticated: true }))
        .catch(() => res.status(403).render('account', { alertType: "danger", message: wrongOldPass, authenticated: true }));
});

app.post('/name', (req, res) => {
    utils.logReq(req);
    console.log("req.body: ", req.body);
    const wrongOldPass = '<strong>Current password incorrect.</strong>  Your name has not been changed.';
    const invalidName = '<strong>Invalid name.</strong>  Your name has not been changed.';
    const success = '<strong>Success.</strong>  Your name has been changed.';

    if (!req.isAuthenticated()) {
        res.status(401).render('/login', { authenticated: false });
        return;
    }
    if (!utils.validName(req.body.name)) {
        res.status(403).render('account', { alertType: "danger", message: invalidName, authenticated: true });
        return;
    }

    req.user.authenticate(req.body.pass)
        .then(({ user }) => {
            if (!user) {
                console.log("Name change failure: incorrect password");
                res.status(403).render('account', { alertType: "danger", message: wrongOldPass, authenticated: true });
            } else {
                console.log("Name change success.");
                user.name = req.body.newName;
                user.save();
                res.render('account', { alertType: "success", message: success, authenticated: true })
            }
        });
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', successRedirect: '/'
}));

app.post('/contact', (req, res) => {
    utils.logReq(req);

    mailer.sendContactForm(req.body.from, req.body.subject, req.body.message)
        .then(info => {
            console.log('Message sent: %s', info.messageId);
            res.set('Access-Control-Allow-Origin', '*').render('contact-submitted', { authenticated: req.isAuthenticated() });
            // Preview only available when sending through an Ethereal account
            //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })
        .catch(err => {
            console.log('Email Error occurred. ' + err.message);
            res.status(400).send("Error sending message");
        })

});


exports = module.exports = app;