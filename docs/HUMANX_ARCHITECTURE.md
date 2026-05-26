# HumanX Shared Public Architecture

## Core Direction

HumanX becomes a shared adversarial truth-pressure system.

No real-name identity.
No email/password auth.
No free public LLM inference.
AI is BYO via AIP packets.

## Identity Model

Users are pseudonymous.

Client generates:
- local UUID
- optional rotating fingerprint hash
- public handle

Server stores:
- handle
- trust score
- strike count
- moderation state

No personal identity required.

## Anti-Abuse

### Hard limits
- per-IP submission limits
- cooldowns
- duplicate claim detection
- shadow banning
- report threshold quarantine

### Soft trust
- evidence accuracy history
- contradiction quality
- community voting
- admin-reviewed trust boosts

## Claim Lifecycle

1. User submits claim
2. Claim enters public arena
3. Others attach:
   - evidence
   - contradiction/pressure points
   - source links
4. Claim receives survivability recalculation
5. Claims crossing report thresholds enter review queue

## AIP-first AI

HumanX does NOT run free public AI analysis.

Instead it exports structured AIP packets:

- claim
- evidence list
- contradictions
- requested task
- reasoning instructions
- scoring instructions

Users copy packet into:
- ChatGPT
- Claude
- local LLM
- DeepSeek
- anything else

## Moderation Philosophy

HumanX does not moderate for opinion.
HumanX moderates for:
- spam
- illegal content
- doxxing
- targeted harassment
- coordinated manipulation
- malware/scams

## Future Extensions

- temporal claim snapshots
- prediction escrow
- evidence reputation graph
- contradiction tournaments
- forensic timelines
- federated mirrors
- signed evidence hashes
- cryptographic timestamping
