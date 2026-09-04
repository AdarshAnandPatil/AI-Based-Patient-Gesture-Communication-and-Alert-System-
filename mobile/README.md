# CareGesture AI Mobile App

1. Install Flutter.
2. In this folder run `flutter create .`
3. Replace generated `lib/main.dart` with the supplied `lib/main.dart`.
4. Add the dependencies listed in `pubspec_additions.txt`.
5. Run `flutter pub get` and `flutter run`.

The app connects to the Render backend, shows large alerts, speaks them using native phone TTS, and supports acknowledge/resolve/escalate.

For true background push, configure Firebase Cloud Messaging with your own Firebase project. Do not commit private Firebase credentials.
