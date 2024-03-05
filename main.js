const { chromium } = require("playwright");
const login = require("./login");
const fetchDealershipHours = require("./fetchDealershipHours");
const fetchPendingWritesCount = require("./fetchPendingWritesCount");
const resubmitter = require("./resubmitter");
const fetchCompanyIds = require("./SnowflakeSQL");

async function initBrowser() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page);
  return { browser, page };
}

async function runTasks(shellNums) {
  let { browser, page } = await initBrowser();

  for (let i = 0; i < shellNums.length; i++) {
    try {
      const url = shellNums[i];
      const isLastDealer = i === shellNums.length - 1;

      await page.goto(
        `https://autoloop.us/dms/App/CompanySelector.aspx?CompanyId=${url}`
      );
      const hasPendingWrites = await fetchPendingWritesCount(page);
      if (!hasPendingWrites) {
        if (isLastDealer) {
          console.log(`last dealer`);
        } else {
          console.log(`No pending writes for ${url}, moving to the next.`);
        }

        continue;
      }

      const isOpen = await fetchDealershipHours(page);
      if (!isOpen) {
        if (isLastDealer) {
          console.log(`Dealerships is closed on ${currentDay}, last dealer`);
        } else {
          console.log(
            `Dealership is closed on ${currentDay}, moving to the next.`
          );
        }
        continue;
      }

      await page.goto(
        "https://autoloop.us/DMS/App/DealershipSettings/PendingAppointmentWrites.aspx"
      );

      await resubmitter(page);
    } catch (error) {
      console.error(`Error occurred while processing ${shellNums[i]}:`, error);
      try {
        await browser.close();
      } catch (error) {
        console.error(`Error occurred while closing the browser:`, error);
      }
      console.log(`Restarting the process for: ${shellNums[i]}`);
      ({ browser, page } = await initBrowser());
      i--;
      continue;
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 30 * 1000)); // wait 20 seconds
    }
  }

  console.log(`Completed tasks for: ${shellNums.join(", ")}`);
  await browser.close();
}

async function scheduleBatches() {
  try {
    const companyIds = await fetchCompanyIds();
    console.log(companyIds);

    const taskBatches = chunkArray(companyIds, 10);

    for (let batch of taskBatches) {
      await runTasks(batch);
    }
  } catch (error) {
    console.error(`error fetching company ID's: ${error}`);
  }
}

function chunkArray(array, size) {
  return array.reduce((acc, e, i) => {
    return (i % size ? acc[acc.length - 1].push(e) : acc.push([e])) && acc;
  }, []);
}
/*
  const taskBatches = [
    [8579, 5890, 5946, 5974, 5990, 6184, 6218, 6318, 7826, 13268],
    [13321, 13579, 13738, 13828, 2213, 2227, 2269, 2297, 2325, 2339],
    [2353, 2367, 2381, 2409, 2451, 2465, 2479, 2507, 2521, 2535],
  ];

  let currentBatch = 0;

  async function executeBatch() {
    if (currentBatch >= taskBatches.length) {
      console.log("All batches have been ran; resetting to first batch");
      currentBatch = 0;
    }

    console.log(`Starting batch ${currentBatch + 1}`);
    await runTasks(taskBatches[currentBatch]);
    currentBatch++;
    setTimeout(executeBatch, 1 * 60 * 1000); // 5 minute wait
  }
  executeBatch();
}*/

scheduleBatches().catch(console.error);
/*
async function main() {
  const tasks = [
    // runTasks([8579, 5890, 5946]),
    // runTasks([5946]),
    // runTasks([8989, 1593, 9282]),
    // runTasks([7283, 1082, 1382]),
    //,,
    runTasks([8579, 5890, 5946, 5974, 5990, 6184, 6218, 6318, 7826, 13268]),
    runTasks([13321, 13579, 13738, 13828, 2213, 2227, 2269, 2297, 2325, 2339]),
    runTasks([2353, 2367, 2381, 2409, 2451, 2465, 2479, 2507, 2521, 2535]),
    // runTasks([2256, 2270, 2291]),
    // runTasks([2305, 2312, 2319]),
    // runTasks([2326, 2333, 2340]),
  ];

  // Run all tasks concurrently
  // await Promise.all(tasks);
}

main().catch(console.error);
*/
