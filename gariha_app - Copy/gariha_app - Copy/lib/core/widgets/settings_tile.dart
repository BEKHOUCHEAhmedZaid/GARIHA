import 'package:flutter/material.dart';
import '../theme/colors.dart';

/// Ligne de menu réutilisable pour les pages Settings, Notifications, Privacy.
///
/// Utilisation simple (avec flèche) :
/// ```dart
/// SettingsTile(
///   label: 'Notifications',
///   onTap: () { Navigator.push(...) },
/// )
/// ```
///
/// Utilisation avec valeur à droite :
/// ```dart
/// SettingsTile(
///   label: 'Location permission',
///   trailingText: 'Always allowed',
/// )
/// ```
class SettingsTile extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final String? trailingText; // texte à droite (ex: "Always allowed")
  final bool showArrow; // affiche >> à droite

  const SettingsTile({
    super.key,
    required this.label,
    this.onTap,
    this.trailingText,
    this.showArrow = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.tableRowBg, width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Label
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppColors.darkBlue,
                ),
              ),
            ),

            // Trailing : texte ou flèche
            if (trailingText != null)
              Text(
                trailingText!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textMuted,
                ),
              )
            else if (showArrow)
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
