// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// const { response } = require("express")

// The store will hold all information needed globally
let store = Immutable.Map({});

function updateStoreValue (key, value) {
    const newStore = store.setIn([key], Immutable.fromJS(value));
    if (!newStore.equals(store)) {
        store = newStore;
    }
    return store.toJS()[key];
}

function getStoreValue (key) {
    return store.toJS()[key];
}

function validateRaceForm() {
    
    if (store.has("player_id") && store.has("track_id")) {

        return true;
    } else {
        if (!store.has("track_id")) {
            renderAt("#track_validate", "<h4>Please Select A Track!</h4>");
        } else {
            renderAt("#track_validate", "");
        }
        
        if (!store.has("player_id")) {
            renderAt("#racer_validate", "<h4>Please Select A Racer!</h4>");
        } else {
            renderAt("#racer_validate", "");
        }
        
    }
    return false;
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    onPageLoad();
    setupClickHandlers();
});

async function onPageLoad() {
    try {
        getTracks()
            .then(tracks => {
                tracks.map(customizeTrack);
                const html = renderTrackCards(tracks);
                renderAt('#tracks', html);
            });

        getRacers()
            .then((racers) => {
                racers.map(customizeRider);
                const html = renderRacerCars(racers);
                renderAt('#racers', html);
            });
    } catch(error) {
        console.log("Problem getting tracks and racers ::", error.message);
        console.error(error);
    }
}

function setupClickHandlers() {
    document.addEventListener('click', function(event) {
        const { target } = event;

        // Race track form field
        if (target.closest('.card.track')) {
            const current = getStoreValue('track_id');
            const selected = target.closest('.card.track');
            
            if (current) {
                document.getElementById(`track_${current}`).style.border = "none";
            }
            handleSelectTrack(selected);
            
            // Format selected track
            selected.style.border = "1px solid rgb(109, 233, 23)";
        }

        // Racer form field
        if (target.closest('.card.podracer')) {
            const current = getStoreValue('player_id');
            const selected = target.closest('.card.podracer');
           
            if (current) {
                document.getElementById(`racer_${current}`).style.border = "none";
            }
            handleSelectPodRacer(selected);
            
            // Format selected racer
            selected.style.border = "1px solid rgb(109, 233, 23)";
        }

        // Submit create race form
        if (target.matches('#submit-create-race')) {
            event.preventDefault();
	
            // Validate track and racer selections and start race if  valid
            if (validateRaceForm()) {
                handleCreateRace();
            }
        }

        // Handle acceleration click
        if (target.matches('#gas-peddle')) {
            handleAccelerate(target);
        }
    }, false);
}

async function delay(ms) {
    try {
        return await new Promise(resolve => setTimeout(resolve, ms));
    } catch(error) {
        console.log("an error shouldn't be possible here");
        console.log(error);
    }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
    try {
        // Get player_id and track_id from the store
        const playerId = getStoreValue('player_id');
        const trackId = getStoreValue('track_id');
        
        // Invoke the API call to create the race, then save the result
        const race = await createRace(playerId, trackId);

        // Update the store with the race id
        const raceId = race.ID - 1;
        updateStoreValue('race_id', raceId);
        
        // render starting UI
        renderAt('#race', renderRaceStartView(race.Track));
        
        // The race has been created, now start the countdown
        // Call the async function runCountdown
        await runCountdown();
        
        // Call the async function startRace
        await startRace(raceId);
        
        // Call the async function runRace to run the race
        await runRace(raceId);
    } catch(error) {
        console.log("Problem with handleCreateRace::", error);
    }
}

function runRace(raceID) {
    return new Promise(resolve => {
        // Use Javascript's built in setInterval method to get race info every 500ms
        const updateRaceInfo = setInterval(async function () {
            const raceInfo = await getRace(raceID);
            const positions = raceInfo.positions.map(customizeRider);

            if (raceInfo.status === "in-progress") {
                // If the race info status property is "in-progress", update the leaderboard
                renderAt('#leaderBoard', raceProgress(positions));
            } else if  (raceInfo.status === "finished") {
                // If the race info status property is "finished":
                clearInterval(updateRaceInfo); // to stop the interval from repeating
                renderAt('#race', resultsView(positions)); // to render the results view
                resolve(); // resolve the promise
            }
        }, 500);
    })
    // Error handling for the Promise
        .catch(err => console.log("Problem with runRace::", err));
	
}

async function runCountdown() {
    try {
        // wait for the DOM to load
        await delay(1000);
        let timer = 3;

        return new Promise(resolve => {
            // Use Javascript's built in setInterval method to count down once per second
            const countDown = setInterval(() => {
                // run this DOM manipulation to decrement the countdown for the user
                document.getElementById('big-numbers').innerHTML = --timer;
                if (timer === 0) {
                    // If the countdown is done, clear the interval, resolve the promise, and return
                    resolve();
                    clearInterval(countDown);
                }
                             
            }, 1000);
        });
    } catch(error) {
        console.log("Problem wiht runCountdown::", error);
    }
}

function handleSelectPodRacer(target) {
    // console.log("selected a pod", target.value)
    // remove class selected from all racer options
    const selected = document.querySelector('#racers .selected');
    if(selected) {
        selected.classList.remove('selected');
    }

    // add class selected to current target
    target.classList.add('selected');

    // save the selected racer to the store
    updateStoreValue('player_id', target.value);
}

function handleSelectTrack(target) {
    // console.log("selected a track", target.value)
    // remove class selected from all track options
    const selected = document.querySelector('#tracks .selected');
    if(selected) {
        selected.classList.remove('selected');
    }

    // add class selected to current target
    target.classList.add('selected');

    // save the selected track id to the store
    updateStoreValue('track_id', target.value);
    
	
}

async function handleAccelerate() {
    // console.log("accelerate button clicked")
    // Invoke the API call to accelerate
    await accelerate(getStoreValue('race_id'));
    
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
    if (!racers.length) {
        return `
			<h4>Loading Racers...</4>
		`;
    }

    const results = racers.map(renderRacerCard).join('');

    return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
    const { id, driver_name, top_speed, acceleration, handling, photo } = racer;

    return `
        <li class="card podracer" id="racer_${id}", value="${id}">
            <img src="${photo}"></img>
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
    if (!tracks.length) {
        return `
			<h4>Loading Tracks...</4>
		`;
    }

    const results = tracks.map(renderTrackCard).join('');

    return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
    const { id, name, map } = track;
    return `
        <li id="track_${id}" class="card track", value=${id}">
            <img src="${map}"></img>
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
    return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers=null) {
    track = customizeTrack(track);
    return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
    positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

    return `
		<header>
			<h1>Race Results</h1>
		</header>
        <main>
            <section id="leaderBoard">
                ${raceProgress(positions)}
                <a class="button" href="/race">Start New Race</a>
            </section>
		</main>
	`;
}

function raceProgress(positions) {
    let userPlayer = positions.find(e => e.id === getStoreValue('player_id'));
    userPlayer.driver_name += " (you)";

    positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
    let count = 1;

    const results = positions.reduce((htmlString, p) => {
        
        htmlString += `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
        `;
        return htmlString;
    }, '');
    
    return `
		<main>
			<h2>Leaderboard</h2>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
    `;
    
}

function renderAt(element, html) {
    const node = document.querySelector(element);

    node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// Customize Track and Rider Info ----------------------------
function customizeTrack (track) {
    const trackPath = '/assets/images/tracks/';
    const trackInfo = {
        1: {
            name: 'Anahiem',
            map: trackPath + 'anahiem.jpg'
        },
        2: {
            name: 'Arlington',
            map: trackPath + 'arlington.jpg'
        },
        3: {
            name: 'Atlanta',
            map: trackPath + 'atlanta.jpg'
        },
        4: {
            name: 'Oakland',
            map: trackPath + 'oakland.jpg'
        },
        5: {
            name: 'Salt Lake City',
            map: trackPath + 'salt_lake_city.jpg'
        },
        6: {
            name: 'San Diego',
            map: trackPath + 'san_diego.jpg'
        }
    };

    const customTrack = trackInfo[track.id];

    // update track name and add map image
    track.name = customTrack.name;
    track.map = customTrack.map;
    return track;

}

function customizeRider (rider) {
    const riderPath = '/assets/images/riders/';
    const riderInfo = {
        1: {
            name: "Eli Tomac",
            photo: riderPath + 'tomac.jpg'
        },
        2: {
            name: "Ken Roczen",
            photo: riderPath + 'roczen.jpg'
        },
        3: {
            name: "Jason Anderson",
            photo: riderPath + 'anderson.jpg'
        },
        4: {
            name: "Chad Reed",
            photo: riderPath + 'reed.jpg'
        },
        5: {
            name: "Justin Barcia",
            photo: riderPath + 'barcia.jpg'
        }
    
    };

    const customRider = riderInfo[rider.id];
    rider.driver_name = customRider.name;
    rider.photo = customRider.photo;

    return rider;
}


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
    return {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : SERVER,
        },
    };
}

// Make a fetch call (with error handling!) to each of the following API endpoints

function getTracks() {
    // GET request to `${SERVER}/api/tracks`
    return fetch (`${SERVER}/api/tracks`)
        .then(res => res.json())
        .catch(err => console.log("Problem with getTracks request::", err));
}

function getRacers() {
    // GET request to `${SERVER}/api/cars`
    return fetch(`${SERVER}/api/cars`)
        .then(res => res.json())
        .catch(err => console.log("Problem with getRacers request::", err));
}

function createRace(player_id, track_id) {
    // There is a problem with the API. It responds with track 1 regardless of what id is supplied
    // in the body of the request. This has been posted on the knowledgebase:
    // https://knowledge.udacity.com/questions/353779
    const body = { player_id, track_id };
	
    return fetch(`${SERVER}/api/races`, {
        method: 'POST',
        ...defaultFetchOpts(),
        dataType: 'json',
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .catch(err => console.log("Problem with createRace request::", err));
}

function getRace(id) {
    // GET request to `${SERVER}/api/races/${id}`
    return fetch(`${SERVER}/api/races/${id}`)
        .then(res => res.json())
        .catch(err => console.log("Problem with getRace request::", err));
}

function startRace(id) {
    return fetch(`${SERVER}/api/races/${id}/start`, {
        method: 'POST',
        ...defaultFetchOpts()
    })
	    .catch(err => console.log("Problem with startRace request::", err));
}

function accelerate(id) {
    // POST request to `${SERVER}/api/races/${id}/accelerate`
    // options parameter provided as defaultFetchOpts
    // no body or datatype needed for this request
    return fetch(`${SERVER}/api/races/${id}/accelerate`, {
        method: 'POST',
        ...defaultFetchOpts()
    })
        .catch(err => console.log("Problem with accelerate request::", err));
}
