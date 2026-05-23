import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/button.dart';
import '../core/widgets/info_field.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';
import '../core/data/app_models.dart';
import '../core/data/user_session.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final TextEditingController _emailCtrl = TextEditingController(
    text: '',
  );
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _addressCtrl = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = UserSession.instance.currentUser;
    _emailCtrl.text = user?.email ?? '';
    _phoneCtrl.text = user?.phone ?? '';
    _addressCtrl.text = user?.address ?? '';
  }

  Future<void> _onSave() async {
    setState(() => _isSaving = true);
    
    // Pour l'instant on met à jour localement :
    final session = context.read<UserSession>();
    final user = session.currentUser;
    if (user != null) {
      session.currentUser = UserModel(
        id:           user.id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        email:        _emailCtrl.text.trim(),
        phone:        _phoneCtrl.text.trim(),
        address:      _addressCtrl.text.trim(),
        parkingName:  user.parkingName,
        nbrOfPlaces:  user.nbrOfPlaces,
        pricePerHour: user.pricePerHour,
        localisation: user.localisation,
        subscription: user.subscription,
        memberSince:  user.memberSince,
        avatarUrl:    user.avatarUrl,
      );
    }
    
    await Future.delayed(const Duration(seconds: 1)); // TODO: appel API
    setState(() => _isSaving = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully'),
          backgroundColor: AppColors.mediumBlue,
        ),
      );
      Navigator.pop(context);
    }
  }

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
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const SizedBox(height: 8),
                  GarihaButton(
                    label: 'Edit Profile',
                    width: 140,
                    onPressed: () {},
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(24),
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
                        InfoField(
                          label: 'Email',
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 20),
                        InfoField(
                          label: 'Phone Nbr',
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 20),
                        InfoField(label: 'Address', controller: _addressCtrl),
                        const SizedBox(height: 28),
                        GarihaButton(
                          label: 'Save',
                          onPressed: _onSave,
                          isLoading: _isSaving,
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
