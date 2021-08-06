// b8555800f807cfdedb844004b8312c49
import TogglClient from 'toggl-api';
import moment from 'moment';
import chalk from 'chalk';
require('dotenv').config();

var token = process.env.TOGGL_TOKEN;
var toggl = new TogglClient({ apiToken: token });

type TimeEntry = {
    id: number;
    guid: string;
    wid: number;
    pid: number;
    billable: boolean;
    duration: number;
    description: string;
    start: string;
    stop: string;
    uid: number;
};
type ProjectData = {
    id: number;
    wid: number;
    cid: number;
    name: string;
    billable: boolean;
    is_private: boolean;
    active: boolean;
    at: string;
    template: boolean;
    color: string;
};

const getMinHourNotation = (timeInSeconds: number) => ((
    ((Math.ceil(timeInSeconds / 60) - (Math.ceil(timeInSeconds / 60) % 60)) / 60 > 0 ?
        ((Math.ceil(timeInSeconds / 60) - (Math.ceil(timeInSeconds / 60) % 60)) / 60) + 'h' : '')
    + ((Math.ceil(timeInSeconds / 60) % 60 > 0) ?
        Math.ceil(Math.ceil(timeInSeconds / 60) % 60) + 'm' : '')
))

const day = moment().subtract(1, 'days');

console.log('Generating timesheets for ' + chalk.red(day.toLocaleString()));

toggl.getTimeEntries(moment(day).startOf('day').toISOString(), moment(day).endOf('day').toISOString(), async (err, timeEntries: TimeEntry[]) => {
    if (!err) {
        const timeEntriesByProject: { [key: number]: TimeEntry[] } = {};

        for (let timeEntry of timeEntries) {
            if (timeEntry.pid == null) {
                timeEntry.pid = -1;
            }
            if (!timeEntriesByProject[timeEntry.pid]) {
                timeEntriesByProject[timeEntry.pid] = [];
            }
            timeEntriesByProject[timeEntry.pid].push(timeEntry);
        }

        const projects: { [key: string]: { color: string, entries: TimeEntry[] } } = {};

        for (let project of Object.keys(timeEntriesByProject)) {
            if (project == "-1") {
                projects["Unlabeled"] = {
                    color: "0",
                    entries: timeEntriesByProject[project]
                };
                continue;
            }
            const projectData = await new Promise<ProjectData>((acc, rej) => {
                toggl.getProjectData(project, (err, data) => {
                    if (err)
                        rej(err);
                    else
                        acc(data);
                });
            });
            projects[projectData.name] = {
                color: projectData.color,
                entries: timeEntriesByProject[project]
            };
        }

        // Log all EOD files
        let length = 20;
        let toggleRGB = (color) => {
            let codes = {
                '1': '#6f4ff6',
                '2': '#6f4ff6',
                '3': '#6f4ff6'
            };
            if (codes[color])
                return codes[color];
            return '#6f4ff6';
        }

        for (let project of Object.keys(projects)) {
            console.log('');
            console.log(chalk.bgHex(toggleRGB(projects[project].color))(`${"=".repeat((length - project.length) / 2)} ${project} ${"=".repeat((length - project.length) / 2)}`));
            console.log(chalk.grey('TSC Hours: ') + chalk.bgYellowBright(chalk.black(Math.ceil(((projects[project].entries.reduce((a, b) => a + (b.duration), 0)) / 60 / 60) * 100) / 100)));
            let mergedEntries: TimeEntry[] = [];
            for (let entry of projects[project].entries) {
                let mergedEntry = mergedEntries.find(entry2 => entry.description == entry2.description);
                if (mergedEntry) {
                    mergedEntry.duration += entry.duration;
                } else {
                    mergedEntries.push(entry);
                }
            }

            for (let entry of mergedEntries) {
                console.log(`${entry.description} (${getMinHourNotation(entry.duration)})`)
            }
        }
        console.log('');

        // TODO: fix total value calculation
        // console.log('Total Hours: ' + (Object.keys(projects).reduce((c, d) => (
        //     Math.ceil(((projects[d].entries.reduceRight((a, b) => a + (b.duration), 0)) / 60 / 60) * 100) / 100 + c
        // ), 0)));
    } else {
        console.error(err);
    }
});