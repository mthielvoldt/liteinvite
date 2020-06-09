const db = require('./db');


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
  db.Meetup.findById(req.params.meetId, function (err, foundMeetup) {
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
  const emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
  return emailRegex.test(str);
}

function validName(str) {
  const nameRegex = /^[A-Za-z][A-Za-z\u00C0-\u00FF\'\-]+([\ A-Za-z][A-Za-z\u00C0-\u00FF\'\-]+)*/;
  return nameRegex.test(str);
}

function validPassword(str) {
  const passRegex = /^[!-~]{7,50}$/;
  return passRegex.test(str);
}

function getPartialGuestList(meetup) {
  // only respond with the guests that are going, and only provide their nicknames. 
  let guestListPartial = meetup.guests.filter((guest) => guest.status > 0);
  return guestListPartial.map((guest) => ({ name: guest.name, status: guest.status }));
}

module.exports = {
  logReq: logReq, 
  guestsEqual: guestsEqual,
  findMeetup: findMeetup,
  authFindMeetup: authFindMeetup,
  validEmail: validEmail,
  validName: validName,
  validPassword: validPassword,
  getPartialGuestList: getPartialGuestList,
}