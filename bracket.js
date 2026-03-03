function initBracketFilter(data, updateCallback, initialSelection = null) {
    const container = d3.select("#bracket-container");
    container.html("");

    const width = container.node().getBoundingClientRect().width || 340;
    const height = container.node().getBoundingClientRect().height || 190;
    const margin = { top: 12, right: 16, bottom: 20, left: 24 };

    const rounds = [
        { value: 1, label: "Round of 64" },
        { value: 2, label: "Round of 32" },
        { value: 3, label: "Sweet 16" },
        { value: 4, label: "Elite 8" },
        { value: 5, label: "Final Four" },
        { value: 6, label: "Finals" },
        { value: 7, label: "Champions" }
    ];

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xStep = innerWidth / rounds.length;
    const yStep = innerHeight / (rounds.length - 1);
    const stageWidth = xStep * 0.7;
    const branchGap = Math.max(4, Math.min(18, yStep * 0.85));
    const baseY = margin.top;

    let selectedRound = initialSelection === null ? null : Number(initialSelection);

    const roundGroups = svg.selectAll(".bracket-round")
        .data(rounds)
        .enter()
        .append("g")
        .attr("class", "bracket-round")
        .style("cursor", "pointer")
        .on("click", function (event, d) {
            if (selectedRound === d.value) {
                selectedRound = null;
                updateCallback(null);
            } else {
                selectedRound = d.value;
                updateCallback(d.value);
            }
            updateStyles();
        });

    roundGroups.each(function (d, i) {
        const g = d3.select(this);
        const x = margin.left + (i * xStep);
        const y = baseY + (i * yStep);
        const upperY = y - (branchGap / 2);
        const lowerY = y + (branchGap / 2);
        const xMerge = x + stageWidth;

        g.append("rect")
            .attr("x", x - 4)
            .attr("y", upperY - 8)
            .attr("width", stageWidth + 8)
            .attr("height", branchGap + 16)
            .attr("fill", "transparent");

        g.append("line")
            .attr("class", "round-segment")
            .attr("x1", x)
            .attr("y1", upperY)
            .attr("x2", xMerge)
            .attr("y2", upperY)
            .attr("stroke", "#777")
            .attr("stroke-width", 2);

        g.append("line")
            .attr("class", "round-segment")
            .attr("x1", x)
            .attr("y1", lowerY)
            .attr("x2", xMerge)
            .attr("y2", lowerY)
            .attr("stroke", "#777")
            .attr("stroke-width", 2);

        g.append("line")
            .attr("class", "round-segment")
            .attr("x1", xMerge)
            .attr("y1", upperY)
            .attr("x2", xMerge)
            .attr("y2", lowerY)
            .attr("stroke", "#777")
            .attr("stroke-width", 2);

        if (i < rounds.length - 1) {
            const yNext = baseY + ((i + 1) * yStep);
            const xNext = margin.left + ((i + 1) * xStep);
            const upperYNext = yNext - (branchGap / 2);
            const xNextTopMid = xNext + (stageWidth / 2);
            g.append("line")
                .attr("class", "round-segment")
                .attr("x1", xMerge)
                .attr("y1", y)
                .attr("x2", xNextTopMid)
                .attr("y2", y)
                .attr("stroke", "#777")
                .attr("stroke-width", 2);

            g.append("line")
                .attr("class", "round-segment")
                .attr("x1", xNextTopMid)
                .attr("y1", y)
                .attr("x2", xNextTopMid)
                .attr("y2", upperYNext)
                .attr("stroke", "#777")
                .attr("stroke-width", 2.2);
        }

        g.append("text")
            .attr("class", "round-label")
            .attr("x", x + (stageWidth / 2))
            .attr("y", lowerY + 6)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .style("font-size", "9px")
            .style("font-family", "sans-serif")
            .style("fill", "#444")
            .text(d.label);
    });

    function updateStyles() {
        const isActiveRound = d => selectedRound !== null && d.value >= selectedRound;

        roundGroups.selectAll(".round-segment")
            .attr("stroke", d => isActiveRound(d) ? "#1f77b4" : "#777")
            .attr("stroke-width", d => isActiveRound(d) ? 3 : 2);

        roundGroups.select(".round-label")
            .style("fill", d => isActiveRound(d) ? "#1f77b4" : "#444")
            .style("font-weight", d => isActiveRound(d) ? "bold" : "normal");
    }

    updateStyles();
}
