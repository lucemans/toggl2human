# Toggle2Human

## Setup

Install the dependencies using yarn (or npm)

```bash
yarn
```

Copy the `.env.example` file and name it `.env`
Add your API Token into the `.env` file. Find your API token at
<https://track.toggl.com/profile> > ``API Token``


## Usage

Change the date on line `42` of `src/index.ts`

Run the script

```bash
yarn start
```

---
**DISCLAIMER**:

If you still have active tracking entries on the day you are attempting to calculate the output will contain incorrect results due to the toggl api returning a negative timestamp. If this issue is of your concern, please feel free to make a PR.

---
