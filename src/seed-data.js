export const HUMANX_SEED = {
  version: 1,
  claims: [
    {
      seed_id: 'seed-flat-earth',
      claim: 'The Earth is flat',
      category: 'Cosmology',
      type: 'Physical/Testable',
      status: 'Disproven',
      evidence_score: 18,
      testability: 98,
      survivability: 2,
      evidence: [
        { stance: 'support', quality: 'media', title: 'Local horizon often appears flat', body: 'At normal human scale, the horizon can appear flat. This explains why the claim feels intuitive, but local perception is not enough to establish planetary geometry.', source_url: '', media_type: 'observation', reliability_score: 20 },
        { stance: 'support', quality: 'vibes', title: 'Water-level phrase argument', body: "The phrase 'water finds its level' is often used as support. HumanX should classify this as language pressure, not a global measurement.", source_url: '', media_type: 'argument', reliability_score: 8 }
      ],
      pressure: [
        { title: 'Time zones require different sun angles across the globe', body: 'A flat local appearance does not explain predictable global day/night timing without extra unsupported mechanisms.', severity: 5 },
        { title: 'Lunar eclipse shadow geometry', body: "Earth's shadow during lunar eclipses repeatedly appears curved from different orientations.", severity: 5 },
        { title: 'Circumnavigation and flight routing', body: 'Navigation, aviation routing and circumnavigation are operational tests used daily.', severity: 4 },
        { title: 'Satellite telemetry and independent tracking', body: 'Satellite signals, orbital prediction, amateur radio tracking and GPS operation form repeatable technical evidence.', severity: 5 }
      ],
      tests: [
        { title: 'Measure shadow angles at two distant locations', instructions: 'At the same time on the same day, compare shadow length from identical vertical sticks in two distant locations.', difficulty: 'medium', safety_level: 'normal' },
        { title: 'Track ships or buildings disappearing bottom-first', instructions: 'Use a zoom camera near a large body of water and record distant objects. Control for haze and distortion.', difficulty: 'easy', safety_level: 'normal' }
      ]
    },
    {
      seed_id: 'seed-moon-landing',
      claim: 'Humans landed on the Moon',
      category: 'History/Space',
      type: 'Historical',
      status: 'Strongly Supported',
      evidence_score: 76,
      testability: 82,
      survivability: 88,
      evidence: [
        { stance: 'support', quality: 'documented', title: 'Apollo mission documentation chain', body: 'Mission planning records, telemetry, photography, transcripts and hardware documentation form a large cross-linked documentary chain.', source_url: '', media_type: 'document', reliability_score: 68 },
        { stance: 'support', quality: 'repeatable', title: 'Lunar retroreflector experiments', body: 'Retroreflectors placed on the Moon allow laser ranging experiments, a repeatable measurement stream independent of testimony.', source_url: '', media_type: 'experiment', reliability_score: 85 },
        { stance: 'support', quality: 'documented', title: 'Moon rocks and sample analysis', body: 'Returned lunar samples have been studied by researchers over decades; custody, composition and independent analysis matter together.', source_url: '', media_type: 'physical_sample', reliability_score: 72 }
      ],
      pressure: [
        { title: 'Hoax claim must explain independent tracking', body: 'A hoax explanation must account for independent radio tracking, international observation and telemetry.', severity: 4 },
        { title: 'Photo anomalies are not enough alone', body: 'Claims about shadows, flags or cameras must become testable technical arguments.', severity: 3 }
      ],
      tests: [
        { title: 'Recreate single-light shadow scenes', instructions: 'Use one strong light, rough ground texture and small models to test whether terrain and perspective can make shadows look non-parallel.', difficulty: 'easy', safety_level: 'normal' }
      ]
    },
    {
      seed_id: 'seed-dream-prediction',
      claim: 'A dream predicted my future',
      category: 'Belief',
      type: 'Religious/Belief',
      status: 'Untestable',
      evidence_score: 24,
      testability: 8,
      survivability: 42,
      evidence: [
        { stance: 'support', quality: 'testimony', title: 'Personal testimony', body: 'The claimant reports a dream and later event match. This may be meaningful but is weak as public proof without timestamped records.', source_url: '', media_type: 'personal_report', reliability_score: 24 }
      ],
      pressure: [
        { title: 'Memory distortion and retrofitting', body: 'After an event happens, people can reinterpret vague memories as more specific than they were.', severity: 4 },
        { title: 'Prediction criteria missing', body: 'A claim needs exact prediction, timestamp, event window and failure condition.', severity: 3 }
      ],
      tests: [
        { title: 'Timestamped dream log test', instructions: 'Write dreams into a timestamped document before events happen. Define what counts as hit or miss, then review after a fixed period.', difficulty: 'easy', safety_level: 'normal' }
      ]
    },
    {
      seed_id: 'seed-perpetual-motion',
      claim: 'Perpetual motion machines can produce free energy forever',
      category: 'Physics',
      type: 'Physical/Testable',
      status: 'Reality Collapse',
      evidence_score: 12,
      testability: 96,
      survivability: 1,
      evidence: [
        { stance: 'support', quality: 'media', title: 'Video demonstrations of magnet wheels', body: 'Videos can show motion, but without controlled measurement they do not prove net energy production.', source_url: '', media_type: 'video', reliability_score: 25 }
      ],
      pressure: [
        { title: 'Energy conservation burden', body: 'A free-energy device must show measured output exceeding all input under controlled conditions.', severity: 5 },
        { title: 'Independent replication required', body: 'A single inventor video is not enough. The device must be reproduced and measured independently.', severity: 5 },
        { title: 'Continuous load test', body: 'A useful machine must power an external load continuously without hidden batteries, mains supply or energy depletion.', severity: 5 }
      ],
      tests: [
        { title: 'Input/output load measurement', instructions: 'Measure all energy entering and leaving the device over time. Include batteries, capacitors, falling weights, temperature changes and external fields. Do not use dangerous voltages.', difficulty: 'hard', safety_level: 'caution' }
      ]
    }
  ]
};
