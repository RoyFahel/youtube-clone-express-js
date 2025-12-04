const mongoose = require("mongoose");

//schema
const subscriptionSchema = mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
//compund index to ensure a user can only subscribe to a channel once
subscriptionSchema.index({subscriber: 1, channel: 1, },{unique: true})

//compile model
const Subscriber = mongoose.model("Subscriber", subscriptionSchema);

module.exports = Subscriber;
