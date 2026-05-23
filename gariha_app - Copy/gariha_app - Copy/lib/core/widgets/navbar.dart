import 'package:flutter/material.dart';
import '../theme/colors.dart';
import 'package:flutter_svg/flutter_svg.dart';

// ── Items de navigation ────────────────────────────────────
class NavItem {
  final String iconPath;
  final String label;
  // final double size;

  const NavItem({required this.iconPath, required this.label});
}

const List<NavItem> navItems = [
  NavItem(iconPath: 'theme/icons/Home.svg', label: 'HOME'),
  NavItem(iconPath: 'theme/icons/Map.svg', label: 'MAP'),
  NavItem(iconPath: 'theme/icons/Icon (6).svg', label: 'PAYMENTS'),
  NavItem(iconPath: 'theme/icons/Clock.svg', label: 'HISTORY'),
  NavItem(iconPath: 'theme/icons/Clipboard.svg', label: 'RESERVATIONS'),
  NavItem(iconPath: 'theme/icons/Settings.svg', label: 'SETTINGS'),
  NavItem(iconPath: 'theme/icons/more.svg', label: 'MORE'),
];

// ══════════════════════════════════════════════════════════
// Widget principal
// ══════════════════════════════════════════════════════════
class GarihaNavBar extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onItemSelected;

  const GarihaNavBar({
    super.key,
    required this.currentIndex,
    required this.onItemSelected,
  });

  @override
  State<GarihaNavBar> createState() => _GarihaNavBarState();
}

class _GarihaNavBarState extends State<GarihaNavBar>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;

  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _animController.forward();
      } else {
        _animController.reverse();
      }
    });
  }

  void _selectItem(int index) {
    setState(() {
      _isExpanded = false;
      _animController.reverse();
    });
    widget.onItemSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final activeItem = navItems[widget.currentIndex];

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.only(bottom: 35, left: 20, right: 20, top: 8),
      child: Center(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          transitionBuilder: (child, animation) {
            return FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.92, end: 1.0).animate(animation),
                child: child,
              ),
            );
          },
          child: _isExpanded
              // ── Menu complet (remplace le bouton, même position) ──
              ? _ExpandedMenu(
                  key: const ValueKey('expanded'),
                  currentIndex: widget.currentIndex,
                  onItemSelected: _selectItem,
                )
              // ── Bouton seul actif ──
              : _ActiveButton(
                  key: const ValueKey('collapsed'),
                  item: activeItem,
                  onTap: _toggle,
                ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Bouton seul (état fermé)
// ══════════════════════════════════════════════════════════
class _ActiveButton extends StatelessWidget {
  final NavItem item;
  final VoidCallback onTap;

  const _ActiveButton({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // La
          ShaderMask(
            shaderCallback: (bounds) => AppColors.park.createShader(bounds),
            child: Text(
              item.label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontFamily: "Afacad",
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
          ),

          // Bouton ovale blanc avec bordure bleue foncée
          Container(
            padding: EdgeInsets.all(6),
            // width: 130,
            // height: 65,
            decoration: BoxDecoration(
              gradient: AppColors.navborder,
              borderRadius: BorderRadius.circular(35),
              boxShadow: [
                BoxShadow(
                  color: const Color.fromARGB(60, 0, 0, 0),
                  blurRadius: 4,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Container(
              padding: EdgeInsets.all(12),
              width: 110,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.bgWhite,
                borderRadius: BorderRadius.circular(40),

                boxShadow: [
                  BoxShadow(
                    color: const Color.fromARGB(60, 0, 0, 0),
                    blurRadius: 4,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: SvgPicture.asset(item.iconPath, width: 20),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Menu complet (état ouvert — remplace le bouton)
// ══════════════════════════════════════════════════════════
class _ExpandedMenu extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onItemSelected;

  const _ExpandedMenu({
    super.key,
    required this.currentIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(6),
      // width: double.infinity,
      // height: 65,
      decoration: BoxDecoration(
        gradient: AppColors.navborder,
        borderRadius: BorderRadius.circular(35),
        boxShadow: [
          BoxShadow(
            color: const Color.fromARGB(60, 0, 0, 0),
            blurRadius: 4,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Container(
        width: double.infinity,
        height: 50,
        padding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.bgWhite,
          borderRadius: BorderRadius.circular(40),

          boxShadow: [
            BoxShadow(
              color: const Color.fromARGB(60, 0, 0, 0),
              blurRadius: 4,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          // mainAxisSize: MainAxisSize.min,
          children: List.generate(navItems.length, (index) {
            final item = navItems[index];
            final isActive = index == currentIndex;

            return GestureDetector(
              onTap: () => onItemSelected(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                // width: 22,
                // height: 22,
                width: 25,
                height: 25,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                // decoration: BoxDecoration(
                //   color: isActive
                //       ? const Color.fromARGB(255, 193, 232, 236)
                //       : Colors.transparent,
                //   borderRadius: BorderRadius.circular(20),
                // ),
                child: SvgPicture.asset(
                  item.iconPath,

                  // color: isActive ? AppColors.mediumBlue : AppColors.iconGrey,
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
