import 'package:flutter/material.dart';

void main() {
  runApp(const WeddingApp());
}

class WeddingApp extends StatelessWidget {
  const WeddingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wedding Celebration',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7A1F3D),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8F3EB),
      ),
      home: const WeddingHomePage(),
    );
  }
}

class WeddingHomePage extends StatelessWidget {
  const WeddingHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8F3EB).withValues(alpha: 0.92),
        title: const Text('Sweta & Shivpujan'),
        actions: [
          TextButton(onPressed: () {}, child: const Text('RSVP')),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        children: const [
          _HeroCopy(),
          SizedBox(height: 24),
          DioramaCard(),
          SizedBox(height: 32),
          _FeatureGrid(),
        ],
      ),
    );
  }
}

class _HeroCopy extends StatelessWidget {
  const _HeroCopy();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'MITHILA · BIHAR · WEDDING CELEBRATION',
          style: textTheme.labelMedium?.copyWith(
            letterSpacing: 2.2,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF7A1F3D),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'A wedding world you can step into.',
          style: textTheme.displaySmall?.copyWith(
            fontFamily: 'serif',
            fontWeight: FontWeight.w600,
            height: 1.02,
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'The Flutter client shares the same guest journey as the Next.js web experience: secure sessions, RSVP, seating and accommodation.',
          style: textTheme.bodyLarge?.copyWith(height: 1.6),
        ),
      ],
    );
  }
}

class DioramaCard extends StatelessWidget {
  const DioramaCard({super.key});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 4 / 5,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFD7E4E6), Color(0xFFEDE9DE), Color(0xFF7E927B)],
                ),
              ),
            ),
            Positioned(
              left: -40,
              right: 110,
              bottom: 120,
              height: 170,
              child: Transform.rotate(
                angle: -0.08,
                child: const DecoratedBox(
                  decoration: BoxDecoration(
                    color: Color(0xFFB9B7AE),
                    borderRadius: BorderRadius.only(topRight: Radius.circular(180)),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 36,
              right: 36,
              bottom: 32,
              height: 112,
              child: Transform(
                transform: Matrix4.identity()..setEntry(3, 2, 0.001)..rotateX(0.92),
                alignment: Alignment.center,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: const RadialGradient(
                      colors: [Color(0xFFFFF5DF), Color(0xFFE5D2A3), Color(0xFFC19B55)],
                    ),
                    boxShadow: const [BoxShadow(blurRadius: 34, offset: Offset(0, 18), color: Color(0x33000000))],
                  ),
                ),
              ),
            ),
            Center(
              child: Container(
                width: 230,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFAF2).withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0x55C7A66A)),
                  boxShadow: const [BoxShadow(blurRadius: 32, offset: Offset(0, 16), color: Color(0x33000000))],
                ),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('शुभ विवाह', style: TextStyle(letterSpacing: 2.2, color: Color(0xFF7A1F3D))),
                    SizedBox(height: 12),
                    Text('Sweta\n& Shivpujan', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'serif', fontSize: 30, height: 1.05, fontWeight: FontWeight.w600)),
                    SizedBox(height: 12),
                    Text('A miniature Mithila-inspired celebration.', textAlign: TextAlign.center),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureGrid extends StatelessWidget {
  const _FeatureGrid();

  @override
  Widget build(BuildContext context) {
    const items = [
      ('RSVP Journey', 'Secure guest confirmation and profile completion.'),
      ('Seat Reservation', 'Touch-friendly seat selection with clear states.'),
      ('Room Booking', 'Accommodation discovery and booking flows.'),
    ];

    return Column(
      children: items
          .map(
            (item) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                minVerticalPadding: 18,
                title: Text(item.$1, style: const TextStyle(fontFamily: 'serif', fontSize: 22, fontWeight: FontWeight.w600)),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(item.$2),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
