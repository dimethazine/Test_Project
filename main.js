const { chromium } = require("playwright");
const login = require("./login");

const errorPatterns = [
  " is locked by ",
  " locked by port",
  "(unknown)",
  "<ERROR_CODE>400",
  "3PA: Index: 0, Size: 0", // truncated for brevity
];

function containsError(errorText) {
  return errorPatterns.some((pattern) => errorText.includes(pattern));
}

async function runTasks(shellNums) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(); // Playwright uses browser contexts
  const page = await context.newPage();

  await login(page);

  for (let url of shellNums) {
    await page.goto(
      `https://autoloop.us/dms/App/CompanySelector.aspx?CompanyId=${url}`
    );
    await page.goto(
      "https://autoloop.us/DMS/App/DealershipSettings/PendingAppointmentWrites.aspx"
    );

    const rows = await page.$$(
      "#ctl00_ctl00_Main_Main_unknownWrites > tbody tr"
    );

    for (let row of rows) {
      const errorTdText = await row.$eval(
        "td:nth-last-child(2)",
        (node) => node.innerText
      );
      if (containsError(errorTdText)) {
        const resubmitID = await row.$eval(".resubmit", (node) =>
          node.getAttribute("data-laid")
        );
        if (resubmitID) {
          const response = await page.evaluate(async (resubmitID) => {
            const response = await fetch(
              "https://autoloop.us/DMS/App/DealershipSettings/PendingAppointmentWrites.aspx/ResubmitAppointmentWrite",
              {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                  loopCompanyId: "INSERT_LOOP_COMPANY_ID_HERE", // Replace with the actual loopCompanyId
                  appointmentId: resubmitID,
                }),
              }
            );
            return response.json();
          }, resubmitID);

          console.log(`Response for ${resubmitID}:`, response);
        }
      }
    }
  }

  console.log(`Completed tasks for: ${shellNums.join(", ")}`);
  // await browser.close();
}

async function main() {
  const tasks = [
    runTasks([8579, 5890, 5946]),
    runTasks([8989, 1593, 9282]),
    runTasks([7283, 1082, 1382]),
  ];

  // Run all tasks concurrently
  await Promise.all(tasks);
}

main().catch(console.error);
