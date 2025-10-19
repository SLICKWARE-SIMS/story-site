# Story Format Guide

Stories for Slickware Sims can be written in [Markdown](https://www.markdownguide.org/cheat-sheet/#basic-syntax) and follow a specific structure that can be parsed into interactive narratives. If you follow dmgCTRL's Google Doc format then you should be good.

## Structure

```
[Title]

[Introduction text...]

---

1. SCENE TITLE

Scene content and narrative here...

[Choice ID] Choice text here
[Choice ID] Another choice here

2. NEXT SCENE TITLE

More narrative...

[Choice ID] Choice text
```

## Details

### Title

First line of the document - and only one line.

### Intro

Everything between the title and the first scene

### Scene

There's three parts of a scene:

#### Scene Title

The scene title line starts with a number followed by a period and a space, then the title text. The number is used as the scene's unique ID. IDs must be unique across the whole story.

#### Scene Content

The scene content is everything between the scene title and the first choice. This is the narrative text that will be shown to the player. You can use standard Markdown formatting here.

#### Choices

Choices start with a line that begins with a square bracket containing the ID, followed by a space and the choice text. The ID should be the ID of the scene that gets loaded when the player selects that choice.
