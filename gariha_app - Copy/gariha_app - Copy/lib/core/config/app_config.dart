/// Centralized configuration for the Gariha app.
/// Change `baseUrl` here to point to your backend server.
class AppConfig {
  // For Android emulator → 10.0.2.2
  // For real device on same WiFi → use your PC's local IP (e.g. 192.168.1.x)
  // For production → use your server domain
  static const String baseUrl = 'http://10.0.2.2:8000';
}
