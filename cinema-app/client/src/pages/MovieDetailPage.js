import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MovieDetailPage = () => {
  const { id } = useParams(); // Get movie ID from URL parameters
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailerProgress, setTrailerProgress] = useState(0);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Fetch movie details
        const movieResponse = await axios.get(`http://localhost:5000/api/movies/${id}`);
        setMovie(movieResponse.data.data);

        // Fetch showtimes for this movie
        // Since we don't have a dedicated endpoint for showtimes by movie, we'll simulate this
        // In a real application, we would have an endpoint like /api/showtimes?movieId=${id}
        // For now, we'll create mock showtimes based on the movie data
        const mockShowtimes = [
          {
            _id: '1',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            startTime: '14:00',
            endTime: '16:00',
            hall: 'Hall 1',
            totalSeats: 100,
            availableSeats: 85,
            price: 10
          },
          {
            _id: '2',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            startTime: '18:00',
            endTime: '20:00',
            hall: 'Hall 2',
            totalSeats: 120,
            availableSeats: 110,
            price: 12
          },
          {
            _id: '3',
            date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
            startTime: '16:00',
            endTime: '18:00',
            hall: 'Hall 1',
            totalSeats: 100,
            availableSeats: 95,
            price: 10
          }
        ];
        
        setShowtimes(mockShowtimes);
        setLoading(false);
      } catch (err) {
        setError('Error fetching movie details');
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  // Function to load trailer with XMLHttpRequest and show buffering progress
 const loadTrailerWithProgress = (movieId) => {
    setIsLoadingTrailer(true);
    setTrailerProgress(0);

    // Use the backend endpoint to stream the trailer
    const trailerUrl = `http://localhost:5000/api/movies/${movieId}/trailer`;
    
    const xhr = new XMLHttpRequest();
    
    xhr.onprogress = function(e) {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 100);
        setTrailerProgress(percentLoaded);
        
        // Update the progress bar visually
        const progressBar = document.getElementById('buffer-progress');
        const bufferText = document.getElementById('buffer-text');
        if (progressBar) {
          progressBar.style.width = `${percentLoaded}%`;
        }
        if (bufferText) {
          bufferText.textContent = `Buffering: ${percentLoaded}%`;
        }
      }
    };

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 302) { // 302 is redirect, which we expect from our endpoint
        // When loaded completely, hide the progress indicators
        setTrailerProgress(100);
        setIsLoadingTrailer(false);
        
        const progressBar = document.getElementById('buffer-progress');
        const bufferText = document.getElementById('buffer-text');
        if (progressBar) {
          progressBar.style.width = '100%';
        }
        if (bufferText) {
          bufferText.textContent = 'Ready to play';
        }
      }
    };

    xhr.onerror = function() {
      console.error('Error loading trailer');
      setIsLoadingTrailer(false);
      setTrailerProgress(0);
      
      const progressBar = document.getElementById('buffer-progress');
      const bufferText = document.getElementById('buffer-text');
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      if (bufferText) {
        bufferText.textContent = 'Error loading trailer';
      }
    };

    xhr.open('GET', trailerUrl, true);
    xhr.responseType = 'blob'; // Get response as blob to handle video data
    xhr.send();
  };

 // Load trailer when movie changes and has a trailer
  useEffect(() => {
     if (movie && movie.trailer && movie.trailer.data) {
       loadTrailerWithProgress(movie._id);
     }
   }, [movie]); // loadTrailerWithProgress is defined outside the effect

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!movie) {
    return <div>Movie not found</div>;
  }

  return (
    <div className="movie-detail-page">
      <div className="movie-header">
        <img 
          src={movie.posterUrl || '/placeholder-poster.jpg'} 
          alt={movie.title} 
          className="movie-poster"
        />
        <div className="movie-info">
          <h1>{movie.title}</h1>
          <p className="movie-meta">
            <span>Duration: {movie.duration} min</span>
            <span>Release: {new Date(movie.releaseDate).toLocaleDateString()}</span>
            <span>Director: {movie.director}</span>
            <span>Rating: {movie.rating}/10</span>
          </p>
          <p className="movie-genres">{movie.genre.join(', ')}</p>
          <p className="movie-cast">Cast: {movie.cast.join(', ')}</p>
        </div>
      </div>

      <div className="movie-content">
        <section className="movie-description">
          <h2>Description</h2>
          <p>{movie.description}</p>
        </section>

        {movie.trailer && movie.trailer.data && (
          <section className="movie-trailer">
            <h2>Trailer</h2>
            <div className="trailer-container">
              <video
                id="trailer-player"
                controls
                preload="metadata"
                style={{ width: '100%', maxWidth: '600px' }}
              >
                <source src={`http://localhost:5000/api/movies/${movie._id}/trailer`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="buffering-progress">
                <div className="progress-bar">
                  <div
                    id="buffer-progress"
                    className="progress-fill"
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <span id="buffer-text">Buffering: 0%</span>
              </div>
            </div>
          </section>
        )}

        <section className="showtimes-section">
          <h2>Showtimes</h2>
          <div className="showtimes-list">
            {showtimes.map((showtime) => (
              <div key={showtime._id} className="showtime-card">
                <div className="showtime-date">
                  <strong>Date:</strong> {new Date(showtime.date).toLocaleDateString()}
                </div>
                <div className="showtime-time">
                  <strong>Time:</strong> {showtime.startTime} - {showtime.endTime}
                </div>
                <div className="showtime-details">
                  <span>Hall: {showtime.hall}</span>
                  <span>Available Seats: {showtime.availableSeats}/{showtime.totalSeats}</span>
                  <span>Price: ${showtime.price}</span>
                </div>
                <button className="book-ticket-btn">Book Ticket</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovieDetailPage;