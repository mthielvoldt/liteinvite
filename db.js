const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


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
});

const Meetup = mongoose.model("meetup", meetupSchema);

module.exports = {
  User: User,
  Meetup: Meetup,
}