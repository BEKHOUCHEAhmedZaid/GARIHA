import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:gariha_app/core/theme/colors.dart';

/// Bouton principal de l'application Gariha.
///
/// Utilisation :
/// ```dart
/// GarihaButton(
///   label: 'Find my vehicle',
///   onPressed: () { ... },
///   icon: Icons.navigation,
/// )
/// ```
class GarihaButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final String? svg;
  final IconData? icon;
  final double? width;
  final bool isOutlined; // true = bouton contour (ex: "Edit location")
  final bool isDestructive; // true = bouton rouge (ex: Logout)
  final bool isLoading; // true = affiche un spinner
  final bool isSecondary; //true = cancellation button
  final bool isBook; //true = book now button
  final bool isSign;

  const GarihaButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.svg,
    this.icon,
    this.width,
    this.isOutlined = false,
    this.isDestructive = false,
    this.isLoading = false,
    this.isSecondary = false,
    this.isBook = false,
    this.isSign = false,
  });

  @override
  Widget build(BuildContext context) {
    // ── Bouton destructif (Logout) ──────────────────────
    if (isDestructive) {
      return SizedBox(
        width: width ?? double.infinity,
        height: 52,
        child: OutlinedButton.icon(
          onPressed: isLoading ? null : onPressed,
          icon: Icon(Icons.logout, color: AppColors.logoutRed, size: 20),
          label: Text(
            label,
            style: const TextStyle(
              color: AppColors.logoutRed,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          style: OutlinedButton.styleFrom(
            backgroundColor: AppColors.logoutRedBg,
            side: const BorderSide(color: AppColors.logoutRed, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
          ),
        ),
      );
    }

    // ── Bouton contour (Edit location and preferences) ──
    // if (isOutlined) {
    //   return SizedBox(
    //     width: width ?? double.infinity,
    //     height: 52,
    //     child: OutlinedButton(
    //       onPressed: isLoading ? null : onPressed,
    //       style: OutlinedButton.styleFrom(
    //         side: const BorderSide(color: AppColors.mediumBlue, width: 1.5),
    //         shape: RoundedRectangleBorder(
    //           borderRadius: BorderRadius.circular(30),
    //         ),
    //       ),
    //       child: isLoading
    //           ? const SizedBox(
    //               width: 20,
    //               height: 20,
    //               child: CircularProgressIndicator(
    //                 strokeWidth: 2,
    //                 color: AppColors.mediumBlue,
    //               ),
    //             )
    //           : Text(
    //               label,
    //               textAlign: TextAlign.center,
    //               style: const TextStyle(
    //                 color: AppColors.mediumBlue,
    //                 fontWeight: FontWeight.w600,
    //                 fontSize: 14,
    //               ),
    //             ),
    //     ),
    //   );
    // }

    // ── Bouton secondaire (bleu-vert) ──────────────────
    if (isOutlined) {
      return SizedBox(
        width: width ?? double.infinity,
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: isLoading ? null : onPressed,
          child: Container(
            padding: const EdgeInsets.all(1.4),
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: const Color.fromARGB(60, 0, 0, 0),
                  blurRadius: 6,
                  offset: const Offset(0, 4),
                ),
              ],
              gradient: AppColors.border,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Container(
              padding: EdgeInsets.all(4),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.mediumBlue,
                      ),
                    )
                  : ShaderMask(
                      shaderCallback: (bounds) =>
                          AppColors.border.createShader(bounds),
                      child: Text(
                        label,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.w400,
                          fontFamily: "Outfit",
                          fontSize: 18,
                          color: Colors.white, // مهم باش يظهر gradient
                        ),
                      ),
                    ),
            ),
          ),
        ),
      );
    }
    if (isSecondary) {
      return SizedBox(
        width: width ?? double.infinity,
        // height: 50,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: AppColors.cancellation,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: const Color.fromARGB(60, 0, 0, 0),
                blurRadius: 10,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.only(top: 15, bottom: 12),
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.textWhite,
                    ),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.textWhite,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.w500,
                      fontSize: 24,
                      letterSpacing: 0.1,
                    ),
                  ),
          ),
        ),
      );
    }

    if (isSign) {
      return SizedBox(
        width: width ?? double.infinity,
        // height: 50,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: AppColors.cancellation,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: const Color.fromARGB(60, 0, 0, 0),
                blurRadius: 10,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.only(top: 10, bottom: 8),
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.textWhite,
                    ),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.textWhite,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.w500,
                      fontSize: 24,
                      letterSpacing: 0.1,
                    ),
                  ),
          ),
        ),
      );
    }

    if (isBook) {
      return SizedBox(
        width: width ?? double.infinity,
        // height: 50,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: AppColors.cancellation,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: const Color.fromARGB(60, 0, 0, 0),
                blurRadius: 4,
                
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.only(top: 2, bottom: 2),
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.textWhite,
                    ),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.textWhite,
                      fontFamily: "Outfit",
                      fontWeight: FontWeight.w500,
                      fontSize: 22,
                      letterSpacing: 1,
                    ),
                  ),
          ),
        ),
      );
    }

    // ── Bouton principal gradient (défaut) ──────────────
    return SizedBox(
      
      width: width ?? double.infinity,
      // height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppColors.find,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: const Color.fromARGB(60, 0, 0, 0),
              blurRadius: 10,
              spreadRadius: 2,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            padding: EdgeInsets.symmetric(horizontal: 6, vertical: 10),
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.textWhite,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, color: AppColors.textWhite, size: 20),
                      const SizedBox(width: 3),
                    ],
                    if (svg != null) ...[
                      SvgPicture.asset("$svg", height: 24),
                      const SizedBox(width: 10),
                    ],
                    Text(
                      label,
                      style: const TextStyle(
                        color: AppColors.textWhite,
                        fontFamily: "Afacad",
                        fontWeight: FontWeight.w400,
                        fontSize: 22,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
