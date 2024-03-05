// TODO
// Add a counter for each batch which resets on the next task
// log to console the total resubmit count for each batch
// Reset the counter for each batch
// Have two separate counters, one for the current batch and one for the total resubmit count of the task loop
// current batch reset on batch end; total resubmit count reset on task loop end

async function extractLoopCompanyId(page) {
  const divText = await page.textContent("#divLegal");
  const idMatch = divText.match(/ID#\s(\d+)/);
  console.log(idMatch ? idMatch[1] : null);
  return idMatch ? idMatch[1] : null;
}

const errorPatterns = [
  " is locked by ",
  " locked by port",
  "(unknown)",
  "<ERROR_CODE>400",
  "3PA: Index: 0, Size: 0",
  "A connection that was expected to be kept alive was closed",
  "ADP3PA.COMP",
  "An error occurred when verifying security for the message.",
  "An error occurred while sending the request.",
  "Bad Gateway",
  "BadRequest - Vendor 3PA_SUBARUAMERICAAL not found",
  "Cannot connect to Dealer backend.",
  "cannot execute INSERT in a read-only transaction",
  "CDK data request timed out.",
  "CDK error 'CDK API call timed out after 120.01 seconds",
  "CDK Error: Request failed CDK API call timed out after 120.01 seconds (timeout set to 120.00 seconds).",
  "CDK Error: Request failed failure - ",
  "InsertAppointment request failed with CDK error '[Error Code: failure]",
  "CDK Error: Request failed failure - Provider error",
  "CUSTOMER RECORD IN USE",
  "CUSTOMER RECORD IN USE",
  "DataLockException",
  "dmotorworks.eip.EIPException: I/O Error",
  "Dont",
  "Error calling Adam web service",
  "Error calling AutoSoft endpoint.",
  "Error calling AutoSoft endpoint. HttpStatus: InternalServerError Status",
  "Error calling DealerBuilt endpoint",
  "Error calling OpenMate web service.",
  "Error calling OpenMate web service. Invalid service Advisor ID specified",
  "Error calling PBS web service. The remote server returned an error: (502) Bad Gateway. ",
  "Error in ParseAppointmentChangeResponse: Request failed",
  "Error in ParseAppointmentChangeResponse: Request failed - Appointment Update Failed. Exception / Exception Appointment is not valid due to one or more broken rules.rule://pbs.fixedops.gui.appointments.appointment-hasrequestlines/(object):- Appointment must have at least 1 Request Line ",
  "Error Processing Request",
  "Error Processing Request ",
  "Error while parsing appointment write response for",
  "Error while parsing appointment write response for LoopCompanyId",
  "ERROR_CODE>500",
  "ErrorCode: 11900110",
  "ErrorCode: null, ErrorMessage:",
  "ErrorMessage:Transaction exceeded buffer size",
  "Ex. Msg:[Unable to connect to the remote server]",
  "Failed to update vehicle",
  "Fault: System.Xml. ErrorType: Exception Error. ErrorDetail",
  "html",
  "http://www.starstandards.org/STAR",
  "ID OUT OF SESSIONS",
  "Index: 0, Size: 0",
  "InsertAppointment request failed with CDK error '[Error Code: failure]'",
  "Invalid XML response received from DMS. XML parsing error",
  "is locked by",
  "Not Authorized at System.Web.Services.Protocols",
  "output buffer too small",
  "Path cannot be null",
  "PBS Error: Request Failed.",
  "RCI Writeback response returned neither a numeric code nor a 'Success' flag",
  "record in use",
  "RECORD LOCKED (APPOINTMENTS ID",
  "RECORD LOCKED (SERINDEX)",
  "RECORD LOCKED (SERINDEX)",
  "request channel timed out",
  "Retry 2 of 2. No more retries left. There was no endpoint listening",
  "Retry 2 of 2. No more retries left. Unable to connect to the remote server",
  "Reynolds.RIH.BPO",
  "Server temporary unavailable",
  "Service Unavailable",
  "text/html",
  "The connection to the dealer has timed out",
  "The DMS did not provide any further information",
  "The operation has timed out",
  "The operation has timed out at System.Web.Services",
  "The remote name could not be resolved",
  "The remote server returned an error",
  "The remote server returned an error:",
  "The request channel timed out while waiting",
  "The request failed with HTTP status 503",
  "The Timestamp is invalid or has expired",
  "The underlying connection was closed",
  "The underlying connection was closed",
  "Timeout Exceeded",
  "timeout set to 120.00 seconds",
  "Unable to attach shared memory",
  "Unable to attach shared memory, all providers busy",
  "Unable to connect to the remote server",
  "Unable to obtain datalock",
  "unable to process the request due to an internal error",
  "Unable to update the data tables, changes have been reverted",
  "Validation failed on Birthdate:",
  "Vendor 3PA_AUTOLOOP not found",
  "Web error calling DealerBuilt web service. Unable to connect to the remote server",
  "xmlns=",
];

function containsError(errorText) {
  return errorPatterns.some((pattern) => errorText.includes(pattern));
}

async function resubmitter(page) {
  const loopCompanyId = await extractLoopCompanyId(page);
  if (!loopCompanyId) {
    console.error("Failed to extract loopCompanyId");
    return;
  } else {
    console.log(`Loop Company ID: ${loopCompanyId}`);
  }

  const rows = await page.$$("#ctl00_ctl00_Main_Main_unknownWrites tbody tr");

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
        const response = await page.evaluate(
          async ({ resubmitID, loopCompanyId }) => {
            try {
              const response = await fetch(
                "https://autoloop.us/DMS/App/DealershipSettings/PendingAppointmentWrites.aspx/ResubmitAppointmentWrite",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json; charset=utf-8",
                  },
                  body: JSON.stringify({
                    loopCompanyId: loopCompanyId,
                    appointmentId: resubmitID,
                  }),
                  credentials: "include",
                }
              );
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return await response.json();
            } catch (error) {
              return { error: error.message };
            }
          },
          { resubmitID, loopCompanyId }
        );

        console.log(`Response for ${resubmitID}:`, response);
      }
    }
  }
}

module.exports = resubmitter;
