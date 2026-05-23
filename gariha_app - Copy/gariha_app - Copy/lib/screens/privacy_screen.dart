import 'package:flutter/material.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/settings_tile.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({super.key});

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  // ── Données backend ────────────────────────────────────
  final List<Map<String, String>> privacySettings = [
    {'label': 'Location permission', 'value': 'Always allowed'},
    {'label': 'Use precise location', 'value': 'Always allowed'},
    {'label': 'Allow background location tracking', 'value': 'Always allowed'},
    {'label': 'Enable face ID / fingerprint', 'value': 'Always allowed'},
    {'label': 'Require authentication for payment', 'value': 'Always allowed'},
    {'label': 'Change password', 'value': 'Always allowed'},
    {'label': 'Clear location history', 'value': 'Always allowed'},
  ];

  void _onNavItemSelected(int index) {
    final screens = [
      const HomeScreen(),
      const MapScreen(),
      const PaymentsScreen(),
      const HistoryScreen(),
      const ReservationsScreen(),
      const SettingsScreen(),
    ];
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => screens[index]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GarihaScaffold(
      currentNavIndex: 5,
      onNavItemSelected: _onNavItemSelected,
      child: Column(
        children: [
          GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.bgWhite,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.darkBlue.withOpacity(0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Privacy & Security',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.darkBlue,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...privacySettings.map(
                          (s) => SettingsTile(
                            label: s['label']!,
                            trailingText: s['value'],
                            showArrow: false,
                            onTap: () {},
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
