const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema({
    title   : String,
    body   : String,
    tech   : String,
    author : {
        id : {
            type :mongoose.Schema.Types.ObjectId,
            ref : "User"
    }, name : String
},
comments: [
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Cmntidea"
    }
 ],
 likes : [
     {
         type : mongoose.Schema.Types.ObjectId,
         ref : "User"
     }
 ],
    createdAt : {type : Date,default : Date.now}
});



module.exports = mongoose.model("Idea",ideaSchema);