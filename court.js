function initCourtFilter(data, updateCallback) {
    // Court dimensions in feet
    const courtWidth = 50;
    const courtLength = 94;

    // Pixel dimensions used for viewBox scaling (maintain aspect ratio)
    const pixelWidth = 500;
    const pixelHeight = 940;

    // Scale to convert feet to pixels
    const scale = d3.scaleLinear()
        .domain([0, courtWidth])
        .range([0, pixelWidth]);

    const heightScale = d3.scaleLinear()
        .domain([0, courtLength])
        .range([0, pixelHeight]);

    // Create the SVG container with responsive sizing
    const svg = d3.select("#basketball-court")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${pixelWidth} ${pixelHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Three point dimensions
    //const threePointRadius = 22.15
    const cornerThreePointDist = 21.65
    const cornerThreeLength = 9.86

    // Free throw dimensions
    const freeTrowDist = 19
    const freeThrowWidth = 12
    const freeThrowRadius = 6

    // Misc dimensions
    const centerCourtRadius = 6
    const hoopRadius = 0.75
    const hoopBackboardLength = 6
    const hoopBaselineDist = 4


    // Draw the court outline
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", scale(courtWidth))
        .attr("height", heightScale(courtLength))
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);


    // Draw the half-court line
    svg.append("line")
        .attr("y1", heightScale(courtLength / 2))
        .attr("x1", 0)
        .attr("y2", heightScale(courtLength / 2))
        .attr("x2", scale(courtWidth))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw the center circle
    svg.append("circle")
        .attr("cx", scale(courtWidth / 2))
        .attr("cy", heightScale(courtLength / 2))
        .attr("r", scale(centerCourtRadius))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw free throw rectangles
    svg.append("rect")
        .attr("x", scale((courtWidth - freeThrowWidth) / 2))
        .attr("y", heightScale(0))
        .attr("width", scale(freeThrowWidth))
        .attr("height", heightScale(freeTrowDist))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw the free throw semi-circles using arcs (half‑circles)
    // bottom half at the near end
    const freeThrowArcBottom = d3.arc()
        .innerRadius(scale(freeThrowRadius))
        .outerRadius(scale(freeThrowRadius))
        .startAngle(Math.PI)          // start at the leftmost point
        .endAngle(2 * Math.PI);       // sweep clockwise to the rightmost point

    svg.append("path")
        .attr("d", freeThrowArcBottom())
        .attr("transform", `translate(${scale(courtWidth / 2)}, ${heightScale(freeTrowDist)}) rotate(270)`)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw three point corner lines
    svg.append("line")
        .attr("x1", scale((courtWidth / 2) - cornerThreePointDist))
        .attr("y1", heightScale(0))
        .attr("x2", scale((courtWidth / 2) - cornerThreePointDist))
        .attr("y2", heightScale(cornerThreeLength))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    svg.append("line")
        .attr("x1", scale((courtWidth / 2) + cornerThreePointDist))
        .attr("y1", heightScale(0))
        .attr("x2", scale((courtWidth / 2) + cornerThreePointDist))
        .attr("y2", heightScale(cornerThreeLength))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    console.log("data", data)

    // Create density plot of data column 2P_O for all teams in the dataset along the FAR baseline
    // (flipped so the bottom of the SVG is treated as the baseline). We bin the data and
    // render a smooth area (KDE-like) that grows upward into the court from the baseline.
    const twoPointData = data.map(d => +d["2P_O"]).filter(d => !isNaN(d));
    const xScale = d3.scaleLinear()
        .domain(d3.extent(twoPointData))
        .range([scale((courtWidth / 2) - cornerThreePointDist), scale((courtWidth / 2) + cornerThreePointDist)]);

    const histogram = d3.histogram()
        .domain(xScale.domain())
        .thresholds(xScale.ticks(40));
    const bins = histogram(twoPointData);

    // compute baseline (bottom of SVG) and inner Y (where the curve should stop rising)
    const baselineY = heightScale(courtLength); // bottom of SVG
    const innerY = heightScale(courtLength - cornerThreeLength); // top of the density area

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length) || 1])
        .range([baselineY, innerY]); // 0 -> baseline (bottom), max -> inward (smaller y)

    const area = d3.area()
        .x(d => xScale((d.x0 + d.x1) / 2))
        .y0(baselineY)
        .y1(d => yScale(d.length))
        .curve(d3.curveBasis);

    // draw full density (unselected) and an overlay path for the selected portion
    svg.append("path")
        .datum(bins)
        .attr("class", "density-unselected")
        .attr("d", area)
        .attr("fill", "steelblue")
        .attr("opacity", 0.6);

    svg.append("path")
        .datum([])
        .attr("class", "density-selected")
        .attr("d", "")
        .attr("fill", "orange")
        .attr("opacity", 0.85);

    // add x-axis with labels centered between the corner three-point lines
    const xAxis = d3.axisBottom(xScale).ticks(6);
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${baselineY})`)
        .call(xAxis)
        .selectAll("text")
        .attr("font-size", "12px");

    // axis label
    svg.append("text")
        .attr("x", scale(courtWidth / 2))
        .attr("y", baselineY - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .text("2P_O");

    // Drag filter on the density plot: highlight selected bins (orange) and dim unselected area
    // enable dragging to select arbitrary range; selection size is determined by
    // where the drag starts and ends. clicking anywhere resets the filter.
    let dragStartX = null;
    const dragFilter = d3.drag()
        .on("start", function(event) {
            dragStartX = event.x;
        })
        .on("drag", function (event) {
            const x0 = dragStartX;
            const x1 = event.x;
            // ensure order
            const [left, right] = x0 < x1 ? [x0, x1] : [x1, x0];
            const selStart = xScale.invert(left);
            const selEnd = xScale.invert(right);

            // callback with filtered rows
            const filteredData = data.filter(d => {
                const twoPO = +d["2P_O"];
                return twoPO >= selStart && twoPO <= selEnd;
            });
            updateCallback(filteredData);

            const selectedBins = bins.filter(b => b.x1 >= selStart && b.x0 <= selEnd);
            svg.selectAll(".density-selected")
                .datum(selectedBins)
                .attr("d", selectedBins.length ? area : "");

            svg.selectAll(".density-unselected")
                .attr("opacity", selectedBins.length ? 0.18 : 0.6);
        })
        .on("end", function () {
            // leave selection visible until user clicks
        });

    svg.call(dragFilter);

    // clear selection on click anywhere in SVG
    svg.on("click", () => {
        svg.selectAll(".density-selected").datum([]).attr("d", "");
        svg.selectAll(".density-unselected").attr("opacity", 0.6);
        updateCallback(data);
    });

    // Draw the three point curve connecting the corner lines
    const threePointArc = d3.arc()
        .innerRadius(scale(cornerThreePointDist))
        .outerRadius(scale(cornerThreePointDist))
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2);

    svg.append("path")
        .attr("d", threePointArc())
        .attr("transform", `translate(${scale(courtWidth / 2)}, ${heightScale(cornerThreeLength)}) rotate(180)`)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw the hoops
    svg.append("circle")
        .attr("cx", scale(courtWidth / 2))
        .attr("cy", heightScale(hoopBaselineDist))
        .attr("r", scale(hoopRadius))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // Draw the backboards
    svg.append("line")
        .attr("x1", scale((courtWidth / 2) - (hoopBackboardLength / 2)))
        .attr("y1", heightScale(hoopBaselineDist - hoopRadius))
        .attr("x2", scale((courtWidth / 2) + (hoopBackboardLength / 2)))
        .attr("y2", heightScale(hoopBaselineDist - hoopRadius))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // === mirror everything on far baseline ===
    const mirror = y => heightScale(courtLength - y);

    // free throw rectangle on opposite side
    svg.append("rect")
        .attr("x", scale((courtWidth - freeThrowWidth) / 2))
        .attr("y", mirror(0) - heightScale(freeTrowDist))
        .attr("width", scale(freeThrowWidth))
        .attr("height", heightScale(freeTrowDist))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // free throw semi-circle on opposite side (top half)
    const freeThrowArcTop = d3.arc()
        .innerRadius(scale(freeThrowRadius))
        .outerRadius(scale(freeThrowRadius))
        .startAngle(0)
        .endAngle(Math.PI);

    svg.append("path")
        .attr("d", freeThrowArcTop())
        .attr("transform", `translate(${scale(courtWidth / 2)}, ${mirror(freeTrowDist)}) rotate(270)`)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // corner lines on opposite side
    svg.append("line")
        .attr("x1", scale((courtWidth / 2) - cornerThreePointDist))
        .attr("y1", mirror(0))
        .attr("x2", scale((courtWidth / 2) - cornerThreePointDist))
        .attr("y2", mirror(cornerThreeLength))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
    svg.append("line")
        .attr("x1", scale((courtWidth / 2) + cornerThreePointDist))
        .attr("y1", mirror(0))
        .attr("x2", scale((courtWidth / 2) + cornerThreePointDist))
        .attr("y2", mirror(cornerThreeLength))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // three point curve on opposite side
    svg.append("path")
        .attr("d", threePointArc())
        .attr("transform", `translate(${scale(courtWidth / 2)}, ${mirror(cornerThreeLength)})`)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // hoop on opposite side
    svg.append("circle")
        .attr("cx", scale(courtWidth / 2))
        .attr("cy", mirror(hoopBaselineDist))
        .attr("r", scale(hoopRadius))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    // backboard on opposite side
    svg.append("line")
        .attr("x1", scale((courtWidth / 2) - (hoopBackboardLength / 2)))
        .attr("y1", mirror(hoopBaselineDist - hoopRadius))
        .attr("x2", scale((courtWidth / 2) + (hoopBackboardLength / 2)))
        .attr("y2", mirror(hoopBaselineDist - hoopRadius))
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
}