const { MongoClient, ServerApiVersion, Int32 } = require("mongodb");
require("dotenv").config();
const users = require("../data/bd.js").users;
const bd = require("../data/bd.js");

const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const path = require("path");
const ejs = require("ejs");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const { decode } = require("punycode/");
const SECRET_KEY = process.env.JWT_SECRET || "secretkey";
const ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET || "secretkey";
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "secretkey";

//Pasar de http a https
const https = require("https");

const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const rateLimit = require("express-rate-limit");

//use

app.use(express.text());
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use("../frontend/public", express.static("public"));

//set
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

bd.run();

const options = {
  key: fs.readFileSync(
    "C:/Users/Eduardo/dev/pweb-3/tp-fullStack/backend/server.key"
  ),
  cert: fs.readFileSync(
    "C:/Users/Eduardo/dev/pweb-3/tp-fullStack/backend/server.cert"
  ),
};


////// LOGS EN CONSOLA //////
app.use(morgan('combined'))


const cors_options = {
  origin: ["http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(cors_options));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("inicio");
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];// Bearer (token)
  if (!token) return res.status(403).json({ message: "Token requerido" });
  
  jwt.verify(token.split(" ")[1], ACCESS_SECRET_KEY || SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });

    req.user = decoded; // Guarda la info del usuario en la request
    next();
  });
};


function lastId() {
  return users
    .find()
    .map(function (p) {
      return p.userId;
    })
    .toArray();
}


// RBAC (Roles)

// Middleware para verificar roles
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }
    next();
  };
};

//     -USO DE JWT -    //
let refreshTokens = [];

// Ruta de login
app.post("/login", async (req, res) => {

  const {email, password  } = req.body;
  const user = await users.findOne({ email: email });

  if (email === user.email && password === user.password) {
    // Generar Token
      const accessToken = jwt.sign({ id: user.id, username: user.username }, ACCESS_SECRET_KEY, {
      expiresIn: "1m",
    });

    const refreshToken = jwt.sign(user, REFRESH_SECRET_KEY);
    // Guardar el refresh token (en un entorno real, usar BD)
    refreshTokens.push(refreshToken);

    // Enviar el Refresh Token en una cookie HTTP-only
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax', 
      path: '/', 
      maxAge: 1000 * 60 * 60 * 24 * 4 // 4 días
    });

    res.json({ accessToken: accessToken });

  } else {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }
});

//refresh token
app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log(`EL REFRESH_TOKEN QUE MANDA EL FRONT ES: ${refreshToken}`)
  if (!refreshToken) return res.status(401).json({ error: "No autorizado" });

  // Verificar si el refresh token es válido
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: "Refresh Token inválido" });
  }

  jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    // Generar un nuevo Access Token
    const accessToken = jwt.sign({ id: user.id, username: user.username }, ACCESS_SECRET_KEY, {
      expiresIn: "15m",
    });
    res.json({ accessToken:accessToken });
  });
});



//Registrar usuario
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  const newUser = await users.insertOne({
    userId: (await lastId()).at(-1) + 1,
    username: username,
    email: email,
    password: password,
    role: role,
  });
if(newUser){
  console.log("Usuario agregado")
  res.json({ message : "Nuevo usuario Agregado"});
}
  else {
    return res.status(401).json({ error: "No se agrego usuario" });
  }
});

// Ruta protegida solo para administrador
app.get("/admin", verifyToken, authorizeRole(["admin"]), (req, res) => {
  res.json({ message: "Bienvenido, Administrador" });
});

// Ruta protegida para empleador y administrador
app.get("/employer", verifyToken, authorizeRole(["employer", "admin"]),
  (req, res) => {
    res.json({
      message: `Bienvenido, ${req.user.username} a seccion de Empleador`,
    });
  }
);

// Ruta accesible para cualquier usuario autenticado
app.get("/profile", verifyToken, async (req, res) => { 
  res.json({ user: await users.findOne({ username: req.user.username }) });

});

//      BUENAS PRACTICAS
//        -SANITIZAR-
app.post("/description-profile",body("descripcion").isString().trim(),(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array() });

    const description = sanitizeHtml(req.body.descripcion);
    res.send({ message: "Descripcion Segura :", description });
  }
);

//    -VALIDAR CARACTERES A MANO-
app.post("/my-data", (req, res) => {
  const datos = req.body.datos;

  if (!/^[a-zA-Z0-9\s]+$/.test(datos)) {
    return res.status(400).send("Entrada Invalida");
  }
  res.send({ mensaje: "Entrada Valida", datos });
});

//   -LIMITADOR-
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 3, // maximo peticiones por IP
  message: "Demasiados mensajes, intente otra vez mas tarde",
});

app.use("/mensajes", limiter);

app.get("/mensajes", (req, res) => {
  res.json({ titulo: "Enviar mensaje" });
});

app.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No autorizado" });

  // Eliminar el token de la "base de datos"
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

  // Eliminar la cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  res.json({ message: "Sesión cerrada" });
});

app.listen(PORT);
console.log("Escuchando en puerto", PORT);