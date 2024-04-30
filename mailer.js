const nodemailer = require("nodemailer");
const utils = require('./utils');

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
    pass: process.env.ETHERIAL_PASS
  }
}
const liveTransporter = nodemailer.createTransport(liveTransportOpts);
const testTransporter = nodemailer.createTransport(testTransportOpts);
const transporter = liveTransporter;



function sendInvitation(meetup, guest, sender) {
  const eventUrl = utils.getGuestsEventURL(meetup, guest);

  let subjectString = "Invitation to " + sender.name + "'s event";

  let textSalutation = "Hello, \n";
  let htmlSalutation = "<p>Hello,</p>"
  if (guest.name.length > 0) {
    textSalutation = "Dear " + guest.name + ",\n";
    htmlSalutation = "<h3>Dear " + guest.name + ",</h3><p>";
  }

  let textString = textSalutation +
    sender.name + " cordially invites you to: " + meetup.name +
    "\nTo see details and RSVP, visit: " + eventUrl;

  let htmlString = htmlSalutation +
    sender.name + " cordially invites you to: " + meetup.name +
    "</p><p>To see details and RSVP: <a href='" + eventUrl + "'>View Invitation</a>";

  let idString = "from: " + sender.username + " to: " + guest.email + " re: " + meetup.name;

  let message = {
    from: '"invitations" <invitations@liteinvite.com>',
    replyTo: sender.username,
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

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log('Error occurred. ' + err.message);
      return process.exit(1);
    }

    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  });
}

function sendContactForm(from, subject, message) {
  let sendData = {
    from: 'invitations@liteinvite.com',
    replyTo: from,
    to: "mthielvoldt@gmail.com",
    subject: subject,
    text: message,
    dsn: {
      id: subject,
      return: 'headers',
      notify: ['success', 'failure', 'delay'],
      recipient: 'mthielvoldt@gmail.com'
    }
  };
  return transporter.sendMail(sendData);
}


module.exports = {
  sendInvitation: sendInvitation,
  sendContactForm: sendContactForm,
}