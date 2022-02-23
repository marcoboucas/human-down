BASE_DATA = {}
METRICS_CHART = undefined;
RISKS_CHART = undefined
CURRENT_YEAR = undefined
AVAILABLE_EVENTS = []
CURRENT_EVENT = null

YEARS = []
METRICS = {}
RISKS = {}

yearIntervalTime = 200;
yearInterval = 1;
maxYear = 1100;

numberOfPoints = 50;

const loadData = () => {
    fetch("data.json").then((result) => result.json()).then((data) => {
        BASE_DATA = data;
        CURRENT_YEAR = data.startingYear;
        AVAILABLE_EVENTS = data.events;

        METRICS = data.metrics
        RISKS = data.risks
        generateGraph()
        updateYear()
    })
}

const replaceVariables = (text) => {
    Object.entries(METRICS).forEach(([key, value]) => {
        for (let endString of ['_acceleration', '_velocity', '']) {
            let metric_key = endString.length == 0 ? "value" : endString.replace('_', '')
            text = text.replace(key + endString, METRICS[key][metric_key])
        }
    })
    return text;
}


const changeMessage = (message) => {
    document.getElementById("currentYear").innerHTML = message;
}
const doEventAction = (event, isLeftAction) => {
    let action = isLeftAction ? event.left : event.right;
    // do the consequences
    for (const [consequenceKey, consequenceOperation] of Object.entries(action.consequences)) {
        console.log(consequenceKey, consequenceOperation)
        if ("value" in consequenceOperation){
            METRICS[consequenceKey].value = eval(replaceVariables(consequenceOperation.value));
        }
        if ("velocity" in consequenceOperation){
            METRICS[consequenceKey].velocity = eval(replaceVariables(consequenceOperation.velocity));
        }
        if ("acceleration" in consequenceOperation){
            METRICS[consequenceKey].acceleration = eval(replaceVariables(consequenceOperation.acceleration));
        }
    }
    endEvent();
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
const startEvent = () => {
    changeMessage("Event !");

    document.getElementById("tinder").display = "inherit";

}

const endEvent = () => {
    changeMessage("End Events !");
    
    document.getElementById("tinder").display = "hidden";
    const element = document.getElementsByClassName("tinder--cards")[0]
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    CURRENT_EVENT = undefined;
    updateYear()
}



const checkEndGame = () => {
    for (let [riskName, riskInfo] of Object.entries(RISKS)) {
        if (riskInfo.value >= 1) {
            endGame(false, riskInfo);
            return true
        }
    }
    return false;
}


const endGame = (win, infos) => {
    console.log('End game !')
    if (win) {
        changeMessage("You have won !");
    } else {
        changeMessage(`Game over ! lost because of ${infos.name}...`);
    }

}


const updateYear = () => {
    if (!CURRENT_YEAR || CURRENT_YEAR > maxYear) {
        if (CURRENT_YEAR > maxYear) {
            endGame(true);
        }
        return;
    }

    // Display the current year
    changeMessage("Current Year: " + CURRENT_YEAR);

    // Events + Metrics
    triggerEvents()
    if (CURRENT_EVENT) {
        initCards()
        return;
    }
    updateMetrics()
    METRICS_CHART.data.datasets.forEach((element) => {
        element.data.push(METRICS[element.label].value)
        if (element.data.length > numberOfPoints) {
            element.data = element.data.slice(1, numberOfPoints);
        }
    })

    // Risks
    updateRisks()
    RISKS_CHART.data.datasets.forEach((element) => {
        element.data.push(RISKS[element.label].value * 100);
        if (element.data.length > numberOfPoints) {
            element.data = element.data.slice(1, numberOfPoints);
        }
    })

    // check if END
    if (checkEndGame()) {
        return;
    }

    CURRENT_YEAR += yearInterval;
    YEARS.push(CURRENT_YEAR);
    if (YEARS.length > numberOfPoints) {
        YEARS = YEARS.slice(1, numberOfPoints);
    }

    METRICS_CHART.update()
    RISKS_CHART.update()

    setTimeout(updateYear, yearIntervalTime)
}

const generateGraph = () => {
    const ctx1 = document.getElementById('metricsChart').getContext('2d');
    METRICS_CHART = new Chart(ctx1, {
        type: 'line',
        options: {
            showXLabels: 10,
           
        },
        data: {
            labels: YEARS,
            datasets: Object.entries(METRICS).map(([key, value]) => {
                return { label: key, data: [],  yAxisID: key, backgroundColor: value.color || "#ffffff" }
            })
        },

    });

    const ctx2 = document.getElementById('risksChart').getContext('2d');
    RISKS_CHART = new Chart(ctx2, {
        type: 'line',
        options: {
            showXLabels: 10,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                }
            },
            plugins: {
                title: {
                    text: "Human extinction risk",
                    display: true
                }
            },
            
        },
        data: {
            labels: YEARS,
            datasets: Object.entries(RISKS).map(([key, value]) => {
                return { label: key, data: [], backgroundColor: value.color || "#ffffff" }
            })
        },

    });
}



const updateMetrics = () => {
    METRICS.population.value += METRICS.population.velocity;
    METRICS.population.velocity += METRICS.population.acceleration;

    METRICS.pollution.value += METRICS.pollution.velocity;
    METRICS.pollution.velocity += METRICS.pollution.acceleration;
    METRICS.pollution.acceleration += 0.001
}

const updateRisks = () => {
    Object.values(RISKS).map((value) => {
        value.value = eval(replaceVariables(value.function));
        console.log(value.name, value.value)
    })
}




// Run the code
loadData()

