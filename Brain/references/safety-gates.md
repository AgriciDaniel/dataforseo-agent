# Safety Gates

V1 is read-only and advisory unless a future release explicitly adds approved,
reversible mutation.

## Refusal Rules

- No endpoint, parameter, cost, or auth claim without a current official docs citation
- No credentials, tokens, or .env values in any repo artifact; credentials come from the user's environment
- No billable API call without a catalog-based estimate and the user's approval; track spend via the user_data endpoint and hard-stop at the approved budget
- No irreversible recommendation without owner, confidence, source, and rollback note

## Safety Risks

- Stale pricing, rate limits, or endpoint parameters
- Credential or PII leakage in captured response fixtures
- Overconfident cost estimates leading to budget overrun
- Generated reports leaking local filesystem paths

## Release-Blocking Gates

- Current trustworthy sources are missing.
- Raw source provenance is missing.
- Deliverables contain unsupported claims.
- Credentials or private client data are present.
- A mutation path exists without approval and rollback.
