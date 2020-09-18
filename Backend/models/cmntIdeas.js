const mongoose = require("mongoose");
 
const cmntIdeaSchema = new mongoose.Schema({
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
 
module.exports = mongoose.model("Cmntidea", cmntIdeaSchema);