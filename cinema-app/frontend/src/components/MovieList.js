import React, { Component } from 'react';
import MovieCard from './MovieCard';
import { FaSort, FaFilter, FaSearch } from 'react-icons/fa';
import '../styles/components/MovieList.css';

// Классовый компонент (требование 3)
class MovieList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: 'title',
      filterGenre: '',
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: 6
    };
  }

  // Обработчики событий
  handleSortChange = (e) => {
    this.setState({ sortBy: e.target.value, currentPage: 1 });
  };

  handleGenreFilter = (e) => {
    this.setState({ filterGenre: e.target.value, currentPage: 1 });
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value, currentPage: 1 });
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleResetFilters = () => {
    this.setState({
      sortBy: 'title',
      filterGenre: '',
      searchQuery: '',
      currentPage: 1
    });
  };

  getFilteredMovies = () => {
    const { movies } = this.props;
    const { sortBy, filterGenre, searchQuery } = this.state;

    let filtered = [...movies];

    // Фильтрация по жанру
    if (filterGenre) {
      filtered = filtered.filter(movie => 
        movie.genre.includes(filterGenre)
      );
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(query) ||
        movie.description.toLowerCase().includes(query) ||
        movie.director.toLowerCase().includes(query)
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'year':
          return b.year - a.year;
        case 'price':
          return a.price - b.price;
        case 'duration':
          return b.duration - a.duration;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  };

  render() {
    const { sortBy, filterGenre, searchQuery, currentPage, itemsPerPage } = this.state;
    const filteredMovies = this.getFilteredMovies();
    
    // Пагинация
    const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMovies = filteredMovies.slice(startIndex, startIndex + itemsPerPage);

    // Уникальные жанры
    const genres = [...new Set(this.props.movies.flatMap(movie => movie.genre))];

    return (
      <div className="movie-list-container">
        <div className="movie-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Поиск фильмов..."
              value={searchQuery}
              onChange={this.handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <label><FaSort /> Сортировка:</label>
              <select value={sortBy} onChange={this.handleSortChange}>
                <option value="title">По названию</option>
                <option value="rating">По рейтингу</option>
                <option value="year">По году</option>
                <option value="price">По цене</option>
                <option value="duration">По длительности</option>
              </select>
            </div>

            <div className="filter-group">
              <label><FaFilter /> Жанр:</label>
              <select value={filterGenre} onChange={this.handleGenreFilter}>
                <option value="">Все жанры</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={this.handleResetFilters}
              className="reset-btn"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        <div className="movie-grid">
          {currentMovies.length > 0 ? (
            currentMovies.map(movie => (
              <MovieCard key={movie._id} movie={movie} />
            ))
          ) : (
            <div className="no-movies">
              <p>Фильмы не найдены. Попробуйте изменить параметры поиска.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => this.handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              Назад
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              )
              .map(page => (
                <button
                  key={page}
                  onClick={() => this.handlePageChange(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))
            }
            
            <button
              onClick={() => this.handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Вперед
            </button>
          </div>
        )}

        <div className="movie-stats">
          <p>Найдено фильмов: {filteredMovies.length}</p>
          <p>Страница {currentPage} из {totalPages}</p>
        </div>
      </div>
    );
  }
}

export default MovieList;