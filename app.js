// Keep a reference to the full dataset globally
let globalData = [];

// 1. Load the CSV Data
d3.csv("cleaneddataset.csv").then(data => {
    
    // Parse the data to clean it up (convert strings to numbers)
    data.forEach(d => {
        // Remove the '%' sign and convert to a decimal number for graphing
        d.winPctRaw = parseFloat(d["W %"].replace('%', ''));
    });

    // --- NEW ADDITION: Filter out teams that did not make the tournament ---
    const tournamentTeams = data.filter(d => {
        const seed = (d.SEED || "").trim().toUpperCase();
        return seed !== "N/A" && seed !== "NA" && seed !== ""; 
    });

    // Assign the filtered list to our global variable
    globalData = tournamentTeams;

    // Initial render: Show all tournament teams
    renderPortraits(globalData);

    // Initialize the Win % Graph filter (from winPercentFilter.js)
    if (typeof initWinPercentFilter === "function") {
        initWinPercentFilter(globalData, renderPortraits);
    }

    // Initialize the Court Filter (from court.js)
    if (typeof initCourtFilter === "function") {
        initCourtFilter(globalData, renderPortraits);
    }

}).catch(error => {
    console.error("Error loading the CSV file:", error);
    document.getElementById("bottom-half").innerHTML = "<p style='color:red;'>Could not load cleaneddataset.csv. Are you running this via a local server?</p>";
});


// 2. Function to Render the Bottom "Portraits"
function renderPortraits(filteredData) {
    const container = d3.select("#bottom-half");
    
    // Clear the current display
    container.html("");
    
    if (filteredData.length === 0) {
        container.append("p").text("No teams match the current filter.");
        return;
    }

    // Bind data to DOM elements and create the cards
    const portraits = container.selectAll(".portrait")
        .data(filteredData, d => d.TEAM + d.YEAR) // Use Team+Year as unique key
        .enter()
        .append("div")
        .attr("class", "portrait");

    portraits.append("div")
        .attr("class", "team-name")
        .text(d => d.TEAM);

    portraits.append("div")
        .attr("class", "stat")
        .text(d => `Year: ${d.YEAR} | Seed: ${d.SEED}`);

    portraits.append("div")
        .attr("class", "stat")
        .text(d => `Win %: ${d["W %"]}`);
        
    portraits.append("div")
        .attr("class", "stat")
        .text(d => `Conf: ${d.CONF}`);
}