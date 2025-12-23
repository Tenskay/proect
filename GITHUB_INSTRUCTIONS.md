# Инструкция по добавлению проекта в GitHub

## Шаг 1: Установка Git (если не установлен)

1. Скачайте Git с официального сайта: https://git-scm.com/download/win
2. Установите Git, следуя инструкциям установщика
3. Перезапустите терминал/командную строку

## Шаг 2: Инициализация Git репозитория

Откройте командную строку (или PowerShell) в папке проекта и выполните:

```bash
git init
```

## Шаг 3: Добавление файлов

Добавьте все файлы проекта в staging area:

```bash
git add .
```

## Шаг 4: Создание первого коммита

```bash
git commit -m "Initial commit: Node.js 2FA application"
```

## Шаг 5: Создание репозитория на GitHub

1. Зайдите на https://github.com
2. Нажмите кнопку "+" в правом верхнем углу
3. Выберите "New repository"
4. Введите название репозитория (например: `nodejs-2fa-app`)
5. НЕ создавайте README, .gitignore или лицензию (они уже есть)
6. Нажмите "Create repository"

## Шаг 6: Подключение к удаленному репозиторию

GitHub покажет вам команды после создания репозитория. Выполните (замените YOUR_USERNAME и YOUR_REPO_NAME на ваши данные):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Например:
```bash
git remote add origin https://github.com/yourusername/nodejs-2fa-app.git
```

## Шаг 7: Отправка файлов на GitHub

```bash
git branch -M main
git push -u origin main
```

Вас попросят ввести логин и пароль GitHub. Если у вас включена двухфакторная аутентификация, используйте Personal Access Token вместо пароля.

---

## Альтернативный способ через GitHub Desktop

Если не хотите использовать командную строку:

1. Скачайте GitHub Desktop: https://desktop.github.com/
2. Установите и войдите в свой аккаунт GitHub
3. File → Add Local Repository
4. Выберите папку проекта
5. Опубликуйте репозиторий через интерфейс

---

## Важно!

- Файл `.gitignore` уже настроен правильно
- `node_modules/` и `database.sqlite` не будут загружены в репозиторий
- Убедитесь, что все важные файлы добавлены перед коммитом

