export const EVIDENCE_SOURCES = Object.freeze([
  { key: 'direct_data', label: 'Direct measurement', description: 'Readings or raw observations gathered from the event or outcome.' },
  { key: 'primary_record', label: 'Original record', description: 'A document, recording, or log created close to what happened.' },
  { key: 'repeated_observation', label: 'Independent repetition', description: 'The same pattern observed again by separate checks or teams.' },
  { key: 'expert_analysis', label: 'Expert analysis', description: 'Interpretation by someone with relevant specialist knowledge.' },
  { key: 'firsthand_account', label: 'First-hand account', description: 'A report from someone who directly witnessed a specific event.' },
  { key: 'lived_experience', label: 'Lived experience', description: 'Sustained experience of a condition, system, or consequence over time.' }
]);

export const EVIDENCE_SCENARIOS = Object.freeze([
  {
    id: 'noise-complaint',
    prompt: 'Residents disagree about whether noise from a nearby venue regularly exceeds a reasonable level.',
    choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Calibrated sound-level readings', limitation: 'A short measurement may miss when the disturbance happens.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'An account from someone who heard it', limitation: 'Position, timing, and memory affect what was perceived.' },
      { id: 'primary_record', source: 'primary_record', label: 'The inspector’s original visit log', limitation: 'The visit may cover only one time window.' }
    ]
  },
  {
    id: 'medicine-effect',
    prompt: 'A patient reports a large improvement after starting a new treatment.',
    choices: [
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Results from several independent trials', limitation: 'Study populations may not match this patient.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'A specialist review of the mechanism and studies', limitation: 'Interpretation depends on the available evidence and judgement.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'The patient’s record of effects over time', limitation: 'One person’s change may have several possible causes.' }
    ]
  },
  {
    id: 'disputed-quote',
    prompt: 'Two groups disagree about what a public speaker meant in a disputed statement.',
    choices: [
      { id: 'primary_record', source: 'primary_record', label: 'The full original recording or transcript', limitation: 'Context outside the recording may still be missing.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'An account from someone who was present', limitation: 'Recall can change and witnesses can disagree.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Analysis by a relevant language or subject expert', limitation: 'Experts can interpret ambiguous language differently.' }
    ]
  },
  {
    id: 'machine-failure',
    prompt: 'A machine failed once during production, and the cause is disputed.',
    choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Sensor logs from the failed machine', limitation: 'Logs capture only conditions that were instrumented.' },
      { id: 'repeated_observation', source: 'repeated_observation', label: 'An attempt to reproduce the fault', limitation: 'A test setup may not recreate the original environment.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'An engineer’s diagnosis', limitation: 'The diagnosis may rely on assumptions when physical evidence is incomplete.' }
    ]
  },
  {
    id: 'workplace-policy',
    prompt: 'A workplace policy is described as successful by management and harmful by some workers.',
    choices: [
      { id: 'primary_record', source: 'primary_record', label: 'The policy text and original decision record', limitation: 'Written intent may differ from implementation.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Accounts from affected workers over time', limitation: 'Experience can vary across roles, shifts, and people.' },
      { id: 'direct_data', source: 'direct_data', label: 'Pay, hours, turnover, and incident data', limitation: 'Numbers may not establish cause or capture unmeasured effects.' }
    ]
  },
  {
    id: 'wildlife-change',
    prompt: 'People disagree about whether local wildlife has declined over the last decade.',
    choices: [
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Repeated surveys by independent teams', limitation: 'Survey methods may miss some species, places, or seasons.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Recent sightings with dates and locations', limitation: 'Identification and reporting can be inconsistent.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Long-term local observers describing the change', limitation: 'Long memory can reveal a trend but is not a standardised count.' }
    ]
  },
  {
    id: 'historical-event',
    prompt: 'A claim about responsibility for a historical event is contested.',
    choices: [
      { id: 'primary_record', source: 'primary_record', label: 'Contemporaneous letters, orders, and photographs', limitation: 'Records can be incomplete or created by interested actors.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Historians comparing the available sources', limitation: 'Interpretations can differ and the source set may be incomplete.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Testimony from a participant or witness', limitation: 'Memory, position, and personal interest can shape the account.' }
    ]
  },
  {
    id: 'education-programme',
    prompt: 'A school says a new programme improved student outcomes.',
    choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Attendance and outcome data from before and after', limitation: 'A change over time does not by itself establish the cause.' },
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Independent evaluations in other schools', limitation: 'Other settings may not match this school.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Student and teacher experiences of the programme', limitation: 'Individual experiences may not show how effects are distributed.' }
    ]
  }
]);

function clampWeight(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function average(values) {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

export function scoreEvidenceReflex(responses = {}) {
  const details = EVIDENCE_SCENARIOS.map(scenario => {
    const raw = responses[scenario.id] || {};
    const choice = scenario.choices.find(item => item.id === raw.choiceId);
    const unresolved = raw.unresolved === true || !choice;
    return {
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      unresolved,
      choiceId: unresolved ? null : choice.id,
      source: unresolved ? null : choice.source,
      sourceLabel: unresolved ? null : EVIDENCE_SOURCES.find(item => item.key === choice.source).label,
      choiceLabel: unresolved ? null : choice.label,
      limitation: unresolved ? null : choice.limitation,
      weight: unresolved ? null : clampWeight(raw.weight)
    };
  });

  const sourceRows = EVIDENCE_SOURCES.map(source => {
    const opportunities = EVIDENCE_SCENARIOS.filter(scenario => scenario.choices.some(choice => choice.source === source.key)).length;
    const selections = details.filter(row => row.source === source.key);
    const unresolved = details.filter(row => row.unresolved && EVIDENCE_SCENARIOS.find(scenario => scenario.id === row.scenarioId).choices.some(choice => choice.source === source.key)).length;
    return {
      ...source,
      opportunities,
      selected: selections.length,
      averageWeight: average(selections.map(row => row.weight)),
      unresolved
    };
  });

  const resolvedRows = details.filter(row => !row.unresolved);
  const resolved = resolvedRows.length;
  const unresolved = details.length - resolved;
  const averageWeight = average(resolvedRows.map(row => row.weight));
  const highWeightChoices = resolvedRows.filter(row => row.weight >= 4);
  const maxSelected = Math.max(0, ...sourceRows.map(row => row.selected));
  const mostSelected = maxSelected > 0 ? sourceRows.filter(row => row.selected === maxSelected) : [];
  const observations = [];

  if (!resolved) {
    observations.push('You left every evidence choice unresolved in this session, so there is no first-inspection pattern yet.');
  } else if (mostSelected.length === 1) {
    observations.push(`In this session, ${mostSelected[0].label} was your first inspection choice in ${maxSelected} of its ${mostSelected[0].opportunities} appearances.`);
  } else {
    observations.push(`In this session, no single source type was chosen first most often; ${mostSelected.map(row => row.label).join(', ')} were tied at ${maxSelected} selection${maxSelected === 1 ? '' : 's'}.`);
  }
  if (highWeightChoices.length) {
    observations.push(`You gave ${highWeightChoices.length} first choice${highWeightChoices.length === 1 ? '' : 's'} an initial weight of 4 or 5.`);
  }
  if (unresolved) {
    observations.push(`You left ${unresolved} evidence choice${unresolved === 1 ? '' : 's'} unresolved rather than forcing a first source.`);
  }
  observations.push('Choosing a source first does not mean rejecting the others, and this session is not a rationality score or truth verdict.');

  return {
    total: details.length,
    resolved,
    unresolved,
    averageWeight,
    highWeightChoices,
    mostSelected,
    sourceRows,
    observations,
    details
  };
}
