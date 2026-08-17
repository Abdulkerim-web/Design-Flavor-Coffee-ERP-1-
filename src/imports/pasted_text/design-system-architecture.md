Master Design System Architecture
PROMPT ID: FIGMA-AI-ERP-01
TARGET MODULE: MASTER DESIGN SYSTEM & CORE FOUNDATIONS
DESIGN PHILOSOPHY: LINEAR x STRIPE x APPLE HUMAN INTERFACE

1. Project Vision & UX Strategy
Generate a complete, enterprise-grade, world-class Design System for Flavor Coffee Roasters PLC, a high-end Ethiopian coffee roasting and exporting enterprise. The interface must balance extreme visual clarity, deep data density, and effortless usability. Eliminate traditional, clunky enterprise ERP patterns. Deliver a clean, calm, high-efficiency interface engineered for zero cognitive fatigue during 8-hour operational shifts.
                    UX DESIGN TRIAD
         
               ┌─────────────────────────┐
               │     ELEGANT CALM        │
               │ Low-fatigue Palette     │
               └────────────┬────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     EXTREME EFFICIENCY    │ │     UNCOMPROMISING SPEED  │
│ Dense, scannable data     │ │ Zero-latency flows        │
└───────────────────────────┘ └───────────────────────────┘

2. Design Tokens & Visual Identity System
Color Architecture
Build a structured semantic color system using the following exact HEX tokens:
BG Primary:         #FAFAF8  (Off-white canvas)
Surface 01:         #FFFFFF  (Pure white container)
Surface 02:         #F5F3EF  (Warm light grey background)
Surface Hover:      #EEEDE8  (Subtle interact state)
Border Neutral:     #E5E3DC  (Subtle structural division)
Border Focus:       #2B4D3A  (Active field ring)

Primary Brand:      #2B4D3A  (Deep Forest Emerald - Authority)
Primary Hover:      #1F382A  (Deep Emerald Dark)
Accent Gold:        #B8860B  (Harvest Gold - Coffee Grade)
Accent Roaster:     #6E4A32  (Artisanal Roasted Bean Brown)

Semantic Success:   #16A34A  (Approved, In-Spec, Paid)
Semantic Warning:   #F59E0B  (Yield Variance, Low Stock)
Semantic Danger:    #DC2626  (QC Rejection, Discrepancy Lock)
Semantic Info:      #2563EB  (Logistics, Delivery Active)

Text Primary:       #1F2937  (High contrast body text)
Text Secondary:     #6B7280  (Supporting metadata)
Text Muted:         #9CA3AF  (Disabled states, placeholders)

Typography Scale
Utilize Inter or Geist variable fonts with strict tabular numbers (tnum) enabled for data tables and financial ledgers:
●	Display 01: 36px / Line Height: 44px / Bold / Tracking: -0.02em
●	Heading 01: 24px / Line Height: 32px / SemiBold / Tracking: -0.01em
●	Heading 02: 18px / Line Height: 24px / SemiBold / Tracking: -0.005em
●	Subheading: 14px / Line Height: 20px / Medium / Tracking: 0em
●	Body Regular: 14px / Line Height: 20px / Regular
●	Body Medium: 14px / Line Height: 20px / Medium
●	Caption/Label: 12px / Line Height: 16px / Medium / Tracking: +0.01em
●	Micro Mono: 11px / Line Height: 14px / Tabular Mono (For SKU/Batch IDs)
Spatial System & Layout Grid
●	Base Unit: 8pt grid system (with 4pt micro-adjustments for badges and icons).
●	Spacing Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px.
●	Elevation & Shadows:
○	Flat Surface: Border 1px solid #E5E3DC, No Shadow.
○	Card Elevation: 0px 1px 3px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.02).
○	Flyout/Popover: 0px 10px 15px -3px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.03).
○	Modal Focus: 0px 25px 50px -12px rgba(0,0,0,0.18), backdrop blur 8px (#000000/20).
3. Core Component Library Foundations
Construct Auto-Layout component sets with complete variants for Default, Hover, Focused, Active, Disabled, Loading, Error, and Success:
Interactive Components
1.	Buttons:
○	Primary: Background #2B4D3A, Text #FFFFFF, Radius 6px, Padding 8px 16px.
○	Secondary: Background #FFFFFF, Border #E5E3DC, Text #1F2937.
○	Destructive: Background #DC2626, Text #FFFFFF.
○	Ghost: Background Transparent, Text #1F2937, Hover Background #F5F3EF.
2.	Form Controls:
○	Text Inputs, Number Inputs (with inline unit labels, e.g., "KG"), Select Dropdowns, Date-Range Pickers, and Multi-Select Filters. Include explicit error state text and success icons (Lucide).
3.	Data Presentation:
○	Status Badges: Pill-shaped, 12px Medium font, dot indicator.
■	Approved: Green background #DCFCE7, Text #15803D.
■	Discrepancy: Red background #FEE2E2, Text #B91C1C.
■	Processing: Amber background #FEF3C7, Text #B45309.
4.	Tables: Clean, row-hover highlighted, fixed-header supported with sorting indicators and column-pinning handlers.
5.	Feedback Systems: Toast notifications, Inline Banner alerts, Skeleton Loaders, Empty States with vector graphic illustrations, Modal Dialogs.
4. Motion & Micro-Interaction Guidelines
●	Duration Tokens: Fast (100ms), Base (200ms), Slow (300ms).
●	Easing Curves: Standard cubic-bezier(0.16, 1, 0.3, 1) (Apple style).
●	Interactions: Smooth card lifts on hover (translateY(-1px)), crisp button press compressions (scale(0.98)), seamless tab indicator slide transitions.

