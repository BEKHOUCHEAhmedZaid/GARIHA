import 'package:flutter/material.dart';
import '../theme/colors.dart';

/// Ligne avec label + Switch ON/OFF — utilisée dans Notifications.
///
/// Utilisation :
/// ```dart
/// ToggleSwitchRow(
///   label: 'Real-time alerts for nearby available parking',
///   value: _realTimeAlerts,
///   onChanged: (val) => setState(() => _realTimeAlerts = val),
/// )
/// ```
class ToggleSwitchRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const ToggleSwitchRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Label
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textDark,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Switch
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.bgWhite,
            activeTrackColor: AppColors.primaryCyan,
            inactiveThumbColor: AppColors.bgWhite,
            inactiveTrackColor: AppColors.iconGrey,
          ),
        ],
      ),
    );
  }
}