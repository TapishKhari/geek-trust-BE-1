
const fs = require('fs');
const readline = require('readline');

async function calc(filePath) {
  const drivers = {};
  const riders = {};
  const rides = {};
  const matchedDrivers = {}; // Store matched drivers for each rider

  // Utility function to calculate Euclidean distance
  function calculateDistance(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return Math.round(distance * 100) / 100; // Round to two decimal places
  }

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      // Split the line into an array by spaces
      const args = line.trim().split(' ');

      // The first argument is the command (e.g., ADD_DRIVER, ADD_RIDER, etc.)
      const command = args[0];

      switch (command) {
        case 'ADD_DRIVER':
          const driverId = args[1];
          const driverX = parseInt(args[2], 10);
          const driverY = parseInt(args[3], 10);
          drivers[driverId] = { x: driverX, y: driverY };
          // console.log(`Driver ${driverId} added at coordinates: (${driverX}, ${driverY})`);
          break;

        case 'ADD_RIDER':
          const riderId = args[1];
          const riderX = parseInt(args[2], 10);
          const riderY = parseInt(args[3], 10);
          riders[riderId] = { x: riderX, y: riderY };
          // console.log(`Rider ${riderId} added at coordinates: (${riderX}, ${riderY})`);
          break;

        case 'MATCH':
          const matchRiderId = args[1];
          if (!(matchRiderId in riders)) {
            console.log('NO_DRIVERS_AVAILABLE');
            break;
          }

          const riderLocation = riders[matchRiderId];
          const matched = [];

          for (const [driverId, driverLocation] of Object.entries(drivers)) {
            const distance = calculateDistance(riderLocation.x, riderLocation.y, driverLocation.x, driverLocation.y);
            if (distance <= 5) {
              matched.push({ driverId, distance });
            }
          }

          matched.sort((a, b) => a.distance - b.distance || a.driverId.localeCompare(b.driverId));

          if (matched.length > 0) {
            const driverIds = matched.slice(0, 5).map(d => d.driverId);
            matchedDrivers[matchRiderId] = driverIds; // Store matched drivers
            console.log(`DRIVERS_MATCHED ${driverIds.join(' ')}`);
          } else {
            matchedDrivers[matchRiderId] = []; // No drivers matched
            console.log('NO_DRIVERS_AVAILABLE');
          }
          break;

        case 'START_RIDE':
          const rideId = args[1];
          const n = parseInt(args[2], 10) - 1; // Convert to zero-based index
          const startRiderId = args[3];

          if (rides[rideId] || !(startRiderId in riders) || !(startRiderId in matchedDrivers) || matchedDrivers[startRiderId].length <= n) {
            console.log('INVALID_RIDE');
            break;
          }

          const selectedDriver = matchedDrivers[startRiderId][n];
          delete drivers[selectedDriver]; // Remove the driver from available drivers
          rides[rideId] = { riderId: startRiderId, driverId: selectedDriver, started: true, completed: false };
          console.log(`RIDE_STARTED ${rideId}`);
          break;

        case 'STOP_RIDE':
          const stopRideId = args[1];
          const destX = parseInt(args[2], 10);
          const destY = parseInt(args[3], 10);
          const timeTaken = parseInt(args[4], 10);

          if (!(stopRideId in rides) || rides[stopRideId].completed) {
            console.log('INVALID_RIDE');
            break;
          }

          const ride = rides[stopRideId];
          const riderStartLocation = riders[ride.riderId];
          const distanceTravelled = calculateDistance(riderStartLocation.x, riderStartLocation.y, destX, destY);

          ride.distanceTravelled = distanceTravelled;
          ride.timeTaken = timeTaken;
          ride.completed = true;

          console.log(`RIDE_STOPPED ${stopRideId}`);
          break;

        case 'BILL':
          const billRideId = args[1];

          if (!(billRideId in rides)) {
            console.log('INVALID_RIDE');
            break;
          }

          const billingRide = rides[billRideId];

          if (!billingRide.completed) {
            console.log('RIDE_NOT_COMPLETED');
            break;
          }

          const baseFare = 50;
          const farePerKm = 6.5;
          const farePerMin = 2;
          const serviceTaxRate = 0.2;

          const distanceCharge = farePerKm * billingRide.distanceTravelled;
          const timeCharge = farePerMin * billingRide.timeTaken;
          let totalFare = baseFare + distanceCharge + timeCharge;
          totalFare += totalFare * serviceTaxRate;
          totalFare = Math.round(totalFare * 100) / 100; // Round to two decimal places

          console.log(`BILL ${billRideId} ${billingRide.driverId} ${totalFare}`);
          break;

        default:
          console.log(`Unknown command: ${command}`);
          break;
      }
    });

    rl.on('close', () => {
      resolve(); // Resolve the Promise when the file has been completely read
    });

    rl.on('error', (error) => {
      reject(error); // Reject the Promise if there's an error reading the file
    });
  });
}

module.exports = calc;
