let apiKey = "";
let numberOfBadges = 0;
let pages = 0;
let currentPage = 0;
let startIndex = 0;
let macAddresses = [];
let presences = [];
let currentTime = new Date();
let results = [];
let resultsWithErrors = [];
let display = document.querySelector(".message");
let buttonDownload = document.querySelector("#download");
let buttonFetch = document.querySelector("#fetch");
let spinner = document.querySelector(".lds-roller");
let apiKeyInput = document.querySelector("#apiKey-input");
let timezoneCST = document.querySelector("#cst");
let timezoneUTC = document.querySelector("#utc");
let timezoneCDT = document.querySelector("#cdt");
let timezoneSelectDiv = document.querySelector("#timezone-select");
let timezoneMessage = document.querySelector("#timezone-message");
let modelSelectDiv = document.querySelector("#model-select");
let modelSelectAll = document.querySelector("#model-all");
let modelSelectSmartBadge = document.querySelector("#model-smartbadge");
let timezoneSelected = "utc";
let modelSelected = "all";



function download_csv_file() {
    let timeOffset = 0;
    //define the heading for each row of the data
    //let csv = 'mac,last seen,last location,uniqueId,alias\n';

    //merge the data with CSV

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += 'mac,last seen,last location,uniqueId,name,firmware\n';
    results.forEach(function (rowArray) {
        let dateToBeConverted = new Date(rowArray[1])
        //console.log(dateToBeConverted, "dateToBeConverted")
        let currentTimeUTC = new Date(Date.UTC())

        let unixDateToBeConverted = Math.floor(dateToBeConverted.getTime() / 1000);
        let unixDateAfterConversion = 0;
        //console.log(unixDateToBeConverted, "unixDateToBeConverted")
        //console.log(timezoneSelected)

        if (timezoneSelected === "cst") {
            timeOffset = -21600;
        } else if (timezoneSelected === "cdt") {
            timeOffset = -18000;
        }
        //console.log(timeOffset, "timeOffset")
        unixDateAfterConversion = unixDateToBeConverted + timeOffset;
        let dateAfterConversion = new Date(unixDateAfterConversion * 1000);
        let year = dateAfterConversion.getFullYear();
        let month = dateAfterConversion.getMonth() + 1;
        if (month < 10) month = '0' + month
        let day = dateAfterConversion.getDate();
        if (day < 10) day = '0' + day;
        let hour = dateAfterConversion.getHours();
        if (hour < 10) hour = '0' + hour;
        let minute = dateAfterConversion.getMinutes()
        if (minute < 10) minute = '0' + minute;
        let second = dateAfterConversion.getSeconds()
        if (second < 10) second = '0' + second
        let dateAfterConversionFormatted = `${year}-${month}-${day}T${hour}:${minute}:${second}`
        //console.log(unixDateAfterConversion, "unixDateAfterConversion")
        //console.log(dateAfterConversion, "dateAfterConversion")
        //console.log(dateAfterConversionFormatted, "dateAfterConversionFormatted")
        //let stringDateAfterConversion = dateAfterConversion.toString();
        //console.log(stringDateAfterConversion, "stringDateAfterConversion")
        rowArray[1] = dateAfterConversionFormatted
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}
function showResults() {
    //console.log(results, "results")
    display.innerText = `data ready to download`
    //console.log(results.length, "results.length")
    buttonDownload.style.display = "block"
    spinner.style.display = "none"
}
function getPresences() {
    // fetch presence for each device and save as object in array
    //console.log(macAddresses.length)
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
                let endTime = '';
                console.log(result.content[0]);
                //console.log(result.content[0].endTime);
                if (result.content[0] === undefined) {
                    resultsWithErrors.push("position missing")
                } else {
                    if (result.content[0].endTime == undefined) {
                        let currentTime = new Date();
                        //console.log(currentTime, "currenttime");
                        let year = currentTime.getUTCFullYear();
                        let month = currentTime.getUTCMonth() + 1;
                        if (month < 10) month = '0' + month
                        let day = currentTime.getUTCDate();
                        if (day < 10) day = '0' + day;
                        let hour = currentTime.getUTCHours();
                        if (hour < 10) hour = '0' + hour;
                        let minute = currentTime.getUTCMinutes()
                        if (minute < 10) minute = '0' + minute;
                        let second = currentTime.getUTCSeconds()
                        if (second < 10) second = '0' + second
                        endTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`
                    } else {
                        endTime = result.content[0].endTime.slice(0, 19)
                    }
                    //console.log(endTime);
                    resultsWithErrors.push("ok")
                    results.push([result.content[0].trackingId, endTime, result.content[0].roomName, device.uniqueId, device.name, device.firmware])
                }//device.alias
                display.innerText = `found positions of ${results.length} badges. Please wait...`
                if (resultsWithErrors.length === macAddresses.length) {
                    showResults()
                }
            })
    })
        .catch(error => console.log('error', error));
    //setTimeout(showResults, 15000)
}



const findMacs = (result) => {
    if (modelSelected === "smartbadge") {
        result.devices.forEach(device => {
            if (device.product === "Smart Badge") {
                macAddresses.push({ "mac": device.mac, "uniqueId": device.uniqueId, "name": device.name, "firmware": device.firmware })
            }
        })
    } else if (modelSelected === "all") {
        result.devices.forEach(device => {
            macAddresses.push({ "mac": device.mac, "uniqueId": device.uniqueId, "name": device.name, "firmware": device.firmware })
        })
    }
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
    //console.log(pages)
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
            //console.log(response)
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
        apiKey = apiKeyInput.value;
        checkNumberOfBadges();
        timezoneSelectDiv.style.display = "none";
        modelSelectDiv.style.display = "none";
        apiKeyInput.style.display = 'none';
        buttonFetch.style.display = 'none';
        spinner.style.display = "inline-block";
        timezoneMessage.style.display = "none";
    } else {
        display.innerText = `input apiKey first`;
    }
}



timezoneUTC.addEventListener("click", function (e) {
    timezoneSelected = "utc"
    timezoneUTC.classList.add("glowing-border")
    timezoneCST.classList.remove("glowing-border")
    timezoneCDT.classList.remove("glowing-border")
})
timezoneCST.addEventListener("click", function (e) {
    timezoneSelected = "cst"
    timezoneCST.classList.add("glowing-border")
    timezoneUTC.classList.remove("glowing-border")
    timezoneCDT.classList.remove("glowing-border")
})
timezoneCDT.addEventListener("click", function (e) {
    timezoneSelected = "cdt"
    timezoneCDT.classList.add("glowing-border")
    timezoneCST.classList.remove("glowing-border")
    timezoneUTC.classList.remove("glowing-border")
})

modelSelectAll.addEventListener("click", function (e) {
    modelSelected = "all";
    modelSelectAll.classList.add("glowing-border")
    modelSelectSmartBadge.classList.remove("glowing-border")
})
modelSelectSmartBadge.addEventListener("click", function (e) {
    modelSelected = "smartbadge"
    modelSelectAll.classList.remove("glowing-border")
    modelSelectSmartBadge.classList.add("glowing-border")
})
timezoneUTC.classList.add("glowing-border")
modelSelectAll.classList.add("glowing-border")