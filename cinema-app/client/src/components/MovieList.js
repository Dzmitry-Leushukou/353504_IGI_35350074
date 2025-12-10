import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title'); // Default sort by title
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/movies');
        setMovies(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching movies');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Filter and sort movies based on search term and sort option
  const filteredAndSortedMovies = movies
    .filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'year') {
        return b.year - a.year; // Sort years in descending order
      } else if (sortBy === 'rating') {
        return b.rating - a.rating; // Sort ratings in descending order
      }
      return 0;
    });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="movie-list">
      {/* Search and Sort Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="title">Sort by Title</option>
          <option value="year">Sort by Year</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {/* Movie Grid */}
      <div className="movies-grid">
        {filteredAndSortedMovies.map((movie) => (
          <div key={movie._id} className="movie-card" onClick={() => navigate(`/movie/${movie._id}`)}>
            <img
              src={movie.posterUrl || '/placeholder-poster.jpg'}
              alt={movie.title}
              className="movie-poster"
            />
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>Year: {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</p>
              <p>Rating: {movie.rating}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieList;