let apiKey = require("./apiKey.json");
let nameIdList = require("./nameIdList.json");

apiKey = apiKey.apiKey;
const getUserList = async () => {};

const update = async (inputId) => {
  const query = `query User($userId: String) {
    user(id: $userId) {
        callSign
        firstName
        lastName
        id
        contact {
            email
        }
            notes {
            adminNote
            instructorNote}
    }
    }`;

  const userVariables = {
    userId: inputId,
  };

  const response = await fetch("https://api.flightlogger.net/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: userVariables,
    }),
  });

  let user = await response.json();
  user = user.data.user;
  //console.log(user.notes);

  let individualUser = {
    callSign: user.callSign,
    email: user.contact.email,
    firstName: user.firstName,
    lastName: user.lastName,
    adminNote: `<a href="https://static-dashboard.pages.dev/?id=${inputId}" target="_blank" rel="nofollow">${user.callSign} Progress Dashboard</a>`,
    instructorNote: `<a href="https://static-dashboard.pages.dev/?id=${inputId}" target="_blank" rel="nofollow">${user.callSign} Progress Dashboard</a>`,
  };
  console.log("INDIVIDUAL USER")
  console.log(individualUser);

  const mutation = `mutation UpdateUser($updateUserId: ID!, $user: UserInput) {
        updateUser(id: $updateUserId, user: $user) {
          id
        }
      }`;

  try {
    const variables = {
      updateUserId: inputId,
      user: individualUser,
    };

    const response = await fetch("https://api.flightlogger.net/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    const data = await response.json();
    console.log(data);

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
    } else {
      console.log("Update successful:", data.data.updateUser);
    }
  } catch (e) {
    console.log(e);
  }
};
const updateRunner = async () => {
  for (let i = 0; i < nameIdList.length; i++) {
    update(nameIdList[i].id);
    
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

updateRunner();
// Andre took his first few flight lessons at 14 years old, and since then he has always been fascinated by aviation. He started formally training in 2020, when he decided to take his passion for flying and turn it into a career, achieving his multi-engine commercial and then flight instructor certificate at Flight Training Professionals. Andre is currently pursuing a degree in computer science at the University of Central Florida, where he hopes to combine his love for aviation and technology.
