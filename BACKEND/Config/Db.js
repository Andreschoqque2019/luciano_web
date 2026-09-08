const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.URL_MONGO_DB);
    console.log("MongoDB conectado correctamente");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
