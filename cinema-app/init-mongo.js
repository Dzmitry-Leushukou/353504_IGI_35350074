db = db.getSiblingDB('cinema-app');

// Создаем пользователя для приложения
db.createUser({
  user: 'cinema_user',
  pwd: 'cinema_password',
  roles: [
    {
      role: 'readWrite',
      db: 'cinema-app'
    }
  ]
});

// Добавляем тестовые фильмы
db.movies.insertMany([
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    duration: 148,
    genre: ["Sci-Fi", "Action", "Thriller"],
    releaseDate: new Date("2010-07-16"),
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
    rating: 8.8,
    posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
    // trailerUrl removed as trailers are now stored as binary data in the database
    language: "English",
    country: "USA",
    ageRating: "PG-13",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    duration: 142,
    genre: ["Drama"],
    releaseDate: new Date("1994-09-23"),
    director: "Frank Darabont",
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    rating: 9.3,
    posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEN77iU1jYKEuG-digs5HX33Djubot6xZrTqEAB3a99lUxLFA0OWy_B2MaAW43fMm70_FxJLhp7eTysZd3UytYrExJww6sctT_6_Zu6Z4&s=10",
    // trailerUrl removed as trailers are now stored as binary data in the database
    language: "English",
    country: "USA",
    ageRating: "R",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    duration: 152,
    genre: ["Action", "Crime", "Drama"],
    releaseDate: new Date("2008-07-18"),
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    rating: 9.0,
    posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxVufRf2AEAOGH6YSWuPv15A8nHni6ZbA_0Nfk67l-FSYUFwmi7gwb743q46HS0nI8zyHpXId6iVoLKS6cZU3lRAfvJoGVppXqpp0x_w&s=10",
    // trailerUrl removed as trailers are now stored as binary data in the database
    language: "English",
    country: "USA",
    ageRating: "PG-13",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
 {
    title: "Pulp Fiction",
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    duration: 154,
    genre: ["Crime", "Drama"],
    releaseDate: new Date("1994-10-14"),
    director: "Quentin Tarantino",
    cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
    rating: 8.9,
    posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTluJGCii2PdGqKea3UdlxcPzcdYwUSzUGjxYRI5Is7UpRGfUxidTVJOs1lSuzfSUbPO3FDXfseN0zCtL49BR4IyE1jHc6XcoOylaEdYg&s=10",
    // trailerUrl removed as trailers are now stored as binary data in the database
    language: "English",
    country: "USA",
    ageRating: "R",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Forrest Gump",
    description: "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.",
    duration: 142,
    genre: ["Drama", "Romance"],
    releaseDate: new Date("1994-07-06"),
    director: "Robert Zemeckis",
    cast: ["Tom Hanks", "Robin Wright", "Gary Sinise"],
    rating: 8.8,
    posterUrl: "https://m.media-amazon.com/images/I/91++WV6FP4L._AC_SL1500_.jpg",
    // trailerUrl removed as trailers are now stored as binary data in the database
    language: "English",
    country: "USA",
    ageRating: "PG-13",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("Тестовые фильмы добавлены в базу данных (без трейлеров - трейлеры добавляются как бинарные данные через API)");