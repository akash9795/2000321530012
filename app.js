const express = require('express');
const axios = require('axios');
const moment = require('moment');

const app = express();
const port = 3000; // You can use any desired port

// Middleware to parse JSON body
app.use(express.json());

// John Doe Railway Server API URLs
const registerURL = 'http://20.244.56.144/train/register';
const authURL = 'http://20.244.56.144/train/auth';
const trainsURL = 'http://20.244.56.144/train/trains';

// Function to register the company with John Doe Railway Server
const registerCompany = async () => {
  try {
    const response = await axios.post(registerURL, {
      companyName: 'Train Central',
      contactPerson: 'Wahul',
      email: 'rall@abc.edu',
      accessCode: 'Koje',
    });

    return response.data;
  } catch (error) {
    console.error('Error registering company:', error.message);
    throw error;
  }
};

// Function to get the authorization token from John Doe Railway Server
const getAuthToken = async () => {
  try {
    const registeredData = await registerCompany();
    const response = await axios.post(authURL, {
      companyName: 'Train Central',
      clientID: registeredData.clientID,
      contactPerson: 'Rahul',
      email: 'rahal@abc.edu',
      rollNo: '1',
      clientSecret: 'XOylOPA',
    });

    return response.data['access token'];
  } catch (error) {
    console.error('Error getting authorization token:', error.message);
    throw error;
  }
};

// Function to fetch train details from John Doe Railway Server
const fetchTrainDetails = async (authToken) => {
  try {
    const response = await axios.get(trainsURL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching train details:', error.message);
    throw error;
  }
};

// Route to get train details for the next 12 hours
app.get('/trains', async (req, res) => {
  try {
    const authToken = await getAuthToken();
    const trainDetails = await fetchTrainDetails(authToken);

    // Filter trains departing in the next 12 hours
    const currentTime = moment();
    const next12Hours = currentTime.clone().add(12, 'hours');

    const filteredTrains = trainDetails.filter((train) => {
      const departureTime = moment(train.departureTimes, 'YYYY-MM-DDTHH:mm:ss');
      return departureTime.isBetween(currentTime, next12Hours);
    });

    // Ignore trains departing in the next 30 minutes
    const filteredTrainsAfter30Minutes = filteredTrains.filter((train) => {
      const departureTime = moment(train.departureTimes, 'YYYY-MM-DDTHH:mm:ss');
      return departureTime.isAfter(currentTime.clone().add(30, 'minutes'));
    });

    // Sort the remaining trains
    const sortedTrains = filteredTrainsAfter30Minutes.sort((a, b) => {
      // Ascending order of price
      if (a.price > b.price) return 1;
      if (a.price < b.price) return -1;

      // Descending order of tickets
      if (a.tickets < b.tickets) return -1;
      if (a.tickets > b.tickets) return 1;

      // Descending order of departure time
      const departureTimeA = moment(a.departureTimes, 'YYYY-MM-DDTHH:mm:ss');
      const departureTimeB = moment(b.departureTimes, 'YYYY-MM-DDTHH:mm:ss');
      if (departureTimeA.isBefore(departureTimeB)) return 1;
      if (departureTimeA.isAfter(departureTimeB)) return -1;

      return 0;
    });

    res.json(sortedTrains); // Return the processed data as the API response
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
