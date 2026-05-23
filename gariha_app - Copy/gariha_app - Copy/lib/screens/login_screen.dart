
import 'package:flutter_svg/svg.dart';
import 'package:flutter/material.dart';
import '../core/theme/colors.dart';
import '../core/widgets/button.dart';
import '../core/data/auth_service.dart';
import 'signup_screen.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _onLogin() async {
    if (_emailCtrl.text.trim().isEmpty || _passwordCtrl.text.trim().isEmpty) {
      _showError('Please fill in all fields');
      return;
    }

    setState(() => _isLoading = true);

    AuthResult? result;
    try {
      result = await AuthService.instance.login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text.trim(),
      );
    } catch (e) {
      // sécurité supplémentaire — ne devrait pas arriver car AuthService catch tout
      result = AuthResult.error('Unexpected error: $e');
    } finally {
      // ← TOUJOURS exécuté, même si exception — le spinner s'arrête TOUJOURS
      if (mounted) setState(() => _isLoading = false);
    }

    if (!mounted) return;

    if (result!.isSuccess) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      _showError(result.errorMessage ?? 'Login failed');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
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
                      'Login',
                      style: TextStyle(
                        fontFamily: "Outfit",
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.texts,
                      ),
                    ),
                    // Logo
                    SvgPicture.asset("theme/icons/Group 7.svg", height: 50),
                  ],
                ),

                const SizedBox(height: 12),
                const Text(
                  'Welcome back! Sign in to continue.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textMuted,
                    fontFamily: 'Afacad',
                  ),
                ),

                const SizedBox(height: 40),

                _AuthField(
                  label: 'Email',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 20),

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

                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: GestureDetector(
                      onTap: () {},
                      child: const Text(
                        'Forgot password?',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.primaryCyan,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Afacad',
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                GarihaButton(
                  label: 'Login',
                  onPressed: _isLoading
                      ? null
                      : () async {
                          setState(() => _isLoading = true);

                          try {
                            await _onLogin(); // ou signup
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (_) => HomeScreen()),
                            );
                          } catch (e) {
                            print(e);
                          } finally {
                            setState(() => _isLoading = false);
                          }
                        }, // ← désactive pendant loading
                  isLoading: _isLoading,
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    const Text(
                      "Don't have an account? ",
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
                        MaterialPageRoute(builder: (_) => const SignUpScreen()),
                      ),
                      child: const Text(
                        'Sign Up',
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

                const SizedBox(height: 40),
                const _OrDivider(),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: _SocialButton(
                        label: 'Sign in with Google',
                        isGoogle: true,
                        onTap: () {},
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _SocialButton(
                        label: 'Sign in with GitHub',
                        isGoogle: false,
                        onTap: () {},
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

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: AppColors.textMuted.withOpacity(0.4),
            thickness: 1,
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textMuted,
              fontFamily: 'Afacad',
            ),
          ),
        ),
        Expanded(
          child: Divider(
            color: AppColors.textMuted.withOpacity(0.4),
            thickness: 1,
          ),
        ),
      ],
    );
  }
}

// Bouton social
// ══════════════════════════════════════════════════════════
class _SocialButton extends StatelessWidget {
  final String label;
  final bool isGoogle;
  final VoidCallback onTap;

  const _SocialButton({
    required this.label,
    required this.isGoogle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.bgWhite,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: AppColors.iconGrey.withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.darkBlue.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: SvgPicture.asset(
                isGoogle
                    ? "theme/icons/icons8-google.svg"
                    : "theme/icons/icons8-github.svg",
              ),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.darkBlue,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
