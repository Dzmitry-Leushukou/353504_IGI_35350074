import React, { useState, useRef, useEffect } from 'react';
import { 
  FaBuilding, 
  FaUsers, 
  FaAward, 
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaInstagram,
  FaTelegram
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/pages/About.css';

// Компонент с использованием useRef
const About = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  const contactFormRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Имитация загрузки карты
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border-radius: 8px;
          ">
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 10px;">📍</div>
              <div>Карта загружается...</div>
              <div style="font-size: 12px; opacity: 0.8;">Интерактивная карта нашего кинотеатра</div>
            </div>
          </div>
        `;
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Имитация отправки формы
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
    setContactForm({
      name: '',
      email: '',
      message: '',
      phone: ''
    });
    setIsSubmitting(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Плавная прокрутка к форме контактов
    if (tab === 'contact' && contactFormRef.current) {
      setTimeout(() => {
        contactFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const cinemaInfo = {
    name: "Кинотеатр 'CinemaMax'",
    founded: 2010,
    employees: 45,
    screens: 8,
    seats: 1200,
    awards: 12
  };

  const workingHours = [
    { day: 'Пн-Пт', hours: '10:00 - 00:00' },
    { day: 'Суббота', hours: '09:00 - 02:00' },
    { day: 'Воскресенье', hours: '09:00 - 00:00' }
  ];

  const socialLinks = [
    { icon: <FaFacebook />, name: 'Facebook', url: '#' },
    { icon: <FaInstagram />, name: 'Instagram', url: '#' },
    { icon: <FaTelegram />, name: 'Telegram', url: '#' }
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>О нашем кинотеатре</h1>
        <p>Мы создаем незабываемые кинематографические впечатления с 2010 года</p>
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => handleTabChange('about')}
        >
          О компании
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => handleTabChange('contacts')}
        >
          Контакты
        </button>
        <button 
          className={`tab-btn ${activeTab === 'career' ? 'active' : ''}`}
          onClick={() => handleTabChange('career')}
        >
          Карьера
        </button>
      </div>

      {activeTab === 'about' && (
        <div className="tab-content">
          <section className="cinema-stats">
            <div className="stat-card">
              <FaBuilding className="stat-icon" />
              <h3>{cinemaInfo.founded}</h3>
              <p>Год основания</p>
            </div>
            <div className="stat-card">
              <FaUsers className="stat-icon" />
              <h3>{cinemaInfo.employees}+</h3>
              <p>Сотрудников</p>
            </div>
            <div className="stat-card">
              <h3>{cinemaInfo.screens}</h3>
              <p>Зрительных залов</p>
            </div>
            <div className="stat-card">
              <h3>{cinemaInfo.seats}</h3>
              <p>Всего мест</p>
            </div>
            <div className="stat-card">
              <FaAward className="stat-icon" />
              <h3>{cinemaInfo.awards}</h3>
              <p>Наград и премий</p>
            </div>
          </section>

          <section className="cinema-history">
            <h2>Наша история</h2>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-year">2010</div>
                <div className="timeline-content">
                  <h4>Открытие первого зала</h4>
                  <p>Начали с одного современного кинозала на 150 мест в центре города.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2014</div>
                <div className="timeline-content">
                  <h4>Расширение до 4 залов</h4>
                  <p>Внедрение технологии IMAX и открытие первого 4D зала в регионе.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2018</div>
                <div className="timeline-content">
                  <h4>Цифровая трансформация</h4>
                  <p>Полный переход на цифровые технологии и запуск онлайн-бронирования.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2023</div>
                <div className="timeline-content">
                  <h4>Инновации и AI</h4>
                  <p>Внедрение системы рекомендаций на основе искусственного интеллекта.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="tab-content" ref={contactFormRef}>
          <div className="contacts-grid">
            <div className="contact-info">
              <h2>Контактная информация</h2>
              
              <div className="contact-item">
                <FaMapMarkerAlt />
                <div>
                  <h4>Адрес</h4>
                  <p>г. Москва, ул. Кинематографическая, д. 15</p>
                  <p>БЦ "Синема Сити", 3 этаж</p>
                </div>
              </div>

              <div className="contact-item">
                <FaPhone />
                <div>
                  <h4>Телефоны</h4>
                  <p>+7 (495) 123-45-67 - Касса</p>
                  <p>+7 (495) 987-65-43 - Администрация</p>
                </div>
              </div>

              <div className="contact-item">
                <FaEnvelope />
                <div>
                  <h4>Email</h4>
                  <p>info@cinemamax.ru - Общие вопросы</p>
                  <p>corp@cinemamax.ru - Корпоративным клиентам</p>
                </div>
              </div>

              <div className="contact-item">
                <FaClock />
                <div>
                  <h4>Часы работы</h4>
                  {workingHours.map((item, index) => (
                    <p key={index}>{item.day}: {item.hours}</p>
                  ))}
                </div>
              </div>

              <div className="social-links">
                <h4>Мы в социальных сетях</h4>
                <div className="social-icons">
                  {socialLinks.map((social, index) => (
                    <a 
                      key={index}
                      href={social.url}
                      className="social-icon"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.icon}
                      <span>{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <h2>Напишите нам</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Имя *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                    minLength="2"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleInputChange}
                    pattern="[0-9]{10,11}"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Сообщение *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    minLength="10"
                    rows="5"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                </button>
              </form>
            </div>
          </div>

          <div className="map-container">
            <h3>Как добраться</h3>
            <div className="map" ref={mapRef}>
              {/* Карта будет загружена динамически */}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'career' && (
        <div className="tab-content">
          <section className="career-section">
            <h2>Карьера в CinemaMax</h2>
            <p className="career-intro">
              Присоединяйтесь к нашей команде профессионалов, создающих магию кино!
            </p>

            <div className="job-openings">
              <h3>Открытые вакансии</h3>
              <div className="job-list">
                <div className="job-card">
                  <h4>Кассир-администратор</h4>
                  <p>Обязанности: работа с посетителями, продажа билетов, консультация</p>
                  <div className="job-meta">
                    <span>Опыт: не требуется</span>
                    <span>График: сменный</span>
                    <span>Зарплата: от 45 000 ₽</span>
                  </div>
                  <button className="btn btn-primary">Откликнуться</button>
                </div>

                <div className="job-card">
                  <h4>Киномеханик</h4>
                  <p>Обязанности: обслуживание проекционного оборудования, контроль качества показа</p>
                  <div className="job-meta">
                    <span>Опыт: от 1 года</span>
                    <span>График: полный день</span>
                    <span>Зарплата: от 60 000 ₽</span>
                  </div>
                  <button className="btn btn-primary">Откликнуться</button>
                </div>

                <div className="job-card">
                  <h4>Маркетолог</h4>
                  <p>Обязанности: продвижение кинотеатра, организация мероприятий, SMM</p>
                  <div className="job-meta">
                    <span>Опыт: от 2 лет</span>
                    <span>График: полный день</span>
                    <span>Зарплата: от 70 000 ₽</span>
                  </div>
                  <button className="btn btn-primary">Откликнуться</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default About;