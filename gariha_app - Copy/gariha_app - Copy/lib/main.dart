import 'package:flutter/material.dart';
import 'package:gariha_app/core/widgets/map.dart';
import 'package:gariha_app/screens/history_screen.dart';
import 'package:gariha_app/screens/home_screen.dart';
import 'package:gariha_app/screens/payments_screen.dart';
import 'package:gariha_app/screens/reservation_screen.dart';
import 'package:gariha_app/screens/settings_screen.dart';
import 'package:gariha_app/screens/map_screen.dart';
import 'package:gariha_app/screens/signup_screen.dart';
import 'package:provider/provider.dart';
import 'package:gariha_app/core/data/user_session.dart';

// void main() {
//   runApp(
//     ChangeNotifierProvider(
//       create: (_) => UserSession.instance,
//       child: const MyApp(),
//     ),
//   );
// }

// class MyApp extends StatelessWidget {
//   const MyApp({super.key});

//   // This widget is the root of your application.
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Flutter Demo',
//       debugShowCheckedModeBanner: false,
//       theme: ThemeData(
//         colorScheme: ColorScheme.fromSeed(seedColor: const Color.fromARGB(255, 176, 181, 195)),
//       ),
//       home: const SignUpScreen()
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'core/data/auth_service.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';


void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<UserSession>.value(value: UserSession.instance),
      ],
      child: GarihaApp(),
    ),
  );
}
// void main() {
//   runApp(
//     MultiProvider(
//       providers: [ChangeNotifierProvider(create: (context) => UserSession())],
//       child: GarihaApp(),
//     ),
//   );
// }
// void main() {
//   runApp(const GarihaApp());
// }

class GarihaApp extends StatelessWidget {
  const GarihaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gariha',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Afacad',
        useMaterial3: true,
      ),
      // SplashScreen gère le auto-login check
      home: const SplashScreen(),
    );
  }
}

// ══════════════════════════════════════════════════════════
// SplashScreen — vérifie si un token JWT valide existe
// Si oui  → HomeScreen (l'utilisateur reste connecté)
// Si non  → LoginScreen
// ══════════════════════════════════════════════════════════
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Essayer de recharger le profil depuis /auth/me
    // avec le token sauvegardé dans SharedPreferences
    final isLoggedIn = await AuthService.instance.tryAutoLogin();

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => isLoggedIn
            ? const HomeScreen()   // token valide → rester connecté
            : const LoginScreen(), // pas de token → login
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Logo centré pendant le check
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.white, Color(0xFFDDEEFF)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Color(0xFF2B5BA8),
                child: Icon(Icons.directions_car,
                    color: Colors.white, size: 40),
              ),
              SizedBox(height: 16),
              Text(
                'GARIHA',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1A3A6B),
                  letterSpacing: 4,
                ),
              ),
              SizedBox(height: 24),
              CircularProgressIndicator(
                color: Color(0xFF00D4FF),
                strokeWidth: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
