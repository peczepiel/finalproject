// winPercentFilter.js

function initWinPercentFilter(data, updateCallback) {
    const container = d3.select("#win-graph-container");
    container.html("");

    const width = container.node().getBoundingClientRect().width || 300;
    // Reverted back to strictly using the container's exact height so it never overflows
    const height = container.node().getBoundingClientRect().height + 45;
    
    // Tightened the margins so the numbers fit, but the graph stays as large as possible
    const margin = {top: 0, right: 30, bottom: 20, left: 30};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const minWinPct = Math.floor(d3.min(data, d => d.winPctRaw));

    const x = d3.scaleLinear()
        .domain([minWinPct, 100])
        .range([margin.left, width - margin.right]);

    const histogram = d3.histogram()
        .value(d => d.winPctRaw)
        .domain(x.domain())
        .thresholds(x.ticks(15));

    const bins = histogram(data);

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

    // X Axis (Bottom) - Kept at 6 ticks to prevent squishing
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "11px");

    // Y Axis (Left side) - Kept at 3 ticks to prevent vertical squishing
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("font-size", "11px");

    // Y Axis (Right side)
    svg.append("g")
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y).ticks(3).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("font-size", "11px");

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