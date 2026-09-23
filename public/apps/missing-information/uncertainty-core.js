export const UNCERTAINTY_MODES = Object.freeze([
  { key: 'inquire', label: 'Seek a missing fact', description: 'Ask a targeted question before choosing a direction.' },
  { key: 'reversible_step', label: 'Take a reversible step', description: 'Move enough to learn while limiting commitment.' },
  { key: 'wait', label: 'Hold position', description: 'Preserve options until the situation changes or clarifies.' },
  { key: 'commit', label: 'Commit with current information', description: 'Choose a direction now and accept remaining uncertainty.' }
]);

export const UNCERTAINTY_SCENARIOS = Object.freeze([
  {
    id: 'collaboration-offer',
    prompt: 'A respected collaborator offers you a large project. Their work is strong, but you do not know how reliably they deliver under pressure. They need an answer this week.',
    reveal: 'A previous client confirms the quality was excellent, but says two important deadlines slipped without early warning.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Ask for a delivery plan and two recent references', tradeoff: 'The collaborator may read the questions as caution or mistrust.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'Propose a small paid pilot with one checkpoint', tradeoff: 'The full opportunity may move more slowly or go elsewhere.' },
      { id: 'wait', mode: 'wait', label: 'Delay until their current project finishes', tradeoff: 'You preserve flexibility but may lose the available window.' },
      { id: 'commit', mode: 'commit', label: 'Accept or decline the full project now', tradeoff: 'You gain certainty of direction while delivery risk remains unclear.' }
    ]
  },
  {
    id: 'friend-cancels',
    prompt: 'A close friend cancels at the last minute for the second time and sends only a short apology. You do not know why.',
    reveal: 'You learn they are handling a family crisis and avoided explaining because the details involve someone else’s privacy.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Ask directly what is happening and what they need', tradeoff: 'A direct question may press into something they cannot share.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'Send a low-pressure check-in without interpreting the cancellation', tradeoff: 'Your own frustration remains unresolved for now.' },
      { id: 'wait', mode: 'wait', label: 'Give them space and wait for them to return', tradeoff: 'Silence may protect space or increase distance.' },
      { id: 'commit', mode: 'commit', label: 'Decide now what the cancellations mean for the friendship', tradeoff: 'You create a clear boundary from incomplete context.' }
    ]
  },
  {
    id: 'machine-warning',
    prompt: 'A production machine makes a new warning sound before an important job. Output still looks normal, and no technician is available today.',
    reveal: 'The replacement part would take two weeks to arrive. A remote technician says the sound might be minor but cannot rule out a damaging fault.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Pause and gather logs, recordings, and remote diagnostic advice', tradeoff: 'The job starts late while evidence is collected.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'Run a limited low-load test with stop conditions', tradeoff: 'The test creates some exposure while limiting the scale.' },
      { id: 'wait', mode: 'wait', label: 'Keep the machine off until an inspection is possible', tradeoff: 'The job may be delayed or lost.' },
      { id: 'commit', mode: 'commit', label: 'Run or cancel the full job now', tradeoff: 'You secure a direction while the fault remains uncertain.' }
    ]
  },
  {
    id: 'breaking-claim',
    prompt: 'A fast-moving public claim is being shared widely. Early reports conflict, and people are asking for your view now.',
    reveal: 'The original dataset becomes available, but it is missing the most recent two months that the strongest claims refer to.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Trace the earliest available source and inspect its method', tradeoff: 'You will not give an immediate public answer.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'State a narrow provisional view with its uncertainty visible', tradeoff: 'Even qualified wording may be repeated without the qualification.' },
      { id: 'wait', mode: 'wait', label: 'Withhold judgement until reports converge', tradeoff: 'The discussion continues without your contribution.' },
      { id: 'commit', mode: 'commit', label: 'Choose and state the explanation that currently seems strongest', tradeoff: 'A clear position may outlast the incomplete evidence behind it.' }
    ]
  },
  {
    id: 'community-budget',
    prompt: 'A community project has half its target budget. A supplier offers a useful discount that expires today, but expected attendance is still unknown.',
    reveal: 'A possible sponsor may cover the remaining gap, but will not decide until next week. Waiting means losing the supplier discount.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Ask the supplier and sponsor for firmer terms before deciding', tradeoff: 'Neither party may answer before the deadline.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'Make a refundable reservation or smaller order', tradeoff: 'The compromise may cost more per unit or secure less capacity.' },
      { id: 'wait', mode: 'wait', label: 'Wait for attendance and funding to become clearer', tradeoff: 'The discount and preferred timing may disappear.' },
      { id: 'commit', mode: 'commit', label: 'Book or abandon the full plan today', tradeoff: 'You settle the project direction before funding is known.' }
    ]
  },
  {
    id: 'creative-commission',
    prompt: 'A high-profile client wants a creative commission started tomorrow. The broad idea is exciting, but the brief and approval process are unclear.',
    reveal: 'You learn that three stakeholders want different outcomes, and the final approver will be unavailable for a week.',
    actions: [
      { id: 'inquire', mode: 'inquire', label: 'Request one written brief and a named final decision-maker', tradeoff: 'Clarification may delay the energetic start the client wants.' },
      { id: 'reversible_step', mode: 'reversible_step', label: 'Create one limited concept study before full production', tradeoff: 'The sample uses time without guaranteeing alignment.' },
      { id: 'wait', mode: 'wait', label: 'Hold production until approval responsibility is clear', tradeoff: 'Momentum and the commission may be lost.' },
      { id: 'commit', mode: 'commit', label: 'Begin full production from your interpretation now', tradeoff: 'You preserve momentum while accepting substantial rework risk.' }
    ]
  }
]);

function clampReadiness(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function average(values) {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

export function scoreMissingInformation(responses = {}) {
  const details = UNCERTAINTY_SCENARIOS.map(scenario => {
    const raw = responses[scenario.id] || {};
    const initial = scenario.actions.find(action => action.id === raw.initialActionId);
    const final = scenario.actions.find(action => action.id === raw.finalActionId);
    const unresolved = raw.unresolved === true || !initial || !final;
    return {
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      reveal: scenario.reveal,
      unresolved,
      readiness: unresolved ? null : clampReadiness(raw.readiness),
      initialActionId: unresolved ? null : initial.id,
      initialMode: unresolved ? null : initial.mode,
      initialLabel: unresolved ? null : initial.label,
      initialTradeoff: unresolved ? null : initial.tradeoff,
      finalActionId: unresolved ? null : final.id,
      finalMode: unresolved ? null : final.mode,
      finalLabel: unresolved ? null : final.label,
      finalTradeoff: unresolved ? null : final.tradeoff,
      changed: unresolved ? false : initial.mode !== final.mode
    };
  });

  const resolvedRows = details.filter(row => !row.unresolved);
  const modeRows = UNCERTAINTY_MODES.map(mode => ({
    ...mode,
    initial: resolvedRows.filter(row => row.initialMode === mode.key).length,
    final: resolvedRows.filter(row => row.finalMode === mode.key).length
  }));
  const resolved = resolvedRows.length;
  const unresolved = details.length - resolved;
  const changedRows = resolvedRows.filter(row => row.changed);
  const highReadinessChanges = changedRows.filter(row => row.readiness >= 4);
  const averageReadiness = average(resolvedRows.map(row => row.readiness));
  const maxInitial = Math.max(0, ...modeRows.map(row => row.initial));
  const mostInitial = maxInitial > 0 ? modeRows.filter(row => row.initial === maxInitial) : [];
  const observations = [];

  if (!resolved) {
    observations.push('You left every situation unresolved in this session, so there is no action pattern to compare.');
  } else if (mostInitial.length === 1) {
    observations.push(`In this session, ${mostInitial[0].label.toLowerCase()} was your most frequent initial approach, used ${maxInitial} time${maxInitial === 1 ? '' : 's'}.`);
  } else {
    observations.push(`In this session, no single initial approach appeared most often; ${mostInitial.map(row => row.label).join(', ')} were tied at ${maxInitial}.`);
  }
  if (resolved) {
    observations.push(`After one new fact, you changed approach in ${changedRows.length} of ${resolved} resolved situation${resolved === 1 ? '' : 's'}.`);
  }
  if (highReadinessChanges.length) {
    observations.push(`You changed course ${highReadinessChanges.length} time${highReadinessChanges.length === 1 ? '' : 's'} after initially marking readiness at 4 or 5.`);
  }
  if (unresolved) {
    observations.push(`You left ${unresolved} situation${unresolved === 1 ? '' : 's'} unresolved rather than forcing an approach.`);
  }
  observations.push('These transitions describe six constructed situations, not your tolerance for uncertainty, decision quality, or personality.');

  return {
    total: details.length,
    resolved,
    unresolved,
    changed: changedRows.length,
    averageReadiness,
    highReadinessChanges,
    mostInitial,
    modeRows,
    observations,
    details
  };
}
