// winPercentFilter.js
function initWinPercentFilter(data, updateCallback) {
    const container = d3.select("#win-graph-container");
    container.html("");

    const width = container.node().getBoundingClientRect().width || 300;
    const height = container.node().getBoundingClientRect().height || 150;
    const margin = {top: 10, right: 15, bottom: 25, left: 15};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // --- NEW: Dynamically find the minimum Win % in the data ---
    const minWinPct = Math.floor(d3.min(data, d => d.winPctRaw));

    const x = d3.scaleLinear()
        .domain([minWinPct, 100]) // Use the dynamic minimum
        .range([margin.left, width - margin.right]);

    const histogram = d3.histogram()
        .value(d => d.winPctRaw)
        .domain(x.domain())
        .thresholds(x.ticks(15));

    const bins = histogram(data);

    // Ensure the curve drops nicely to 0 at the ends
    bins.unshift({x0: minWinPct, x1: bins[0].x0, length: 0});
    bins.push({x0: bins[bins.length-1].x1, x1: 100, length: 0});

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    const area = d3.area()
        .curve(d3.curveBasis)
        .x(d => x(d.x0 + (d.x1 - d.x0) / 2))
        .y0(height - margin.bottom)
        .y1(d => y(d.length));

    svg.append("path")
        .datum(bins)
        .attr("fill", "#eaf2f8")
        .attr("d", area);

    const line = d3.line()
        .curve(d3.curveBasis)
        .x(d => x(d.x0 + (d.x1 - d.x0) / 2))
        .y(d => y(d.length));

    svg.append("path")
        .datum(bins)
        .attr("fill", "none")
        .attr("stroke", "#3498db")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) {
            updateCallback(null);
            return;
        }
        const [pixelMin, pixelMax] = event.selection;
        const minVal = x.invert(pixelMin);
        const maxVal = x.invert(pixelMax);
        updateCallback([minVal, maxVal]);
    }
}