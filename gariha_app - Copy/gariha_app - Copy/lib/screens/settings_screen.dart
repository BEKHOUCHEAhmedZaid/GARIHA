import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/button.dart';
import '../core/widgets/settings_tile.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'editProfile_screen.dart';
import 'notifications_screen.dart';
import 'privacy_screen.dart';
import 'login_screen.dart';
import '../core/data/user_session.dart';
import '../core/data/app_models.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
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
    final session = context.watch<UserSession>();
    final user = session.currentUser;
    final userName = user?.firstName ?? '';
    final userLastName = user?.lastName ?? '';
    final userEmail = user?.email ?? '';
    final subscription = user?.subscription ?? 'Regular';
    final memberSince = session.memberSince;
    final avatarUrl = user?.avatarUrl ?? '';

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
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),

                  // Bouton Edit Profile
                  Align(
                    alignment: Alignment.centerRight,
                    child: GarihaButton(
                      label: 'Edit Profile',
                      width: 140,
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const EditProfileScreen(),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Card profil
                  _ProfileCard(
                    userName: userName,
                    userLastName: userLastName,
                    email: userEmail,
                    subscription: subscription,
                    memberSince: memberSince,
                    avatarUrl: avatarUrl,
                  ),

                  const SizedBox(height: 20),

                  // Menu settings
                  Container(
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
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        SettingsTile(
                          label: 'Notifications',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NotificationsScreen(),
                            ),
                          ),
                        ),
                        SettingsTile(
                          label: 'Privacy & Security',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const PrivacyScreen(),
                            ),
                          ),
                        ),
                        SettingsTile(label: 'Language', onTap: () {}),
                        SettingsTile(
                          label: 'Interface & Visibility',
                          onTap: () {},
                          showArrow: false,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Logout
                  GarihaButton(
                    label: 'Logout',
                    isDestructive: true,
                    onPressed: () {
                      UserSession.instance.clear();
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (route) =>
                            false, // supprime tout le stack de navigation
                      );
                    },
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

class _ProfileCard extends StatelessWidget {
  final String userName;
  final String userLastName;
  final String email;
  final String subscription;
  final String memberSince;
  final String avatarUrl;

  const _ProfileCard({
    required this.userName,
    required this.userLastName,
    required this.email,
    required this.subscription,
    required this.memberSince,
    required this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppColors.tableRowBg,
                backgroundImage: avatarUrl.isNotEmpty
                    ? NetworkImage(avatarUrl)
                    : null,
                child: avatarUrl.isEmpty
                    ? Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.darkBlue,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '$userName ',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.darkBlue,
                            ),
                          ),
                          TextSpan(
                            text: userLastName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryCyan,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      email,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    const TextSpan(
                      text: 'Current Subscription: ',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.primaryCyan,
                      ),
                    ),
                    TextSpan(
                      text: subscription,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryCyan,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'Member since: $memberSince',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
