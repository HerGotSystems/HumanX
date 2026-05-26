# HumanX

HumanX is the umbrella system for the Human Experience / Human Experiment / Human X.

It is built around a simple idea:

Nobody is forced to use anything here. But if you do use it, you should understand that your beliefs, actions, claims, contradictions, evidence and public behaviour can all be examined.

HumanX has two connected layers:

## 1. HumanX Belief Engine — personal layer

The Belief Engine is the personal starting point.

It maps belief structure, identity load, contradiction pressure, inherited ideas, pain-shaped views, tribal influence and personal response patterns.

It can be used anonymously, casually, or seriously.

Purpose:

- understand your own belief profile
- see where your views come from
- identify contradiction patterns
- test how answers shift your profile
- prepare for deeper claim testing later

This part is personal. It is about the individual.

## 2. HumanX Claims Engine — public / mass layer

The Claims Engine is the public pressure system.

Users submit claims, attach evidence, add pressure points, generate social reveal cards, and run server-side AI pressure analysis through Cloudflare Workers.

Purpose:

- make a claim
- challenge a claim
- support a claim with evidence
- attack weak claims with counter-evidence
- expose contradiction, stupidity, bad reasoning or social performance
- show how belief affects what people accept as proof

This part is social. It is about people, groups, tribes, arguments and public stupidity.

## Relationship between the two

The Belief Engine comes first.

The Claims Engine becomes more interesting when it understands the belief structure behind a claim.

A person can use HumanX just for fun, anonymously, or as an open challenge to their own thinking. A claim can be judged not only by whether it sounds convincing, but by what kind of belief structure produced it and what kind of evidence survives pressure.

In short:

- Belief Engine = personal profile
- Claims Engine = public claim pressure
- HumanX = the system connecting belief, behaviour, evidence and social exposure

## What is included in this repo

This repo currently contains the Claims Engine side:

- Cloudflare Worker API
- D1 database schema
- Static frontend in `public/index.html`
- Standalone demo mode
- Server-side Anthropic proxy at `/api/ai/analyse`

The Belief Engine currently lives as a runnable app in the RINKIMIRIKATA hub.

## Required Cloudflare secrets

The following secret names are required for deployment. Do not commit the actual values into GitHub.

- `ANTHROPIC_KEY`
- `ADMIN_TOKEN`

## Deployment

Connect this GitHub repo to Cloudflare Workers / Pages, set the D1 binding as `DB`, set the static assets binding as `ASSETS`, and add the two secrets above using Cloudflare secrets.
