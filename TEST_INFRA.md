# Aegis Control Plane Design - Test Infrastructure Plan

This document outlines the requirement-driven, opaque-box E2E test suite structure for Aegis. It contains exactly 71 test cases mapping to a 4-tier test case design across 6 core features.

## Feature Inventory
1. **Landing Page Interaction & Content** (LP)
2. **Setup Wizard / Guided Onboarding** (WIZ)
3. **Governance & Agent Control** (GOV)
4. **Inbox & Approvals Management** (INB)
5. **History Ledger / Audit logs** (HIST)
6. **Providers, Devices, & Settings** (SET)

---

## 4-Tier Test Suite Design

### Tier 1: Feature Coverage (30 Tests)

#### Feature 1: Landing Page (LP)
* **LP-T1-1**: Scroll Interaction - verifies scroll reveal triggers content visibility safely.
* **LP-T1-2**: MCP Console Simulation - verifies live logs and evaluation rows render correctly.
* **LP-T1-3**: Scenario Cycler - verifies that policy scenarios cycle text periodically.
* **LP-T1-4**: Newsletter Validation - submitting a valid email shows success state.
* **LP-T1-5**: FAQ Accordion - clicking questions toggles answers visibility and state.

#### Feature 2: Setup Wizard (WIZ)
* **WIZ-T1-1**: License key input activation updates local settings and triggers toast.
* **WIZ-T1-2**: Agent Setup step updates agent name in the visual description card.
* **WIZ-T1-3**: Providers step allows toggling Stripe/Twilio connection status.
* **WIZ-T1-4**: Phone linking step handles sending verification code.
* **WIZ-T1-5**: Connect AI command generator updates CLI commands based on agent name.

#### Feature 3: Governance & Agent Control (GOV)
* **GOV-T1-1**: View list of governed agents and verify initial states and names.
* **GOV-T1-2**: Toggle enforcement toggle on a specific agent and verify state update.
* **GOV-T1-3**: Pause an active agent and verify status changes to 'paused'.
* **GOV-T1-4**: Resume a paused agent and verify status returns to 'active'.
* **GOV-T1-5**: Revoke an agent and check status changes to 'revoked'.

#### Feature 4: Inbox & Approvals (INB)
* **INB-T1-1**: View inbox list and verify count badge on sidebar matches length.
* **INB-T1-2**: Filter inbox list by Step-up tab to show only STEP-UP items.
* **INB-T1-3**: Filter inbox list by Notice tab to show only NOTICE items.
* **INB-T1-4**: Approve a request, signing it and removing it from inbox.
* **INB-T1-5**: Deny a request, rejecting it and removing it from inbox.

#### Feature 5: History Ledger (HIST)
* **HIST-T1-1**: View history ledger table and verify columns are populated.
* **HIST-T1-2**: Filter history by verdict ALLOW to show only ALLOW actions.
* **HIST-T1-3**: Filter history by verdict DENY to show only DENY actions.
* **HIST-T1-4**: Search ledger logs by agent name to narrow down matching entries.
* **HIST-T1-5**: Click export button to trigger CSV export toast and verify action.

#### Feature 6: Providers, Devices & Settings (SET)
* **SET-T1-1**: View providers catalog and connect a disconnected integration.
* **SET-T1-2**: View providers catalog and disconnect a connected integration.
* **SET-T1-3**: Link a new security key device and verify it appears in the device list.
* **SET-T1-4**: Revoke a linked security key device and ensure it is removed.
* **SET-T1-5**: Toggle global enforcement settings and verify banner visibility on overview.

---

### Tier 2: Boundary & Corner Cases (30 Tests)

#### Feature 1: Landing Page (LP)
* **LP-T2-1**: Newsletter empty submission should trigger error border styling on the wrapper.
* **LP-T2-2**: Newsletter invalid email structure (missing domain/host) fails validation.
* **LP-T2-3**: FAQ accordion toggling same item twice collapses it.
* **LP-T2-4**: Mobile menu expansion and collapse via header buttons.
* **LP-T2-5**: Mandate search filter with a non-existent search term hides all rows except eval row.

#### Feature 2: Setup Wizard (WIZ)
* **WIZ-T2-1**: License key activate button remains disabled with empty/whitespace input.
* **WIZ-T2-2**: Next and Back step navigation boundaries.
* **WIZ-T2-3**: Setup phone step prevents verification submit with short code (less than 4 chars).
* **WIZ-T2-4**: Closing/skipping wizard via Close 'X' button hides modal and sets `aeg-dash-wizard-done` in localStorage.
* **WIZ-T2-5**: Finishing setup on step 5 redirects user to overview and sets localStorage flags.

#### Feature 3: Governance & Agent Control (GOV)
* **GOV-T2-1**: Reactivate a revoked agent and confirm status returns to 'active'.
* **GOV-T2-2**: Verify revoked agent card disables further action buttons except Reactivate/Play.
* **GOV-T2-3**: Ensure toggle enforcement does not alter other fields like spend limit or tasks run.
* **GOV-T2-4**: Verify agent card displays correct list of assigned mandates.
* **GOV-T2-5**: Check agent progress bars correctly reflect spend percentage calculations.

#### Feature 4: Inbox & Approvals (INB)
* **INB-T2-1**: Empty inbox state displays "Inbox zero" empty state layout.
* **INB-T2-2**: Approve or Deny items until inbox count is zero, verifying sidebar badge disappears.
* **INB-T2-3**: Verify approving/denying from a filtered tab updates counts in other tabs.
* **INB-T2-4**: Check that risk tags (High/Medium/Low) are styled correctly based on threat model.
* **INB-T2-5**: Ensure approval cards render full context (agent name, target payee, category, timestamp).

#### Feature 5: History Ledger (HIST)
* **HIST-T2-1**: Search for an impossible term to display empty state message.
* **HIST-T2-2**: Search for wildcard characters and handle escape bounds safely.
* **HIST-T2-3**: Ensure verdict filters update table row counts dynamically.
* **HIST-T2-4**: Verify live audit logs append new rows asynchronously and limit displays to recent entries.
* **HIST-T2-5**: Verify sequence numbers are monotonic and hashes are truncated with ellipsis.

#### Feature 6: Providers, Devices & Settings (SET)
* **SET-T2-1**: Attempt to revoke the current device and verify action is disabled.
* **SET-T2-2**: Edit settings step-up threshold with negative values or extreme bounds.
* **SET-T2-3**: Save custom Backend API endpoint and verify persistence.
* **SET-T2-4**: Toggle notification settings (SMS/Email) and check storage updates.
* **SET-T2-5**: Trigger "Reset Setup Wizard" from settings and verify modal immediately re-opens.

---

### Tier 3: Cross-Feature Combinations (6 Tests)

* **COMB-3-1**: Wizard Provider Toggle -> Providers Page Sync: Toggling providers inside setup wizard syncs their status on the main Providers page.
* **COMB-3-2**: Settings Enforcement Toggle -> Dashboard Overview Banner: Turning off global enforcement in Settings displays the warning banner on Dashboard.
* **COMB-3-3**: Wizard License Key -> Settings Key Sync: Activating a license in the wizard auto-populates the license input on Settings page.
* **COMB-3-4**: Inbox Approval Action -> History Ledger Entry: Approving a request in Inbox appends a new signed/approved record in the History table.
* **COMB-3-5**: Devices Addition in Wizard -> Devices Tab Sync: Adding phone device in wizard links it, appearing inside the Devices list on main app.
* **COMB-3-6**: Theme Toggle Sync: Toggling theme on landing page persists settings so the Dashboard is rendered in matching theme (data-theme/localStorage sync).

---

### Tier 4: Real-world Application Scenarios (5 Tests)

* **SCEN-4-1**: E2E Setup to Governance Workflow: User loads landing, launches Dashboard, completes onboarding wizard (agent name, provider link, phone link), and verifies agent is active under Governance.
* **SCEN-4-2**: Step-up Transaction Approval Flow: Agent initiates high-value payment which triggers a STEP-UP approval in the Inbox; user approves it, and system records cryptographic audit entry in History.
* **SCEN-4-3**: Emergency Revocation Drill: Operator detects anomalous agent behaviour, revokes passport on Governance page, and verifies that the agent's enforcement switches status.
* **SCEN-4-4**: Accessibility (Axe) Audit: Landing page and main dashboard views have no critical violations.
* **SCEN-4-5**: Settings Sync & Reset Loop: Resetting setup wizard from settings, modifying endpoints, changing notification channels, and verifying settings persist after reloads.
