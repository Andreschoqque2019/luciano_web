const bcrypt = require("bcryptjs");
const { getDb } = require("../Config/db");

const SALT_ROUNDS = 10;

function safeUser(doc) {
  if (!doc) return null;
  const { password, ...rest } = doc;
  return rest;
}

async function createUser({ name, email, password }) {
  const db = getDb();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    balance: 0,
    createdAt: new Date(),
  };

  const result = await db.collection("users").insertOne(user);
  return safeUser({ ...user, _id: result.insertedId });
}

async function findUserByEmail(email) {
  const db = getDb();
  const user = await db.collection("users").findOne({ email: email.toLowerCase() });
  return user;
}

async function updateBalance(email, newBalance) {
  const db = getDb();
  await db
    .collection("users")
    .updateOne({ email: email.toLowerCase() }, { $set: { balance: newBalance } });
}

async function getUserByEmail(email) {
  const db = getDb();
  const user = await db.collection("users").findOne({ email: email.toLowerCase() });
  return safeUser(user);
}

module.exports = { createUser, findUserByEmail, updateBalance, getUserByEmail };
