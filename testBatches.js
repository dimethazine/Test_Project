async function scheduleBatches() {
  const taskBatches = [
    [2228, 2235, 2242],
    [2256, 2270, 2291],
    [2305, 2312, 2319],
    [2326, 2333, 2340],
    [2228, 2235, 2242],
    [2256, 2270, 2291],
    [2305, 2312, 2319],
    [2326, 2333, 2340],
    [2228, 2235, 2242],
    [2256, 2270, 2291],
    [2305, 2312, 2319],
    [2326, 2333, 2340],
    [2228, 2235, 2242],
    [2256, 2270, 2291],
    [2305, 2312, 2319],
    [2326, 2333, 2340],
    [2228, 2235, 2242],
    [2256, 2270, 2291],
    [2305, 2312, 2319],
    [2326, 2333, 2340],
  ];

  let currentIndex = 0;

  async function executeBatch() {
    if (currentIndex >= taskBatches.length) {
      console.log("All batches have been executed");
      currentIndex = 0;
    }

    console.log(`Starting batch ${currentIndex + 1} of ${taskBatches.length}`);
    await runTasks(taskBatches[currentIndex]);

    // I believe to run all of them, loop through it as:
    /*
  for (i = 0; i < taskBatches.length; i++) {
    await runTasks(taskBatches[i]); 
  }




    */
    currentIndex++;
    setTimeout(executeBatch, 30 * 60 * 1000);
  }
  executeBatch();
}

scheduleBatches();
