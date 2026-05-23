// import 'package:flutter/material.dart';
// import '../theme/colors.dart';

// /// Ligne de tableau réutilisable — utilisée dans Payments et History.
// ///
// /// Utilisation Payments (Date / Location / Time / Price) :
// /// ```dart
// /// ParkingTableRow(
// ///   date: '2026-03-08',
// ///   location: 'ESTIN-Amizour',
// ///   time: '14:37',
// ///   lastColumn: '50DZD',
// ///   isEven: true,
// /// )
// /// ```
// ///
// /// Utilisation History (Date / Location / Time / Vehicle) :
// /// ```dart
// /// ParkingTableRow(
// ///   date: '2026-03-08',
// ///   location: 'ESTIN-Amizour',
// ///   time: '14:37',
// ///   lastColumn: 'Ford F-150',
// ///   isEven: true,
// /// )
// /// ```
// class ParkingTableRow extends StatelessWidget {
//   final String date;
//   final String location;
//   final String time;
//   final String lastColumn;
//   final bool isEven; // alterne la couleur des lignes

//   const ParkingTableRow({
//     super.key,
//     required this.date,
//     required this.location,
//     required this.time,
//     required this.lastColumn,
//     required this.isEven,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       color: isEven
//           ? Color.fromARGB(255, 235, 235, 235)
//           : Color.fromARGB(255, 217, 217, 217),
//       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),

//       child: Row(
//         mainAxisAlignment: MainAxisAlignment.spaceAround,
//         children: [
//           // Date
//           Expanded(
//             flex: 2,
//             child: Text(
//               date,
//               style: const TextStyle(
//                 fontSize: 16,
//                 color: AppColors.text,
//                 fontFamily: "Afacad",
//               ),
//             ),
//           ),
//           // Location
//           Expanded(
//             flex: 4,
//             child: Text(
//               location,
//               style: const TextStyle(
//                 fontSize: 16,
//                 color: AppColors.text,
//                 fontFamily: "Afacad",
//               ),
//             ),
//           ),
//           // Time
//           Expanded(
//             flex: 2,
//             child: Text(
//               time,
//               style: const TextStyle(
//                 fontSize: 16,
//                 color: AppColors.text,
//                 fontFamily: "Afacad",
//               ),
//             ),
//           ),
//           // Dernière colonne (Price ou Vehicle)
//           Expanded(
//             flex: 2,
//             child: Text(
//               lastColumn,
//               style: const TextStyle(
//                 fontSize: 16,
//                 color: AppColors.text,
//                 fontFamily: "Afacad",
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }

// // ── En-tête du tableau ─────────────────────────────────────
// /// À placer juste au-dessus de la liste des ParkingTableRow.
// ///
// /// ```dart
// /// ParkingTableHeader(lastColumnLabel: 'Price')
// /// ParkingTableHeader(lastColumnLabel: 'Vehicles')
// /// ```
// class ParkingTableHeader extends StatelessWidget {
//   final String lastColumnLabel;

//   const ParkingTableHeader({super.key, required this.lastColumnLabel});

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       color: Color.fromARGB(255, 217, 217, 217),
//       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
//       child: Row(
//         children: [
//           _HeaderCell(label: 'Date', flex: 3),
//           _HeaderCell(label: 'Location', flex: 3),
//           _HeaderCell(label: 'Time', flex: 2),
//           _HeaderCell(label: lastColumnLabel, flex: 2),
//         ],
//       ),
//     );
//   }
// }

// class _HeaderCell extends StatelessWidget {
//   final String label;
//   final int flex;

//   const _HeaderCell({required this.label, required this.flex});

//   @override
//   Widget build(BuildContext context) {
//     return Expanded(
//       flex: flex,
//       child: Text(
//         label,
//         style: const TextStyle(
//           fontSize: 18,
//           fontWeight: FontWeight.w500,
//           color: AppColors.text,
//         ),
//       ),
//     );
//   }
// }

import 'package:flutter/material.dart';
import '../theme/colors.dart';

// ── Column Model ──────────────────────────────────────────
class TableColumn {
  final String label;
  final String key;
  final int flex;

  const TableColumn({
    required this.label,
    required this.key,
    required this.flex,
  });
}

// ── Styles ────────────────────────────────────────────────
const _cellStyle = TextStyle(
  fontSize: 16,
  color: AppColors.text,
  fontFamily: "Afacad",
);

const _headerStyle = TextStyle(
  fontSize: 18,
  fontWeight: FontWeight.w500,
  color: AppColors.text,
);

// ── Table Widget ──────────────────────────────────────────
class CustomTable extends StatelessWidget {
  final List<TableColumn> columns;
  final List<Map<String, dynamic>> rows;

  const CustomTable({super.key, required this.columns, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),
        ...List.generate(rows.length, (index) {
          return _buildRow(rows[index], isEven: index.isEven);
        }),
      ],
    );
  }

  // ── Header ─────────────────────────────────────────────
  Widget _buildHeader() {
    return Container(
      color: const Color.fromARGB(255, 217, 217, 217),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start, // 🔥 مهم
        children: _buildCells(
          columns.map((e) => e.label).toList(),
          columns.map((e) => e.flex).toList(),
          isHeader: true,
        ),
      ),
    );
  }

  // ── Row ────────────────────────────────────────────────
  Widget _buildRow(Map<String, dynamic> row, {required bool isEven}) {
    final data = columns.map((col) {
      final value = row[col.key];
      return value?.toString() ?? '-';
    }).toList();

    return Container(
      color: isEven
          ? const Color.fromARGB(255, 235, 235, 235)
          : const Color.fromARGB(255, 217, 217, 217),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start, // 🔥 مهم باش يبان wrap مليح
        children: _buildCells(data, columns.map((e) => e.flex).toList()),
      ),
    );
  }

  // ── Cells Builder ──────────────────────────────────────
  List<Widget> _buildCells(
    List<String> items,
    List<int> flexes, {
    bool isHeader = false,
  }) {
    return List.generate(items.length * 2 - 1, (index) {
      if (index.isOdd) return const SizedBox(width: 12);

      final i = index ~/ 2;

      return Expanded(
        flex: flexes[i],
        child: Text(
          items[i],
          softWrap: true, //  يرجع للسطر
          maxLines: 2,
          overflow: TextOverflow.fade, // بدون limit
          style: isHeader ? _headerStyle : _cellStyle,
        ),
      );
    });
  }
}
