# Makanika Connect

A responsive web-app prototype for helping drivers find roadside mechanics in Kampala. The app can be installed on supported mobile browsers as a progressive web app (PWA).

## Run locally

Start the Django API in one terminal:

```sh
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Run the Mobile App (Expo / React Native)

In a new terminal:

```sh
cd mobile
npm install
npx expo start
```

Press `a` to run on Android emulator or connected device, `i` for iOS simulator, or `w` for Web preview. You can also scan the QR code using the **Expo Go** app on your physical mobile phone.

### Run the Web Prototype

Start the web app from the project root:

```sh
npm install
npm start
```

`npm run dev` is also available as an equivalent command.
The Vite development server proxies `/api` requests to Django at `127.0.0.1:8000`.

Create and serve a production build with:

```sh
npm run build
npm run preview
```

## Prototype behavior

- Supports persistent driver and mechanic accounts using Django's built-in password hashing and CSRF-protected browser sessions. Sign-up and sign-in require the Django API to be running.
- Uses SQLite for local development. Configure PostgreSQL and production environment settings before deployment.
- Uses browser GPS only after the driver selects **Use GPS** and grants permission.
- Provides approximate manual location selection for several Kampala areas.
- Shows an interactive OpenStreetMap map alongside filters and mechanic results.
- Filters the sample mechanic profiles by service, maximum distance, and availability.
- Lets a driver submit an in-page demo request and view it in the mechanic workspace during the same browser session.
- Includes mechanic and admin workspace previews.
- Caches the app shell and built assets for offline reopening; map tiles require an internet connection.

Mechanic profiles, ratings, availability, distances, arrival estimates, and requests remain illustrative. Accounts are real and stored in the local Django database, but there is no email verification, password-reset flow, real contact data, dispatch, or notifications. Mechanic/admin workspaces and service requests are still previews and are not yet associated with account permissions. Submitting a request does not contact anyone. Do not use it for emergencies or as evidence that a mechanic is available.

Location permission requires a secure context, such as HTTPS, or localhost during development. The map uses OpenStreetMap tiles and includes attribution. Follow the relevant OpenStreetMap tile usage policy before deployment.

## Production account setup

Before deployment, set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, and `DJANGO_ALLOWED_HOSTS`; configure PostgreSQL, HTTPS, and secure cookies (`DJANGO_SECURE_COOKIES=true`). Create administrator accounts with `python manage.py createsuperuser`; public registration only permits driver and mechanic roles. Add email verification, password reset, role-based permissions for mechanic profiles and service requests, and provider verification before using real listings. Do not publish providers' contact or location details without their consent.
