export const VALUE_CONSIDERATIONS = Object.freeze([
  { key: 'privacy', label: 'Privacy', description: 'Limiting observation and control over personal information.' },
  { key: 'safety', label: 'Safety', description: 'Reducing exposure to preventable harm.' },
  { key: 'autonomy', label: 'Autonomy', description: 'Preserving room for informed individual choice.' },
  { key: 'fairness', label: 'Fairness', description: 'Applying benefits, burdens, or rules evenly.' },
  { key: 'loyalty', label: 'Loyalty', description: 'Protecting a relationship, team, or shared commitment.' },
  { key: 'honesty', label: 'Honesty', description: 'Making relevant truth visible, even when uncomfortable.' },
  { key: 'mercy', label: 'Mercy', description: 'Softening a consequence in response to circumstance.' },
  { key: 'consistency', label: 'Consistency', description: 'Keeping a rule or process stable across cases.' },
  { key: 'participation', label: 'Participation', description: 'Giving affected people a meaningful voice.' },
  { key: 'speed', label: 'Speed', description: 'Acting soon enough to preserve time or opportunity.' }
]);

export const VALUE_SCENARIOS = Object.freeze([
  {
    id: 'workshop-cameras',
    prompt: 'A shared workshop has had several tools stolen. Members must choose one response.',
    choices: [
      { id: 'privacy', value: 'privacy', label: 'Keep work areas free of cameras', cost: 'Investigations may remain slower and less certain.' },
      { id: 'safety', value: 'safety', label: 'Add visible cameras in shared areas', cost: 'Members will be recorded while using the space.' }
    ]
  },
  {
    id: 'storm-trail',
    prompt: 'Severe weather makes a popular trail unusually risky for the next few days.',
    choices: [
      { id: 'safety', value: 'safety', label: 'Close the trail until conditions improve', cost: 'Informed adults temporarily lose the choice to enter.' },
      { id: 'autonomy', value: 'autonomy', label: 'Keep it open with prominent warnings', cost: 'More people may accept risks that are hard to control.' }
    ]
  },
  {
    id: 'cooperative-grant',
    prompt: 'A cooperative is dividing a small grant among teams with different needs.',
    choices: [
      { id: 'autonomy', value: 'autonomy', label: 'Let each team request and defend its own amount', cost: 'Final allocations may differ substantially.' },
      { id: 'fairness', value: 'fairness', label: 'Give every eligible team an equal share', cost: 'Some teams may receive less than their situation requires.' }
    ]
  },
  {
    id: 'queue-exception',
    prompt: 'A close teammate under pressure asks to skip a queue that everyone else follows.',
    choices: [
      { id: 'fairness', value: 'fairness', label: 'Apply the same queue to everyone', cost: 'Your teammate may feel unsupported when they need help.' },
      { id: 'loyalty', value: 'loyalty', label: 'Make an exception for your teammate', cost: 'Other people will receive different treatment.' }
    ]
  },
  {
    id: 'published-error',
    prompt: 'A project team finds a mistake that caused no direct harm but changes a published result.',
    choices: [
      { id: 'loyalty', value: 'loyalty', label: 'Handle it inside the team before saying more', cost: 'Public correction will be delayed.' },
      { id: 'honesty', value: 'honesty', label: 'Correct the result publicly now', cost: 'The team will face immediate scrutiny.' }
    ]
  },
  {
    id: 'difficult-feedback',
    prompt: 'Someone asks for candid feedback immediately after a difficult failure.',
    choices: [
      { id: 'honesty', value: 'honesty', label: 'Give the full assessment now', cost: 'The timing may add to their distress.' },
      { id: 'mercy', value: 'mercy', label: 'Offer gentler, partial feedback for now', cost: 'Important problems will remain unstated.' }
    ]
  },
  {
    id: 'missed-deadline',
    prompt: 'A participant misses the same deadline again because of a new personal emergency.',
    choices: [
      { id: 'mercy', value: 'mercy', label: 'Grant another exception', cost: 'The rule will be applied differently in this case.' },
      { id: 'consistency', value: 'consistency', label: 'Apply the usual consequence', cost: 'Their circumstance receives less accommodation.' }
    ]
  },
  {
    id: 'neighborhood-process',
    prompt: 'A neighborhood needs a decision on a recurring issue, but many new voices want input.',
    choices: [
      { id: 'consistency', value: 'consistency', label: 'Use the established decision process', cost: 'Fewer new voices will shape this decision.' },
      { id: 'participation', value: 'participation', label: 'Reopen the process to wider input', cost: 'The decision will take longer and may change precedent.' }
    ]
  },
  {
    id: 'urgent-repair',
    prompt: 'A public space needs repairs before a busy weekend.',
    choices: [
      { id: 'participation', value: 'participation', label: 'Invite local input before choosing the repair', cost: 'The space may reopen later.' },
      { id: 'speed', value: 'speed', label: 'Let specialists choose and begin today', cost: 'Affected people will have little input.' }
    ]
  },
  {
    id: 'service-launch',
    prompt: 'A small online service can launch this week if it collects broad usage data by default.',
    choices: [
      { id: 'speed', value: 'speed', label: 'Launch now with broad collection and clear controls', cost: 'More user data will be gathered by default.' },
      { id: 'privacy', value: 'privacy', label: 'Delay launch and minimize collection first', cost: 'People will wait longer to use the service.' }
    ]
  }
]);

function clampDifficulty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export function scoreValuesMap(responses = {}) {
  const details = VALUE_SCENARIOS.map(scenario => {
    const raw = responses[scenario.id] || {};
    const choice = scenario.choices.find(item => item.id === raw.choiceId);
    const unresolved = raw.unresolved === true || !choice;
    const otherChoice = choice ? scenario.choices.find(item => item.id !== choice.id) : null;
    return {
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      unresolved,
      choiceId: unresolved ? null : choice.id,
      selectedValue: unresolved ? null : choice.value,
      selectedLabel: unresolved ? null : choice.label,
      selectedCost: unresolved ? null : choice.cost,
      otherValue: unresolved ? null : otherChoice.value,
      otherLabel: unresolved ? null : otherChoice.label,
      difficulty: unresolved ? null : clampDifficulty(raw.difficulty)
    };
  });

  const valueRows = VALUE_CONSIDERATIONS.map(value => {
    const opportunities = VALUE_SCENARIOS.filter(scenario => scenario.choices.some(choice => choice.value === value.key)).length;
    const selected = details.filter(row => row.selectedValue === value.key).length;
    const unresolved = details.filter(row => row.unresolved && VALUE_SCENARIOS.find(scenario => scenario.id === row.scenarioId).choices.some(choice => choice.value === value.key)).length;
    return { ...value, opportunities, selected, unresolved };
  });

  const resolved = details.filter(row => !row.unresolved).length;
  const unresolved = details.length - resolved;
  const hardChoices = details.filter(row => !row.unresolved && row.difficulty >= 4).sort((a, b) => b.difficulty - a.difficulty);
  const maxSelected = Math.max(0, ...valueRows.map(row => row.selected));
  const mostSelected = maxSelected > 0 ? valueRows.filter(row => row.selected === maxSelected) : [];
  const observations = [];

  if (!resolved) {
    observations.push('You left every trade-off unresolved in this session, so no consideration was selected over another.');
  } else if (mostSelected.length === 1) {
    observations.push(`${mostSelected[0].label} was selected in ${maxSelected} of its ${mostSelected[0].opportunities} appearances in this session.`);
  } else {
    observations.push(`In this session, no single consideration appeared most often; ${mostSelected.map(row => row.label).join(', ')} were tied at ${maxSelected} selection${maxSelected === 1 ? '' : 's'}.`);
  }
  if (hardChoices.length) {
    observations.push(`You marked ${hardChoices.length} resolved trade-off${hardChoices.length === 1 ? '' : 's'} as difficult.`);
  }
  if (unresolved) {
    observations.push(`You left ${unresolved} trade-off${unresolved === 1 ? '' : 's'} unresolved rather than forcing a choice.`);
  }
  observations.push('These choices describe one set of scenarios, not a fixed value hierarchy, moral score, or personality type.');

  return {
    total: details.length,
    resolved,
    unresolved,
    hardChoices,
    mostSelected,
    valueRows,
    observations,
    details
  };
}
