var mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
    title   : String,
    image   : String,
    price   : String,
    author : {
        id : {
            type :mongoose.Schema.Types.ObjectId,
            ref : "User"
    }, name : String
},
comments: [
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Cmntproduct"
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



module.exports = mongoose.model("Product",productSchema);