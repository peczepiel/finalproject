// app.js
let globalData = [];

const activeFilters = {
    year: null,
    winPct: null,
    court: null,
    seed: null // NEW
};

// Wrapper function so we can easily re-initialize the UI when clearing
function initAllFilters() {
    if (typeof initWinPercentFilter === "function") {
        initWinPercentFilter(globalData, (range) => {
            activeFilters.winPct = range;
            applyAllFilters();
        });
    }
    if (typeof initYearFilter === "function") {
        initYearFilter(globalData, (selectedYear) => {
            activeFilters.year = selectedYear;
            applyAllFilters();
        });
    }
    if (typeof initCourtFilter === "function") {
        initCourtFilter(globalData, (range) => {
            activeFilters.court = range;
            applyAllFilters();
        });
    }
    // NEW: Initialize Seed Filter
    if (typeof initSeedFilter === "function") {
        initSeedFilter(globalData, (range) => {
            activeFilters.seed = range;
            applyAllFilters();
        });
    }
}

d3.csv("cleaneddataset.csv").then(data => {
    data.forEach(d => {
        d.winPctRaw = parseFloat(d["W %"].replace('%', ''));
    });

    const tournamentTeams = data.filter(d => {
        const seed = (d.SEED || "").trim().toUpperCase();
        return seed !== "N/A" && seed !== "NA" && seed !== "";
    });

    globalData = tournamentTeams;
    renderBubbles(globalData);

    // Call the wrapper
    initAllFilters();

}).catch(error => {
    console.error("Error loading CSV:", error);
});


function applyAllFilters() {
    let filtered = globalData;

    if (activeFilters.year !== null) {
        filtered = filtered.filter(d => parseInt(d.YEAR) === activeFilters.year);
    }
    if (activeFilters.winPct !== null) {
        const min = activeFilters.winPct[0];
        const max = activeFilters.winPct[1];
        filtered = filtered.filter(d => d.winPctRaw >= min && d.winPctRaw <= max);
    }
    if (activeFilters.court !== null) {
        const min = activeFilters.court[0];
        const max = activeFilters.court[1];
        filtered = filtered.filter(d => {
            const twoPO = +d["2P_O"];
            return twoPO >= min && twoPO <= max;
        });
    }

    if (activeFilters.seed !== null && activeFilters.seed.length > 0) {
        filtered = filtered.filter(d => {
            const seedNum = parseInt(d.SEED);
            // Keep the team only if their seed is inside the array of clicked seeds
            return activeFilters.seed.includes(seedNum);
        });
    }

    renderBubbles(filtered);
}

function renderBubbles(filteredData) {
    const container = d3.select("#bottom-half");
    container.html("");

    if (filteredData.length === 0) {
        container.append("p").text("No teams match the current filters.");
        return;
    }

    const portraits = container.selectAll(".portrait")
        .data(filteredData, d => d.TEAM + d.YEAR)
        .enter()
        .append("div")
        .attr("class", "portrait");

    portraits.append("div").attr("class", "team-name").text(d => d.TEAM);
    portraits.append("div").attr("class", "stat").text(d => `Year: ${d.YEAR} | Seed: ${d.SEED}`);
    portraits.append("div").attr("class", "stat").text(d => `Win %: ${d["W %"]}`);
    portraits.append("div").attr("class", "stat").text(d => `Conf: ${d.CONF}`);
}

// NEW: Clear Button Event Listener
document.getElementById("clear-btn").addEventListener("click", () => {
    // 1. Reset the logic state
    activeFilters.year = null;
    activeFilters.winPct = null;
    activeFilters.court = null;
    activeFilters.seed = null;

    // 2. Clear the screen by re-initializing the components to their defaults
    initAllFilters();

    // 3. Render all portraits again
    renderBubbles(globalData);
});