// court.js
function initCourtFilter(data, updateCallback) {
    const courtWidth = 50;
    const courtLength = 94;
    const pixelWidth = 500;
    const pixelHeight = 940;

    const scale = d3.scaleLinear().domain([0, courtWidth]).range([0, pixelWidth]);
    const heightScale = d3.scaleLinear().domain([0, courtLength]).range([0, pixelHeight]);

    const container = d3.select("#basketball-court");
    container.html(""); // clear existing

    // --- NEW: Swap width/height in viewBox to make the bounding box horizontal ---
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${pixelHeight} ${pixelWidth}`) 
        .attr("preserveAspectRatio", "xMidYMid meet");

    // --- NEW: Rotate the entire court 90 degrees ---
    const g = svg.append("g")
        .attr("transform", `translate(${pixelHeight}, 0) rotate(90)`);

    const cornerThreePointDist = 21.65;
    const cornerThreeLength = 9.86;
    const freeTrowDist = 19;
    const freeThrowWidth = 12;
    const freeThrowRadius = 6;
    const centerCourtRadius = 6;
    const hoopRadius = 0.75;
    const hoopBackboardLength = 6;
    const hoopBaselineDist = 4;

    // Court outline
    g.append("rect")
        .attr("width", scale(courtWidth))
        .attr("height", heightScale(courtLength))
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    g.append("line").attr("y1", heightScale(courtLength / 2)).attr("x1", 0).attr("y2", heightScale(courtLength / 2)).attr("x2", scale(courtWidth)).attr("stroke", "#000").attr("stroke-width", 2);
    g.append("circle").attr("cx", scale(courtWidth / 2)).attr("cy", heightScale(courtLength / 2)).attr("r", scale(centerCourtRadius)).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);

    // Free throws
    g.append("rect").attr("x", scale((courtWidth - freeThrowWidth) / 2)).attr("y", heightScale(0)).attr("width", scale(freeThrowWidth)).attr("height", heightScale(freeTrowDist)).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    const freeThrowArcBottom = d3.arc().innerRadius(scale(freeThrowRadius)).outerRadius(scale(freeThrowRadius)).startAngle(Math.PI).endAngle(2 * Math.PI);
    g.append("path").attr("d", freeThrowArcBottom()).attr("transform", `translate(${scale(courtWidth / 2)}, ${heightScale(freeTrowDist)}) rotate(270)`).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);

    // Corner lines
    g.append("line").attr("x1", scale((courtWidth / 2) - cornerThreePointDist)).attr("y1", heightScale(0)).attr("x2", scale((courtWidth / 2) - cornerThreePointDist)).attr("y2", heightScale(cornerThreeLength)).attr("stroke", "#000").attr("stroke-width", 2);
    g.append("line").attr("x1", scale((courtWidth / 2) + cornerThreePointDist)).attr("y1", heightScale(0)).attr("x2", scale((courtWidth / 2) + cornerThreePointDist)).attr("y2", heightScale(cornerThreeLength)).attr("stroke", "#000").attr("stroke-width", 2);

    // DENSITY PLOT
    const twoPointData = data.map(d => +d["2P_O"]).filter(d => !isNaN(d));
    const xScale = d3.scaleLinear().domain(d3.extent(twoPointData)).range([scale((courtWidth / 2) - cornerThreePointDist), scale((courtWidth / 2) + cornerThreePointDist)]);
    const histogram = d3.histogram().domain(xScale.domain()).thresholds(xScale.ticks(40));
    const bins = histogram(twoPointData);
    
    const baselineY = heightScale(courtLength);
    const innerY = heightScale(courtLength - cornerThreeLength);
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).range([baselineY, innerY]);
    const area = d3.area().x(d => xScale((d.x0 + d.x1) / 2)).y0(baselineY).y1(d => yScale(d.length)).curve(d3.curveBasis);

    g.append("path").datum(bins).attr("class", "density-unselected").attr("d", area).attr("fill", "steelblue").attr("opacity", 0.6);
    g.append("path").datum([]).attr("class", "density-selected").attr("d", "").attr("fill", "orange").attr("opacity", 0.85);

    // Draw axis and rotate text back so it is upright
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const axisG = g.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${baselineY})`).call(xAxis);
    axisG.selectAll("text")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end")
        .attr("dx", "-10px")
        .attr("dy", "-5px")
        .attr("font-size", "12px");

    // Interactive Drag Filter
    let dragStartX = null;
    const dragFilter = d3.drag()
        .on("start", function(event) { dragStartX = event.x; })
        .on("drag", function (event) {
            const x0 = dragStartX;
            const x1 = event.x;
            const [left, right] = x0 < x1 ? [x0, x1] : [x1, x0];
            const selStart = xScale.invert(left);
            const selEnd = xScale.invert(right);

            // SEND RANGE TO APP.JS
            updateCallback([selStart, selEnd]);

            const selectedBins = bins.filter(b => b.x1 >= selStart && b.x0 <= selEnd);
            g.selectAll(".density-selected").datum(selectedBins).attr("d", selectedBins.length ? area : "");
            g.selectAll(".density-unselected").attr("opacity", selectedBins.length ? 0.18 : 0.6);
        });

    g.call(dragFilter);

    svg.on("click", (event) => {
        g.selectAll(".density-selected").datum([]).attr("d", "");
        g.selectAll(".density-unselected").attr("opacity", 0.6);
        updateCallback(null);
    });

    const threePointArc = d3.arc().innerRadius(scale(cornerThreePointDist)).outerRadius(scale(cornerThreePointDist)).startAngle(-Math.PI / 2).endAngle(Math.PI / 2);
    g.append("path").attr("d", threePointArc()).attr("transform", `translate(${scale(courtWidth / 2)}, ${heightScale(cornerThreeLength)}) rotate(180)`).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    g.append("circle").attr("cx", scale(courtWidth / 2)).attr("cy", heightScale(hoopBaselineDist)).attr("r", scale(hoopRadius)).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    g.append("line").attr("x1", scale((courtWidth / 2) - (hoopBackboardLength / 2))).attr("y1", heightScale(hoopBaselineDist - hoopRadius)).attr("x2", scale((courtWidth / 2) + (hoopBackboardLength / 2))).attr("y2", heightScale(hoopBaselineDist - hoopRadius)).attr("stroke", "#000").attr("stroke-width", 2);

    const mirror = y => heightScale(courtLength - y);
    g.append("rect").attr("x", scale((courtWidth - freeThrowWidth) / 2)).attr("y", mirror(0) - heightScale(freeTrowDist)).attr("width", scale(freeThrowWidth)).attr("height", heightScale(freeTrowDist)).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    const freeThrowArcTop = d3.arc().innerRadius(scale(freeThrowRadius)).outerRadius(scale(freeThrowRadius)).startAngle(0).endAngle(Math.PI);
    g.append("path").attr("d", freeThrowArcTop()).attr("transform", `translate(${scale(courtWidth / 2)}, ${mirror(freeTrowDist)}) rotate(270)`).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    g.append("line").attr("x1", scale((courtWidth / 2) - cornerThreePointDist)).attr("y1", mirror(0)).attr("x2", scale((courtWidth / 2) - cornerThreePointDist)).attr("y2", mirror(cornerThreeLength)).attr("stroke", "#000").attr("stroke-width", 2);
    g.append("line").attr("x1", scale((courtWidth / 2) + cornerThreePointDist)).attr("y1", mirror(0)).attr("x2", scale((courtWidth / 2) + cornerThreePointDist)).attr("y2", mirror(cornerThreeLength)).attr("stroke", "#000").attr("stroke-width", 2);
    g.append("path").attr("d", threePointArc()).attr("transform", `translate(${scale(courtWidth / 2)}, ${mirror(cornerThreeLength)})`).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    g.append("circle").attr("cx", scale(courtWidth / 2)).attr("cy", mirror(hoopBaselineDist)).attr("r", scale(hoopRadius)).attr("fill", "none").attr("stroke", "#000").attr("stroke-width", 2);
    g.append("line").attr("x1", scale((courtWidth / 2) - (hoopBackboardLength / 2))).attr("y1", mirror(hoopBaselineDist - hoopRadius)).attr("x2", scale((courtWidth / 2) + (hoopBackboardLength / 2))).attr("y2", mirror(hoopBaselineDist - hoopRadius)).attr("stroke", "#000").attr("stroke-width", 2);
}