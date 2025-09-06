// ФАЙЛ script.js
// Инициализация Telegram WebApp
let tg = window.Telegram?.WebApp;
let user = null;
let userLocation = null;

// Конфигурация Google Sheets (один лист)
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: '1kT_6xZd-kcpVhAdOBg9i6E6deRqRnu_J8SqzkPr7OeM',
    sheetName: 'Services' // Используем только один лист
};
// Система местоположений
let userCoordinates = null;
let userManualLocation = null;
const DISTRICTS = [
    'Центральный', 'Северный', 'Южный', 'Восточный', 'Западный',
    'Советский', 'Ленинский', 'Октябрьский', 'Железнодорожный',
    'Автозаводский', 'Московский', 'Приокский', 'Канавинский'
];

// Примерные координаты районов (широта, долгота)
const DISTRICT_COORDINATES = {
    'Центральный': [56.3287, 44.0020],
    'Северный': [56.3500, 44.0020],
    'Южный': [56.3000, 44.0020],
    'Восточный': [56.3287, 44.0300],
    'Западный': [56.3287, 43.9700],
    'Советский': [56.3400, 43.9800],
    'Ленинский': [56.3200, 44.0200],
    'Октябрьский': [56.3300, 43.9900],
    'Железнодорожный': [56.3100, 44.0100],
    'Автозаводский': [56.2700, 43.8700],
    'Московский': [56.3600, 43.9300],
    'Приокский': [56.2900, 44.0700],
    'Канавинский': [56.3400, 44.0400]
};
// Система управления модальными окнами
let modalStack = [];

function openModal(modalId, modalHTML) {
    // Закрываем все существующие модальные окна
    closeAllModals();
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalStack.push(modalId);
}

function closeAllModals() {
    // Закрываем все модальные окна
    const modals = document.querySelectorAll('[id$="Modal"]');
    modals.forEach(modal => modal.remove());
    modalStack = [];
}

function closeTopModal() {
    if (modalStack.length > 0) {
        const topModalId = modalStack.pop();
        const modal = document.getElementById(topModalId);
        if (modal) {
            modal.remove();
        }
    }
}


// Текущий режим просмотра
let currentView = 'services';

// Кэш данных
let allData = [];

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
        contact: "@maria_dog_walker",
        type: "service"
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
        contact: "@alex_delivery",
        type: "service"
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
        contact: "@elena_dog_owner",
        type: "request"
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
        contact: "@anna_babushka",
        type: "request"
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

// Функция загрузки всех данных из Google Sheets
async function loadAllDataFromGoogleSheets() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${GOOGLE_SHEETS_CONFIG.sheetName}`;
        
        console.log(`Загружаем все данные из: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('Получен CSV:', csvText.substring(0, 200) + '...');
        
        const rows = parseCSV(csvText);
        
        if (!rows || rows.length <= 1) {
            console.log('Нет данных в таблице, используем статичные данные');
            return [...mockServices, ...mockRequests];
        }
        
        const allItems = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] && row[0].trim()) {
                allItems.push({
                    id: i,
                    title: row[0] || 'Без названия',
                    description: row[1] || 'Описание отсутствует',
                    category: row[2] || 'services',
                    price: row[3] || 'По договоренности',
                    provider: row[4] || 'Аноним',
                    contact: row[5] || '@unknown',
                    rating: parseFloat(row[6]) || 4.0,
                    location: row[7] || 'Не указан',
                    type: (row[8] || 'service').toLowerCase(), // Новая колонка Type
                    distance: Math.round(Math.random() * 30) / 10
                });
            }
        }
        
        console.log(`Загружено ${allItems.length} записей из Google Sheets`);
        return allItems;
        
    } catch (error) {
        console.error('Ошибка при загрузке из Google Sheets:', error);
        return [...mockServices, ...mockRequests];
    }
}

// Функция фильтрации данных по типу
function filterDataByType(data, type) {
    return data.filter(item => item.type === type);
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    setupEventListeners();
    loadServices();
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
        console.log('Платформа:', tg.platform);
        console.log('Версия:', tg.version);
    } else {
        console.log('Запуск без Telegram (режим разработки)');
        user = {
            first_name: "Тестовый",
            last_name: "Пользователь", 
            username: "test_user"
        };
    }
    
    setTimeout(() => {
        restoreUserLocation();
    }, 1000);
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

// Переключение между услугами и просьбами
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
    
    // Перезагружаем данные с фильтрацией
    loadServices();
}

// Загрузка и отображение услуг
async function loadServices(filter = '') {
    const servicesGrid = document.getElementById('servicesGrid');
    
    if (servicesGrid) {
        servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">Загружаем данные...</p>';
    }
    
    try {
        // Загружаем все данные, если еще не загружены
        if (allData.length === 0) {
            allData = await loadAllDataFromGoogleSheets();
        }
        
        // Фильтруем по типу (services/requests)
        const typeFilter = currentView === 'services' ? 'service' : 'request';
        let filteredData = filterDataByType(allData, typeFilter);
        
        console.log(`Отфильтровано ${filteredData.length} записей типа "${typeFilter}"`);
        
        // Применяем текстовый фильтр поиска
        if (filter) {
            filteredData = filteredData.filter(item =>
                item.title.toLowerCase().includes(filter.toLowerCase()) ||
                item.description.toLowerCase().includes(filter.toLowerCase()) ||
                item.provider.toLowerCase().includes(filter.toLowerCase())
            );
        }
        
        displayServices(filteredData, servicesGrid);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        if (servicesGrid) {
            servicesGrid.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Ошибка загрузки. Показываем тестовые данные.</p>';
            
            // Показываем статичные данные при ошибке
            const fallbackData = currentView === 'services' ? mockServices : mockRequests;
            displayServices(fallbackData, servicesGrid);
        }
    }
}

// Функция отображения услуг
function displayServices(services, servicesGrid) {
    if (servicesGrid) {
        servicesGrid.innerHTML = '';
        
        if (services.length === 0) {
            const message = currentView === 'services' ? 'Услуги не найдены' : 'Просьбы не найдены';
            servicesGrid.innerHTML = `<p style="text-align: center; color: #666;">${message}</p>`;
            return;
        }
        
        services.forEach(service => {
            const serviceCard = createServiceCard(service);
            servicesGrid.appendChild(serviceCard);
        });
    }
}

// Создание карточки услуги (обновленная версия с кнопками)
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
        <div class="service-footer">
            <div class="service-provider" onclick="showUserProfile('${service.provider}', '${service.contact}')" style="
                font-size: 14px; color: #4CAF50; cursor: pointer; text-decoration: underline;
                margin-bottom: 8px;
            ">
                ${service.provider}
            </div>
            <div class="service-actions" style="display: flex; gap: 8px;">
                <button class="btn-small btn-primary" onclick="showServiceDetailsById(${service.id})">
                    Подробнее
                </button>
                <button class="btn-small btn-secondary" onclick="contactProviderById(${service.id})">
                    Связаться
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Поиск
function handleSearch(event) {
    const query = event.target.value;
    loadServices(query);
}

// Фильтрация по категории
async function filterByCategory(category) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = '<p style="text-align: center; color: #666;">Загружаем услуги...</p>';
    }
    
    try {
        // Загружаем все данные, если еще не загружены
        if (allData.length === 0) {
            allData = await loadAllDataFromGoogleSheets();
        }
        
        // Фильтруем по типу и категории
        const typeFilter = currentView === 'services' ? 'service' : 'request';
        const filteredData = allData.filter(item => 
            item.type === typeFilter && item.category === category
        );
        
        displayServices(filteredData, servicesGrid);
        
    } catch (error) {
        const services = currentView === 'services' ? mockServices : mockRequests;
        const filteredServices = services.filter(service => service.category === category);
        displayServices(filteredServices, servicesGrid);
    }
    
    const servicesList = document.getElementById('servicesList');
    if (servicesList) {
        servicesList.scrollIntoView({ behavior: 'smooth' });
    }
}

// Обновление placeholder для поиска
function updateSearchPlaceholder(text) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = text;
    }
}

// Остальные функции
function requestLocation() {
    const locationBtn = document.getElementById('locationBtn');
    
    // Если в Telegram WebApp и нет HTTPS, сразу показываем выбор района
    if (tg && window.location.protocol !== 'https:') {
        if (locationBtn) {
            locationBtn.textContent = '🏘️ Выберите район';
        }
        setTimeout(() => {
            showDistrictSelector();
        }, 500);
        return;
    }
    
    const locationModalHTML = `
        <div id="locationModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 400px;
            ">
                <h3 style="margin: 0 0 16px 0; text-align: center;">Укажите местоположение</h3>
                
                <p style="color: #666; margin: 0 0 20px 0; text-align: center; font-size: 14px;">
                    Это поможет показать услуги рядом с вами
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${window.location.protocol === 'https:' ? `
                    <button onclick="requestPreciseLocation()" style="
                        padding: 14px 20px; background: #4CAF50; color: white;
                        border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                    ">📍 Определить точно (GPS)</button>
                    ` : ''}
                    
                    <button onclick="showDistrictSelector()" style="
                        padding: 14px 20px; background: #2196F3; color: white;
                        border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                    ">🏘️ Выбрать район</button>
                    
                    <button onclick="closeLocationModal()" style="
                        padding: 14px 20px; background: #f0f0f0; color: #333;
                        border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                    ">Отмена</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', locationModalHTML);
}

function requestPreciseLocation() {
    closeLocationModal();
    
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) {
        locationBtn.textContent = '⏳ Получаем...';
    }
    
    // Проверяем HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        if (locationBtn) locationBtn.textContent = '❌ Нужен HTTPS';
        setTimeout(() => {
            alert('Для определения местоположения требуется защищенное соединение (HTTPS). Выберите район вручную.');
            showDistrictSelector();
        }, 1000);
        return;
    }
    
    // Проверяем поддержку геолокации
    if (!navigator.geolocation) {
        if (locationBtn) locationBtn.textContent = '❌ Не поддерживается';
        setTimeout(() => {
            showDistrictSelector();
        }, 1500);
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 25000, // Увеличиваем таймаут
        maximumAge: 300000 // 5 минут
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            userManualLocation = null;
            
            const accuracy = position.coords.accuracy;
            let locationText;
            
            if (accuracy < 50) {
                locationText = `✅ Точное местоположение (${Math.round(accuracy)}м)`;
            } else if (accuracy < 200) {
                locationText = `✅ Хорошее местоположение (${Math.round(accuracy)}м)`;
            } else if (accuracy < 1000) {
                locationText = `✅ Примерное местоположение (${Math.round(accuracy)}м)`;
            } else {
                locationText = `✅ Грубое местоположение (~${Math.round(accuracy/1000)}км)`;
            }
            
            if (locationBtn) locationBtn.textContent = locationText;
            
            updateServicesWithDistance();
            
            localStorage.setItem('userLocation', JSON.stringify({
                type: 'coordinates',
                data: userCoordinates,
                accuracy: accuracy,
                timestamp: Date.now()
            }));
            
            console.log('Местоположение получено:', userCoordinates, 'точность:', accuracy);
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            
            let errorMessage = '';
            let userMessage = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Доступ запрещен';
                    userMessage = 'Вы запретили доступ к местоположению. Можете выбрать район вручную или разрешить доступ в настройках браузера.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Недоступно';
                    userMessage = 'Не удалось определить местоположение. Попробуйте выбрать район вручную.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Время вышло';
                    userMessage = 'Определение местоположения заняло слишком много времени. Попробуйте еще раз или выберите район вручную.';
                    break;
                default:
                    errorMessage = 'Ошибка';
                    userMessage = 'Произошла неизвестная ошибка. Выберите район вручную.';
            }
            
            if (locationBtn) locationBtn.textContent = `❌ ${errorMessage}`;
            
            // Показываем диалог с объяснением
            setTimeout(() => {
                if (confirm(`${userMessage}\n\nХотите выбрать район вручную?`)) {
                    showDistrictSelector();
                } else {
                    if (locationBtn) locationBtn.textContent = '📍 Мое местоположение';
                }
            }, 1000);
        },
        options
    );
}

function showDistrictSelector() {
    closeLocationModal();
    
    const districtHTML = `
        <div id="districtModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 400px;
                max-height: 80vh; overflow-y: auto;
            ">
                <h3 style="margin: 0 0 16px 0; text-align: center;">Выберите район</h3>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${DISTRICTS.map(district => `
                        <button onclick="selectDistrict('${district}')" style="
                            padding: 12px 16px; background: #f8f9fa; border: 1px solid #e0e0e0;
                            border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s;
                        " onmouseover="this.style.background='#e8f5e8'; this.style.borderColor='#4CAF50'"
                           onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#e0e0e0'">
                            ${district}
                        </button>
                    `).join('')}
                </div>
                
                <button onclick="closeDistrictModal()" style="
                    width: 100%; margin-top: 16px; padding: 12px; background: #f0f0f0; color: #333;
                    border: none; border-radius: 8px; cursor: pointer;
                ">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', districtHTML);
}

function selectDistrict(district) {
    closeDistrictModal();
    
    userManualLocation = district;
    userCoordinates = null;
    
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) {
        locationBtn.textContent = `📍 ${district} (выбран вручную)`;
    }
    
    updateServicesWithDistance();
    
    localStorage.setItem('userLocation', JSON.stringify({
        type: 'district',
        data: district,
        timestamp: Date.now()
    }));
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) modal.remove();
}

function closeDistrictModal() {
    const modal = document.getElementById('districtModal');
    if (modal) modal.remove();
}

// Функция расчета расстояния между координатами (формула гаверсинусов)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Обновление расстояний до услуг
function updateServicesWithDistance() {
    if (!userCoordinates && !userManualLocation) return;
    
    allData = allData.map(service => {
        if (userCoordinates) {
            // Если у нас есть точные координаты пользователя
            const serviceCoords = DISTRICT_COORDINATES[service.location] || [56.3287, 44.0020];
            const distance = calculateDistance(
                userCoordinates.latitude, 
                userCoordinates.longitude,
                serviceCoords[0], 
                serviceCoords[1]
            );
            service.distance = Math.round(distance * 10) / 10;
        } else if (userManualLocation) {
            // Если пользователь выбрал район
            if (service.location === userManualLocation) {
                service.distance = 0.1; // В том же районе
            } else {
                const userCoords = DISTRICT_COORDINATES[userManualLocation] || [56.3287, 44.0020];
                const serviceCoords = DISTRICT_COORDINATES[service.location] || [56.3287, 44.0020];
                const distance = calculateDistance(
                    userCoords[0], userCoords[1],
                    serviceCoords[0], serviceCoords[1]
                );
                service.distance = Math.round(distance * 10) / 10;
            }
        }
        return service;
    });
    
    // Сортируем по расстоянию
    allData.sort((a, b) => a.distance - b.distance);
    
    // Перезагружаем отображение
    loadServices();
}

// Восстановление местоположения при загрузке
function restoreUserLocation() {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        try {
            const locationData = JSON.parse(savedLocation);
            const locationBtn = document.getElementById('locationBtn');
            
            // Проверяем, не устарели ли данные (старше 24 часов)
            const isExpired = locationData.timestamp && (Date.now() - locationData.timestamp > 24 * 60 * 60 * 1000);
            
            if (locationData.type === 'coordinates' && !isExpired) {
                userCoordinates = locationData.data;
                const accuracy = locationData.accuracy || 0;
                const locationText = accuracy < 100 ? 
                    `✅ Точное местоположение` : 
                    `✅ Примерное местоположение`;
                if (locationBtn) locationBtn.textContent = locationText;
                updateServicesWithDistance();
            } else if (locationData.type === 'district') {
                userManualLocation = locationData.data;
                if (locationBtn) locationBtn.textContent = `📍 ${locationData.data}`;
                updateServicesWithDistance();
            } else if (isExpired && locationBtn) {
                locationBtn.textContent = '📍 Обновить местоположение';
                localStorage.removeItem('userLocation');
            }
        } catch (error) {
            console.error('Ошибка восстановления местоположения:', error);
            localStorage.removeItem('userLocation');
        }
    }
}


function contactProvider(service) {
    const isRequest = service.type === 'request';
    const message = isRequest ? 
        `Здравствуйте! Я могу помочь с вашей просьбой "${service.title}". Готов обсудить детали.` :
        `Здравствуйте! Меня интересует вашу услугу "${service.title}". Хочу задать пару вопросов по деталям и условиям.`;
    
    // Извлекаем username без @
    const username = service.contact.replace('@', '');
    const telegramUrl = `https://t.me/${username}?text=${encodeURIComponent(message)}`;
    
    // Показываем подтверждение перехода
    showContactConfirmation(service.provider, telegramUrl, message);
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
                type: currentView === 'requests' ? 'request' : 'service'
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

console.log('NeighborHelp app с упрощенной Google Sheets интеграцией загружен!');

// Показать подробную информацию об услуге/просьбе
function showServiceDetails(serviceData) {
    // Если передан только ID, найдем полные данные
    let service;
    if (typeof serviceData === 'number') {
        service = allData.find(item => item.id === serviceData);
        if (!service) {
            alert('Услуга не найдена');
            return;
        }
    } else {
        service = serviceData;
    }
    
    const isRequest = service.type === 'request';
    const modalTitle = isRequest ? 'Подробности просьбы' : 'Подробности услуги';
    
    const modalHTML = `
        <div id="serviceDetailsModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 500px;
                max-height: 80vh; overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0;">${modalTitle}</h3>
                    <button onclick="closeServiceDetailsModal()" style="
                        background: none; border: none; font-size: 24px; cursor: pointer; color: #666;
                    ">&times;</button>
                </div>
                
                <div class="service-detail-content">
                    <div class="service-detail-header" style="margin-bottom: 20px;">
                        <h2 style="color: #333; margin: 0 0 8px 0; font-size: 20px;">${service.title}</h2>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 18px; color: #4CAF50; font-weight: 600;">${service.price}</span>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span>⭐</span>
                                <span style="font-weight: 600;">${service.rating}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="service-detail-description" style="margin-bottom: 20px;">
                        <h4 style="color: #333; margin: 0 0 8px 0;">Описание:</h4>
                        <p style="color: #666; line-height: 1.5; margin: 0;">${service.description}</p>
                    </div>
                    
                    <div class="service-detail-info" style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <h4 style="color: #333; margin: 0 0 4px 0; font-size: 14px;">Категория:</h4>
                                <p style="margin: 0; color: #666;">${getCategoryName(service.category)}</p>
                            </div>
                            <div>
                                <h4 style="color: #333; margin: 0 0 4px 0; font-size: 14px;">Местоположение:</h4>
                                <p style="margin: 0; color: #666;">📍 ${service.location}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="service-detail-provider" style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #333; margin: 0 0 4px 0; font-size: 14px;">
                                    ${isRequest ? 'Заказчик:' : 'Исполнитель:'}
                                </h4>
                                <p style="margin: 0; color: #4CAF50; font-weight: 600; cursor: pointer;" 
                                   onclick="showUserProfile('${service.provider}', '${service.contact}')">
                                    ${service.provider}
                                </p>
                            </div>
                            <button onclick="showUserProfile('${service.provider}', '${service.contact}')" style="
                                padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px;
                                color: #333; cursor: pointer; font-size: 12px;
                            ">Профиль</button>
                        </div>
                    </div>
                    <div class="service-detail-actions" style="display: flex; gap: 12px;">
                        <button onclick="contactProvider({
                            id: ${service.id},
                            title: \`${service.title}\`,
                            description: \`${service.description}\`,
                            provider: \`${service.provider}\`,
                            contact: '${service.contact}',
                            type: '${service.type}'
                        })" style="
                            flex: 2; padding: 14px 20px; background: #4CAF50; color: white;
                            border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer;
                        ">💬 Написать в Telegram</button>
                        <button onclick="shareService({
                            id: ${service.id},
                            title: \`${service.title}\`,
                            description: \`${service.description}\`,
                            provider: \`${service.provider}\`,
                            contact: '${service.contact}',
                            type: '${service.type}'
                        })" style="
                            flex: 1; padding: 14px 16px; background: #2196F3; color: white;
                            border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                        ">📤</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal('serviceDetailsModal', modalHTML);
}

// Показать профиль пользователя
function showUserProfile(userName, userContact) {
    const modalHTML = `
        <div id="userProfileModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1001;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 500px;
                max-height: 80vh; overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Профиль пользователя</h3>
                    <button onclick="closeUserProfileModal()" style="
                        background: none; border: none; font-size: 24px; cursor: pointer; color: #666;
                    ">&times;</button>
                </div>
                
                <div class="user-profile-content">
                    <div class="user-profile-header" style="text-align: center; margin-bottom: 24px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                        <div style="width: 80px; height: 80px; background: #4CAF50; border-radius: 50%; 
                                   display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
                            <span style="color: white; font-size: 32px; font-weight: 600;">
                                ${userName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h2 style="color: #333; margin: 0 0 4px 0;">${userName}</h2>
                        <p style="color: #666; margin: 0;">Telegram: ${userContact}</p>
                        <div style="margin-top: 12px;">
                            <span style="background: #e8f5e8; color: #4CAF50; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                                ⭐ ${(Math.random() * 0.5 + 4.5).toFixed(1)} рейтинг
                            </span>
                            <span style="background: #e3f2fd; color: #2196F3; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">
                                📈 ${Math.floor(Math.random() * 50 + 10)} сделок
                            </span>
                        </div>
                    </div>
                    
                    <div class="user-services-section" style="margin-bottom: 20px;">
                        <h4 style="color: #333; margin: 0 0 12px 0;">Активные объявления:</h4>
                        <div id="userServicesList">
                            <div style="text-align: center; color: #666; padding: 20px;">
                                Загружаем объявления пользователя...
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-profile-actions" style="display: flex; gap: 12px;">
                        <button onclick="contactUserDirectly('${userContact}')" style="
                            flex: 1; padding: 14px 20px; background: #4CAF50; color: white;
                            border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                        ">💬 Написать</button>
                        <button onclick="reportUser('${userName}', '${userContact}')" style="
                            padding: 14px 16px; background: #f44336; color: white;
                            border: none; border-radius: 8px; cursor: pointer;
                        ">⚠️</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal('userProfileModal', modalHTML);
    loadUserServices(userName);
}

// Загрузить объявления пользователя
async function loadUserServices(userName) {
    const userServicesList = document.getElementById('userServicesList');
    
    try {
        const userServices = allData.filter(item => item.provider === userName);
        
        if (userServices.length === 0) {
            userServicesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">У пользователя пока нет активных объявлений</div>';
            return;
        }
        
        userServicesList.innerHTML = '';
        
        userServices.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.style.cssText = `
                border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 8px;
                cursor: pointer; transition: all 0.2s;
            `;
            
            serviceElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${service.title}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${service.description.substring(0, 60)}${service.description.length > 60 ? '...' : ''}</div>
                        <div style="font-size: 12px; color: #4CAF50;">
                            ${service.type === 'request' ? '🔍 Просьба' : '💼 Услуга'} • ${service.price}
                        </div>
                    </div>
                    <button onclick="openServiceFromProfile(${JSON.stringify(service).replace(/"/g, '&quot;')})" style="
                        padding: 6px 12px; background: #f0f0f0; border: none; border-radius: 4px;
                        color: #333; cursor: pointer; font-size: 12px; margin-left: 12px;
                    ">Открыть</button>
                </div>
            `;
            
            serviceElement.addEventListener('mouseenter', () => {
                serviceElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                serviceElement.style.borderColor = '#4CAF50';
            });
            
            serviceElement.addEventListener('mouseleave', () => {
                serviceElement.style.boxShadow = 'none';
                serviceElement.style.borderColor = '#e0e0e0';
            });
            
            userServicesList.appendChild(serviceElement);
        });
        
    } catch (error) {
        userServicesList.innerHTML = '<div style="text-align: center; color: #ff6b6b; padding: 20px;">Ошибка загрузки объявлений</div>';
    }
}



function contactUserDirectly(userContact) {
    const username = userContact.replace('@', '');
    const message = `Здравствуйте! Увидел ваш профиль в приложении NeighborHelp. Хотел бы обсудить возможность сотрудничества.`;
    const telegramUrl = `https://t.me/${username}?text=${encodeURIComponent(message)}`;
    
    // Извлекаем имя из контакта для отображения
    const displayName = userContact;
    showContactConfirmation(displayName, telegramUrl, message);
}

// Поделиться услугой
function shareService(service) {
    const isRequest = service.type === 'request';
    const shareText = `${isRequest ? '🔍 Просьба' : '💼 Услуга'}: ${service.title}

${service.description}

💰 ${service.price}
📍 ${service.location}
⭐ ${service.rating}

${isRequest ? 'Заказчик' : 'Исполнитель'}: ${service.provider}
Связаться: ${service.contact}

#NeighborHelp`;

    if (navigator.share) {
        navigator.share({
            title: service.title,
            text: shareText,
            url: window.location.href
        });
    } else {
        // Копируем в буфер обмена
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Информация об услуге скопирована в буфер обмена!');
        }).catch(() => {
            alert('Поделиться:\n\n' + shareText);
        });
    }
}

// Пожаловаться на пользователя
function reportUser(userName, userContact) {
    if (confirm(`Пожаловаться на пользователя ${userName}?`)) {
        if (tg) {
            tg.sendData(JSON.stringify({
                action: 'report_user',
                user_name: userName,
                user_contact: userContact
            }));
            
            tg.showAlert('Жалоба отправлена. Мы рассмотрим её в течение 24 часов.');
        } else {
            alert('Жалоба отправлена администрации.');
        }
        
        closeUserProfileModal();
    }
}

// Получить название категории
function getCategoryName(category) {
    const categories = {
        'animals': 'Животные',
        'delivery': 'Доставка', 
        'home': 'Дом и быт',
        'elderly': 'Помощь пожилым',
        'transport': 'Транспорт',
        'services': 'Профуслуги'
    };
    return categories[category] || category;
}

function openServiceFromProfile(service) {
    // Закрываем профиль и открываем детали услуги
    closeUserProfileModal();
    showServiceDetails(service);
}

function showContactConfirmation(providerName, telegramUrl, message) {
    const confirmHTML = `
        <div id="contactConfirmModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1002;
        ">
            <div style="
                background: white; padding: 20px; border-radius: 12px; width: 90%; max-width: 400px;
                text-align: center;
            ">
                <h3 style="margin: 0 0 16px 0; color: #333;">Переход в диалог</h3>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: #666; margin: 0 0 12px 0; line-height: 1.5;">
                        При переходе в диалог с <strong>${providerName}</strong> приложение закроется.
                    </p>
                    <p style="color: #666; margin: 0; font-size: 14px;">
                        Вы уверены, что хотите продолжить?
                    </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #555; font-style: italic;">
                        Заготовка сообщения:<br>
                        "${message}"
                    </p>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="confirmContact('${telegramUrl}')" style="
                        flex: 1; padding: 12px 20px; background: #4CAF50; color: white;
                        border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                    ">Да, перейти</button>
                    <button onclick="closeContactConfirmModal()" style="
                        flex: 1; padding: 12px 20px; background: #f0f0f0; color: #333;
                        border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
                    ">Назад</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmHTML);
}

function confirmContact(telegramUrl) {
    // Закрываем модальное окно подтверждения
    closeContactConfirmModal();
    
    // Открываем Telegram
    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'opening_telegram',
            url: telegramUrl
        }));
    }
    
    window.open(telegramUrl, '_blank');
    
    // Показываем сообщение об успешном переходе
    if (tg) {
        tg.showAlert('Переходим в Telegram...');
    }
}

function contactProviderById(serviceId) {
    const service = allData.find(item => item.id === serviceId);
    if (!service) {
        alert('Услуга не найдена');
        return;
    }
    contactProvider(service);
}

function showServiceDetailsById(serviceId) {
    const service = allData.find(item => item.id === serviceId);
    if (!service) {
        alert('Услуга не найдена');
        return;
    }
    showServiceDetails(service);
}

function closeContactConfirmModal() {
    const modal = document.getElementById('contactConfirmModal');
    if (modal) {
        modal.remove();
    }
}

function closeServiceDetailsModal() {
    closeAllModals();
}

function closeUserProfileModal() {
    closeAllModals();
}


// Функция для отладки геолокации
function debugLocation() {
    console.log('=== DEBUG LOCATION ===');
    console.log('navigator.geolocation:', navigator.geolocation);
    console.log('tg.platform:', tg?.platform);
    console.log('userAgent:', navigator.userAgent);
    console.log('https:', window.location.protocol === 'https:');
    console.log('userCoordinates:', userCoordinates);
    console.log('userManualLocation:', userManualLocation);
    
    if (navigator.geolocation) {
        console.log('Тестируем геолокацию...');
        navigator.geolocation.getCurrentPosition(
            (pos) => console.log('SUCCESS:', pos),
            (err) => console.log('ERROR:', err),
            { timeout: 10000 }
        );
    }
}

// Добавьте эту функцию в конец файла
function handleLocationInTelegram() {
    // В Telegram WebApp можем попробовать получить город через IP
    if (tg) {
        // Отправляем запрос боту для определения примерного местоположения
        tg.sendData(JSON.stringify({
            action: 'request_location',
            user_id: user?.id,
            platform: tg.platform
        }));
        
        // Показываем диалог выбора района
        setTimeout(() => {
            showDistrictSelector();
        }, 1000);
    }
}