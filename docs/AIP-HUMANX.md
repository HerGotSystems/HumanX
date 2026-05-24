# HumanX AIP Mode

HumanX should not use the owner's private AI/API budget for random public users.

Default model:

1. HumanX generates an AIP task packet.
2. The user copies/downloads the packet.
3. The user runs it with their own AI: ChatGPT, Claude, local model, or any compatible tool.
4. The user pastes the result back as evidence pressure / analysis.

## AIP task shape

```json
{
  "aip_version": "1.0",
  "app": "HumanX",
  "task_type": "claim_pressure_analysis",
  "claim_id": "HX-000001",
  "claim": "The Earth is flat",
  "claim_type": "Physical/Testable",
  "current_status": "Disproven",
  "scores": {
    "evidence": 4,
    "testability": 98,
    "survivability": 2
  },
  "evidence": [],
  "pressure_points": [],
  "instructions": "Stress-test this claim. Return JSON with verdict, newPressurePoints, evidenceCritique, collapseChain, aiSurvivability."
}
```

## Server-side AI mode

Server-side AI through `ANTHROPIC_KEY` is optional and should be disabled for public free use unless one of these is true:

- admin-only mode
- paid users
- strict quota
- user's own API key
- internal testing

## Product rule

Public HumanX must prefer AIP/export/copy workflows over burning owner API credits.
