# URL Shortener

[![CI](https://github.com/l-Monarch-l/url-shortener/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/l-Monarch-l/url-shortener/actions/workflows/ci.yml)

Сервис для сокращения ссылок с аналитикой переходов. REST API на Node.js + SPA на React, полностью контейнеризирован, с настроенным CI/CD.

## Возможности

- **Сокращение ссылок:** `POST /api/shorten` принимает URL, возвращает короткий код.
- **Редирект:** `GET /:code` перенаправляет на оригинальный URL (302).
- **Аналитика:** счётчик переходов и дата последнего клика для каждой ссылки.
- **Идемпотентность:** повторное сокращение того же URL возвращает существующий код.
- **Валидация:** принимаются только `http`/`https`, запрещены self-reference.
- **Управление ссылками:** просмотр списка, статистики, удаление.
- **Health-check:** для мониторинга и CI/CD.
- **Юнит- и интеграционные тесты:** 24 теста, покрытие ~89%.

## 🛠 Стек технологий

**Backend:**
- Node.js 22 (встроенный `node:sqlite`)
- Express 4
- nanoid (генерация коротких кодов)
- Jest + Supertest (тесты)
- ESLint 9

**Frontend:**
- React 18
- Vite
- Нативный `fetch` с проксированием через Vite (dev) / Nginx (prod)

**DevOps / Инфраструктура:**
- Docker (multi-stage build для frontend)
- Docker Compose (healthcheck для backend)
- Nginx (раздача SPA + проксирование `/api/*`)
- GitHub Actions (CI/CD)
- GitHub Container Registry (публикация образов)

## CI/CD Pipeline

Каждый пуш в `main` автоматически проверяет и публикует проект:

| Job | Что делает | Время |
|---|---|---|
| **Backend** | Установка deps + ESLint + 24 Jest-теста | ~16 сек |
| **Frontend** | Установка deps + ESLint + production-сборка Vite | ~15 сек |
| **Publish to GHCR** | Сборка и публикация Docker-образов | ~56 сек |
| **Smoke test** | `docker compose up` → проверка `/health`, `/api/shorten`, отдачи фронта | ~31 сек |

### Опубликованные Docker-образы

- Backend: [`ghcr.io/l-monarch-l/url-shortener/backend`](https://github.com/l-Monarch-l/url-shortener/pkgs/container/url-shortener%2Fbackend)
- Frontend: [`ghcr.io/l-monarch-l/url-shortener/frontend`](https://github.com/l-Monarch-l/url-shortener/pkgs/container/url-shortener%2Ffrontend)

**Структура workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Требования

- Docker Desktop (Windows/macOS) или Docker + Docker Compose (Linux)
- Свободные порты: **80** (frontend) и **3001** (backend)

## Быстрый запуск

### 1. Клонирование

```bash
git clone https://github.com/l-Monarch-l/url-shortener.git
cd url-shortener
```

### 2. Запуск

```bash
docker compose up --build
```

Первый запуск займёт 1–3 минуты.

### 3. Открытие

- **Приложение:** http://localhost
- **API (для отладки):** http://localhost:3001/api
- **Health-check:** http://localhost:3001/health

## 📡 Эндпоинты API

| Метод | Путь | Описание | Коды ответа |
|---|---|---|---|
| POST | `/api/shorten` | Сократить ссылку | `201` создано, `200` уже существует, `400` невалидный URL |
| GET | `/api/links` | Список всех ссылок | `200` |
| GET | `/api/stats/:code` | Статистика по коду | `200`, `404` |
| DELETE | `/api/links/:code` | Удалить ссылку | `204`, `404` |
| GET | `/:code` | Редирект на оригинал | `302`, `404` |
| GET | `/health` | Health-check | `200` |
| GET | `/` | Информация о сервисе | `200` |

### Примеры запросов

**Создать короткую ссылку:**

```bash
curl -X POST http://localhost/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/l-Monarch-l/url-shortener"}'
```

Ответ:
```json
{
  "code": "aB3xY9k",
  "shortUrl": "http://localhost/aB3xY9k",
  "originalUrl": "https://github.com/l-Monarch-l/url-shortener",
  "reused": false
}
```

**Получить статистику:**

```bash
curl http://localhost/api/stats/aB3xY9k
```

Nginx проксирует:
- `/api/*` → backend (API-запросы)
- `/<7-символьный-код>` → backend (редирект коротких ссылок)
- Всё остальное → SPA (`index.html`)

## Структура проекта

```
url-shortener/
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD: тесты, GHCR, smoke
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── links.js      # CRUD-роуты API
│   │   │   ├── redirect.js   # /:code → редирект
│   │   │   └── health.js     # /, /health
│   │   ├── services/
│   │   │   └── linkService.js  # бизнес-логика
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── db.js             # SQLite + миграции
│   │   └── app.js            # Express app (без listen)
│   ├── tests/
│   │   ├── api.test.js       # интеграционные
│   │   ├── linkService.test.js  # юнит
│   │   └── setup.js
│   ├── server.js             # точка входа
│   ├── eslint.config.js
│   ├── jest.config.js
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js            # fetch-обёртка
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── nginx.conf            # проксирование + SPA fallback
│   ├── eslint.config.js
│   ├── Dockerfile            # multi-stage
│   ├── .dockerignore
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .gitattributes
└── README.md
```

## Тесты

**Запуск:**

```bash
cd backend
npm test
```

**С покрытием:**

```bash
npx jest --runInBand --coverage
```

**Результат:** 24 теста (13 integration + 11 unit), покрытие ~89%.

## Технические решения

- **Идемпотентное сокращение:** если URL уже есть в БД, возвращаем существующий код, а не создаём новый. Это поведение bit.ly.
- **Кастомный алфавит** для генерации кодов без похожих символов (`0`/`O`, `1`/`l`/`I`).
- **Коллизии:** при генерации кода проверяем его уникальность (до 5 попыток). С 7 символами из 55-символьного алфавита коллизии практически невозможны (55⁷ ≈ 1.5×10¹²).
- **WAL-режим SQLite:** улучшает производительность чтения.
- **Разделение `app.js` / `server.js`:** позволяет тестам работать с Express-приложением без `listen`.
- **Graceful shutdown:** обрабатываем `SIGTERM`/`SIGINT` для корректного завершения в Docker.

## Автор: l-Monarch-l
