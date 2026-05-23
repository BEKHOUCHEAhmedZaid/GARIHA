import 'package:flutter/material.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/settings_tile.dart';
import '../core/widgets/toggle_switch_row.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // ── État des toggles (données backend) ────────────────
  bool _spotOpens = false;
  bool _realTimeAlerts = true;
  bool _timeReminder = true;
  bool _repeatAlert = false;
  bool _smartFrequency = true;

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
                          'Notifications',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.darkBlue,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Toggles
                        ToggleSwitchRow(
                          label: 'Notify when a spot opens in a saved area',
                          value: _spotOpens,
                          onChanged: (v) => setState(() => _spotOpens = v),
                        ),
                        ToggleSwitchRow(
                          label:
                              'Real-time alerts for nearby available parking',
                          value: _realTimeAlerts,
                          onChanged: (v) => setState(() => _realTimeAlerts = v),
                        ),
                        ToggleSwitchRow(
                          label: 'Time left reminder (10min before expiry)',
                          value: _timeReminder,
                          onChanged: (v) => setState(() => _timeReminder = v),
                        ),
                        ToggleSwitchRow(
                          label: 'Repeat alert until action is taken',
                          value: _repeatAlert,
                          onChanged: (v) => setState(() => _repeatAlert = v),
                        ),
                        ToggleSwitchRow(
                          label: 'Smart alerts frequency',
                          value: _smartFrequency,
                          onChanged: (v) => setState(() => _smartFrequency = v),
                        ),

                        const SizedBox(height: 8),
                        const Divider(color: AppColors.tableRowBg),
                        const SizedBox(height: 8),

                        // Liens
                        SettingsTile(label: 'Custom timing', onTap: () {}),
                        SettingsTile(label: 'Frequency', onTap: () {}),
                        SettingsTile(
                          label: 'Saved places & favorites',
                          onTap: () {},
                        ),
                        SettingsTile(
                          label: 'Quiet hours / do not disturb',
                          onTap: () {},
                          showArrow: false,
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
