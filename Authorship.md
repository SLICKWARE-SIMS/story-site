# Creating Your Own CYOA

Simple CYOAs can be created directly in Google Docs. More complex CYOAs may require a text editor.

## Making A CYOA With Google Docs

This guide will walk you through the process of creating a CYOA exclusively in Google Docs.

Try visiting [A Day At The Park](https://docs.google.com/document/d/1RgM9Lvw_YRbjZjZKbjATJHPAtZSSlaGVjxi-s8mZUVc/edit?usp=sharing). Start at the first section "Arriving At The Park" and click on hyperlinks to navigate to other parts of the story. When you get to the "Go Home" section then the story is over.

Let's dig into the elements of this document that this package will transform into a CYOA engine.

### Title

> A Day At The Park

The Title is the first thing that appears in the document. It is in the `Title` Style.

### Author

> By r0u73r

The `By r0u73r` section comes after the title but before the first heading.

### First Passage

> Arriving at the Park

The first instance of text with the `Heading 2` Style will be the place where players start.

#### Passage Text

> It’s a beautiful day at the park! What will you do?

Text in the `Normal Text` Style following the header is stored as the text for that passage. This can spread across multiple lines, but it cannot contain bulleted lists, numbered lists, bold, or italics.

#### Passage Transitions

> - Search through the trash can
> - Swing on the swing
> - Nap in the grass
> - Go home

Each bullet is a separate "transition", a link to a potential next step in the story. Each of these links will link two another header within the same document.

Each bullet has two pieces of information:

1. The player facing text, what you see when you look at the link.
2. The link destination, which controls where the link takes you.

##### How do I hyperlink within the same document?

When you go to create a hyperlink in Google Docs you will see an option at the bottom of the pop-up box that says `Headings, bookmarks, and tabs`. This will allow you to choose other headings in the same document.

### Additional Passages

Additional passages follow the exact same format. If a passage has no transitions then it is the end of the story.

### Things To Watch Out For

- Don't use bold or italics.
- Don't alternate between passage text and passage transitions. For example, don't do the following:
    > It’s a beautiful day at the park! What will you do?
    >
    > - Search through the trash can
    > - Swing on the swing
    > - Nap in the grass
    >
    > You could also just turn in early!
    >
    > - Go home

### Exporting The CYOA to Markdown

It's as simple as selecting `File`, then `Download`, then `Markdown (md)`

### What Does The Exported File Look Like?

```markdown
# A Day At The Park

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```

By looking at this document you can start to see how documents are written in markdown.

A `#` at the beginning of the line denotes a header, with multiple `##` denoting a sub-header.

Each header ends with that header's tag like `{#arriving-at-the-park}`. A header's tag is the header text lowercased and with all special characters removed and all spaces converted to dashes.

Note: You don't actually need to add the header tags at the end of the header, it's totally unnecessary, Google Docs adds them just for fun.

Bulleted lists start a line with `-`.

Hyperlinks follow the format `[visible, player facing text](#relevant-passage-name)`.

Note: Some lines end with a bunch of spaces, this is a weird Google Docs thing, you never need to end a line with a bunch of blank spaces.

Note: You might see the backslash character `\` appear at random points. Ignore it. It's weird behavior from Google Docs and you can delete them if you want.

## Making a CYOA With Markdown (Advanced)

Advanced behavior will require working with the markdown file directly. Consider starting the CYOA as a google doc, downloading that doc, and then editing the markdown file to add advanced behavior.

Types of advanced behavior:

- Enhanced metadata
- Inventory system
- Making options available/unavailable based on the player's inventory

### Picking Up Where We Left Off

This is what the markdown from the previous story looked like. We're going to extend this story to add a balloon cart in the park that we can buy balloons from. This means that we need to keep track of our money and forbid the balloon buying option if the player is broke.

You will need a text editor like Notepad (comes installed on Windows) or TextEdit (comes installed on Mac) in order to edit a Markdown doc.

### Adding The New Sections

Let's add some sections about balloon purchasing

```markdown
# A Day At The Park

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Visit the balloon cart](#balloon-cart)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Balloon Cart

You approach a colorful balloon cart.

A man says "Do you want a balloon? It costs 1 Dollar."

- [Buy Balloon](#buy-balloon)
- [Go Back](#arriving-at-the-park)

## Buy Balloon

The man says "Thanks! Here's one balloon."

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```

Remember that the heading tags (like `{#trash-can}`) are totally optional. They are exported by Google Docs, but there is no need to include them.

### Adding Inventory Items

If you want to use an inventory then initialize that inventory right underneath the title. You will be writing simple JavaScript code to do this with an `inventory` object that has already been created for you. Surround your javascript with curly braces `{}`.

For example, maybe I want my player to start with two shoes and a bow. Later in the game I plan on having them pick up arrows, but they don't start with any. They can specify that as follows:

```console
{inventory.shoes = 2}
{inventory.bows = 1}
{inventory.arrows = 0}
```

Now let's update our story to give the player 5 dollars at the start.

```markdown
# A Day At The Park

{inventory.dollars = 5}

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Visit the balloon cart](#balloon-cart)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Balloon Cart

You approach a colorful balloon cart.

A man says "Do you want a balloon? It costs 1 Dollar."

- [Buy Balloon](#buy-balloon)
- [Go Back](#arriving-at-the-park)

## Buy Balloon

The man says "Thanks! Here's one balloon."

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```

### Updating Inventory

You can update inventory exactly as you set it, but do so at the beginning of a passage. In the example below you will see how to set an inventory item to a new value, increment an inventory item value by 1, and decrement it by 1.

```console
{inventory.itemOne = 5}
{inventory.itemTwo = inventory.itemTwo + 1}
{inventory.itemThree = inventory.itemThree - 1}
```

Now let's update our CYOA to subtract one dollar each time a balloon is purchased.

```markdown
# A Day At The Park

{inventory.dollars = 5}

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Visit the balloon cart](#balloon-cart)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Balloon Cart

You approach a colorful balloon cart.

A man says "Do you want a balloon? It costs 1 Dollar."

- [Buy Balloon](#buy-balloon)
- [Go Back](#arriving-at-the-park)

## Buy Balloon

{inventory.dollars = inventory.dollars - 1}

The man says "Thanks! Here's one balloon."

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```

### Conditional Transitions

We don't want the player to be able to buy a balloon if they don't have enough money. So we should prevent them from buying a balloon unless they have 1 or more dollars. How can we accomplish that?

We can use an `If` statement. This looks like an html tag, and it's going to be the scariest part of writing a CYOA in markdown. We put an `If` statement within the transition to define `when` the "condition" (a JavaScript expression) is possible.

Note: when you are comparing amounts in Javascript you can use the greater than and lesser than operators (`<` and `>`), but your can also check that the amounts are equal (`==` notice we are using two equal signs here). You can even check for greater than or equal `>=`, or even less than or equal `<=`.

```markdown
- [This is a transition you will always be able to take no matter what](#header-one)
- <If when={inventory.arrows >= 5}> 
    [This is a transition you can only take if you have at least 5 arrows](#arrow-time)
  </If>
- <If when={inventory.shoes == 2}> 
    [This is a transition you can only take if you have exactly 2 shoes](#pair-of-shoes)
  </If>
```

Don't worry about the weird spacing, it doesn't have to be exact as long as each bullet starts on its own line.

With all that in mind, let's go ahead and add an `If` statement to prevent buying balloons if we don't have the money.

```markdown
# A Day At The Park

{inventory.dollars = 5}

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Visit the balloon cart](#balloon-cart)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Balloon Cart

You approach a colorful balloon cart.

A man says "Do you want a balloon? It costs 1 Dollar."

- <If when={inventory.dollars >= 1}> 
    [Buy Balloon](#buy-balloon)
  </If>
- [Go Back](#arriving-at-the-park)

## Buy Balloon

{inventory.dollars = inventory.dollars - 1}

The man says "Thanks! Here's one balloon."

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```

### Adding Metadata

Let's say that this story can be considered scary because it has `balloons` and `the outdoors`. These elements aren't very scary, but if you're writing a horror story you may have some very scary triggers that you don't want to expose your unprepared audience to.

To add metadata to markdown we can shove something like this at the very top of the document.

```markdown
---
key: some value
anotherKey: some other value
aListOfThings: ["thing1", "thing2", "thing3"]
---
```

Now lets update our document to include triggers:

```markdown
---
triggers: ["balloons", "the outdoors"]
---

# A Day At The Park

{inventory.dollars = 5}

By r0u73r

## Arriving at the park {#arriving-at-the-park}

It’s a beautiful day at the park\! What will you do?

- [Search through the trash can](#trash-can)  
- [Swing on the swing](#swing)  
- [Nap in the grass](#nap)  
- [Visit the balloon cart](#balloon-cart)  
- [Go home](#go-home)

## Trash Can {#trash-can}

You root through the trash can, but you don’t find anything interesting.

- [Go Back](#arriving-at-the-park)

## Swing {#swing}

Wheeeeeeeeee\!

- [Go Back](#arriving-at-the-park)

## Nap {#nap}

Your eyes flutter and you drift off into a peaceful slumber. You awake in the park after a few minutes, feeling refreshed\!

- [Go Back](#arriving-at-the-park)

## Balloon Cart

You approach a colorful balloon cart.

A man says "Do you want a balloon? It costs 1 Dollar."

- <If when={inventory.dollars >= 1}> 
    [Buy Balloon](#buy-balloon)
  </If>
- [Go Back](#arriving-at-the-park)

## Buy Balloon

{inventory.dollars = inventory.dollars - 1}

The man says "Thanks! Here's one balloon."

- [Go Back](#arriving-at-the-park)

## Go Home {#go-home}

Wow, what a day\! You head home.
```
