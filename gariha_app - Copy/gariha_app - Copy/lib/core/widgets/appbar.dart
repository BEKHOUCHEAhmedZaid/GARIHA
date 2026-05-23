import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:gariha_app/core/theme/colors.dart';


class GarihaAppBar extends StatelessWidget {
  final VoidCallback? onInfoTap;
  final VoidCallback? onProfileTap;

  const GarihaAppBar({super.key, this.onInfoTap, this.onProfileTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              GestureDetector(
                onTap: onInfoTap,
                child: SvgPicture.asset(
                  "theme/icons/alert.svg",
                  height: 16,
                  width: 16,
                ),
              ),
              const SizedBox(width: 18),
              GestureDetector(
                onTap: onProfileTap,
                child: SvgPicture.asset(
                  "theme/icons/user.svg",
                  height: 16,
                  width: 16,
                ),
              ),
            ], 
          ),

          const _GarihaLogo(),
        ],
      ),
    );
  }
}

// ── Logo GARIHA ────────────────────────────────────────────
class _GarihaLogo extends StatelessWidget {
  const _GarihaLogo();

  @override
  Widget build(BuildContext context) {
    return 
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SvgPicture.asset("theme/icons/Group 7.svg", height: 45),
          ShaderMask(
            shaderCallback: (bounds) =>
                AppColors.logotext.createShader(bounds),

            child: Text(
              "ARIHA",
              style: TextStyle(
                color: Colors.white,
                fontSize: 36,
                fontWeight: FontWeight.bold,
                fontFamily: "Outfit",
              ),
            ),
          ),
        ],
    );
  }
}
