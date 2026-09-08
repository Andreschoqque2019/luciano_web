const { MongoClient } = require("mongodb");

require("dotenv").config();

const url_mongodb = process.env.URL_MONGO_DB;

if (!url_mongodb) {
  throw new Error("URL_MONGO_DB is not defined in environment variables");
}

const db_name = process.env.DB_NAME || "Perfume_web";

// Vercel serverless: reuse connection across invocations via global cache
// Mantiene compatibilidad local (global existe siempre en Node)
let client;
let database;

if (!global._mongoClient) {
  global._mongoClient = new MongoClient(url_mongodb);
}
client = global._mongoClient;

// Reuse cached database instance if available
if (global._mongoDb) {
  database = global._mongoDb;
}

async function Conexion_Mongodb() {
  // Reutilizar conexión existente si ya está disponible
  if (database) {
    return database;
  }
  if (global._mongoDb) {
    database = global._mongoDb;
    return database;
  }

  try {
    await client.connect();

    database = client.db(db_name);
    global._mongoDb = database;

    await Promise.all([
      database.collection("users").createIndex({ email: 1 }, { unique: true }),
      database.collection("perfumes").createIndex({ userId: 1 }),
      database.collection("desodorante").createIndex({ userId: 1 }),
      database.collection("Solicitudes").createIndex({ pais: 1 }),
      database.collection("Solicitudes").createIndex({ tipo: 1 }),
      database.collection("Solicitudes").createIndex({ createdAt: -1 }),
    ]);
    console.log("CONEXION CON MONGODB EXITOSA");

    return database;
  } catch (error) {
    console.error("ERROR AL CONECTAR CON MONGODB:", error.message);
    throw error;
  }
}

function getDb() {
  if (database) {
    return database;
  }
  if (global._mongoDb) {
    database = global._mongoDb;
    return database;
  }
  throw new Error("CONEXION CON MONGODB NO ENCONTRADA");
}

module.exports = { Conexion_Mongodb, client, getDb };
