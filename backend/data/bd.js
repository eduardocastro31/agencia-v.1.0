// Base de datos 
const {MongoClient, ServerApiVersion, Int32} = require("mongodb");
const { MONGODB_USR, MONGODB_PWD } =  require("../config.js");
const uri = "mongodb+srv://"+MONGODB_USR+":"+MONGODB_PWD+"@bd.m0u45gc.mongodb.net/?retryWrites=true&w=majority&appName=bd"


const client = new MongoClient(uri, {
  serverApi: {
   version: ServerApiVersion.v1,
   strict: true,
   deprecationErrors: true,
  },
});
const bd = client.db("basedatos");
const users = bd.collection("data_users");

async function run() {

  try {

    // Conecta el cliente al servidor
    await client.connect();
    // Envia un ping para confirmar una conexión exitosa
    await client.db("admin").command({ ping: 1 });
    console.log("Conexion a MongoDB exitosa !");
  } catch (error) {
    // Asegura que el cliente se cerrará cuando de error
    await client.close();
    console.log("No se pudo conectar al servidor, error: ", error);
  }
}


//Exporto la coleccion "personas" y en cliente de Mongodb
module.exports = {users,run};

