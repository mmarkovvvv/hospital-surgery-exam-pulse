# BEEP — локальная платформа

Изолированная TypeScript/Next.js/Payload-версия платформы. Текущая статическая версия в корне проекта не затрагивается.

## Локальный запуск

```bash
cd platform
cp .env.example .env
npm install
npm run generate:types
npm run seed
npm run dev
```

Открой `http://localhost:3000`. Payload Admin доступен по `http://localhost:3000/admin`.

Чтобы создать или обновить локального администратора, открой второй терминал и выполни:

```bash
npm run create-admin
```

Команда попросит email и пароль, после чего вход выполняется на `http://localhost:3000/admin/login`.

## Перенос материалов из статического приложения

Учебный контент исходного приложения хранится в `../app.js` и `../ozz-expanded.js`, а не в старой SQLite-базе. Импорт выполняется так:

```bash
npm run generate:types
npm run import:static
```

Команда импортирует карточки, тесты, билеты, клинические задачи и задачи с изображениями по двум предметам в коллекцию `learning-items`. По умолчанию записи получают видимость `registered`. Для первой публичной витрины можно явно выбрать режим:

```bash
IMPORT_VISIBILITY=public npm run import:static
```

Изображения и исходные поля сохраняются в `sourceData`; подключение файлов к Payload Media — отдельный следующий шаг, чтобы текущий статический сайт не ломался.

## Telegram Mini App

Телеграм-бот не должен получать токен из кода или из Git. В локальном `.env` заполни:

```dotenv
TELEGRAM_BOT_TOKEN=новый_токен_из_BotFather
TELEGRAM_MINI_APP_URL=https://твой-домен.example
PUBLIC_APP_URL=https://твой-домен.example
TELEGRAM_WEBHOOK_SECRET=длинная-случайная-строка
```

`TELEGRAM_MINI_APP_URL` должен быть публичным HTTPS-адресом: Telegram не открывает `localhost` у пользователя. После деплоя приложения выполни:

```bash
npm run telegram:set-webhook
```

Команда подключит `/api/telegram/webhook`, а Mini App проверит подписанную Telegram-строку на сервере и создаст или найдёт пользователя Payload по `telegramUserId`. Клиентские поля `initDataUnsafe` сами по себе не считаются доказательством личности.

## Публикация на Render

Для первого запуска создай Web Service из репозитория и укажи:

- Root Directory: `platform`;
- Build Command: `npm install && npm run generate:types && npm run build`;
- Start Command: `npm run start`;
- Environment: `DATABASE_URL`, `PAYLOAD_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MINI_APP_URL`, `PUBLIC_APP_URL`, `TELEGRAM_WEBHOOK_SECRET`.

Для постоянных данных используй внешнюю PostgreSQL-базу или платный постоянный диск/базу. Бесплатные временные среды подходят только для прототипа: база может удаляться или засыпать. После появления публичного HTTPS URL обнови `TELEGRAM_MINI_APP_URL` и выполни `npm run telegram:set-webhook`.

На бесплатном тарифе Render Shell может быть недоступен — он не нужен для первого запуска. При старте приложение само создаёт схему Payload и один раз импортирует материалы из `app.js` и `ozz-expanded.js`. Контент загружается с GitHub, если эти файлы недоступны внутри Docker-контейнера. Ручные команды `npm run import:static` и `npm run telegram:set-webhook` остаются для повторного импорта и настройки webhook.

Для браузерных тестов один раз установи Chromium:

```bash
npx playwright install chromium
```

## Проверки

```bash
npm run test:int
npm run test:e2e
npm run lint
npm run build
```

## Доступ к материалам

- `public` — опубликованный материал виден всем;
- `registered` — виден только авторизованному пользователю;
- `subscription` — виден пользователю с активным планом подписчика;
- `admin` — управляет пользователями и материалами через Payload Admin.

У нового пользователя по умолчанию `student` и `free`. Поля роли, плана и даты окончания подписки изменяются только администратором. Ответы материалов не отдаются гостю в каталоге.

## Что сделано сейчас

Первый вертикальный срез включает SQLite, Payload Auth, регистрацию, вход, выход, коллекцию учебных материалов, seed-данные, серверную проверку доступа, TDD unit-тесты и Playwright-проверки воронки.

Оплата, webhook от платёжного провайдера, продление подписки и полноценный личный кабинет прогресса пока не включены: они будут следующим отдельным срезом после выбора провайдера и модели продукта.
