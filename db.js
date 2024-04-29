const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


// Creates a new db if it is not already there.  Requires mongod to be running.
let dbName = 'LiteInvite';
let connected = false;
let dbHost;
switch (process.env.NODE_ENV) {
  case 'local':
    dbHost = '127.0.0.1';
    break;
  default:
    dbHost = 'li_db';
}

function connect() {
  if (connected) {
    console.log("db already connected.");
    return Promise.resolve(this);
  }
  connected = true; 
  console.log('connecting to db:', dbName, 'on host:', dbHost);
  return (
    mongoose.connect(`mongodb://${dbHost}:27017/${dbName}`,
      { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  );
}

function disconnect() {
  connected = false;
  console.log("disconnecting from database");
  return mongoose.disconnect();
}

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  meetups: [ObjectId],
  guests: [ObjectId],
});

userSchema.plugin(passportLocalMongoose);   // use passport local mongoose to handle hashing and salting passwords
const User = mongoose.model("User", userSchema);    // need "new"


const meetupSchema = new Schema({
  name: String,
  owner: { type: ObjectId, required: true },
  desc: String,
  image: String,
  location: String,
  time: String,
  lists: [],
  guests: [{ name: String, email: String, sent: Number, status: Number }],
  comments: [{ name: String, email: String, date: String, text: String }]
});

const Meetup = mongoose.model("meetup", meetupSchema);

module.exports = {
  User,
  Meetup,
  connect,
  disconnect,
}