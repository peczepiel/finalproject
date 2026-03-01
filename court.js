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
        .attr("viewBox", `0 0 ${pixelHeight + pixelWidth} ${pixelWidth}`)
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
    const innerY = heightScale(courtLength - 15);
    const densityLeft = scale((courtWidth / 2) - cornerThreePointDist);
    const densityRight = scale((courtWidth / 2) + cornerThreePointDist);
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
    axisG.append("text")
        .attr("x", (densityLeft + densityRight) / 2)
        .attr("y", -28)
        .attr("fill", "#000")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("2P_O");

    // Interactive Drag Filter - use overlay rect over density area to capture input
    // Create a transparent overlay rect that covers the density plot area
    const densityOverlay = g.append("rect")
        .attr("x", densityLeft)
        .attr("y", innerY)
        .attr("width", densityRight - densityLeft)
        .attr("height", baselineY - innerY)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .style("cursor", "crosshair");

    let dragStartY = null;
    const dragFilter = d3.drag()
        .on("start", function (event) {
            const coords = d3.pointer(event, g.node());
            dragStartY = coords[0]; // x in the rotated group = y in screen space
        })
        .on("drag", function (event) {
            const coords = d3.pointer(event, g.node());
            const y1 = coords[0];
            const [left, right] = dragStartY < y1 ? [dragStartY, y1] : [y1, dragStartY];

            const selStart = xScale.invert(left);
            const selEnd = xScale.invert(right);

            updateCallback({ metric: "2P_O", range: [selStart, selEnd] });

            const selectedBins = bins.filter(b => b.x1 >= selStart && b.x0 <= selEnd);
            g.selectAll(".density-selected").datum(selectedBins).attr("d", selectedBins.length ? area : "");
            g.selectAll(".density-unselected").attr("opacity", selectedBins.length ? 0.18 : 0.6);
        });

    densityOverlay.call(dragFilter);


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

    // Add labels for offense and defense sides (horizontal layout)
    g.append("text").attr("x", pixelWidth * 0.05).attr("y", pixelHeight * 0.1).attr("text-anchor", "start").attr("font-size", "16px").attr("font-weight", "bold").text("Defense").attr("transform", `rotate(270, ${pixelWidth * 0.05}, ${pixelHeight * 0.1})`);
    g.append("text").attr("x", pixelWidth * 0.05).attr("y", pixelHeight * 0.9).attr("text-anchor", "end").attr("font-size", "16px").attr("font-weight", "bold").attr("transform", `rotate(270, ${pixelWidth * 0.05}, ${pixelHeight * 0.9})`).text("Offense");

    // DENSITY PLOT 2P_D (defense) - on opposite baseline with same functionality
    const twoPointDefData = data.map(d => +d["2P_D"]).filter(d => !isNaN(d));
    const xScaleDef = d3.scaleLinear().domain(d3.extent(twoPointDefData)).range([scale((courtWidth / 2) - cornerThreePointDist), scale((courtWidth / 2) + cornerThreePointDist)]);
    const histogramDef = d3.histogram().domain(xScaleDef.domain()).thresholds(xScaleDef.ticks(40));
    const binsDef = histogramDef(twoPointDefData);

    const baselineYDef = heightScale(0);  // opposite baseline
    const innerYDef = heightScale(20);  // grows inward
    const yScaleDef = d3.scaleLinear().domain([0, d3.max(binsDef, d => d.length) || 1]).range([baselineYDef, innerYDef]);
    const areaDef = d3.area().x(d => xScaleDef((d.x0 + d.x1) / 2)).y0(baselineYDef).y1(d => yScaleDef(d.length)).curve(d3.curveBasis);

    g.append("path").datum(binsDef).attr("class", "density-unselected-def").attr("d", areaDef).attr("fill", "red").attr("opacity", 0.6);
    g.append("path").datum([]).attr("class", "density-selected-def").attr("d", "").attr("fill", "orange").attr("opacity", 0.85);

    // Draw axis for defense side (top)
    const xAxisDef = d3.axisTop(xScaleDef).ticks(6);
    const axisGDef = g.append("g").attr("class", "x-axis-def").attr("transform", `translate(0, ${baselineYDef})`).call(xAxisDef);
    axisGDef.selectAll("text")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end")
        .attr("dx", "-10px")
        .attr("dy", "-5px")
        .attr("font-size", "12px");
    axisGDef.append("text")
        .attr("x", (densityLeft + densityRight) / 2)
        .attr("y", 30)
        .attr("fill", "#000")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("2P_D");

    // Drag filter overlay for defense density
    const densityDefOverlay = g.append("rect")
        .attr("x", densityLeft)
        .attr("y", baselineYDef)
        .attr("width", densityRight - densityLeft)
        .attr("height", innerYDef - baselineYDef)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .style("cursor", "crosshair");

    let dragStartYDef = null;
    const dragFilterDef = d3.drag()
        .on("start", function (event) {
            const coords = d3.pointer(event, g.node());
            dragStartYDef = coords[0];
        })
        .on("drag", function (event) {
            const coords = d3.pointer(event, g.node());
            const y1 = coords[0];
            const [left, right] = dragStartYDef < y1 ? [dragStartYDef, y1] : [y1, dragStartYDef];

            const selStart = xScaleDef.invert(left);
            const selEnd = xScaleDef.invert(right);

            // Update defense side filter
            updateCallback({ metric: "2P_D", range: [selStart, selEnd] });

            const selectedBinsDef = binsDef.filter(b => b.x1 >= selStart && b.x0 <= selEnd);
            g.selectAll(".density-selected-def").datum(selectedBinsDef).attr("d", selectedBinsDef.length ? areaDef : "");
            g.selectAll(".density-unselected-def").attr("opacity", selectedBinsDef.length ? 0.18 : 0.6);
        });

    densityDefOverlay.call(dragFilterDef);

    // --- THREE POINT ARC DENSITY (OUTWARD GROWING) ---
    // Arc geometry
    const r = scale(cornerThreePointDist);
    const cx = scale(courtWidth / 2);
    const cy = heightScale(courtLength - cornerThreeLength);

    // Extract data
    const threePointData = data
        .map(d => +d["3P_O"])
        .filter(d => !isNaN(d));

    // Angle scale (arc is the x-axis)
    const angleScaleThree = d3.scaleLinear()
        .domain(d3.extent(threePointData))
        .range([-Math.PI / 2, Math.PI / 2]);

    // Histogram
    const histogramThree = d3.histogram()
        .domain(angleScaleThree.domain())
        .thresholds(angleScaleThree.ticks(40));

    const binsThree = histogramThree(threePointData);

    // Radial scale (grow OUTWARD from arc)
    const radialScaleThree = d3.scaleLinear()
        .domain([0, d3.max(binsThree, d => d.length) || 1])
        .range([r, r + 100]);

    // Area generator in polar coordinates
    const areaThree = d3.area()
        .x0(d => {
            const theta = angleScaleThree((d.x0 + d.x1) / 2);
            return cx + r * Math.cos(theta);
        })
        .y0(d => {
            const theta = angleScaleThree((d.x0 + d.x1) / 2);
            return cy + r * Math.sin(theta);
        })
        .x1(d => {
            const theta = angleScaleThree((d.x0 + d.x1) / 2);
            return cx + radialScaleThree(d.length) * Math.cos(theta);
        })
        .y1(d => {
            const theta = angleScaleThree((d.x0 + d.x1) / 2);
            return cy + radialScaleThree(d.length) * Math.sin(theta);
        })
        .curve(d3.curveBasis);

    // Draw density (unselected)
    g.append("path")
        .datum(binsThree)
        .attr("class", "density-unselected-three")
        .attr("d", areaThree)
        .attr("fill", "green")
        .attr("pointer-events", "none")
        .attr("transform", `rotate(270, ${cx}, ${cy})`)
        .attr("opacity", 0.6);

    // Placeholder for selected overlay
    g.append("path")
        .datum([])
        .attr("class", "density-selected-three")
        .attr("d", "")
        .attr("fill", "orange")
        .attr("pointer-events", "none")
        .attr("transform", `rotate(270, ${cx}, ${cy})`)
        .attr("opacity", 0.85);

    // Tick marks + labels for 3P_O arc (value axis along arc)
    const threePointTicks = angleScaleThree.ticks(5);
    threePointTicks.forEach(t => {
        const theta = angleScaleThree(t);
        const tickInner = r - 5;
        const tickOuter = r + 8;
        const x1 = cx + tickInner * Math.cos(theta);
        const y1 = cy + tickInner * Math.sin(theta);
        const x2 = cx + tickOuter * Math.cos(theta);
        const y2 = cy + tickOuter * Math.sin(theta);
        const lx = cx + (r + 22) * Math.cos(theta);
        const ly = cy + (r + 22) * Math.sin(theta);

        g.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#222")
            .attr("stroke-width", 1)
            .attr("transform", `rotate(270, ${cx}, ${cy})`);

        g.append("text")
            .attr("x", lx)
            .attr("y", ly)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#111")
            .text(d3.format(".1f")(t))
            .attr("transform", `rotate(270, ${cx}, ${cy}) rotate(-270, ${lx}, ${ly})`);
    });
    g.append("text")
        .attr("x", cx)
        .attr("y", cy - (r + 34))
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#000")
        .text("3P_O")
        .attr("transform", `rotate(270, ${cx}, ${cy}) rotate(-270, ${cx}, ${cy - (r + 34)})`);

    // Drag filter functionality
    // Use an arc stroke hit-area so this overlay does not block 2P drag regions.
    const densityThreeOverlay = g.append("path")
        .attr("d", d3.arc()
            .innerRadius(r)
            .outerRadius(r)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2)())
        .attr("transform", `translate(${cx}, ${cy}) rotate(270)`)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 50)
        .attr("pointer-events", "stroke")
        .style("cursor", "crosshair");

    let dragStartAngle = null;
    const clampAngle = a => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, a));

    const dragFilterThree = d3.drag()
        .on("start", function (event) {
            // Use pointer in overlay's own coordinate space for exact transform alignment.
            const [x, y] = d3.pointer(event, this);
            const distance = Math.sqrt(x * x + y * y);

            if (Math.abs(distance - r) > 25) {
                dragStartAngle = null;
                return;
            }

            dragStartAngle = clampAngle(Math.atan2(y, x));
        })
        .on("drag", function (event) {
            if (dragStartAngle === null) return;

            const [x, y] = d3.pointer(event, this);
            const angle = clampAngle(Math.atan2(y, x));
            const lower = Math.min(dragStartAngle, angle);
            const upper = Math.max(dragStartAngle, angle);

            // Convert drag angle selection back into 3P_O value range.
            const valA = angleScaleThree.invert(lower);
            const valB = angleScaleThree.invert(upper);
            const selStart = Math.min(valA, valB);
            const selEnd = Math.max(valA, valB);

            // Filter bins by data range overlap.
            const selectedBinsThree = binsThree.filter(b => b.x1 >= selStart && b.x0 <= selEnd);

            // Callback with metric + numeric range (same contract as other court filters).
            updateCallback({ metric: "3P_O", range: [selStart, selEnd] });

            // Update density overlay
            g.select(".density-selected-three")
                .datum(selectedBinsThree)
                .attr("transform", `rotate(270, ${cx}, ${cy})`)
                .attr("d", selectedBinsThree.length ? areaThree : "");

            g.select(".density-unselected-three")
                .attr("transform", `rotate(270, ${cx}, ${cy})`)
                .attr("opacity", selectedBinsThree.length ? 0.18 : 0.6);
        })
        .on("end", function () {
            dragStartAngle = null;
        });

    densityThreeOverlay.call(dragFilterThree);

    // Add 3P_D density on opposite side with same functionality
    const cyDefThree = heightScale(cornerThreeLength);
    const threePointDefData = data
        .map(d => +d["3P_D"])
        .filter(d => !isNaN(d));

    const angleScaleThreeDef = d3.scaleLinear()
        .domain(d3.extent(threePointDefData))
        .range([-Math.PI / 2, Math.PI / 2]);

    const histogramFour = d3.histogram()
        .domain(angleScaleThreeDef.domain())
        .thresholds(angleScaleThreeDef.ticks(40));

    const binsFour = histogramFour(threePointDefData);

    const radialScaleThreeDef = d3.scaleLinear()
        .domain([0, d3.max(binsFour, d => d.length) || 1])
        .range([r, r + 100]);

    const areaFour = d3.area()
        .x0(d => {
            const theta = angleScaleThreeDef((d.x0 + d.x1) / 2);
            return cx + r * Math.cos(theta);
        })
        .y0(d => {
            const theta = angleScaleThreeDef((d.x0 + d.x1) / 2);
            return cyDefThree + r * Math.sin(theta);
        })
        .x1(d => {
            const theta = angleScaleThreeDef((d.x0 + d.x1) / 2);
            return cx + radialScaleThreeDef(d.length) * Math.cos(theta);
        })
        .y1(d => {
            const theta = angleScaleThreeDef((d.x0 + d.x1) / 2);
            return cyDefThree + radialScaleThreeDef(d.length) * Math.sin(theta);
        })
        .curve(d3.curveBasis);

    g.append("path")
        .datum(binsFour)
        .attr("class", "density-unselected-three-def")
        .attr("d", areaFour)
        .attr("fill", "red")
        .attr("pointer-events", "none")
        .attr("transform", `rotate(90, ${cx}, ${cyDefThree})`)
        .attr("opacity", 0.6);

    g.append("path")
        .datum([])
        .attr("class", "density-selected-three-def")
        .attr("d", "")
        .attr("fill", "orange")
        .attr("pointer-events", "none")
        .attr("transform", `rotate(90, ${cx}, ${cyDefThree})`)
        .attr("opacity", 0.85);

    // Tick marks + labels for 3P_D arc (value axis along arc)
    const threePointTicksDef = angleScaleThreeDef.ticks(5);
    threePointTicksDef.forEach(t => {
        const theta = angleScaleThreeDef(t);
        const tickInner = r - 5;
        const tickOuter = r + 8;
        const x1 = cx + tickInner * Math.cos(theta);
        const y1 = cyDefThree + tickInner * Math.sin(theta);
        const x2 = cx + tickOuter * Math.cos(theta);
        const y2 = cyDefThree + tickOuter * Math.sin(theta);
        const lx = cx + (r + 22) * Math.cos(theta);
        const ly = cyDefThree + (r + 22) * Math.sin(theta);

        g.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#222")
            .attr("stroke-width", 1)
            .attr("transform", `rotate(90, ${cx}, ${cyDefThree})`);

        g.append("text")
            .attr("x", lx)
            .attr("y", ly)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#111")
            .text(d3.format(".1f")(t))
            .attr("transform", `rotate(90, ${cx}, ${cyDefThree}) rotate(-90, ${lx}, ${ly})`);
    });
    g.append("text")
        .attr("x", cx)
        .attr("y", cyDefThree - (r + 34))
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#000")
        .text("3P_D")
        .attr("transform", `rotate(90, ${cx}, ${cyDefThree}) rotate(-90, ${cx}, ${cyDefThree - (r + 34)})`);

    const densityFourOverlay = g.append("path")
        .attr("d", d3.arc()
            .innerRadius(r)
            .outerRadius(r)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2)())
        .attr("transform", `translate(${cx}, ${cyDefThree}) rotate(90)`)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 50)
        .attr("pointer-events", "stroke")
        .style("cursor", "crosshair");

    let dragStartAngleDef = null;
    const dragFilterFour = d3.drag()
        .on("start", function (event) {
            const [x, y] = d3.pointer(event, this);
            const distance = Math.sqrt(x * x + y * y);
            if (Math.abs(distance - r) > 25) {
                dragStartAngleDef = null;
                return;
            }
            dragStartAngleDef = clampAngle(Math.atan2(y, x));
        })
        .on("drag", function (event) {
            if (dragStartAngleDef === null) return;

            const [x, y] = d3.pointer(event, this);
            const angle = clampAngle(Math.atan2(y, x));
            const lower = Math.min(dragStartAngleDef, angle);
            const upper = Math.max(dragStartAngleDef, angle);
            const valA = angleScaleThreeDef.invert(lower);
            const valB = angleScaleThreeDef.invert(upper);
            const selStart = Math.min(valA, valB);
            const selEnd = Math.max(valA, valB);
            const selectedBinsFour = binsFour.filter(b => b.x1 >= selStart && b.x0 <= selEnd);

            updateCallback({ metric: "3P_D", range: [selStart, selEnd] });

            g.select(".density-selected-three-def")
                .datum(selectedBinsFour)
                .attr("transform", `rotate(90, ${cx}, ${cyDefThree})`)
                .attr("d", selectedBinsFour.length ? areaFour : "");
            g.select(".density-unselected-three-def")
                .attr("transform", `rotate(90, ${cx}, ${cyDefThree})`)
                .attr("opacity", selectedBinsFour.length ? 0.18 : 0.6);
        })
        .on("end", function () {
            dragStartAngleDef = null;
        });

    densityFourOverlay.call(dragFilterFour);



}


