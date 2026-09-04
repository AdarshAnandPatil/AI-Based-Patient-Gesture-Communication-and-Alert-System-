# Firebase FCM setup

1. Open Firebase Console and create a project.
2. Add an Android app.
3. Use the Flutter Android application ID shown in `android/app/build.gradle` / `android/app/build.gradle.kts`.
4. Download `google-services.json`.
5. Put it at:
   `mobile/android/app/google-services.json`
6. Configure the Google Services Gradle plugin according to the FlutterFire/Firebase Android setup for your installed Flutter version.
7. Run:
   `flutter pub get`
8. Build/run the Android app.
9. The app requests notification permission and registers its FCM token with:
   `POST /api/devices/register`
10. Add Firebase Admin credentials to Render environment variables for server-side push.

Never commit:
- google-services.json if your organization's policy treats it as sensitive
- Firebase service-account JSON
- FIREBASE_PRIVATE_KEY

## Multilingual phone voice

The app now reads each alert according to the `language` field sent by the backend:
- `en` → English (`en-IN`)
- `kn` → Kannada (`kn-IN`)
- `hi` → Hindi (`hi-IN`)

For Kannada/Hindi speech to work, the Android phone must have a compatible TTS voice installed. If the requested voice is unavailable, the app safely falls back to English instead of failing silently.

The same language-aware voice is used for:
- foreground push notifications
- the **Play Voice** button
