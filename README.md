# Urtak Revival

A rebuild of the Urtak yes/no polling widget in HTML, CSS and SVG, starting from the 2012 design
file `1201-MagicWidgets.psd`.

## What Urtak was

Urtak was a collaborative polling service, started in New York in 2008. Publishers embedded a
widget on a page, and readers answered a stream of short yes/no questions. Readers could also add
their own questions to the same poll, so a single question could grow into a large poll written by
its audience. TheBlaze ran one about food stamps that started with one question and grew to over
88 questions and nearly 200,000 responses.

Publishers used it alongside or instead of a comment box. It was quicker to take part in than
writing a comment (useful on mobile), and the answers gave publishers numbers they could analyse.

The service shut down on 20 September 2013. By then it had hosted more than 13,000 polls, 77,000
questions and 22 million responses.

## How it worked

### For readers

- **A stream of cards.** Questions appear one at a time as cards in a narrow column.
- **Three answers:** Yes, No or Don't Care. A question can't be skipped, but it can be flagged.
- **The result replaces the buttons on the same card.** When you answer, the buttons turn into a
  pie chart of the community's answers and your answer is added after the question ("... NO").
  The answered card then slides down to make room for a new unanswered card on top.
- **Numbers on demand.** The pie shows Yes vs No (Don't Care isn't in the pie). Yes %, No %, total
  votes and Care % (the share who didn't pick Don't Care) are available on the result.
- **You can scroll back** through the questions you've answered, and share a result to Twitter or
  Facebook.
- **No account needed to answer.** Anyone who sees the widget can vote without logging in.
- **Ask your own.** Readers can add a yes/no question of their own, which needs an account. You
  answer your own question to submit it. It shows "Asked by a reader" unless you choose to show
  your username, and you can remove it later.
- **Happy ending.** Once you've answered everything you get "Awesome! You've answered all the
  questions" and an invitation to ask one. New questions show up later as a "New Questions! Click
  to Load" bar.

### Question order

Questions are served in a shuffled order, weighted so the "most cared about" questions (those with
the fewest Don't Care answers) come first.

### For publishers

- **Setup:** sign up with an email address, type in the yes/no questions, add a title and
  instructions, then publish. It was free, with several design themes to choose from.
- **Embedding:** an embed code (like YouTube's), plus plugins and integrations for WordPress,
  Drupal, Blogger, Typepad, Squarespace, Tumblr and Facebook tabs. The same poll could be embedded
  on many pages and articles at once, or shared with a direct link.
- **Moderation:** either approve reader questions before they go live (they show as pending until
  then) or let them publish straight away and let the community sort them out. Spam filtering and
  flagging helped, and the owner could delete any question.
- **Analysis:** a dashboard with results for every question and cross-tabulation between
  questions, e.g. how people who answered Yes to one question answered another. This made it
  useful for learning about an audience, not only for collecting opinions.

## This project

- `prototype/`: a clickable prototype of all 39 Layer Comps from the PSD, built in code with design
  tokens (`tokens.css`) instead of images.
- `widget/`: the live widget in one view. Cards slide, answers crossfade into pies, and asking,
  logging in, moderation and the info drawer all happen in place. A control strip lets you toggle
  logged in, moderation, live votes and the counter style, and trigger events like new questions.
- `design/comps/`: a PNG of each Layer Comp for side-by-side comparison.
- `docs/reference.md`: how the PSD is structured and how both builds work.

The PSD itself is kept outside the repo. To view either build, open `prototype/index.html` or
`widget/index.html` in a browser, or serve the project folder with any static server.

## Sources

What's above comes from the project owner's description, the 2012 design comps, and these
articles:

- [Urtak, Wikipedia](https://en.wikipedia.org/wiki/Urtak): history, shutdown date and final numbers
- [How to use Urtak, Poynter (2011)](https://www.poynter.org/reporting-editing/2011/how-to-use-urtak-a-collaborative-polling-tool-to-increase-reader-engagement/):
  reader and publisher view, moderation, cross-tabulation, embedding
- [Urtak's new publishing tool, The Next Web](https://thenextweb.com/news/urtaks-new-publishing-tool-creates-collaborative-online-polling):
  no skipping, random order, TheBlaze example, platforms
- [Creating social polls, Nik Peachey (2010)](https://nikpeachey.blogspot.com/2010/04/creating-social-polls-and.html):
  creating a poll, answering without an account, deleting reader questions
- [Urtak Drupal module](https://www.drupal.org/sandbox/lgomezc/1679420): "most cared about"
  ordering, spam filtering and approval
- [Urtak description, OER wiki](https://oer.opendeved.net/wiki/Tools/Urtak/description):
  Urtak as an alternative to blog comments
- [Urtak hits 10,000,000 responses, Business Insider (2011)](https://www.businessinsider.com/urtak-10000000-responses-yesnodont-care-2011-3)
  (couldn't be fetched, listed for reference)
