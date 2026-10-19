# Roadmap

## Done
- [x] Simplify public portfolio while preserving the current format (Home, Portfolio, Project detail, Services, About, Contact, Nav, Footer).
- [x] Fix PortfolioDetail build error (unclosed tag, ReadingProgress, hero parallax refs, grain).
- [x] Verify all public pages on desktop (1280px) and phone (390px): all render, 10 public projects + galleries load without login, private project hidden, no HTTP 400s.
- [x] Verify anonymous access to every non-private project, including galleries; private projects stay protected.
- [x] Polish admin phone navigation, touch controls, and dashboard header; verify signed-in navigation and search at 390px and layout at 1280px.

## In progress
- [ ] Prevent portal search shortcuts from interrupting typing and make the activity heatmap keyboard/touch accessible; verify with tests and signed-in use.

## Open (blocked)
- [ ] Diagnose Myanmar-only access failure — needs the affected network's browser error message and ISP/provider name from the user; the test network is not in Myanmar.

