import 'package:flutter/material.dart';
import 'colors.dart';
import '../widgets/navbar.dart';

/// Scaffold réutilisable pour tous les écrans Gariha.
/// La navbar est dans le body (Stack), pas dans bottomNavigationBar.
///
/// Utilisation :
/// ```dart
/// GarihaScaffold(
///   currentNavIndex: 0,
///   onNavItemSelected: _onNavItemSelected,
///   child: Column(
///     children: [ ... contenu de la page ... ],
///   ),
/// )
/// ```
class GarihaScaffold extends StatelessWidget {
  final int currentNavIndex;
  final ValueChanged<int> onNavItemSelected;
  final Widget child;

  const GarihaScaffold({
    super.key,
    required this.currentNavIndex,
    required this.onNavItemSelected,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.scaffold),
        child: SafeArea(
          child: Stack(
            children: [
              // ── Contenu principal (avec padding bas pour la navbar) ──
              Positioned.fill(
                bottom: 80, // espace pour la navbar
                child: child,
              ),

              // ── Navbar positionnée en bas ──
              Positioned(
                left: 0,
                right: 0,
                bottom: -30,
                child: GarihaNavBar(
                  currentIndex: currentNavIndex,
                  onItemSelected: onNavItemSelected,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
