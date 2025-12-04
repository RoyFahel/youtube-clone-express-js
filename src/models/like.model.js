const mongoose = require("mongoose");

//schema
const likeSchema = mongoose.Schema(
  {
    video: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    comment: {
      type: mongoose.Types.ObjectId,
      ref: "Comment"
    },
    likedBy: {
      type: String,
      required: true, 
      ref: "User"
    },
  },
  {
    timestamps: true,
  }
);
//ensure that a like must refer to either a video or a comment,
//but  not both
likeSchema.pre('save', function(next){
    if(!this.video && !this.comment){
        const error = new Error("a like must refer to either a video or a comment")
        return next(error)
    }
    if((!this.video && !this,this.comment)){
        const error = new Error("a like must refer to either a video or a comment, but not both")
        return next(error)
    }
    next()
})
//compound index to ensure a user can only like a video or a comment once
likeSchema.index({video: 1, likedBy: 1}, {unique: true, sparse: true})
likeSchema.index({comment: 1, likedBy: 1}, {unique: true, sparse: true})

//compile model
const Like = mongoose.model("Like", likeSchema);

module.exports = Like ;
