// Инициализация Telegram WebApp
let tg = window.Telegram?.WebApp;
let user = null;
let userLocation = null;

// Конфигурация Google Sheets (ЕДИНСТВЕННАЯ правильная)
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: '1kT_6xZd-kcpVhAdOBg9i6E6deRqRnu_J8SqzkPr7OeM',
    servicesSheetName: 'Services',
    requestsSheetName: 'Requests', 
    formResponsesSheetName: 'FormResponses'
};

// Текущий режим просмотра
let currentView = 'services';

// Статические данные услуг (резервные)
const mockServices = [
    {
        id: 1,
        title: "Выгул собак",
        description: "Выгуляю вашего питомца 2 раза в день",
        price: "500₽/день",
        category: "animals",
        rating: 4.8,
        distance: 0.3,
        provider: "Мария К.",
        contact: "@maria_dog_walker"
    },
    {
        id: 2,
        title: "Доставка продуктов",
        description: "Привезу продукты из любого магазина",
        price: "200₽",
        category: "delivery", 
        rating: 4.9,
        distance: 0.5,
        provider: "Алексей П.",
        contact: "@alex_delivery"
    },
    {
        id: 3,
        title: "Мелкий ремонт",
        description: "Поклейка обоев, сборка мебели, электрика",
        price: "800₽/час",
        category: "home",
        rating: 4.7,
        distance: 0.8,
        provider: "Сергей М.",
        contact: "@sergey_master"
    }
];

// Статические данные просьб (резервные)
const mockRequests = [
    {
        id: 1,
        title: "Нужен выгул собаки",
        description: "Ищу человека для выгула лабрадора 2 раза в день",
        price: "500₽/день",
        category: "animals",
        rating: 0,
        distance: 0.4,
        provider: "Елена М.",
        contact: "@elena_dog_owner"
    },
    {
        id: 2,
        title: "Требуется доставка лекарств",
        description: "Нужно привезти лекарства из аптеки",
        price: "300₽",
        category: "delivery", 
        rating: 0,
        distance: 0.7,
        provider: "Анна Петровна",
        contact: "@anna_babushka"
    }
];

// Простая функция парсинга CSV
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    
    for (let line of lines) {
        if (line.trim()) {
            const row = line.split(',').map(cell => 
                cell.replace(/^"/, '').replace(/"$/, '').trim()
            );
            result.push(row);
        }
    }
    
    return result;
}

// Функция для загрузки данных из Google Sheets
async function loadServicesFromGoogleSheets() {
    const sheetName = currentView === 'services' ? 
        GOOGLE_SHEETS_CONFIG.servicesSheetName : 
        GOOGLE_SHEETS_CONFIG.requestsSheetName;
    
    try {
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
        
        console.log(`Загружаем данные из: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('Получен CSV:', csvText.substring(0, 200) + '...');
        
        const rows = parseCSV(csvText);
        
        if (!rows || rows.length <= 1) {
            console.log(`Нет данных в листе ${sheetName}, используем статичные данные`);
            return currentView === 'services' ? mockServices : mockRequests;
        }
        
        const services = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] && row[0].trim()) {
                services.push({
                    id: i,
                    title: row[0] || 'Без названия',
                    description: row[1] || 'Описание отсутствует',
                    category: row[2] || 'services',
                    price: row[3] || 'По договоренности',
                    provider: row[4] || 'Аноним',
                    contact: row[5] || '@unknown',
                    rating: parseFloat(row[6]) || 4.0,
                    location: row[7] || 'Не указан',
                    distance: Math.round(Math.random() * 30) / 10
                });
            }
        }
        
        console.log(`Загружено ${services.length} записей из ${sheetName}`);
        return services;
        
    } catch (error) {
        console.error(`Ошибка при загрузке из ${sheetName}:`, error);
        return currentView === 'services' ? mockServices : mockRequests;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    setupEventListeners();
    loadServicesWithView(currentView);
    updateUserInfo();
});

// Инициализация Telegram WebApp
function initTelegramApp() {
    if (tg) {
        tg.ready();
        user = tg.initDataUnsafe?.user;
        
        document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';
        
        tg.MainButton.text = "Связаться";
        tg.MainButton.show();
        
        console.log('Telegram WebApp инициализирован');
        console.log('Пользователь:', user);
    } else {
        console.log('Запуск без Telegram (режим разработки)');
        user = {
            first_name: "Тестовый",
            last_name: "Пользователь",
            username: "test_user"
        };
    }
}

// Обновление информации о пользователе
function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (user) {
        const displayName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        userNameElement.textContent = displayName;
    } else {
        userNameElement.textContent = 'Гость';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    const locationBtn = document.getElementById('locationBtn');
    locationBtn.addEventListener('click', requestLocation);
    
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            filterByCategory(category);
        });
    });
    
    const addServiceBtn = document.getElementById('addServiceBtn');
    const myServicesBtn = document.getElementById('myServicesBtn');
    
    addServiceBtn.addEventListener('click', showAddServiceForm);
    myServicesBtn.addEventListener('click', showMyServices);
    
    // Переключатели услуги/просьбы
    const servicesBtn = document.getElementById('servicesBtn');
    const requestsBtn = document.getElementById('requestsBtn');
    
    if (servicesBtn) {
        servicesBtn.addEventListener('click', () => switchView('services'));
    }
    if (requestsBtn) {
        requestsBtn.addEventListener('click', () => switchView('requests'));
    }
}

function switchView(view) {
    currentView = view;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(view + 'Btn');
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Обновляем заголовки
    const servicesTitle = document.querySelector('.services h2');
    const addBtn = document.getElementById('addServiceBtn');
    
    if (view === 'services') {
        if (servicesTitle) servicesTitle.textContent = 'Доступные услуги';
        if (addBtn) addBtn.textContent = '+ Предложить услугу';
        updateSearchPlaceholder('Поиск услуг...');
    } else {
        if (servicesTitle) servicesTitle.textContent = 'Активные просьбы';
        if (addBtn) addBtn.textContent = '+ Создать просьбу';
        updateSearchPlaceholder('Поиск просьб...');
    }
    
    // Загружаем данные с явным указанием типа
    loadServicesWithView(view);
}

// Функция загрузки данных с указанием типа просмотра
async function loadServicesWithView(viewType, filter = '') {
   const servicesGrid = document.getElementById('servicesGrid');
   
   // Определяем какой лист загружать
   const sheetName = viewType === 'services' ? 
       GOOGLE_SHEETS_CONFIG.servicesSheetName : 
       GOOGLE_SHEETS_CONFIG.requestsSheetName;
   
   if (servicesGrid) {
       servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">Загружаем данные...</p>';
   }
   
   try {
       const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
       
       console.log(`Загружаем данные из: ${url}`);
       
       const response = await fetch(url);
       
       if (!response.ok) {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }
       
       const csvText = await response.text();
       console.log('Получен CSV:', csvText.substring(0, 200) + '...');
       
       const rows = parseCSV(csvText);
       
       if (!rows || rows.length <= 1) {
           console.log(`Нет данных в листе ${sheetName}, используем статичные данные`);
           const fallbackData = viewType === 'services' ? mockServices : mockRequests;
           displayServices(fallbackData, filter, servicesGrid);
           return;
       }
       
       const services = [];
       for (let i = 1; i < rows.length; i++) {
           const row = rows[i];
           if (row[0] && row[0].trim()) {
               services.push({
                   id: i,
                   title: row[0] || 'Без названия',
                   description: row[1] || 'Описание отсутствует',
                   category: row[2] || 'services',
                   price: row[3] || 'По договоренности',
                   provider: row[4] || 'Аноним',
                   contact: row[5] || '@unknown',
                   rating: parseFloat(row[6]) || (viewType === 'requests' ? 0 : 4.0),
                   location: row[7] || 'Не указан',
                   distance: Math.round(Math.random() * 30) / 10
               });
           }
       }
       
       console.log(`Загружено ${services.length} записей из ${sheetName}`);
       displayServices(services, filter, servicesGrid);
       
   } catch (error) {
       console.error(`Ошибка при загрузке из ${sheetName}:`, error);
       if (servicesGrid) {
           servicesGrid.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Ошибка загрузки. Показываем тестовые данные.</p>';
           
           const fallbackData = viewType === 'services' ? mockServices : mockRequests;
           displayServices(fallbackData, filter, servicesGrid);
       }
   }
}

// Вспомогательная функция отображения услуг
function displayServices(services, filter, servicesGrid) {
   let filteredServices = services;
   
   if (filter) {
       filteredServices = services.filter(service =>
           service.title.toLowerCase().includes(filter.toLowerCase()) ||
           service.description.toLowerCase().includes(filter.toLowerCase()) ||
           service.provider.toLowerCase().includes(filter.toLowerCase())
       );
   }
   
   if (servicesGrid) {
       servicesGrid.innerHTML = '';
       
       if (filteredServices.length === 0) {
           servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">Данные не найдены</p>';
           return;
       }
       
       filteredServices.forEach(service => {
           const serviceCard = createServiceCard(service);
           servicesGrid.appendChild(serviceCard);
       });
   }
}

// Обновление placeholder для поиска
function updateSearchPlaceholder(text) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = text;
    }
}


// Создание карточки услуги
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.serviceId = service.id;
    
    card.innerHTML = `
        <div class="service-header">
            <div class="service-title">${service.title}</div>
            <div class="service-price">${service.price}</div>
        </div>
        <div class="service-description">${service.description}</div>
        <div class="service-meta">
            <div class="service-distance">
                <span>📍</span>
                <span>${service.location || service.distance + ' км'}</span>
            </div>
            <div class="service-rating">
                <span>⭐</span>
                <span>${service.rating}</span>
            </div>
        </div>
        <div style="margin-top: 12px; font-size: 14px; color: #4CAF50;">
            ${service.provider}
        </div>
    `;
    
    card.addEventListener('click', () => contactProvider(service));
    
    return card;
}

// Поиск услуг
function handleSearch(event) {
    const query = event.target.value;
    loadServicesWithView(currentView, query); // вместо loadServices(query)
}

// Фильтрация по категории
async function filterByCategory(category) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">Загружаем услуги...</p>';
    }
    
    try {
        allServices = await loadServicesWithView(currentView);
        const filteredServices = allServices.filter(service => service.category === category);
        
        if (servicesGrid) {
            servicesGrid.innerHTML = '';
            
            if (filteredServices.length === 0) {
                servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">В этой категории пока нет услуг</p>';
                return;
            }
            
            filteredServices.forEach(service => {
                const serviceCard = createServiceCard(service);
                servicesGrid.appendChild(serviceCard);
            });
        }
        
    } catch (error) {
        const services = currentView === 'services' ? mockServices : mockRequests;
        const filteredServices = services.filter(service => service.category === category);
        if (servicesGrid) {
            servicesGrid.innerHTML = '';
            
            filteredServices.forEach(service => {
                const serviceCard = createServiceCard(service);
                servicesGrid.appendChild(serviceCard);
            });
        }
    }
    
    const servicesList = document.getElementById('servicesList');
    if (servicesList) {
        servicesList.scrollIntoView({ behavior: 'smooth' });
    }
}

// Остальные функции остаются без изменений
function requestLocation() {
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) {
        locationBtn.textContent = '⏳ Получаем...';
    }
    
    if (tg && tg.LocationManager) {
        tg.LocationManager.getLocation((location) => {
            userLocation = location;
            if (locationBtn) locationBtn.textContent = '✅ Местоположение получено';
            updateServicesWithDistance();
        });
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                if (locationBtn) locationBtn.textContent = '✅ Местоположение получено';
                updateServicesWithDistance();
            },
            (error) => {
                console.error('Ошибка получения геолокации:', error);
                if (locationBtn) locationBtn.textContent = '❌ Не удалось получить';
                setTimeout(() => {
                    if (locationBtn) locationBtn.textContent = '📍 Мое местоположение';
                }, 2000);
            }
        );
    } else {
        if (locationBtn) locationBtn.textContent = '❌ Не поддерживается';
        setTimeout(() => {
            if (locationBtn) locationBtn.textContent = '📍 Мое местоположение';
        }, 2000);
    }
}

function updateServicesWithDistance() {
    if (!userLocation) return;
    loadServices();
}

function contactProvider(service) {
    const message = `Здравствуйте! Меня интересует услуга "${service.title}". Можем обсудить детали?`;
    
    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'contact_provider',
            service_id: service.id,
            provider_contact: service.contact,
            message: message
        }));
        
        tg.showAlert(`Связываемся с ${service.provider}...`);
    } else {
        alert(`Связаться с ${service.provider}\nКонтакт: ${service.contact}\n\n${message}`);
    }
}

function showAddServiceForm() {
    const isRequest = currentView === 'requests';
    const formTitle = isRequest ? 'Создать просьбу' : 'Предложить услугу';
    const submitBtnText = isRequest ? 'Создать просьбу' : 'Предложить услугу';
    const namePlaceholder = isRequest ? 'Что вам нужно?' : 'Что вы предлагаете?';
    const descPlaceholder = isRequest ? 'Опишите что именно вам нужно' : 'Опишите вашу услугу';
    
    const formHTML = `
        <div id="addServiceModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 400px;
                max-height: 80vh; overflow-y: auto;
            ">
                <h3 style="margin-bottom: 16px;">${formTitle}</h3>
                <form id="addServiceForm">
                    <input type="text" id="serviceName" placeholder="${namePlaceholder}" required
                           style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <textarea id="serviceDescription" placeholder="${descPlaceholder}" required
                              style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; min-height: 80px;"></textarea>
                    
                    <select id="serviceCategory" required
                            style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="">Выберите категорию</option>
                        <option value="animals">Животные</option>
                        <option value="delivery">Доставка</option>
                        <option value="home">Дом и быт</option>
                        <option value="elderly">Помощь пожилым</option>
                        <option value="transport">Транспорт</option>
                        <option value="services">Профуслуги</option>
                    </select>
                    
                    <input type="text" id="servicePrice" placeholder="Цена (например: 500₽/час)" required
                           style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <input type="text" id="serviceProvider" placeholder="Ваше имя" required
                           style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <input type="text" id="serviceContact" placeholder="Telegram username (например: @username)" required
                           style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <input type="text" id="serviceLocation" placeholder="Район/метро" required
                           style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button type="submit" style="
                            flex: 1; padding: 12px; background: #4CAF50; color: white;
                            border: none; border-radius: 8px; font-weight: 600;
                        ">${submitBtnText}</button>
                        <button type="button" onclick="closeAddServiceModal()" style="
                            flex: 1; padding: 12px; background: #f0f0f0; color: #333;
                            border: none; border-radius: 8px; font-weight: 600;
                        ">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
    
    const form = document.getElementById('addServiceForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const serviceData = {
                title: document.getElementById('serviceName').value,
                description: document.getElementById('serviceDescription').value,
                category: document.getElementById('serviceCategory').value,
                price: document.getElementById('servicePrice').value,
                provider: document.getElementById('serviceProvider').value,
                contact: document.getElementById('serviceContact').value,
                location: document.getElementById('serviceLocation').value,
                type: currentView
            };
            
            if (tg) {
                tg.sendData(JSON.stringify({
                    action: 'add_service',
                    data: serviceData
                }));
            }
            
            alert(`${isRequest ? 'Просьба' : 'Услуга'} отправлена! Мы проверим и добавим в течение 24 часов.`);
            closeAddServiceModal();
        });
    }
}

function closeAddServiceModal() {
    const modal = document.getElementById('addServiceModal');
    if (modal) {
        modal.remove();
    }
}

function showMyServices() {
    if (tg) {
        tg.showPopup({
            title: 'Мои услуги',
            message: 'У вас пока нет активных услуг',
            buttons: [
                {id: 'ok', type: 'ok', text: 'Понятно'}
            ]
        });
    } else {
        alert('У вас пока нет активных услуг');
    }
}

// Обработчик главной кнопки Telegram
if (tg) {
    tg.onEvent('mainButtonClicked', function() {
        tg.showAlert('Главная кнопка нажата!');
    });
}

console.log('NeighborHelp app с Google Sheets интеграцией загружен!');