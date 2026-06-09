# Qeerja Design System

## Design Philosophy

Qeerja is a modern project management platform focused on:

* Simplicity
* Clarity
* Speed
* Collaboration

Users should be able to create and manage tasks with minimal friction.

Every interface should answer:

1. What should I do?
2. What is currently happening?
3. What is blocked?
4. What is completed?

---

# Design References

Primary References:

* Linear
* Notion
* GitHub Issues
* Trello

Avoid:

* Jira complexity
* ClickUp clutter
* Monday.com excessive colors

---

# Visual Identity

Brand Personality:

* Professional
* Modern
* Minimal
* Enterprise-ready

Keywords:

* Focused
* Fast
* Clean
* Productive

---

# Color Palette

## Primary

Slate

```css
Primary 50  : #F8FAFC
Primary 100 : #F1F5F9
Primary 200 : #E2E8F0
Primary 300 : #CBD5E1
Primary 400 : #94A3B8
Primary 500 : #64748B
Primary 600 : #475569
Primary 700 : #334155
Primary 800 : #1E293B
Primary 900 : #0F172A
```

---

## Accent

```css
Blue
#2563EB
```

Used for:

* CTA
* Active menu
* Active board
* Links

---

## Success

```css
#16A34A
```

---

## Warning

```css
#D97706
```

---

## Danger

```css
#DC2626
```

---

## Background

Light:

```css
#FFFFFF
```

Dark:

```css
#09090B
```

---

# Typography

Font Family

```txt
Inter
```

Fallback:

```txt
system-ui
```

---

# Font Scale

Page Title

40px

Section Title

24px

Card Title

18px

Body

14px

Caption

12px

---

# Layout

Maximum Width

```css
1600px
```

---

# Application Layout

+------------------------------------------------+
| Top Navigation                                 |
+---------+--------------------------------------+
| Sidebar | Main Content                         |
|         |                                      |
|         |                                      |
+---------+--------------------------------------+

---

# Sidebar

Width

```css
260px
```

Collapsed

```css
72px
```

Sections:

* Home
* Workspace
* Projects
* My Tasks
* Notifications
* Settings

---

# Dashboard

Widgets:

* Assigned Tasks
* Overdue Tasks
* Recent Activity
* Active Projects
* Upcoming Deadlines

---

# Project Page

Header:

Project Name
Description
Members
Settings

Tabs:

* Board
* List
* Timeline
* Files
* Activity

---

# Board View

Columns:

Backlog
Todo
In Progress
Review
Done

Card Layout:

+--------------------------------+
| TASK-101                       |
| Create Login Page              |
|                                |
| High Priority                  |
| Arya                           |
+--------------------------------+

Rules:

* Drag and drop
* Infinite vertical scroll
* Lazy load tasks

---

# Task Detail Drawer

Open from right side.

Width:

```css
720px
```

Contains:

* Title
* Description
* Assignee
* Due Date
* Priority
* Labels
* Attachments
* Comments
* Activity

Never navigate to a separate page by default.

Use drawer first.

---

# Status Colors

Backlog

```css
gray
```

Todo

```css
slate
```

In Progress

```css
blue
```

Review

```css
amber
```

Done

```css
green
```

---

# Priority Colors

Lowest

gray

Low

blue

Medium

amber

High

orange

Urgent

red

---

# Cards

Radius:

```css
12px
```

Shadow:

```css
shadow-sm
```

Hover:

```css
shadow-md
```

Transition:

```css
200ms
```

---

# Tables

Use:

TanStack Table

Features:

* Sorting
* Search
* Pagination
* Column Visibility

Avoid:

DataTables

---

# Forms

Use:

* React Hook Form
* Zod
* shadcn Form

Validation:

Inline

Never use alert().

---

# Dialog

Use for:

* Delete
* Archive
* Confirmation

Maximum Width:

```css
500px
```

---

# Notifications

Position:

Top Right

Use:

Sonner

Duration:

```txt
3 seconds
```

---

# Empty State

Always include:

* Illustration
* Message
* CTA

Example:

"No tasks assigned yet"

Button:

"Create Task"

---

# Loading State

Use:

Skeleton

Never:

Spinner-only pages

---

# Dark Mode

Mandatory

All pages must support:

* Light
* Dark

No exceptions.

---

# Mobile Strategy

Desktop First

Supported:

* Desktop
* Tablet

Mobile:

Read-only MVP

Full mobile support in future phases.

---

# Accessibility

Requirements:

* Keyboard navigation
* Focus state
* ARIA labels
* Contrast AA

---

# Component Library

Use only:

* shadcn/ui
* Radix UI
* Lucide React

Avoid additional UI frameworks.

---

# Animation

Use:

Framer Motion

Duration:

150ms - 250ms

Avoid:

Heavy animations

Page transitions

Parallax effects

---

# KPI

Target Experience:

* Open task < 150ms
* Board load < 2 seconds
* Search response < 300ms

Users should feel the application is as responsive as Linear.
