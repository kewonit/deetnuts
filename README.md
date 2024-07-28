# Deetnuts

1000s of pages of public college, competitive exam, cutoffs data within pdfs, cleaned, formatted, made accessible & useable using sophisticated tables & graphs within our webapp!

tldr : Large public college data, made accessible & simpler to use

## Table of Contents

- [Deetnuts](#deetnuts)
  - [Table of Contents](#table-of-contents)
- [The Annoyance/Problem](#the-annoyanceproblem)
- [The Solution](#the-solution)
- [How to install \& run?](#how-to-install--run)
  - [Prerequisites](#prerequisites)
  - [The UI](#the-ui)
  - [The DB](#the-db)
    - [Set up environment variables:](#set-up-environment-variables)
- [Contribution](#contribution)
- [License](#license)

---

# The Annoyance/Problem

So, every year lakhs of students have to make a critical choice of choosing the college, they want to attend, as we here have fixed ranking, if you get a certain percentile above the cutoffs, you will get to attend that batch, but here is where a massive problem lies, we personally and lakhs of other students are stuck with sub par data, found on various random sites, and blogs all over the internet, the problem you may ask? This data is highly misleading, outdated, and outright wrong at times, and it doesn't even fulfill it's purpose, the irony is, all of this data for college cutoffs, their stats, from spending, to batch sizes are published every year, you may ask, why don't students use this? It's cause the data is massive, these are pdfs mostly and span across thousands of pages of unsorted, inaccessible data, that follows no standard, so here comes the solution we handcrafted at this FossHack.

Our believe in solving this problem became even more clear, when we saw not 100s, but 1000s of posts on the student run, subreddit of mhtcet, where students posted their percentile and preference, hoping for help, but sadly for them, there wasn't any way out there, they had to manually figure it out, and hope they were right with their choice, until now!

# The Solution

"deetnuts.com" a webapp that, solves this problem, we went through the tedious process of scraping these pdfs, converting them into usable csv's, and making the data accessible, as per the needs of students across the country, we knew just publishing the csv's out there, won't solve the problem, so we went ahead and build an accessibility & usability first table, which allows the students the ultimate control on the parameters, they would like to toggle, and find the exact colleges, they are eligible for, this would save the students (who presumable are under a lot of pressure already), greatly ease out their work of finding a good college

We have read enough stories, where people were unaware of better college they could get into, but didn't know it, cause there never had been a go to, one stop solution for it, instead of going through 10s, if not 100s of different website, keeping notes, they can find it with a few toggles, and deetnuts make this happen!

# How to install & run?

## Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- Git

## The UI
Clone the repository locally 
`git clone https://github.com/kewonit/deetnuts`

Change directory to deetnuts, if it isn't already

`cd deetnuts`

Install the packages

`npm install`

Run the npm server

`npm run dev`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## The DB

Staying close to the FOSS roots of this project we have used the <a href="https://github.com/supabase/supabase">Supabase Postgres </a>(The open source Firebase alternative.)

<a href="https://supabase.com/docs/reference/javascript/installing">To get started with installing</a>

### Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in your Supabase project details:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  SUPABASE_PUBLIC_ROLE_KEY=your-anon-key
  ```

You can use the given datasource and the handcrafted scrapers to recreate the exact data within the existing tables and add them in the `public` schema and fetch them down accordingly

We do not have any intermediate API layer, making more contribution easier without causing breakdowns within the entire webapp

This does bring some challanges pagination and limiting the rows queried at times, but this isn't a problem as of now, the loading speed do take a bit of hit, not signficant enough to slow down the entire app, and quering after every toggle option is made, loading the entire data on the client, make the user expirence seamless, while the inital boot might take a bit longer

In this usecase, it benifits us to use this method of directly fetching and displaying the data!


# Contribution

Feel free to contribute to this project, if you ideas to add more data, do open an issue up, and we would me more than happier to solve it togther!

# License

<a href="https://github.com/kewonit/deetnuts/blob/main/LICENSE">MIT license</a>
