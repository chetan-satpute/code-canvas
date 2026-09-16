# Documentation

Written for a reader who was not present for the conversation that produced
them. No shorthand, no references to a chat, no bare ticket ids.

| Document                           | What it covers                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [engine.md](engine.md)             | The execution engine: how a run produces steps, how algorithms and structure operations are authored, and what the renderer receives.                                                  |
| [icon.md](icon.md)                 | The application icon: the mark and why it is that, the served asset files and the sources they come from, and how to regenerate them.                                                  |
| [porting.md](porting.md)           | The record of porting v1's thirteen algorithms and four structures onto the v2 engine, now complete, and the decisions that came out of it.                                            |
| [testing.md](testing.md)           | The plan for testing the application: why visualization correctness is assertable as data rather than pixels, the layers of the suite, and the order to build them.                    |
| [performance.md](performance.md)   | Whether the bundle needs code splitting and whether the engine belongs in a Web Worker: the measurements behind both answers, and what each one turned up that is worth doing instead. |
| [organization.md](organization.md) | A review of how the v2 source is organized now that the port is finished: the conventions that hold, and the places the same idea is written down more than once.                      |

## Conventions

Two kinds of document live here, and they are maintained differently.

**Living docs** — `engine.md` and anything beside it — describe how the code
works today. They are updated in the same commit as the behavior they
describe, so a stale living doc is a defect in that commit rather than a
follow-up task.

**Decisions** — `decisions/` — is an append-only log of the reasoning behind a
choice, written at the time it was made. An entry is never edited to reflect a
later change of mind; a new entry supersedes it and says so. The point is to
preserve why something looked right then, which a living doc deliberately
discards.
