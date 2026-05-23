
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/theme/colors.dart';
import '../core/widgets/button.dart';
import '../core/data/auth_service.dart';
import 'login_screen.dart';
import 'home_screen.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _licensePlateCtrl = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _licensePlateCtrl.dispose();
    super.dispose();
  }

  String? _validate() {
    if (_firstNameCtrl.text.trim().isEmpty)
      return 'Please enter your first name';
    if (_lastNameCtrl.text.trim().isEmpty) return 'Please enter your last name';
    if (_emailCtrl.text.trim().isEmpty) return 'Please enter your email';
    if (_passwordCtrl.text.trim().isEmpty) return 'Please enter a password';
    if (_passwordCtrl.text.trim().length < 6)
      return 'Password must be at least 6 characters';
    if (_licensePlateCtrl.text.trim().isEmpty)
      return 'Please enter your license plate';
    return null;
  }

  Future<void> _onGetStarted() async {
    final error = _validate();
    if (error != null) {
      _showError(error);
      return;
    }

    setState(() => _isLoading = true);

    // ── Appel AuthService → register + login + fetch /auth/me ──
    final result = await AuthService.instance.register(
      firstName: _firstNameCtrl.text.trim(),
      lastName: _lastNameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text.trim(),
      plateNumber: _licensePlateCtrl.text.trim(),
    );

    setState(() => _isLoading = false);
    if (!mounted) return;

    if (result.isSuccess) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      _showError(result.errorMessage ?? 'Registration failed');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.scaffold),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Create Account',
                      style: TextStyle(
                        fontFamily: "Outfit",
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.texts,
                      ),
                    ),
                    // Logo Gariha
                    SvgPicture.asset("theme/icons/Group 7.svg", height: 50),
                  ],
                ),

                const SizedBox(height: 36),

                // Ligne 1 : First name + Last name
                Row(
                  children: [
                    Expanded(
                      child: _AuthField(
                        label: 'First name',
                        controller: _firstNameCtrl,
                        keyboardType: TextInputType.name,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _AuthField(
                        label: 'Last name',
                        controller: _lastNameCtrl,
                        keyboardType: TextInputType.name,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Email
                _AuthField(
                  label: 'Email',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 20),

                // Password
                _AuthField(
                  label: 'Password',
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  suffixIcon: GestureDetector(
                    onTap: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    child: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: AppColors.primaryCyan,
                      size: 20,
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // License Plate
                _AuthField(
                  label: 'License Plate',
                  controller: _licensePlateCtrl,
                  keyboardType: TextInputType.text,
                ),

                const SizedBox(height: 28),

                GarihaButton(
                  label: 'Get started',
                  onPressed: _onGetStarted,
                  isLoading: _isLoading,
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    const Text(
                      'Already have an account? ',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                        fontFamily: 'Afacad',
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      ),
                      child: const Text(
                        'Login',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryCyan,
                          fontFamily: 'Afacad',
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),
                const Center(
                  child: Text(
                    '© 2026 GARIHA. All rights reserved',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                      fontFamily: 'Afacad',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Champ formulaire ──────────────────────────────────────
class _AuthField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;

  const _AuthField({
    required this.label,
    required this.controller,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: const TextStyle(
        fontSize: 14,
        color: AppColors.text,
        fontFamily: 'Afacad',
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(
          color: AppColors.primaryCyan,
          fontSize: 14,
          fontFamily: 'Afacad',
        ),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.primaryCyan,
            width: 1.5,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.mediumBlue, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }
}


//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       body: Container(
//         width: double.infinity,
//         height: double.infinity,
//         decoration: const BoxDecoration(gradient: AppColors.scaffold),
//         child: SafeArea(
//           child: SingleChildScrollView(
//             padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 // Header
//                 Row(
//                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     ShaderMask(
//                       shaderCallback: (b) => AppColors.welcome.createShader(b),
//                       child: const Text(
//                         'Create Account',
//                         style: TextStyle(
//                           fontSize: 28,
//                           fontWeight: FontWeight.w900,
//                           color: Colors.white,
//                           fontFamily: 'Afacad',
//                         ),
//                       ),
//                     ),
//                     Container(
//                       width: 64,
//                       height: 64,
//                       decoration: BoxDecoration(
//                         shape: BoxShape.circle,
//                         gradient: const LinearGradient(
//                           colors: [AppColors.primaryCyan, AppColors.mediumBlue],
//                           begin: Alignment.topLeft,
//                           end: Alignment.bottomRight,
//                         ),
//                         boxShadow: [
//                           BoxShadow(
//                             color: AppColors.primaryCyan.withOpacity(0.3),
//                             blurRadius: 12,
//                             offset: const Offset(0, 4),
//                           ),
//                         ],
//                       ),
//                       child: const Icon(
//                         Icons.directions_car,
//                         color: Colors.white,
//                         size: 32,
//                       ),
//                     ),
//                   ],
//                 ),

//                 const SizedBox(height: 36),

//                 Row(
//                   children: [
//                     Expanded(
//                       child: _AuthField(
//                         label: 'Full name',
//                         controller: _fullNameCtrl,
//                         keyboardType: TextInputType.name,
//                       ),
//                     ),
//                     const SizedBox(width: 14),
//                     Expanded(
//                       child: _AuthField(
//                         label: "parking's name",
//                         controller: _parkingNameCtrl,
//                       ),
//                     ),
//                   ],
//                 ),

//                 const SizedBox(height: 20),

//                 _AuthField(
//                   label: 'Email',
//                   controller: _emailCtrl,
//                   keyboardType: TextInputType.emailAddress,
//                 ),

//                 const SizedBox(height: 20),

//                 _AuthField(
//                   label: 'Password',
//                   controller: _passwordCtrl,
//                   obscureText: _obscurePassword,
//                   suffixIcon: GestureDetector(
//                     onTap: () =>
//                         setState(() => _obscurePassword = !_obscurePassword),
//                     child: Icon(
//                       _obscurePassword
//                           ? Icons.visibility_outlined
//                           : Icons.visibility_off_outlined,
//                       color: AppColors.primaryCyan,
//                       size: 20,
//                     ),
//                   ),
//                 ),

//                 const SizedBox(height: 20),

//                 Row(
//                   children: [
//                     Expanded(
//                       child: _AuthField(
//                         label: 'Nbr of places',
//                         controller: _nbrPlacesCtrl,
//                         keyboardType: TextInputType.number,
//                       ),
//                     ),
//                     const SizedBox(width: 14),
//                     Expanded(
//                       child: _AuthField(
//                         label: 'Price /Hour',
//                         controller: _priceHourCtrl,
//                         keyboardType: TextInputType.number,
//                       ),
//                     ),
//                   ],
//                 ),

//                 const SizedBox(height: 20),

//                 _AuthField(
//                   label: 'Localisation',
//                   controller: _localisationCtrl,
//                 ),

//                 const SizedBox(height: 28),

//                 GarihaButton(
//                   label: 'Get started',
//                   onPressed: _isLoading
//                       ? null
//                       : _onGetStarted, // ← désactive pendant loading
//                   isLoading: _isLoading,
//                 ),

//                 const SizedBox(height: 16),

//                 Row(
//                   children: [
//                     const Text(
//                       'Already have an account? ',
//                       style: TextStyle(
//                         fontSize: 13,
//                         fontWeight: FontWeight.w600,
//                         color: AppColors.text,
//                         fontFamily: 'Afacad',
//                       ),
//                     ),
//                     GestureDetector(
//                       onTap: () => Navigator.pushReplacement(
//                         context,
//                         MaterialPageRoute(builder: (_) => const LoginScreen()),
//                       ),
//                       child: const Text(
//                         'Login',
//                         style: TextStyle(
//                           fontSize: 13,
//                           fontWeight: FontWeight.w600,
//                           color: AppColors.primaryCyan,
//                           fontFamily: 'Afacad',
//                         ),
//                       ),
//                     ),
//                   ],
//                 ),

//                 const SizedBox(height: 32),
//                 const Center(
//                   child: Text(
//                     '© 2026 GARIHA. All rights reserved',
//                     textAlign: TextAlign.center,
//                     style: TextStyle(
//                       fontSize: 10,
//                       color: AppColors.textMuted,
//                       fontFamily: 'Afacad',
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ),
//       ),
//     );
//   }
// }

// class _AuthField extends StatelessWidget {
//   final String label;
//   final TextEditingController controller;
//   final TextInputType keyboardType;
//   final bool obscureText;
//   final Widget? suffixIcon;

//   const _AuthField({
//     required this.label,
//     required this.controller,
//     this.keyboardType = TextInputType.text,
//     this.obscureText = false,
//     this.suffixIcon,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return TextField(
//       controller: controller,
//       keyboardType: keyboardType,
//       obscureText: obscureText,
//       style: const TextStyle(
//         fontSize: 14,
//         color: AppColors.text,
//         fontFamily: 'Afacad',
//       ),
//       decoration: InputDecoration(
//         labelText: label,
//         labelStyle: const TextStyle(
//           color: AppColors.primaryCyan,
//           fontSize: 14,
//           fontFamily: 'Afacad',
//         ),
//         suffixIcon: suffixIcon,
//         filled: true,
//         fillColor: Colors.white,
//         enabledBorder: OutlineInputBorder(
//           borderRadius: BorderRadius.circular(12),
//           borderSide: const BorderSide(
//             color: AppColors.primaryCyan,
//             width: 1.5,
//           ),
//         ),
//         focusedBorder: OutlineInputBorder(
//           borderRadius: BorderRadius.circular(12),
//           borderSide: const BorderSide(color: AppColors.mediumBlue, width: 2),
//         ),
//         contentPadding: const EdgeInsets.symmetric(
//           horizontal: 16,
//           vertical: 16,
//         ),
//       ),
//     );
//   }
// }
