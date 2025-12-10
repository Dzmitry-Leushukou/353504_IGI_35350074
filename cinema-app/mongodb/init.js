db.createUser({
  user: "cinema_user",
  pwd: "cinema_password",
  roles: [
    {
      role: "readWrite",
      db: "cinema_db"
    }
  ]
});

db.createCollection("users");
db.createCollection("movies");
db.createCollection("orders");
db.createCollection("sessions");