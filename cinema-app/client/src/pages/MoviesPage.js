import React from 'react';
import MovieList from '../components/MovieList';

const MoviesPage = () => {
  return (
    <div className="moviespage">
      <h1>Movies Catalog</h1>
      <MovieList />
    </div>
  );
};

export default MoviesPage;