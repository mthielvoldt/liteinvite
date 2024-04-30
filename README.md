<p align="center">
  <a href="https://liteinvite.com/">
    <img src="https://liteinvite.com/images/LiteInvite192.png" alt="LiteInvite logo" width="92" height="96">
  </a>
</p>

<h3 align="center">LiteInvite</h3>

<p align="center">
  A minimalist and flexible (RESTful) app for organizing events 
  <br>
</p>

## Table of Contents

- [Introduction](#introduction)
- [State of Development](#state-of-development)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Tech](#tech)
- [Creators](#creators)
- [Thanks](#thanks)
- [Copyright and license](#copyright-and-license)


## Introduction

LiteInvite focuses on striking a balance between organizer control and guest participation.  For example, event organizers enter a guest's email to send an invitation, but guests get to choose how their name will appear on the guest list before any of the other guests will see it.  

### Using LiteInvite as a guest
- You do not need to have an account to use LiteInvite as a guest.  
- Invitation emails contain links to the event page.
- Anyone with an event link can RSVP to the event; you do not have to be the original recipient.
- By sharing the link, guests can permit +1's to add their names to the guest list if they so choose. 

### Using LiteInvite as an event organizer
- An account is required to create events.
- Presently, all event details are controlled by the event creator.  This will soon change, pending new features. 

## State of Development

LiteInvite is embracing the release-early model.  This is <strong>publically-avaliable alpha software</strong>, which means users should not expect at this time that the site will be reliably available, or that their data will not be lost.  At present, there are known user-flow and UI [issues](https://github.com/mthielvoldt/liteinvite/issues). 

## Bugs and Feature Requests

Please submit bugs and feature requests.  That is all. 

## Tech

The API attempts to be RESTful.

I use server-side rendering with EJS, and also use React.  I do not use WebPack or any other tools commonly paired with React.  In creating, I wanted to learn what React is in isolation, apart from its normal ecosystem(s). 

### Back end stack: 

- Nodejs
- Express
- MongoDB
- Mongoose
- Multer
- Passport
- Nodemailer
- passport-local-mongoose

### Server-side rendering
- EJS

### Front end:
- Bootstrap
- React
- Babel

Currently, liteinvite.com is hosted on a personal server running Ubuntu and Nginx.

## Creators 

[Mike Thielvoldt](https://www.linkedin.com/in/mike-thielvoldt/) is an ex-mechanical engineer turned coder and is looking for work. 

## Thanks 

Thanks to all who contributed to the software components in use.  You people are amazing. \
Jane Huang - for your guidance and patience. \
[Angela Yu](https://www.appbrewery.co/courses/author/26789) - for making a great udemy course

## Copyright and License

Code and documentation copyright 2020 - Mike Thielvoldt.  Code released under the [MIT License](https://github.com/mthielvoldt/liteinvite/blob/master/LICENSE.txt). Docs released under [Creative Commons](https://creativecommons.org/licenses/by/3.0/).

