const axios = require("axios");
const jwt = require("jsonwebtoken");
const secrets = require("./secrets.js");
const bcrypt = require("bcryptjs");
const db = require("./userModel.js");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      userName: user.username
    },
    secrets.jwt,
    { expiresIn: "1h" }
  );
}

function register(req, res) {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 12);
  user.password = hash;

  db.add(user)
    .then(newUser => {
      const token = generateToken(newUser);
      console.log(token);

      res.status(201).json({ authToken: token });
    })
    .catch(err => {
      res.status(500).json({ message: "Please try again" });
    });
}

function login(req, res) {
  let { username, password } = req.body;

  db.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);

        res
          .status(201)
          .json({ message: `Welcome ${user.username}`, token: token });
      }
    });
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
