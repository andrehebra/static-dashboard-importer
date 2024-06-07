let apiKey = require("./apiKey.json")
apiKey = apiKey.apiKey

const query = `query Query($all: Boolean, $to: DateTime, $after: String) {
    bookings(all: $all, to: $to, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
        startCursor
        hasPreviousPage
      }
      nodes {
        ... on SingleStudentBooking {
        startsAt
          registration {
            approvedByStudent
            approvedByStudentAt
            asymmetricSeconds
            audit {
              createdAt
              createdById
              updatedAt
              updatedById
            }
            briefingSeconds
            comment
            crossCountrySeconds
            debriefingSeconds
            id
            ifrDualSeconds
            ifrSimSeconds
            ifrSpicSeconds
            instructor {
              firstName
              lastName
            }
            instrumentSeconds
            multiSeconds
            name
            nightSeconds
            pilotFlyingSeconds
            pilotMonitoringSeconds
            singleSeconds
            status
            student {
              firstName
              lastName
              id
            }
            submittedByInstructorAt
            totalSeconds
            vfrDualSeconds
            vfrSimSeconds
            vfrSoloSeconds
            vfrSpicSeconds
          }
          cancellation {
            id
            title
            comment
            user {
              firstName
              lastName
              id
            }
          }
        }
      }
    }
  }`;
  

let currentDate = new Date();
const currentISODate = currentDate.toISOString().slice(0, -5);
let userArray = [];
let nameIdList = [];
let end = {
    dateCreated: new Date(),
    endCursor: null,
}

const load = async () => {
    console.log('Load function called in page.server.js');
    try {
        const variables = {
            to: currentISODate,
            all: true,
        };

        const response = await fetch('https://api.flightlogger.net/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        let data = await response.json();
        let dataArray = [...data.data.bookings.nodes];
        
        data.data.bookings.pageInfo.hasNextPage == true
        let q = 0;

        while (data.data.bookings.pageInfo.hasNextPage == true) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(q);
            q++;
            const variables = {
                all: true,
                to: currentISODate,
                after: data.data.bookings.pageInfo.endCursor,
            }

            const response = await fetch('https://api.flightlogger.net/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            console.log(data.data.bookings.pageInfo.hasNextPage);
            end.endCursor = data.data.bookings.pageInfo.endCursor;

            data = await response.json();
            try {
                for (let i = 0; i < data.data.bookings.nodes.length; i++) {
                    dataArray.push(data.data.bookings.nodes[i]);
                    
                    
                    //get user id of user, save to userId variables
                    let userId = null;
                    let regValid = false;
                    let empty = false;
                    if (data.data.bookings.nodes[i].registration != null && data.data.bookings.nodes[i].registration.student != null) {
                        userId = data.data.bookings.nodes[i].registration.student.id;
                        regValid = true;
                    } else if (data.data.bookings.nodes[i].cancellation != null && data.data.bookings.nodes[i].cancellation != null) {
                        userId = data.data.bookings.nodes[i].cancellation.user.id;
                        regValid = false;
                    } else {
                        empty = true;
                    }

                    if (empty == false) {
                        //check if userId is in the list of users, set match = true, and save the index in j to index
                        let match = false;
                        let index = -1;
                        for (let j = 0; j < userArray.length; j++) {
                            if (userArray[j].id == userId) {
                                match = true;
                                index = j;
                            } 
                        }

                        // save the reservation or the cancellation to the javascript object userArray
                        if (match == true) {
                            if (regValid == true) {
                                userArray[index].reservations.push(data.data.bookings.nodes[i].registration)
                                userArray[index].reservations.at(-1).startsAt = data.data.bookings.nodes[i].startsAt;
                            } else if (regValid == false) {
                                userArray[index].cancellations.push(data.data.bookings.nodes[i].cancellation)
                                userArray[index].cancellations.at(-1).startsAt = data.data.bookings.nodes[i].startsAt;
                            }
                        } else if (match == false && regValid == true) {
                            userArray.push({
                                name: data.data.bookings.nodes[i].registration.student.firstName + " " + data.data.bookings.nodes[i].registration.student.lastName,
                                id: data.data.bookings.nodes[i].registration.student.id,
                                reservations: [data.data.bookings.nodes[i].registration],
                                cancellations: [],
                            })
                            userArray.at(-1).reservations.at(-1).startsAt = data.data.bookings.nodes[i].startsAt;
                        } else if (match == false && regValid == false) {
                            userArray.push({
                                name: data.data.bookings.nodes[i].cancellation.user.firstName + " " + data.data.bookings.nodes[i].cancellation.user.lastName,
                                id: data.data.bookings.nodes[i].cancellation.user.id,
                                reservations: [],
                                cancellations: [data.data.bookings.nodes[i].cancellation],
                            })
                            userArray.at(-1).cancellations.at(-1).startsAt = data.data.bookings.nodes[i].startsAt;
                        }
                    }                                       
                }
                    
                    
            } catch (e) {
                console.error("concatination error: " + e);

                return "ERROR";
            }

            
        }

        //console.log(userArray);

        /*
        for (let i = 0; i < userArray.length; i++) {
            writeObjectToJsonFile(userArray[i], userArray[i].id + ".json");
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        */

        await new Promise(resolve => setTimeout(resolve, 2000));
        writeObjectToJsonFile(userArray, "data.json")

        for (let i = 0; i < userArray.length; i++) {
            nameIdList.push({
                name: userArray[i].name,
                id: userArray[i].id,
            })
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        writeObjectToJsonFile(end, "dataInformation.json");

        await new Promise(resolve => setTimeout(resolve, 2000));
        writeObjectToJsonFile(nameIdList, "nameIdList.json");
        console.log(end)

        return { dataArray };
    } catch (error) {
        console.error(`Error in load function :( ${error}`);
    }
}


const fs = require('fs');
function writeObjectToJsonFile(obj, filename) {
    const jsonString = JSON.stringify(obj, null, 2); // Convert the object to a JSON string with 2-space indentation
    fs.writeFile(filename, jsonString, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log(`JSON data has been written to ${filename}`);
      }
    });
  }

load();