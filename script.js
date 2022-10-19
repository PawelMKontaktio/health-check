let apiKey = "";
let numberOfBadges = 0;
let pages = 0;
let currentPage = 0;
let startIndex = 0;
let macAddresses = [];
let presences = [];
let currentTime = new Date();
let results = [];
let display = document.querySelector(".message")
let buttonDownload = document.querySelector("#download")
let buttonFetch = document.querySelector("#fetch")
let spinner = document.querySelector(".lds-roller")
let apiKeyInput = document.querySelector("#apiKey-input")

function download_csv_file() {

    //define the heading for each row of the data
    let csv = 'mac,last seen,last location,uniqueId,alias\n';

    //merge the data with CSV

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += 'mac,last seen,last location,uniqueId,name\n';
    results.forEach(function (rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
    console.log(row)
}
function showResults() {
    console.log(results, "results")
    display.innerText = `data ready to download`
    console.log(results.length, "results.length")
    buttonDownload.style.display = "block"
    spinner.style.display = "none"
}
function getPresences() {
    // fetch presence for each device and save as object in array
    console.log(macAddresses.length)
    macAddresses.forEach(device => {
        var myHeaders = new Headers();
        myHeaders.append("Api-Key", apiKey);
        myHeaders.append("Content-Type", "application/json");

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        fetch(`https://apps.cloud.us.kontakt.io/v3/presences?trackingId=${device.mac.toLowerCase()}`, requestOptions)
            .then(response => response.json())
            .then(result => {
                results.push([result.content[0].trackingId, result.content[0].startTime.slice(0, 19), result.content[0].roomName, device.uniqueId, device.name])
                //device.alias
                display.innerText = `found positions of ${results.length} badges. Please wait...`
            })
            .catch(error => console.log('error', error));
    })
    setTimeout(showResults, 15000)
};

const findMacs = (result) => {
    console.log(result.devices)
    result.devices.forEach(device => {
        if (device.product === "Smart Badge") {
            console.log(device.mac)

            macAddresses.push({ "mac": device.mac, "uniqueId": device.uniqueId, "name": device.name })
        }
    })
    console.log(macAddresses) //all badges here
    display.innerText = `found ${macAddresses.length} badges, fetching positions...`
}

const fetchMacs = () => {
    display.innerText = "fetching devices..."
    let myHeaders = new Headers();
    myHeaders.append("Accept", "application/vnd.com.kontakt+json;version=10");
    myHeaders.append("Api-Key", apiKey);
    myHeaders.append("Content-Type", "application/json");


    let requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch(`https://api.kontakt.io/device?maxResult=500&deviceType=BEACON&startIndex=${startIndex}`, requestOptions)
        .then(response => response.json())
        .then(result => findMacs(result))
        .then(startIndex += 500)
        .catch(error => console.log('error', error));


    if (startIndex < numberOfBadges) {
        fetchMacs();
    } else {
        setTimeout(getPresences, 10000)
    }
}

const setNumberOfBadges = (response) => {
    numberOfBadges = response.searchMeta.count
    pages = numberOfBadges / 500
    pages = Math.floor(pages) + 1;
    console.log(pages)
    fetchMacs();
}
const checkNumberOfBadges = () => {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/vnd.com.kontakt+json;version=10',
            'Api-Key': apiKey
        }
    };

    fetch('https://api.kontakt.io/device?maxResult=5&queryType=COUNTED', options)
        .then(response => {
            console.log(response)
            if (response.status >= 300) {
                display.innerText = `response status: ${response.status}. Most likely apiKey is incorrect. Refresh the page and try again`
                spinner.style.display = "none"
            }
            return response;
        })
        .then(response => response.json())
        //.then(response => console.log(response))
        .then(response => setNumberOfBadges(response))
        .catch(err => console.log(err));
}
const healthCheck = () => {
    if (apiKeyInput.value.length > 0) {
        apiKey = apiKeyInput.value
        checkNumberOfBadges();
        apiKeyInput.style.display = 'none';
        // apiKeyInput.style.display = 'none';
        buttonFetch.style.display = 'none';
        spinner.style.display = "inline-block";
    } else {
        display.innerText = `input apiKey first`
    }
}