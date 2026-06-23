/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Note } from "../types";

// Seed data for the demonstration
const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    email: "alex@secondbrain.dev",
    name: "Alex Mercer",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  },
  {
    id: "user-2",
    email: "sarah@sky.net",
    name: "Sarah Connor",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
  }
];

const INITIAL_NOTES: Note[] = [
  {
    id: "alex-note-1",
    title: "⚡ Event-Driven Decoupling Architecture",
    content: `# Event-Driven Decoupling Hierarchy

Below is the design spec for our standard pub-sub message dispatch system.

## Performance Requirements
- **Target latency**: < 5ms at 99th percentile.
- **Durable backlog**: Apache Kafka with 3 partition replication factors.
- **Schema Validation**: Protobuf messages.

### Message Pipeline Diagram
\`\`\`text
[API Gateway] ──> [Ingestion Lambda] ──> [Kafka Stream] ──> [Consumer Services]
\`\`\`

### Sample Dispatch Router in TypeScript
\`\`\`typescript
interface PubSubEvent {
  eventId: string;
  topic: string;
  payload: Record<string, any>;
  timestamp: number;
}

export class DecoupledDispatcher {
  async dispatch(event: PubSubEvent): Promise<boolean> {
    console.log("[PubSub] Emitting event on topic: " + event.topic);
    // Write code to produce message to partition queue safely
    return true;
  }
}
\`\`\`

## Edge Case Handling
- Double delivery must be resolved via **idempotency keys** on consumer states.
- Retries follow exponential backoff with random jitter.`,
    excerpt: "Design spec and TypeScript router implementation details for event-driven message dispatch system with Apache Kafka integration.",
    tags: ["architecture", "systems", "backend"],
    color: "violet",
    userId: "user-1",
    createdAt: "2026-06-21T10:15:00.000Z",
    updatedAt: "2026-06-21T10:15:00.000Z"
  },
  {
    id: "alex-note-2",
    title: "🐘 PostgreSQL Query Plans & Optimization",
    content: `# PostgreSQL Query Optimizer Guidelines

Practical reference for diagnosing slow reads and managing execution graphs.

## Core Optimization Rules
1. Never run \`SELECT *\` on multi-million row joins.
2. Ensure index coverage matches your \`WHERE\` predicates.
3. Optimize queries by viewing their plans:
   \`\`\`sql
   EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
   SELECT * FROM notes 
   WHERE user_id = 'user-1' AND status = 'active'
   ORDER BY created_at DESC;
   \`\`\`

## Structural Checklist
- **Partial Indexes**: Use partial indexes to index subset conditions:
  \`\`\`sql
  CREATE INDEX idx_active_notes ON notes (user_id) WHERE status = 'active';
  \`\`\`
- **Composite Indexes**: The leftmost indexing rule matters. Order columns based on query filters.`,
    excerpt: "A guide to analyzing query trees, buffer lookups, and applying composite/partial indexes in PostgreSQL.",
    tags: ["database", "postgres", "performance"],
    color: "emerald",
    userId: "user-1",
    createdAt: "2026-06-22T14:30:00.000Z",
    updatedAt: "2026-06-22T16:45:00.000Z"
  },
  {
    id: "alex-note-3",
    title: "🦀 Rust Memory Ownership & Lifetimes Cheat Sheet",
    content: `# Rust Memory Performance Cheat Sheet

Quick reminders for managing allocations and memory ownership boundaries.

## Rules of Borrowing
1. At any given time, you can have *either* one mutable reference *or* any number of immutable references.
2. References must always be valid.

### Lifetime Signatures
\`\`\`rust
// Lifetimes tie the reference parameters to the return value safety
fn longest_span<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
\`\`\`

## Reference Counting
- Use \`Rc<T>\` for single-threaded shared ownership models.
- Use \`Arc<T>\` for multi-threaded thread-safe messaging overlays.
- Combine with \`RefCell<T>\` or \`Mutex<T>\` for interior mutability patterns.`,
    excerpt: "Quick cheat sheet on lifetimes, borrowing checkers, reference counting, and pointers safety under Rust ownership model.",
    tags: ["rust", "compilers", "systems"],
    color: "amber",
    userId: "user-1",
    createdAt: "2026-06-23T08:00:00.000Z",
    updatedAt: "2026-06-23T08:00:00.000Z"
  },
  {
    id: "sarah-note-1",
    title: "🚀 Q3 Strategic Launch Timeline & Plan",
    content: `# Q3 Launch Plan & Strategic Goals

Our core objective is to execute a seamless roll-out to the private beta list by mid-August.

## Key Goals
- **Private Beta List**: 1,200 qualified designers, developers, and product operators.
- **Conversion Target**: 8.5% conversion to premium tier during first 30 days.
- **Product Stabilization**: Maintain 99.95% uptime threshold.

### Launch Timeline Phases
| Month | Focus | Deliverables |
|---|---|---|
| July | Features | Markdown Editor, Workspace Folders |
| August | Beta Launch | Close loop invite codes, feedback pipelines |
| September | Scaling | Stripe payments subscription engine |

### Distribution Channels
- Direct product demos via tech newsletters.
- Dev-to-dev onboarding guides on popular aggregate pages.
- Engaging bento-styled landing page showcases.`,
    excerpt: "Roadmap, target user conversion rates, and monthly phases for launching our private beta during third quarter.",
    tags: ["product", "launch", "strategy"],
    color: "amber",
    userId: "user-2",
    createdAt: "2026-06-20T09:12:00.000Z",
    updatedAt: "2026-06-20T11:45:00.000Z"
  },
  {
    id: "sarah-note-2",
    title: "🌲 Expedition Checklist: Wilderness Navigation",
    content: `# Wilderness Preparedness & Navigation Checklist

Crucial checklist to ensure remote safety during the Cascades mapping expedition.

## Essential Gear
- [x] **Water Filter**: Sawyer Squeeze + dynamic gravity bladder.
- [x] **Power Storage**: Anker solar block (24,000 mAh rugged output).
- [ ] **First Aid**: Multi-layer medical compression pack + antiseptic pads.
- [ ] **Backpack**: 48L ultralight waterproof frame.

## Navigation Protocols
- Set waypoint indexes in the physical satellite mapper before entering tree cover.
- Synchronize radio frequencies with base camp at 0900 and 1800 daily.
- Bring custom topo maps detailed in scale 1:24,000 as secondary hard backups.`,
    excerpt: "Crucial safety checklist and emergency communication protocols for the Cascades expedition.",
    tags: ["wilderness", "survival", "outdoors"],
    color: "emerald",
    userId: "user-2",
    createdAt: "2026-06-22T19:00:00.000Z",
    updatedAt: "2026-06-22T20:15:00.000Z"
  },
  {
    id: "sarah-note-3",
    title: "🎨 UI/UX Aesthetic Layout & Styling Guidelines",
    content: `# UI Styling & Typography Strategy

Design specifications to maintain professional elegance in high-density web products.

## Typography Guidelines
- **Display Headings**: Use Space Grotesk with light tracking (\`-tracking-tight font-medium\`).
- **Body & Controls**: Inter (\`font-sans bg-slate-950 text-slate-200\`).
- **Data & Tables**: JetBrains Mono for system feeds, counts, stats, and configurations.

## Visual Accents
- Keep margins generous. Negative space is a premium visual element, not a void.
- Emphasize borders over heavy background fills. Utilize subtle wireframes: \`border-slate-800 bg-slate-900/50 backdrop-blur\`.
- Keep colorful accents sparse. Pick one dominant neon/soft tone representing specific attributes.`,
    excerpt: "Aesthetic tokens, spacing proportions, and styling guidelines for modern dark mode grids.",
    tags: ["product", "ui-design", "ux"],
    color: "violet",
    userId: "user-2",
    createdAt: "2026-06-23T05:30:00.000Z",
    updatedAt: "2026-06-23T05:35:00.000Z"
  }
];

export function getStoredUsers(): User[] {
  const users = localStorage.getItem("secondbrain_users");
  if (!users) {
    localStorage.setItem("secondbrain_users", JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(users);
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem("secondbrain_users", JSON.stringify(users));
}

export function getStoredNotes(): Note[] {
  const notes = localStorage.getItem("secondbrain_notes");
  if (!notes) {
    localStorage.setItem("secondbrain_notes", JSON.stringify(INITIAL_NOTES));
    return INITIAL_NOTES;
  }
  return JSON.parse(notes);
}

export function saveStoredNotes(notes: Note[]) {
  localStorage.setItem("secondbrain_notes", JSON.stringify(notes));
}

// Security Helper: Verifies the note strictly belongs to the current user (Isolation Constraint)
export function verifyNoteOwnership(note: Note, currentUserId: string): boolean {
  return note.userId === currentUserId;
}
