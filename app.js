let globalData = [];
let isRefreshingFilters = false;

const activeFilters = {
    year: null,
    winPct: null,
    court: {},
    seed: null,
    bracket: null
};

function initAllFilters(skipKey = null) {
    isRefreshingFilters = true;

    if (skipKey !== "winPct" && typeof initWinPercentFilter === "function") {
        initWinPercentFilter(getFilteredData("winPct"), (range) => {
            if (isRefreshingFilters) return;
            activeFilters.winPct = range;
            applyAllFilters("winPct");
        }, activeFilters.winPct);
    }
    if (skipKey !== "year" && typeof initYearFilter === "function") {
        initYearFilter(getFilteredData("year"), (selectedYear) => {
            if (isRefreshingFilters) return;
            activeFilters.year = selectedYear;
            applyAllFilters("year");
        }, activeFilters.year);
    }
    if (skipKey !== "court" && typeof initCourtFilter === "function") {
        initCourtFilter(getFilteredData("court"), (payload) => {
            if (isRefreshingFilters) return;
            if (payload === null) {
                activeFilters.court = {};
            } else if (Array.isArray(payload)) {
                activeFilters.court["2P_O"] = payload;
            } else if (payload.metric && Array.isArray(payload.range)) {
                activeFilters.court[payload.metric] = payload.range;
            }
            applyAllFilters("court");
        }, activeFilters.court);
    }
    if (skipKey !== "seed" && typeof initSeedFilter === "function") {
        initSeedFilter(getFilteredData("seed"), (range) => {
            if (isRefreshingFilters) return;
            activeFilters.seed = range;
            applyAllFilters("seed");
        }, activeFilters.seed);
    }
    if (skipKey !== "bracket" && typeof initBracketFilter === "function") {
        initBracketFilter(getFilteredData("bracket"), (selectedRound) => {
            if (isRefreshingFilters) return;
            activeFilters.bracket = selectedRound;
            applyAllFilters("bracket");
        }, activeFilters.bracket);
    }

    isRefreshingFilters = false;
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
    applyAllFilters();

}).catch(error => {
    console.error("Error loading CSV:", error);
});


function getFilteredData(excludedFilter = null) {
    let filtered = globalData;

    if (excludedFilter !== "year" && activeFilters.year !== null) {
        const yearSet = Array.isArray(activeFilters.year)
            ? new Set(activeFilters.year.map(Number))
            : new Set([Number(activeFilters.year)]);
        filtered = filtered.filter(d => yearSet.has(parseInt(d.YEAR)));
    }
    if (excludedFilter !== "winPct" && activeFilters.winPct !== null) {
        const min = activeFilters.winPct[0];
        const max = activeFilters.winPct[1];
        filtered = filtered.filter(d => d.winPctRaw >= min && d.winPctRaw <= max);
    }
    if (excludedFilter !== "court" && activeFilters.court && Object.keys(activeFilters.court).length > 0) {
        filtered = filtered.filter(d => {
            return Object.entries(activeFilters.court).every(([metric, range]) => {
                if (!Array.isArray(range) || range.length !== 2) return true;
                const min = Math.min(range[0], range[1]);
                const max = Math.max(range[0], range[1]);
                const value = +d[metric];
                return !isNaN(value) && value >= min && value <= max;
            });
        });
    }

    if (excludedFilter !== "seed" && activeFilters.seed !== null && activeFilters.seed.length > 0) {
        filtered = filtered.filter(d => {
            const seedNum = parseInt(d.SEED);
            return activeFilters.seed.includes(seedNum);
        });
    }
    if (excludedFilter !== "bracket" && activeFilters.bracket !== null) {
        filtered = filtered.filter(d => {
            const finishRound = parseInt(d["Finish Dum"]);
            if (isNaN(finishRound)) return false;

            if (activeFilters.bracket === 1) {
                const postseason = (d.POSTSEASON || "").trim().toUpperCase();
                return finishRound >= 1 && postseason !== "R68";
            }

            return finishRound >= activeFilters.bracket;
        });
    }

    return filtered;
}

function applyAllFilters(changedKey = null) {
    const filtered = getFilteredData();
    renderBubbles(filtered);
    initAllFilters(changedKey);
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


document.getElementById("clear-btn").addEventListener("click", () => {
    activeFilters.year = null;
    activeFilters.winPct = null;
    activeFilters.court = {};
    activeFilters.seed = null;
    activeFilters.bracket = null;

    applyAllFilters();
});
