export const REVISION_TRIGGERS = Object.freeze([
  { key: 'direct_contradiction', label: 'Direct contradictory observation', description: 'A clear observation conflicts with what the position predicts.' },
  { key: 'independent_pattern', label: 'Repeated independent evidence', description: 'Separate sources or checks repeatedly point the other way.' },
  { key: 'failed_prediction', label: 'A failed prediction', description: 'An expected outcome does not occur under the stated conditions.' },
  { key: 'source_correction', label: 'Correction from the original source', description: 'The record, quotation, data, or provenance behind the position changes.' },
  { key: 'better_explanation', label: 'A better competing explanation', description: 'Another account explains the same facts with fewer unsupported assumptions.' },
  { key: 'different_consequence', label: 'Consequences differ from expectation', description: 'The position produces effects unlike those expected or intended.' },
  { key: 'unknown', label: 'I cannot name one yet', description: 'No concrete revision condition is currently available.' }
]);

export const REVISION_THRESHOLDS = Object.freeze([
  { key: 'one_strong', label: 'One strong instance', description: 'One unusually clear contradiction could be enough.' },
  { key: 'several_converging', label: 'Several converging instances', description: 'More than one independent signal would need to point together.' },
  { key: 'sustained_pattern', label: 'A sustained pattern over time', description: 'The counter-pattern would need to persist rather than appear once.' },
  { key: 'unsure', label: 'Threshold not clear yet', description: 'The amount of evidence required is not currently defined.' }
]);

export const REVISION_RESPONSES = Object.freeze([
  { key: 'investigate', label: 'Investigate before changing', description: 'Pause and examine the challenge before moving the position.' },
  { key: 'lower_confidence', label: 'Lower confidence', description: 'Keep the position provisionally but reduce certainty.' },
  { key: 'suspend', label: 'Suspend judgement', description: 'Stop treating the position as settled while the conflict is examined.' },
  { key: 'replace', label: 'Replace the position', description: 'Adopt a different position if the declared condition is met.' }
]);

function clampCertainty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function optionByKey(options, key, fallbackKey) {
  return options.find(option => option.key === key) || options.find(option => option.key === fallbackKey);
}

function average(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export function analyseRevisionConditions(entries = []) {
  const details = entries.slice(0, 3).map((entry, index) => {
    const position = String(entry?.position || '').trim().slice(0, 240);
    if (!position) return null;
    const trigger = optionByKey(REVISION_TRIGGERS, entry.trigger, 'unknown');
    const threshold = optionByKey(REVISION_THRESHOLDS, entry.threshold, 'unsure');
    const response = optionByKey(REVISION_RESPONSES, entry.response, 'investigate');
    return {
      number: index + 1,
      position,
      certainty: clampCertainty(entry.certainty),
      trigger: trigger.key,
      triggerLabel: trigger.label,
      triggerDescription: trigger.description,
      threshold: threshold.key,
      thresholdLabel: threshold.label,
      thresholdDescription: threshold.description,
      response: response.key,
      responseLabel: response.label,
      responseDescription: response.description,
      namedCondition: trigger.key !== 'unknown'
    };
  }).filter(Boolean);

  const namedConditions = details.filter(item => item.namedCondition).length;
  const unnamedConditions = details.length - namedConditions;
  const highCertainty = details.filter(item => item.certainty >= 80).length;
  const highCertaintyWithoutCondition = details.filter(item => item.certainty >= 80 && !item.namedCondition).length;
  const unclearThresholds = details.filter(item => item.threshold === 'unsure').length;
  const averageCertainty = average(details.map(item => item.certainty));
  const triggerRows = REVISION_TRIGGERS.map(trigger => ({
    ...trigger,
    count: details.filter(item => item.trigger === trigger.key).length
  }));
  const observations = [];

  if (!details.length) {
    observations.push('No position was completed in this session, so there are no revision conditions to inspect.');
  } else {
    observations.push(`You named a concrete change condition for ${namedConditions} of ${details.length} position${details.length === 1 ? '' : 's'} in this session.`);
  }
  if (highCertaintyWithoutCondition) {
    observations.push(`${highCertaintyWithoutCondition} position${highCertaintyWithoutCondition === 1 ? '' : 's'} had certainty at 80% or above without a named change condition.`);
  }
  if (unclearThresholds) {
    observations.push(`${unclearThresholds} position${unclearThresholds === 1 ? '' : 's'} left the amount of counterevidence required unclear.`);
  }
  observations.push('These are stated revision conditions from one session, not proof that you will change, refuse to change, reason well, or hold a true position.');

  return {
    total: details.length,
    namedConditions,
    unnamedConditions,
    highCertainty,
    highCertaintyWithoutCondition,
    unclearThresholds,
    averageCertainty,
    triggerRows,
    observations,
    details
  };
}
