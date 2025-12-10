// frontend/src/pages/MyOrders.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaMoneyBillWave,
  FaTrash,
  FaPrint,
  FaDownload,
  FaShareAlt,
  FaCreditCard,
  FaCheck
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/pages/MyOrders.css';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите отменить заказ?')) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Заказ отменен');
      fetchOrders();
    } catch (error) {
      toast.error('Ошибка отмены заказа');
    }
  };

  const handlePayOrder = async (orderId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/pay`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Заказ оплачен!');
      fetchOrders();
    } catch (error) {
      toast.error('Ошибка оплаты заказа');
    }
  };

  const handlePrintTicket = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Билет - ${order.movie?.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .ticket { border: 2px dashed #000; padding: 20px; max-width: 400px; }
            .header { text-align: center; margin-bottom: 20px; }
            .movie-title { font-size: 20px; font-weight: bold; margin: 10px 0; }
            .info { margin: 10px 0; }
            .qr-code { text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>КИНОТЕАТР</h2>
              <p>Электронный билет</p>
            </div>
            <div class="movie-title">${order.movie?.title}</div>
            <div class="info">Дата: ${new Date(order.showDate).toLocaleDateString('ru-RU')}</div>
            <div class="info">Время: ${order.showTime}</div>
            <div class="info">Места: ${order.seats.join(', ')}</div>
            <div class="info">Зал: ${order.session?.hall || 'A'}</div>
            <div class="info">Цена: ${order.totalPrice} ₽</div>
            <div class="info">Статус: ${order.isPaid ? 'Оплачен' : 'Не оплачен'}</div>
            <div class="info">Номер заказа: ${order._id}</div>
            <div class="qr-code">[QR Code Placeholder]</div>
            <div class="footer">
              <p>Приятного просмотра!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadTicket = (order) => {
    const ticketData = {
      title: order.movie?.title,
      date: new Date(order.showDate).toLocaleDateString('ru-RU'),
      time: order.showTime,
      seats: order.seats,
      hall: order.session?.hall || 'A',
      price: order.totalPrice,
      orderId: order._id,
      status: order.isPaid ? 'Оплачен' : 'Не оплачен',
      qrData: `ORDER:${order._id}`
    };

    const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${order._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Билет скачан');
  };

  const handleShareOrder = (order) => {
    if (navigator.share) {
      navigator.share({
        title: `Мой билет на ${order.movie?.title}`,
        text: `Я иду на ${order.movie?.title} ${new Date(order.showDate).toLocaleDateString('ru-RU')}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована в буфер');
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkCancel = async () => {
    if (selectedOrders.length === 0) return;
    
    if (!window.confirm(`Отменить ${selectedOrders.length} заказов?`)) return;

    const promises = selectedOrders.map(orderId =>
      axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
    );

    try {
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} заказов отменено`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      toast.error('Ошибка отмены заказов');
    }
  };

  const filteredOrders = orders.filter(order => {
    switch (filter) {
      case 'pending':
        return !order.isPaid && order.status === 'confirmed';
      case 'paid':
        return order.isPaid;
      case 'cancelled':
        return order.status === 'cancelled';
      case 'completed':
        return order.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status, isPaid) => {
    if (isPaid) return 'status-paid';
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusText = (status, isPaid) => {
    if (isPaid) return 'Оплачен';
    switch (status) {
      case 'pending': return 'Ожидание';
      case 'confirmed': return 'Подтвержден';
      case 'cancelled': return 'Отменен';
      case 'completed': return 'Завершен';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>Мои заказы</h1>
        <div className="header-info">
          <p>Всего заказов: {orders.length}</p>
          {selectedOrders.length > 0 && (
            <button 
              className="btn btn-danger"
              onClick={handleBulkCancel}
            >
              <FaTrash /> Отменить выбранные ({selectedOrders.length})
            </button>
          )}
        </div>
      </div>

      <div className="orders-controls">
        <div className="filter-tabs">
          {['all', 'pending', 'paid', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Все' : 
               status === 'pending' ? 'Ожидают оплаты' :
               status === 'paid' ? 'Оплаченные' :
               status === 'completed' ? 'Завершенные' : 'Отмененные'}
            </button>
          ))}
        </div>

        <div className="timezone-info">
          <span>Ваша временная зона: {user?.timezone || 'Europe/Moscow'}</span>
          <span>Текущее время: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="orders-container">
        {filteredOrders.length > 0 ? (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div 
                key={order._id} 
                className={`order-card ${getStatusColor(order.status, order.isPaid)} ${selectedOrders.includes(order._id) ? 'selected' : ''}`}
              >
                <div className="order-select">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => handleSelectOrder(order._id)}
                    disabled={order.isPaid || order.status === 'cancelled'}
                  />
                </div>

                <div className="order-header">
                  <h3>{order.movie?.title}</h3>
                  <div className="order-status-section">
                    <span className={`order-status ${getStatusColor(order.status, order.isPaid)}`}>
                      {getStatusText(order.status, order.isPaid)}
                    </span>
                    {order.isPaid && (
                      <span className="payment-status paid">
                        <FaCheck /> Оплачен
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <span>Дата сеанса:</span>
                    <strong>{new Date(order.showDate).toLocaleDateString('ru-RU')}</strong>
                  </div>
                  
                  <div className="detail-item">
                    <FaClock />
                    <span>Время:</span>
                    <strong>{order.showTime}</strong>
                  </div>

                  <div className="detail-item">
                    <FaTicketAlt />
                    <span>Места:</span>
                    <strong>{order.seats.join(', ')}</strong>
                  </div>

                  <div className="detail-item">
                    <FaMoneyBillWave />
                    <span>Стоимость:</span>
                    <strong>{order.totalPrice} ₽</strong>
                  </div>
                </div>

                <div className="time-info">
                  <div className="time-item">
                    <span>Заказ создан:</span>
                    <small>{new Date(order.createdAt).toLocaleString('ru-RU')}</small>
                  </div>
                </div>

                <div className="order-actions">
                  {!order.isPaid && order.status === 'confirmed' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handlePayOrder(order._id)}
                    >
                      <FaCreditCard /> Оплатить
                    </button>
                  )}
                  
                  {!order.isPaid && order.status === 'confirmed' && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      <FaTrash /> Отменить
                    </button>
                  )}
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePrintTicket(order)}
                  >
                    <FaPrint /> Печать
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDownloadTicket(order)}
                  >
                    <FaDownload /> Скачать
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleShareOrder(order)}
                  >
                    <FaShareAlt /> Поделиться
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders">
            <p>Заказы не найдены</p>
            <a href="/movies" className="btn btn-primary">
              Посмотреть фильмы
            </a>
          </div>
        )}
      </div>

      <div className="orders-summary">
        <h3>Статистика заказов</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Всего заказов:</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="summary-item">
            <span>На сумму:</span>
            <strong>{orders.reduce((sum, order) => sum + order.totalPrice, 0)} ₽</strong>
          </div>
          <div className="summary-item">
            <span>Оплачено:</span>
            <strong>{orders.filter(o => o.isPaid).length}</strong>
          </div>
          <div className="summary-item">
            <span>Ожидают оплаты:</span>
            <strong>{orders.filter(o => !o.isPaid && o.status === 'confirmed').length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;