BASE_DATA = {}
MYCHART = undefined;
CURRENT_YEAR = undefined
AVAILABLE_EVENTS = []
CURRENT_EVENT = null

YEARS = []
METRICS = {}

yearIntervalTime = 400;
yearInterval = 1;
maxYear = 1040;

const loadData = () => {
    fetch("data.json").then((result) => result.json()).then((data) => {
        BASE_DATA = data;
        CURRENT_YEAR = data.startingYear;
        AVAILABLE_EVENTS = data.events;

        METRICS = data.metrics
        updateYear()
    })
}

const updateMetrics = () => {
    METRICS.population.value += METRICS.population.velocity;
    METRICS.population.velocity += METRICS.population.acceleration;
}

const checkTrigger = (conditions) => {
    for (let [key, value] of Object.entries(conditions)) {
        if ((!value[0] || METRICS[key].value >= value[0]) && (!value[1] || METRICS[key].value <= value[1])) {
            // ITS OK
        } else {
            return false;
        }
    }


    return true;
}
const changeMessage = (message) => {
    document.getElementById("currentYear").innerHTML = message;
}
const doEventAction = (event, isLeftAction) => {
    let action = isLeftAction ? event.left : event.right;
    // do the consequences
    for (const [consequenceKey, consequenceOperation] of Object.entries(action.consequences)) {
        let x = METRICS[consequenceKey].value;
        x = eval(consequenceOperation.value);
        METRICS[consequenceKey].value = x;
    }
    endEvent();
}


const addEvent = (event) => {
    const div = document.getElementById("tinder");
    const cardList = div.getElementsByClassName("tinder--cards")[0];

    // Generate a new element
    const newCard = document.createElement("div");
    newCard.className = "tinder--card";
    const elementImg = document.createElement("img");
    elementImg.src = event.image;
    newCard.appendChild(elementImg);


    const elementTitle = document.createElement("h3");
    elementTitle.innerHTML = event.name;
    newCard.appendChild(elementTitle);

    const elementDesc = document.createElement("p");
    elementDesc.innerHTML = event.description;
    newCard.appendChild(elementDesc);

    cardList.appendChild(newCard);
    allCards = document.querySelectorAll('.tinder--card');

}
const startEvent = () => {
    changeMessage("Event !");

    document.getElementById("tinder").display = "inherit";

}

const endEvent = () => {
    changeMessage("End Events !");
    document.getElementById("tinder").display = "hidden";
    CURRENT_EVENT = undefined;
    updateYear()
}

const triggerEvents = () => {
    // We check if one event can be triggered
    for (let eventIndex = 0; eventIndex < AVAILABLE_EVENTS.length; eventIndex += 1) {
        let event = AVAILABLE_EVENTS[eventIndex];
        // Check if trigger
        isTriggered = checkTrigger(event.trigger)

        if (isTriggered) {
            AVAILABLE_EVENTS.pop(eventIndex)
            CURRENT_EVENT = event;

            addEvent(event)
            startEvent()
            return
        }


    }
}


const updateYear = () => {
    console.info('try to update the year')
    if (!CURRENT_YEAR || CURRENT_YEAR > maxYear) {
        return;
    }
    // Display the current year
    changeMessage("Current Year: " + CURRENT_YEAR);

    // Check for events
    triggerEvents()
    if (CURRENT_EVENT) {
        initCards()
        return;
    }


    // Update the metrics
    updateMetrics()


    // Update the graphic
    MYCHART.data.datasets.forEach((element) => {
        element.data.push(METRICS[element.label].value)
    })


    CURRENT_YEAR += yearInterval;
    YEARS.push(CURRENT_YEAR);

    MYCHART.update()

    setTimeout(updateYear, yearIntervalTime)
}

const generateGraph = () => {
    const ctx = document.getElementById('myChart').getContext('2d');
    MYCHART = new Chart(ctx, {
        type: 'line',
        options: {
            showXLabels: 10
        },
        data: {
            labels: YEARS,
            datasets: [{ label: "population", data: [], backgroundColor: "#ff0000" },]
        },

    });
    return myChart
}

loadData()
generateGraph()
