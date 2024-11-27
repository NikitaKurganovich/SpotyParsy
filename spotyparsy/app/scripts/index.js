var counter = 0


document.getElementById("download-button").addEventListener("click", printWithChange)


function printWithChange() {
    console.log("Current counter: " + counter)
    counter = counter + 1
}



