const snowflake = require("snowflake-sdk");
require("dotenv").config();

async function fetchCompanyIds() {
  console.log("attempting connection - step 1");
  return new Promise((resolve, reject) => {
    console.log("attempting connection - step 2");
    const connection = snowflake.createConnection({
      account: "autoloop.us-east-1.snowflakecomputing.com",
      username: "rkomprath",
      password: "Poopslayer91!",
    });

    connection.connect((err, conn) => {
      console.log("attempting connection - step 3");
      if (err) {
        console.error("Unable to connect: " + err.message);
        reject(err);
      } else {
        const query = `SELECT DISTINCT e.companyname, a.companyid, b.name, b.isactive FROM loop.hub.company as e ON a.companyid = e.companyid JOIN loop.loop.services as b ON a.serviceid = b.serviceid JOIN loop.hub.companythirdpartyids as c ON a.companyid = c.companyid WHERE b.name = 'Appointment Scheduling'`;
        console.log("Attempting to connect and execute query");
        connection.execute({
          sqlText: query,
          complete: (err, stmt, rows) => {
            if (err) {
              console.error(`Failed to execute query: ${err.message}`);
              reject(err);
            } else {
              const companyIds = rows.map((row) => row.COMPANYID);
              resolve(companyIds);
            }
          },
        });
      }
    });
  });
}

module.exports = fetchCompanyIds;
