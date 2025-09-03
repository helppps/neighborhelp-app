// Файл bot.js
// Простой Telegram бот для NeighborHelp
// Этот файл можно разместить на бесплатном хостинге

const TelegramBot = require('node-telegram-bot-api');

// Замените на ваш токен от BotFather
const BOT_TOKEN = process.env.BOT_TOKEN || 'demo_mode';
const bot = new TelegramBot(BOT_TOKEN, {polling: true});

// URL вашего Mini App
const MINI_APP_URL = 'https://helppps.github.io/neighborhelp-app/';

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Друг';
    
    const welcomeMessage = `
🏠 Добро пожаловать в NeighborHelp, ${firstName}!

Здесь вы можете найти помощь от соседей или предложить свои услуги.

🔥 Доступные категории:
🐕 Животные (выгул, передержка)
📦 Доставка (продукты, лекарства) 
🏠 Дом и быт (ремонт, уборка)
👴 Помощь пожилым
🚗 Транспорт (поездки, перевозки)
💻 IT-услуги

Нажмите кнопку ниже, чтобы открыть приложение! 👇
    `;
    
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🏠 Открыть NeighborHelp',
                        web_app: { url: MINI_APP_URL }
                    }
                ],
                [
                    { text: '❓ Помощь', callback_data: 'help' },
                    { text: '📞 Поддержка', callback_data: 'support' }
                ]
            ]
        }
    };
    
    bot.sendMessage(chatId, welcomeMessage, options);
});

// Обработчик данных от Mini App
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const data = JSON.parse(msg.web_app.data);
    
    console.log('Получены данные от Mini App:', data);
    
    // Обработка различных действий
    switch(data.action) {
        case 'contact_provider':
            handleContactProvider(chatId, data);
            break;
        case 'add_service':
            handleAddService(chatId, data);
            break;
        default:
            bot.sendMessage(chatId, '✅ Данные получены!');
    }
});

// Обработка связи с исполнителем
function handleContactProvider(chatId, data) {
    const message = `
🤝 Запрос на услугу отправлен!

📋 Услуга: ${data.service_title || 'Неизвестно'}
👤 Исполнитель: ${data.provider_contact || 'Неизвестно'}

💬 Ваше сообщение передано исполнителю. 
Ожидайте ответа в течение 15 минут.

Если исполнитель не ответит, мы найдем вам альтернативы! 🔄
    `;
    
    bot.sendMessage(chatId, message);
    
    // Здесь можно добавить логику уведомления исполнителя
    console.log(`Пользователь ${chatId} запросил услугу:`, data);
}

// Обработка добавления услуги
function handleAddService(chatId, data) {
    const message = `
✅ Ваша услуга добавлена на модерацию!

📝 Мы проверим объявление в течение 2 часов.
📢 После одобрения оно появится в общем списке.

Спасибо за участие в развитии сообщества! 🤗
    `;
    
    bot.sendMessage(chatId, message);
    
    // Сохранение услуги (здесь можно добавить базу данных)
    console.log(`Новая услуга от пользователя ${chatId}:`, data);
}

// Обработка кнопок
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    switch(data) {
        case 'help':
            const helpMessage = `
❓ Как использовать NeighborHelp:

1️⃣ Нажмите "Открыть NeighborHelp"
2️⃣ Выберите нужную категорию услуг
3️⃣ Найдите подходящее предложение
4️⃣ Нажмите на услугу для связи
5️⃣ Договоритесь об условиях

💡 Советы:
• Проверяйте рейтинг исполнителей
• Уточняйте детали до встречи
• Оплачивайте после выполнения
• Оставляйте отзывы

🔒 Безопасность:
• Не передавайте личные данные
• Встречайтесь в общественных местах
• Доверяйте своей интуиции
            `;
            bot.sendMessage(chatId, helpMessage);
            break;
            
        case 'support':
            const supportMessage = `
📞 Поддержка NeighborHelp

🕐 Часы работы: 9:00 - 21:00 (МСК)
📧 Email: support@neighborhelp.ru
💬 Telegram: @neighborhelp_support

⚡ Экстренные вопросы - пишите сразу!
🤝 Мы поможем решить любую проблему.

Ваша безопасность - наш приоритет! 🛡️
            `;
            bot.sendMessage(chatId, supportMessage);
            break;
    }
    
    // Убираем "часики" с кнопки
    bot.answerCallbackQuery(callbackQuery.id);
});

// Обработка обычных сообщений
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const response = `
Привет! 👋 

Для использования NeighborHelp нажмите кнопку "🏠 Открыть NeighborHelp" или отправьте команду /start

🚀 В приложении вас ждут:
• Сотни услуг от соседей
• Удобный поиск по категориям  
• Безопасные сделки
• Быстрая связь с исполнителями
        `;
        
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🏠 Открыть NeighborHelp',
                            web_app: { url: MINI_APP_URL }
                        }
                    ]
                ]
            }
        };
        
        bot.sendMessage(chatId, response, options);
    }
});

// Логирование ошибок
bot.on('error', (error) => {
    console.error('Ошибка бота:', error);
});

console.log('🤖 NeighborHelp бот запущен!');
console.log('📱 Mini App URL:', MINI_APP_URL);