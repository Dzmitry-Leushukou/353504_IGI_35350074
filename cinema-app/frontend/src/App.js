import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import About from './pages/About';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import { useAuth } from './contexts/AuthContext';
import './styles/App.css';

// Декларативный функциональный компонент (требование 1)
function App() {
  const { isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Обновление времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <Navbar currentTime={currentTime} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/about" element={<About />} />
            <Route 
              path="/my-orders" 
              element={
                isAuthenticated ? <MyOrders /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? <Login /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/register" 
              element={
                !isAuthenticated ? <Register /> : <Navigate to="/" />
              } 
            />
          </Routes>
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            <p>Кинотеатр &copy; {new Date().getFullYear()}</p>
            <p>Текущее время: {currentTime.toLocaleTimeString()}</p>
            <p>Версия: 1.0.0</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;