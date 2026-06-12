fetch("http://localhost:5000/report")
.then(res => res.json())
.then(data => {

    const report = document.getElementById("report");

    if(data.length === 0){
        report.innerHTML = "No data available";
        return;
    }

    report.innerHTML = data.map(item =>
        `<p>${item.website} - ${item.timeSpent} sec</p>`
    ).join("");

});