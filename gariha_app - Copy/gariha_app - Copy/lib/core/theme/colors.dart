import 'dart:ui';

import 'package:flutter/material.dart';

class AppColors {
  // ── Couleurs principales ──────────────────────────────
  static const Color primaryCyan = Color.fromARGB(255, 69, 189, 225);
  static const Color darkBlue = Color.fromARGB(255, 20, 43, 146);
  static const Color mediumBlue = Color(0xFF2B5BA8);
  static const Color lightBlue = Color(0xFF4A9FD4);
  static const Color teal = Color(0xFF00B8CC);

  // ── Backgrounds ──────────────────────────────────────
  static const Color bgLight = Color(0xFFDDEEFF);
  static const Color bgWhite = Color(0xFFFFFFFF);
  static const Color cardBg = Color(0xFFF0F5FF);
  static const Color tableRowBg = Color(0xFFE8F4FB);
  static const Color tableRowAlt = Color(0xFFD6E8F5);

  // ── Texte ─────────────────────────────────────────────
  static const Color textDark = Color(0xFF1A3A6B);
  static const Color textMedium = Color(0xFF2B5BA8);
  static const Color textMuted = Color(0xFF6B7A99);
  static const Color textWhite = Color(0xFFFFFFFF);

  // ── Actions ───────────────────────────────────────────
  static const Color logoutRed = Color(0xFFFF4D6D);
  static const Color logoutRedBg = Color(0xFFFFE4E9);
  static const Color navBorder = Color(0xFF1A3A6B);

  // ── Icônes / éléments inactifs ────────────────────────
  static const Color iconGrey = Color(0xFFABB8CC);

  // ── Gradients ─────────────────────────────────────────

  /// Gradient principal : boutons, headers, cards bleues
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryCyan, mediumBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  /// Gradient vertical pour les backgrounds de pages
  static const LinearGradient bgGradient = LinearGradient(
    colors: [bgWhite, bgLight],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Gradient pour les cards sombres (Usage Summary, parking info)
  static const LinearGradient cardDarkGradient = LinearGradient(
    colors: [mediumBlue, darkBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Gradient pour les barres de progression (Home stats)
  static const LinearGradient barGradient = LinearGradient(
    colors: [primaryCyan, lightBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  /////////////////gariha real colors//////////////////
  ///
  ///
  //////////////text grdaients//////////////////////////////////////////
  static const LinearGradient logotext = LinearGradient(
    colors: [
      Color.fromARGB(255, 20, 41, 181),
      Color.fromARGB(255, 75, 207, 231),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );


  static const LinearGradient welcome = LinearGradient(
    colors: [
      Color.fromARGB(255, 25, 51, 177),
      Color.fromARGB(255, 74, 205, 230),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.topRight,
  );

  static const LinearGradient monthly = LinearGradient(
    colors: [
      Color.fromARGB(255, 75, 207, 231),
      Color.fromARGB(255, 25, 49, 177),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient park = LinearGradient(
    colors: [
      Color.fromARGB(255, 74, 159, 224),
      Color.fromARGB(255, 26, 55, 179),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient navtext = LinearGradient(
    colors: [
      Color.fromARGB(255, 36, 208, 243),
      Color.fromARGB(255, 6, 44, 179),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  //////////////////////container gradients///////////////////////
  ///
  ///
  static const LinearGradient scaffold = LinearGradient(
    colors: [
      Color.fromARGB(255, 255, 255, 255),
      Color.fromARGB(255, 169, 190, 217),
    ],
    begin: Alignment(-1, -0.5),
    end: Alignment(1, 0.5),
  );
  static const LinearGradient statistic = LinearGradient(
    colors: [
      Color.fromARGB(255, 74, 205, 230),
      Color.fromARGB(255, 29, 62, 181),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient find = LinearGradient(
    colors: [
      Color.fromARGB(255, 76, 206, 232),
      Color.fromARGB(255, 30, 62, 182),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient navborder = LinearGradient(
    colors: [
      Color.fromARGB(255, 75, 207, 231),
      Color.fromARGB(255, 25, 51, 177),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient usage = LinearGradient(
    colors: [
      Color.fromARGB(255, 84, 181, 229),
      Color.fromARGB(255, 47, 98, 196),
      Color.fromARGB(255, 26, 52, 176),
      Color.fromARGB(255, 26, 51, 178),
    ],
    begin: Alignment(-0.8, 0.8),
    end: Alignment(0.5, 0),
  );

  static const LinearGradient summary = LinearGradient(
    colors: [
      Color.fromARGB(255, 74, 205, 230),
      Color.fromARGB(255, 25, 50, 177),
    ],
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
  );

  static const LinearGradient cancellation = LinearGradient(
    colors: [
      Color.fromARGB(255, 37, 89, 190),
      Color.fromARGB(255, 74, 206, 230),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cancellation2 = LinearGradient(
    colors: [
      Color.fromARGB(255, 25, 50, 177),
      Color.fromARGB(255, 108, 230, 253),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient extend = LinearGradient(
    colors: [
      Color.fromARGB(255, 154, 164, 179),
      Color.fromARGB(255, 222, 228, 238),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient mixte = LinearGradient(
    colors: [
      Color.fromARGB(255, 34, 174, 210),
      Color.fromARGB(255, 59, 102, 209),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient active = LinearGradient(
    colors: [
      Color.fromARGB(255, 74, 206, 230),
      Color.fromARGB(255, 40, 99, 194),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient reserve = LinearGradient(
    colors: [
      Color.fromARGB(255, 76, 206, 232),
      Color.fromARGB(255,61, 101, 210),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient border = LinearGradient(
    colors: [
      Color.fromARGB(255, 59, 84, 207),
      Color.fromARGB(255, 75, 207, 231),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient reverse = LinearGradient(
    colors: [
      Color.fromARGB(255, 75, 207, 231),
      Color.fromARGB(255, 59, 84, 207),
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

/////////////////text colors///////////////////
///
static const Color text = Color.fromARGB(255, 13, 28, 110);
static const Color small = Color.fromARGB(255, 162, 161, 161);
static const Color texts = Color.fromARGB(255, 40, 56, 124);


}

