export const CERTAINTY_QUESTIONS = Object.freeze([
  {
    id: 'moonlight',
    prompt: 'About how long does light reflected from the Moon take to reach Earth?',
    choices: [['a', 'About 1.3 seconds'], ['b', 'About 8 minutes'], ['c', 'About 1 hour']],
    answer: 'a',
    explanation: 'The Moon is roughly 384,400 km away, so its reflected light reaches Earth in about 1.3 seconds.'
  },
  {
    id: 'octopus-hearts',
    prompt: 'How many hearts does an octopus have?',
    choices: [['a', 'One'], ['b', 'Two'], ['c', 'Three']],
    answer: 'c',
    explanation: 'An octopus has three hearts: two pump blood through the gills and one pumps it through the body.'
  },
  {
    id: 'hot-desert',
    prompt: 'Which is the largest hot desert on Earth?',
    choices: [['a', 'The Sahara'], ['b', 'The Gobi'], ['c', 'The Arabian Desert']],
    answer: 'a',
    explanation: 'The Sahara is the largest hot desert. Antarctica is larger overall, but it is a polar desert.'
  },
  {
    id: 'gold-symbol',
    prompt: 'What is the chemical symbol for gold?',
    choices: [['a', 'Ag'], ['b', 'Au'], ['c', 'Gd']],
    answer: 'b',
    explanation: 'Gold uses the symbol Au, from the Latin word aurum.'
  },
  {
    id: 'fraction',
    prompt: 'What percentage is one eighth?',
    choices: [['a', '8%'], ['b', '12.5%'], ['c', '18%']],
    answer: 'b',
    explanation: 'One divided by eight is 0.125, which is 12.5%.'
  },
  {
    id: 'largest-planet',
    prompt: 'Which is the largest planet in our solar system?',
    choices: [['a', 'Earth'], ['b', 'Saturn'], ['c', 'Jupiter']],
    answer: 'c',
    explanation: 'Jupiter is the solar system’s largest planet by both mass and volume.'
  },
  {
    id: 'sound-vacuum',
    prompt: 'Can ordinary sound waves travel through a perfect vacuum?',
    choices: [['a', 'Yes'], ['b', 'No'], ['c', 'Only at very high volume']],
    answer: 'b',
    explanation: 'Ordinary sound needs particles to carry mechanical vibrations, so it cannot travel through a perfect vacuum.'
  },
  {
    id: 'leap-year',
    prompt: 'How many days are in a leap year?',
    choices: [['a', '365'], ['b', '366'], ['c', '367']],
    answer: 'b',
    explanation: 'A leap year adds 29 February, making 366 days.'
  },
  {
    id: 'earth-orbit',
    prompt: 'Approximately how long does Earth take to orbit the Sun?',
    choices: [['a', 'About 24 hours'], ['b', 'About 30 days'], ['c', 'About 365.25 days']],
    answer: 'c',
    explanation: 'Earth completes one solar orbit in roughly 365.25 days.'
  },
  {
    id: 'triangle',
    prompt: 'In ordinary Euclidean geometry, what do the interior angles of a triangle add up to?',
    choices: [['a', '90°'], ['b', '180°'], ['c', '360°']],
    answer: 'b',
    explanation: 'On a flat Euclidean plane, a triangle’s interior angles sum to 180°.'
  },
  {
    id: 'neck-vertebrae',
    prompt: 'How many neck vertebrae do humans and giraffes usually have?',
    choices: [['a', 'Humans 7; giraffes 7'], ['b', 'Humans 7; giraffes 14'], ['c', 'Humans 5; giraffes 12']],
    answer: 'a',
    explanation: 'Humans and giraffes usually both have seven cervical vertebrae; giraffe vertebrae are simply much longer.'
  },
  {
    id: 'great-barrier-reef',
    prompt: 'The Great Barrier Reef lies off the coast of which country?',
    choices: [['a', 'Australia'], ['b', 'South Africa'], ['c', 'Mexico']],
    answer: 'a',
    explanation: 'The Great Barrier Reef lies off Queensland on Australia’s north-east coast.'
  }
]);

export const CONFIDENCE_BANDS = Object.freeze([
  { key: '0-49', label: '0–49%', min: 0, max: 49 },
  { key: '50-79', label: '50–79%', min: 50, max: 79 },
  { key: '80-100', label: '80–100%', min: 80, max: 100 }
]);

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function scoreCertaintyLab(responses = {}) {
  const details = CERTAINTY_QUESTIONS.map(question => {
    const raw = responses[question.id] || {};
    const choiceIds = new Set(question.choices.map(([id]) => id));
    const deferred = raw.deferred === true || !choiceIds.has(raw.choiceId);
    const confidence = deferred ? null : clampConfidence(raw.confidence);
    const correct = deferred ? null : raw.choiceId === question.answer;
    return {
      questionId: question.id,
      prompt: question.prompt,
      choiceId: deferred ? null : raw.choiceId,
      answerId: question.answer,
      deferred,
      confidence,
      correct,
      explanation: question.explanation
    };
  });

  const answeredRows = details.filter(row => !row.deferred);
  const answered = answeredRows.length;
  const deferred = details.length - answered;
  const correct = answeredRows.filter(row => row.correct).length;
  const accuracyPercent = percent(correct, answered);
  const averageConfidence = answered
    ? Math.round(answeredRows.reduce((sum, row) => sum + row.confidence, 0) / answered)
    : 0;
  const calibrationGap = averageConfidence - accuracyPercent;
  const highConfidenceMisses = answeredRows.filter(row => !row.correct && row.confidence >= 80).length;

  const bands = CONFIDENCE_BANDS.map(band => {
    const rows = answeredRows.filter(row => row.confidence >= band.min && row.confidence <= band.max);
    const bandCorrect = rows.filter(row => row.correct).length;
    return {
      key: band.key,
      label: band.label,
      answered: rows.length,
      correct: bandCorrect,
      accuracyPercent: percent(bandCorrect, rows.length)
    };
  });

  const observations = [];
  if (!answered) {
    observations.push('You deferred every item in this session, so there is no confidence-to-answer comparison yet.');
  } else if (calibrationGap > 10) {
    observations.push(`In this session, reported confidence was ${calibrationGap} points higher than answer accuracy.`);
  } else if (calibrationGap < -10) {
    observations.push(`In this session, reported confidence was ${Math.abs(calibrationGap)} points lower than answer accuracy.`);
  } else {
    observations.push(`In this session, average confidence and answer accuracy were within ${Math.abs(calibrationGap)} points.`);
  }
  if (highConfidenceMisses > 0) {
    observations.push(`${highConfidenceMisses} answer${highConfidenceMisses === 1 ? '' : 's'} at 80% confidence or above did not match the answer key.`);
  }
  if (deferred > 0) {
    observations.push(`You deferred ${deferred} item${deferred === 1 ? '' : 's'} instead of selecting an answer.`);
  }
  observations.push('This is one small session using a fixed answer key, not a measure of intelligence, knowledge, or personality.');

  return {
    total: details.length,
    answered,
    deferred,
    correct,
    accuracyPercent,
    averageConfidence,
    calibrationGap,
    highConfidenceMisses,
    bands,
    observations,
    details
  };
}
