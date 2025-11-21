const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phnumber: { type: Number, required: true, unique: true }
});



const userModel=mongoose.model('userdetail',UserSchema)

module.exports=userModel