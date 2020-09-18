const mongoose = require("mongoose");
 
const cmntProductSchema = new mongoose.Schema({
   text: String,
   createdAt : {type : Date,default : Date.now},
   author: {
       id : {
           type : mongoose.Schema.Types.ObjectId,
           ref : "User"
       },
       username : String,
       email : String
   }
    
});
 
module.exports = mongoose.model("Cmntproduct", cmntProductSchema);