# Overview Redesign Plan

## Purpose

`Overview` is a parallel overview page for committee review.

It does not replace the current homepage or the existing governance introduction page yet. The goal is to give the committee a clearer alternative that can be compared side by side before a final switch.

## Why a parallel page

The current homepage and governance introduction page still carry a documentation-style structure:

- long text blocks dominate the first screen
- protocol rules, participation guidance, and action entry points are mixed together
- the page reads more like a README than a DAO landing page

For the next iteration, the product direction is:

- homepage-like entry page first
- structured guide second
- deep documentation third

This is the first experiment in that direction, and the preferred long-term direction is for it to become an `Overview / Start Here` page rather than a conventional homepage hero.

## Page split

Short term:

- `/`
  - keep the current homepage unchanged
- `/governance_introducing`
  - keep the current long-form guide
- `/overview`
  - new structured landing page for committee comparison
- `/governance2`
  - compatibility route that redirects to `/overview`

Long term after review:

- keep the stronger page as the primary public entry
- move the other page into an archive or secondary guide role

## Overview direction

For a first-time visitor, the page should answer four questions in order:

1. What is BuckyDAO?
2. How does the protocol work?
3. What is happening now?
4. Where should I go next?

This means the page should behave like an orientation layer before a user enters the more specific workspaces.

## Overview v1 scope

The first version should answer three questions quickly:

1. What is BuckyDAO?
2. How does the protocol work at a high level?
3. Where should a visitor go next?

To achieve that, `Overview` should include these sections:

### 1. Hero

- a short DAO statement
- a compact description of BuckyOS governance
- a hero-adjacent `Core Principles` strip
- primary actions:
  - Explore proposals
  - View projects
  - Read current guide

### 2. Core Principles Strip

Move the constitutional ideas close to the first screen instead of burying them in the middle of the page.

- keep the wording short and manifesto-like
- use 4 compact cards
- place them directly under the hero copy

### 3. Live Snapshot

A compact live summary should make the page feel like a running system rather than a static guide.

Examples:

- indexed proposals
- committee members
- project profiles
- active funding rounds
- versions in development
- waiting settlement versions

This can use lightweight existing frontend queries in the first phase.

### 4. System Map

Explain the main protocol relationships:

- Projects
- Versions
- Proposals
- Release
- Treasury

This should read like a system graph, not a legal process description.

### 5. Choose Your Path

Intent-based cards are clearer than role labels for new users.

Examples:

- I am new and want the big picture
- I want to follow live governance
- I want to track roadmap execution
- I want capital and token flow

### 6. Recommended Next Steps

Direct links to:

- Governance guide
- Token Center
- Project & Version guide
- Treasury & Funding overview
- Vote guide

### 7. Live Activity

Reuse existing dynamic modules near the bottom:

- recent proposal votes
- DAO members

This keeps the page feeling alive without overcomplicating the first iteration.

## Design direction

The visual direction should move away from a markdown document and toward a product landing page:

- larger hero and stronger visual hierarchy
- narrower copy blocks, more cards and grouped sections
- emphasis on actions and system relationships
- less chapter-style reading, more guided scanning

## What stays out of v1

Not part of the first Overview rollout:

- replacing the current homepage
- removing the current governance guide
- adding heavy backend aggregation just for this page
- building charts or data visualization specific to the page

## Review criteria

The committee should compare the current homepage and `Overview` on:

- clarity of the first screen
- speed of understanding what the DAO is
- ease of finding the next action
- overall fit as a public-facing landing page

## Next steps after v1

If the committee prefers the new direction, the next phase should be:

1. decide whether `Overview` replaces `/` or becomes the primary top-level entry
2. connect richer live summary data where useful
3. refactor the old introduction page into a structured protocol guide

## Overview v2 focus

The second iteration should sharpen the page into a true first-entry overview.

The practical test is simple:

- a first-time visitor should form a usable protocol mental model in 30 seconds
- they should understand what is happening now
- they should know which next page matches their intent

### 1. Live Snapshot becomes a protocol dashboard

The snapshot section should move beyond static counts and feel like a lightweight protocol dashboard.

Recommended direction:

- top-line protocol metrics:
  - open proposals
  - versions in development
  - active funding rounds
  - released BDDT
- grouped "right now" panels:
  - governance now
  - delivery now
  - treasury now
- emphasis on what is active and actionable, not only what exists

### 2. System Map becomes more explicit

The current card list is a useful start, but the next version should read more like a system graph than a glossary.

Recommended direction:

- show the protocol as a left-to-right flow:
  - project profiles
  - versions
  - governance decisions
  - settlement and release
  - treasury and token flows
- make the transitions explicit:
  - projects create versions
  - versions become proposals
  - accepted work unlocks settlement and release
  - treasury and token state reflect those outcomes

### 3. Choose Your Path becomes stronger intent routing

The page should route visitors by intent, not by their ability to decode DAO terminology.

Recommended direction:

- each card should answer:
  - what kind of visitor is this for
  - what is the first page to open
  - what should they do next after that
- each path should have one clear primary action and a smaller secondary action
- examples:
  - understand the DAO in 10 minutes
  - follow live governance right now
  - inspect roadmap and delivery
  - inspect treasury and token flow

### Review criteria for v2

The next review should judge the page on:

- whether a first-time visitor can explain the protocol shape after one pass
- whether the snapshot feels like a live protocol dashboard
- whether the path cards reduce navigation hesitation
