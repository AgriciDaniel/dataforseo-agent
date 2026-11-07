---
type: workflow
skill: youtube-research
title: "YouTube Research"
description: "Use when researching YouTube for a topic: which videos and channels rank, video metrics, top comments, and transcripts."
modules: [serp]
domain: dataforseo
status: stable
confidence: practitioner
created: 2026-11-06
updated: 2026-11-06
tags: [dataforseo, workflow, skill]
---

# YouTube Research

> Use when researching YouTube for a topic: which videos and channels rank, video metrics, top comments, and transcripts.

## Trigger
Video content planning, competitor channel research, or mining comments and transcripts. Inputs: keywords, or video ids.

## Inputs to ask for
- Ask only for what is missing. Location, language and budget fall back to the user's settings ([[settings]]).
- Keywords or video ids.
- Location and language.
- How many videos and comment blocks.

## Endpoints used (in order)
- `POST /v3/serp/youtube/organic/live/advanced` (ranked videos, channels, playlists)
- `POST /v3/serp/youtube/video_info/live/advanced` (metrics for one video)
- `POST /v3/serp/youtube/video_comments/live/advanced` (top comments)
- `POST /v3/serp/youtube/video_subtitles/live/advanced` (transcript)

## Steps
1. Search each keyword with `youtube/organic`; keep `youtube_video` items with `video_id`, `channel_name`, `views_count`, `is_shorts`.
2. Pick the top videos and pull `video_info` for likes, comments count, subscribers and keywords.
3. Pull `video_comments` (set `depth`) for audience questions and objections.
4. Pull `video_subtitles` for transcripts to see how the top videos structure the topic.

## Cost estimate
Notation: `task(x)` is the catalog per-task (or per-request, per-SERP, per-block) price of endpoint x for the chosen mode; `item(x)` is its per-item or per-row price. Read both from the catalog at run time.

K = keywords, V = videos analysed.
- Search: K x task(`youtube/organic/live/advanced`) per block of results.
- Per video: task(`video_info`) + task(`video_comments`) x comment blocks + task(`video_subtitles`).

Cheapest mode: Standard queue (`task_post`): search $0.0006 per block, video info and subtitles $0.0018, comments $0.0006 per block, against Live $0.002 to $0.006.

Typical run (3 keyword searches and 5 videos with info, 1 comment block and subtitles, Standard queue): 3 x $0.0006 + 5 x ($0.0018 + $0.0006 + $0.0018) = $0.0228 (list prices from `research/endpoints.json`, checked 2026-11-06).

## Output
A table of ranking videos with metrics, a list of recurring audience questions from comments, and transcript outlines of the top videos.

## Visuals
- `table`: ranking videos with views and channel. Fields: `items[].rank_absolute`, `items[].title`, `items[].views_count`, `items[].channel_name`. Rank order, top 20.
- `hbar`: total views per channel in the results. Fields: `items[].channel_name`, `items[].views_count`. Sort desc, top 10.

## Tell the user
- Top videos and channels with views.
- Themes in comments and transcripts.
- Content gaps worth a video.
- Close with the billed cost (sum of `tasks[].cost`) next to the estimate; for sandbox runs say the data is dummy.

## Pitfalls
- Organic results are counted in blocks; control volume with `block_depth`.
- Video info, comments and subtitles take one video per call.
- Metrics are point-in-time; repeat calls are needed for trends.

Related: [[serp]]
