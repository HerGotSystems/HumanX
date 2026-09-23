export const PERSPECTIVE_LENSES = Object.freeze([
  { key: 'intent', label: 'Intent', description: 'What someone meant, attempted, or believed they were doing.' },
  { key: 'impact', label: 'Impact', description: 'What happened to the people affected, regardless of intention.' },
  { key: 'constraint', label: 'Constraint', description: 'The limits, pressures, access, or options present in the situation.' },
  { key: 'responsibility', label: 'Responsibility', description: 'What someone could reasonably have anticipated, communicated, or changed.' },
  { key: 'unknowns', label: 'What is still unknown', description: 'The missing facts that keep the account from supporting a settled reading.' }
]);

export const PERSPECTIVE_MOVEMENTS = Object.freeze([
  { key: 'same', label: 'My reading stayed the same', description: 'The added position did not change the weight of my reading.' },
  { key: 'less_settled', label: 'I am less settled', description: 'The added position weakened how settled my first reading felt.' },
  { key: 'more_settled', label: 'I am more settled', description: 'The added position strengthened how settled my reading felt.' },
  { key: 'mixed', label: 'My reading is more mixed', description: 'More than one consideration now carries meaningful weight.' },
  { key: 'withholding', label: 'I am still withholding judgement', description: 'The two accounts still do not give me enough to settle the issue.' }
]);

export const PERSPECTIVE_SCENARIOS = Object.freeze([
  {
    id: 'project-deadline',
    title: 'The missed deadline',
    first: {
      position: 'Project lead',
      account: 'A contributor missed a client deadline and gave no warning directly to the project lead. The delay forced two colleagues to cancel weekend plans to finish the work.'
    },
    second: {
      position: 'Contributor',
      account: 'The contributor was suddenly caring for a dependent and asked a colleague to relay that the work was at risk. They did not check whether the message reached the lead, and the handoff failed.'
    }
  },
  {
    id: 'venue-noise',
    title: 'The late-night venue',
    first: {
      position: 'Nearby resident',
      account: 'Music from a local venue is audible inside the resident’s bedroom several nights a week. They have lost sleep and say earlier complaints produced only brief changes.'
    },
    second: {
      position: 'Venue operator',
      account: 'The operator has stayed within the permitted closing time and paid for sound treatment after the first complaints. Cutting more hours could mean reducing staff, but the music remains audible nearby.'
    }
  },
  {
    id: 'family-dinner',
    title: 'The family dinner',
    first: {
      position: 'Parent',
      account: 'Their adult child arrived late, spoke very little, and left before dessert at a dinner planned weeks in advance. The parent experienced it as dismissive and embarrassing in front of relatives.'
    },
    second: {
      position: 'Adult child',
      account: 'A relative at the dinner has repeatedly made personal remarks toward the child. The child came because the gathering mattered to the parent, avoided a confrontation, and left when the remarks began again.'
    }
  },
  {
    id: 'system-rollout',
    title: 'The new system',
    first: {
      position: 'Team manager',
      account: 'A worker keeps using the old process after training on a replacement system. Their work now takes longer to combine with everyone else’s, and the manager sees the refusal as blocking the rollout.'
    },
    second: {
      position: 'Worker',
      account: 'The worker lost records during an earlier rollout and spent unpaid time repairing them. They reported two similar risks in the replacement system, but have not received an answer or proposed safeguard.'
    }
  },
  {
    id: 'unanswered-message',
    title: 'The unanswered message',
    first: {
      position: 'Friend who wrote',
      account: 'A friend sent a vulnerable message asking to talk. It was marked as read, but five days passed without a reply even though the recipient posted in a shared group chat.'
    },
    second: {
      position: 'Friend who received it',
      account: 'The recipient opened the message while waiting for a hospital appointment, planned to answer privately, and then forgot. Their group-chat posts were brief attempts to stay connected while overwhelmed.'
    }
  },
  {
    id: 'community-meeting',
    title: 'The interrupted meeting',
    first: {
      position: 'Meeting chair',
      account: 'A participant spoke over two other people during a crowded community meeting. The chair cut them off to protect the speaking order and keep the meeting within its booked time.'
    },
    second: {
      position: 'Participant',
      account: 'The participant was following through an interpreter and twice believed the chair had invited their response. They felt the cutoff happened before the interpretation delay was taken into account.'
    }
  }
]);

function clampSettled(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.max(1, Math.min(5, Math.round(number)));
}

export function scorePerspectiveShift(responses = {}) {
  const lensKeys = new Set(PERSPECTIVE_LENSES.map(lens => lens.key));
  const movementKeys = new Set(PERSPECTIVE_MOVEMENTS.map(movement => movement.key));
  const details = PERSPECTIVE_SCENARIOS.map(scenario => {
    const raw = responses[scenario.id] || {};
    const complete = raw.unresolved !== true && lensKeys.has(raw.initialLens) && lensKeys.has(raw.finalLens) && movementKeys.has(raw.movement);
    return {
      scenarioId: scenario.id,
      title: scenario.title,
      first: scenario.first,
      second: scenario.second,
      unresolved: !complete,
      settled: complete ? clampSettled(raw.settled) : null,
      initialLens: complete ? raw.initialLens : null,
      finalLens: complete ? raw.finalLens : null,
      movement: complete ? raw.movement : null,
      lensChanged: complete ? raw.initialLens !== raw.finalLens : false
    };
  });

  const resolvedRows = details.filter(row => !row.unresolved);
  const lensRows = PERSPECTIVE_LENSES.map(lens => ({
    ...lens,
    initial: resolvedRows.filter(row => row.initialLens === lens.key).length,
    after: resolvedRows.filter(row => row.finalLens === lens.key).length
  }));
  const movementRows = PERSPECTIVE_MOVEMENTS.map(movement => ({
    ...movement,
    count: resolvedRows.filter(row => row.movement === movement.key).length
  }));
  const lensChanges = resolvedRows.filter(row => row.lensChanged);
  const reconsidered = resolvedRows.filter(row => ['less_settled', 'mixed', 'withholding'].includes(row.movement));
  const highSettledReconsidered = reconsidered.filter(row => row.settled >= 4);
  const resolved = resolvedRows.length;
  const unresolved = details.length - resolved;
  const maxInitial = Math.max(0, ...lensRows.map(row => row.initial));
  const leadingInitial = maxInitial ? lensRows.filter(row => row.initial === maxInitial) : [];
  const observations = [];

  if (!resolved) {
    observations.push('You left every situation unresolved in this session, so there is no before-and-after pattern to compare.');
  } else if (leadingInitial.length === 1) {
    observations.push(`In the first accounts, ${leadingInitial[0].label.toLowerCase()} held the most weight most often: ${maxInitial} of ${resolved} resolved situations.`);
  } else {
    observations.push(`No single consideration led your first readings; ${leadingInitial.map(row => row.label).join(', ')} were tied at ${maxInitial}.`);
  }
  if (resolved) {
    observations.push(`After another person’s position appeared, the consideration carrying most weight changed in ${lensChanges.length} of ${resolved} resolved situations.`);
    observations.push(`You reported a less settled, more mixed, or still-withholding reading in ${reconsidered.length} of ${resolved} resolved situations.`);
  }
  if (highSettledReconsidered.length) {
    observations.push(`${highSettledReconsidered.length} reading${highSettledReconsidered.length === 1 ? '' : 's'} that began at 4 or 5 settled became less settled, more mixed, or still withheld.`);
  }
  if (unresolved) {
    observations.push(`You left ${unresolved} situation${unresolved === 1 ? '' : 's'} unresolved rather than forcing one consideration to lead.`);
  }
  observations.push('These are responses to six constructed, incomplete conflicts—not a score for empathy, fairness, openness, or how you would behave in real life.');

  return {
    total: details.length,
    resolved,
    unresolved,
    lensChanges: lensChanges.length,
    reconsidered: reconsidered.length,
    highSettledReconsidered,
    lensRows,
    movementRows,
    observations,
    details
  };
}
