import React, { Component } from 'react';
import axios from 'axios';

class Booking extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      selectedSeats: [],
      selectedTime: '',
      ticketCount: 1,
      showtimes: [],
      loading: true,
      error: null,
      success: false,
      movieId: this.props.movieId || null
    };
  }

  componentDidMount() {
    // Load showtimes when component mounts
    this.loadShowtimes();
  }

  loadShowtimes = async () => {
    try {
      const { movieId } = this.props;
      
      // Fetch real showtimes from the API based on movieId
      const response = await axios.get(`http://localhost:5000/api/showtimes?movieId=${movieId}`);
      const showtimes = response.data.data || [];
      
      this.setState({
        showtimes: showtimes,
        selectedTime: showtimes[0]?._id || '', // Using _id instead of time for real showtime selection
        loading: false
      });
    } catch (error) {
      console.error('Error loading showtimes:', error);
      this.setState({
        error: 'Failed to load showtimes',
        loading: false
      });
    }
 }

  handleSeatSelect = (seatNumber) => {
    const { selectedSeats } = this.state;
    if (selectedSeats.includes(seatNumber)) {
      // Remove seat if already selected
      this.setState({
        selectedSeats: selectedSeats.filter(seat => seat !== seatNumber)
      });
    } else {
      // Add seat if not selected
      this.setState({
        selectedSeats: [...selectedSeats, seatNumber]
      });
    }
  }

  handleTimeChange = (event) => {
    this.setState({ selectedTime: event.target.value });
  }

  handleTicketCountChange = (event) => {
    const count = parseInt(event.target.value);
    if (count > 0) {
      this.setState({ ticketCount: count });
    }
  }

  handleBooking = async (event) => {
    event.preventDefault();
    
    const { selectedSeats, selectedTime, ticketCount } = this.state;
    
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    if (!selectedTime) {
      alert('Please select a time');
      return;
    }
    
    try {
      // Prepare the booking data for the API request
      const bookingData = {
        seats: selectedSeats,
        showtime: selectedTime, // Using the showtime _id
        movieId: this.props.movieId,
        ticketCount: ticketCount
      };
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      // Send the POST request to the bookings API
      const response = await axios.post('http://localhost:5000/api/bookings', bookingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Booking response:', response.data);
      
      this.setState({ success: true });
      
      // Reset form after successful booking
      setTimeout(() => {
        this.setState({
          selectedSeats: [],
          selectedTime: this.state.showtimes[0]?._id || '',
          ticketCount: 1,
          success: false
        });
      }, 3000);
    } catch (error) {
      console.error('Booking error:', error);
      this.setState({
        error: error.response?.data?.message || 'Booking failed. Please try again.'
      });
    }
  }

  render() {
    const { 
      selectedSeats, 
      selectedTime, 
      ticketCount, 
      showtimes, 
      loading, 
      error, 
      success 
    } = this.state;

    if (loading) {
      return <div>Loading booking options...</div>;
    }

    return (
      <div className="booking-component">
        <h2>Book Your Seats</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Booking successful!</div>}
        
        <form onSubmit={this.handleBooking} className="booking-form">
          <div className="booking-controls">
            <div className="control-group">
              <label htmlFor="time-select">Select Time:</label>
              <select
                id="time-select"
                value={selectedTime}
                onChange={this.handleTimeChange}
                required
              >
                {showtimes.map(showtime => (
                  <option key={showtime._id} value={showtime._id}>
                    {showtime.date} at {showtime.startTime} ({showtime.availableSeats} seats available)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <label htmlFor="ticket-count">Number of Tickets:</label>
              <input
                type="number"
                id="ticket-count"
                min="1"
                max="10"
                value={ticketCount}
                onChange={this.handleTicketCountChange}
                required
              />
            </div>
          </div>
          
          <div className="seat-selection">
            <h3>Select Seats:</h3>
            <div className="seats-grid">
              {Array.from({ length: 60 }, (_, i) => {
                const seatNumber = i + 1;
                const isSelected = selectedSeats.includes(seatNumber);
                return (
                  <button
                    key={seatNumber}
                    type="button"
                    className={`seat ${isSelected ? 'selected' : ''}`}
                    onClick={() => this.handleSeatSelect(seatNumber)}
                  >
                    {seatNumber}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="booking-summary">
            <h3>Booking Summary:</h3>
            <p>Selected Seats: {selectedSeats.join(', ') || 'None'}</p>
            <p>Selected Time: {showtimes.find(st => st._id === selectedTime)?.startTime || 'Not selected'}</p>
            <p>Number of Tickets: {ticketCount}</p>
            <p>Total: ${selectedSeats.length * (showtimes.find(st => st._id === selectedTime)?.price || 10)}</p>
          </div>
          
          <button 
            type="submit" 
            className="book-button"
            disabled={selectedSeats.length === 0 || !selectedTime}
          >
            Book Now
          </button>
        </form>
      </div>
    );
  }
}

export default Booking;