// court.js
function initCourtFilter(data, updateCallback) {
    const courtWidth = 50;
    const courtLength = 94;
    const halfCourtLength = courtLength / 2;

    const cornerThreePointDist = 18;
    const cornerThreeLength = 9.86;
    const freeTrowDist = 19;
    const freeThrowWidth = 12;
    const freeThrowRadius = 6;
    const hoopRadius = 0.75;
    const hoopBackboardLength = 6;
    const hoopBaselineDist = 4;
    const densityArcInsetFeet = 0;
    const palette = {
        twoPO: "#145a32",
        threePO: "#7dce82",
        selOff: "#0b3d20",
        twoPD: "#7b1113",
        threePD: "#f28b82",
        selDef: "#4a0607"
    };

    const legend = d3.select("#court-legend");
    legend.html("");
    legend.append("h4").text("Court Legend");
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.twoPO}"></span><span>2P_O</span>`);
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.threePO}"></span><span>3P_O</span>`);
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.selOff}"></span><span>Offense Selected</span>`);
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.twoPD}"></span><span>2P_D</span>`);
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.threePD}"></span><span>3P_D</span>`);
    legend.append("div").attr("class", "legend-item").html(`<span class="legend-swatch" style="background:${palette.selDef}"></span><span>Defense Selected</span>`);

    function renderHalfCourt(containerSelector, cfg) {
        const container = d3.select(containerSelector);
        container.html("");

        const bounds = container.node().getBoundingClientRect();
        const width = bounds.width > 0 ? bounds.width : 620;
        const height = bounds.height > 0 ? bounds.height : 480;

        const labelBand = Math.max(38, Math.min(54, height * 0.12));
        const padX = Math.max(6, Math.min(12, width * 0.02));
        const padBottom = Math.max(18, Math.min(28, height * 0.06));

        const usableW = width - (2 * padX);
        const usableH = height - labelBand - padBottom;
        const feetToPx = Math.min(usableW / courtWidth, usableH / halfCourtLength);
        const drawW = Math.min(usableW, courtWidth * feetToPx * 1.08);
        const drawH = halfCourtLength * feetToPx;
        const drawX0 = (width - drawW) / 2;
        const drawY0 = labelBand + ((usableH - drawH) / 2);
        const titleSize = Math.max(22, Math.min(34, feetToPx * 2.1));
        const axisTickSize = Math.max(11, Math.min(14, feetToPx * 0.85));
        const metricLabelSize = Math.max(14, Math.min(20, feetToPx * 1.2));
        const arcTickSize = Math.max(11, Math.min(15, feetToPx * 0.95));
        const arcLabelSize = Math.max(14, Math.min(20, feetToPx * 1.25));
        const radialOutBase = Math.max(34, Math.min(68, drawH * 0.18));

        const xScaleCourt = d3.scaleLinear().domain([0, courtWidth]).range([drawX0, drawX0 + drawW]);
        const yScaleHalf = d3.scaleLinear().domain([0, halfCourtLength]).range([drawY0, drawY0 + drawH]);
        const yFromBaseline = d => yScaleHalf(halfCourtLength - d);

        const svg = container.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g");

        g.append("rect")
            .attr("x", xScaleCourt(0))
            .attr("y", yScaleHalf(0))
            .attr("width", xScaleCourt(courtWidth) - xScaleCourt(0))
            .attr("height", yScaleHalf(halfCourtLength) - yScaleHalf(0))
            .attr("fill", "#f5f5f5")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("line")
            .attr("x1", xScaleCourt((courtWidth / 2) - cornerThreePointDist))
            .attr("x2", xScaleCourt((courtWidth / 2) - cornerThreePointDist))
            .attr("y1", yFromBaseline(0))
            .attr("y2", yFromBaseline(cornerThreeLength))
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("line")
            .attr("x1", xScaleCourt((courtWidth / 2) + cornerThreePointDist))
            .attr("x2", xScaleCourt((courtWidth / 2) + cornerThreePointDist))
            .attr("y1", yFromBaseline(0))
            .attr("y2", yFromBaseline(cornerThreeLength))
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("rect")
            .attr("x", xScaleCourt((courtWidth - freeThrowWidth) / 2))
            .attr("y", Math.min(yFromBaseline(0), yFromBaseline(freeTrowDist)))
            .attr("width", xScaleCourt(freeThrowWidth) - xScaleCourt(0))
            .attr("height", Math.abs(yFromBaseline(freeTrowDist) - yFromBaseline(0)))
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        const freeThrowArc = d3.arc()
            .innerRadius(xScaleCourt(freeThrowRadius) - xScaleCourt(0))
            .outerRadius(xScaleCourt(freeThrowRadius) - xScaleCourt(0))
            .startAngle(0)
            .endAngle(Math.PI);

        g.append("path")
            .attr("d", freeThrowArc())
            .attr("transform", `translate(${xScaleCourt(courtWidth / 2)}, ${yFromBaseline(freeTrowDist)}) rotate(270)`)
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        const threePointArc = d3.arc()
            .innerRadius(xScaleCourt(cornerThreePointDist) - xScaleCourt(0))
            .outerRadius(xScaleCourt(cornerThreePointDist) - xScaleCourt(0))
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        g.append("path")
            .attr("d", threePointArc())
            .attr("transform", `translate(${xScaleCourt(courtWidth / 2)}, ${yFromBaseline(cornerThreeLength)})`)
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("circle")
            .attr("cx", xScaleCourt(courtWidth / 2))
            .attr("cy", yFromBaseline(hoopBaselineDist))
            .attr("r", xScaleCourt(hoopRadius) - xScaleCourt(0))
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("line")
            .attr("x1", xScaleCourt((courtWidth / 2) - (hoopBackboardLength / 2)))
            .attr("x2", xScaleCourt((courtWidth / 2) + (hoopBackboardLength / 2)))
            .attr("y1", yFromBaseline(hoopBaselineDist - hoopRadius))
            .attr("y2", yFromBaseline(hoopBaselineDist - hoopRadius))
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

        g.append("text")
            .attr("x", xScaleCourt(courtWidth / 2))
            .attr("y", labelBand - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", `${titleSize}px`)
            .attr("font-weight", "bold")
            .text(cfg.title);

        // 2P density
        const twoPointData = data.map(d => +d[cfg.twoMetric]).filter(d => !isNaN(d));
        const densityLeft = xScaleCourt((courtWidth / 2) - cornerThreePointDist);
        const densityRight = xScaleCourt((courtWidth / 2) + cornerThreePointDist);
        const xScale = d3.scaleLinear().domain(d3.extent(twoPointData)).range([densityLeft, densityRight]);
        const bins = d3.histogram().domain(xScale.domain()).thresholds(xScale.ticks(40))(twoPointData);

        const baselineY = yFromBaseline(0);
        const innerY = yFromBaseline(cfg.twoInnerFeet);
        const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).range([baselineY, innerY]);
        const area = d3.area()
            .x(d => xScale((d.x0 + d.x1) / 2))
            .y0(baselineY)
            .y1(d => yScale(d.length))
            .curve(d3.curveBasis);

        const twoUnselected = g.append("path")
            .datum(bins)
            .attr("d", area)
            .attr("fill", cfg.twoColor)
            .attr("opacity", 0.6);

        const twoSelected = g.append("path")
            .datum([])
            .attr("d", "")
            .attr("fill", cfg.selectedColor)
            .attr("opacity", 0.85);

        const axisG = g.append("g")
            .attr("transform", `translate(0, ${baselineY})`)
            .call(d3.axisBottom(xScale).ticks(6));

        axisG.selectAll("text").attr("font-size", `${axisTickSize}px`).attr("font-weight", "600");
        axisG.selectAll("line").attr("stroke-width", 1.5);

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
                const [x] = d3.pointer(event, g.node());
                dragStartY = x;
            })
            .on("drag", function (event) {
                const [x] = d3.pointer(event, g.node());
                const [left, right] = dragStartY < x ? [dragStartY, x] : [x, dragStartY];
                const selStart = xScale.invert(left);
                const selEnd = xScale.invert(right);

                updateCallback({ metric: cfg.twoMetric, range: [selStart, selEnd] });

                const selectedBins = bins.filter(b => b.x1 >= selStart && b.x0 <= selEnd);
                twoSelected.datum(selectedBins).attr("d", selectedBins.length ? area : "");
                twoUnselected.attr("opacity", selectedBins.length ? 0.18 : 0.6);
            });

        densityOverlay.call(dragFilter);

        // 3P density
        const r = xScaleCourt(cornerThreePointDist - densityArcInsetFeet) - xScaleCourt(0);
        const cx = xScaleCourt(courtWidth / 2);
        const cy = yFromBaseline(cornerThreeLength);
        const arcLabelOffset = Math.max(14, Math.min(20, drawW * 0.018));
        const radialOut = Math.max(
            24,
            Math.min(radialOutBase, (drawW / 2) - r - (arcLabelOffset + 20))
        );

        const threeData = data.map(d => +d[cfg.threeMetric]).filter(d => !isNaN(d));
        const angleScale = d3.scaleLinear().domain(d3.extent(threeData)).range([-Math.PI / 2, Math.PI / 2]);
        const binsThree = d3.histogram().domain(angleScale.domain()).thresholds(angleScale.ticks(40))(threeData);
        const radialScale = d3.scaleLinear().domain([0, d3.max(binsThree, d => d.length) || 1]).range([r, r + radialOut]);

        const areaThree = d3.area()
            .x0(d => {
                const theta = angleScale((d.x0 + d.x1) / 2);
                return cx + r * Math.cos(theta);
            })
            .y0(d => {
                const theta = angleScale((d.x0 + d.x1) / 2);
                return cy + r * Math.sin(theta);
            })
            .x1(d => {
                const theta = angleScale((d.x0 + d.x1) / 2);
                return cx + radialScale(d.length) * Math.cos(theta);
            })
            .y1(d => {
                const theta = angleScale((d.x0 + d.x1) / 2);
                return cy + radialScale(d.length) * Math.sin(theta);
            })
            .curve(d3.curveBasis);

        const threeUnselected = g.append("path")
            .datum(binsThree)
            .attr("d", areaThree)
            .attr("fill", cfg.threeColor)
            .attr("pointer-events", "none")
            .attr("transform", `rotate(270, ${cx}, ${cy})`)
            .attr("opacity", 0.6);

        const threeSelected = g.append("path")
            .datum([])
            .attr("d", "")
            .attr("fill", cfg.selectedColor)
            .attr("pointer-events", "none")
            .attr("transform", `rotate(270, ${cx}, ${cy})`)
            .attr("opacity", 0.85);

        const threeTicks = angleScale.ticks(5);
        threeTicks.forEach(t => {
            const theta = angleScale(t);
            const tickInner = r - 6;
            const tickOuter = r + 10;
            const x1 = cx + tickInner * Math.cos(theta);
            const y1 = cy + tickInner * Math.sin(theta);
            const x2 = cx + tickOuter * Math.cos(theta);
            const y2 = cy + tickOuter * Math.sin(theta);
            const lx = cx + (r + arcLabelOffset) * Math.cos(theta);
            const ly = cy + (r + arcLabelOffset) * Math.sin(theta);

            g.append("line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke", "#222")
                .attr("stroke-width", 2)
                .attr("transform", `rotate(270, ${cx}, ${cy})`);

            g.append("text")
                .attr("x", lx)
                .attr("y", ly)
                .attr("text-anchor", "middle")
                .attr("font-size", `${arcTickSize}px`)
                .attr("fill", "#111")
                .text(d3.format(".1f")(t))
                .attr("transform", `rotate(270, ${cx}, ${cy}) rotate(-270, ${lx}, ${ly})`);
        });

        g.append("text")
            .attr("x", cx)
            .attr("y", cy - (r + arcLabelOffset + 16))
            .attr("text-anchor", "middle")
            .attr("font-size", `${arcLabelSize}px`)
            .attr("font-weight", "bold")
            .attr("fill", "#000")
            .text("")
            .attr("transform", `rotate(270, ${cx}, ${cy}) rotate(-270, ${cx}, ${cy - (r + arcLabelOffset + 16)})`);

        const overlayThree = g.append("path")
            .attr("d", d3.arc().innerRadius(r).outerRadius(r).startAngle(-Math.PI / 2).endAngle(Math.PI / 2)())
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

                const valA = angleScale.invert(lower);
                const valB = angleScale.invert(upper);
                const selStart = Math.min(valA, valB);
                const selEnd = Math.max(valA, valB);
                const selectedBins = binsThree.filter(b => b.x1 >= selStart && b.x0 <= selEnd);

                updateCallback({ metric: cfg.threeMetric, range: [selStart, selEnd] });

                threeSelected.datum(selectedBins)
                    .attr("transform", `rotate(270, ${cx}, ${cy})`)
                    .attr("d", selectedBins.length ? areaThree : "");

                threeUnselected
                    .attr("transform", `rotate(270, ${cx}, ${cy})`)
                    .attr("opacity", selectedBins.length ? 0.18 : 0.6);
            })
            .on("end", function () {
                dragStartAngle = null;
            });

        overlayThree.call(dragFilterThree);
    }

    renderHalfCourt("#basketball-court-off", {
        title: "Offense",
        twoMetric: "2P_O",
        twoInnerFeet: 15,
        twoColor: palette.twoPO,
        threeMetric: "3P_O",
        threeColor: palette.threePO,
        selectedColor: palette.selOff
    });

    renderHalfCourt("#basketball-court-def", {
        title: "Defense",
        twoMetric: "2P_D",
        twoInnerFeet: 20,
        twoColor: palette.twoPD,
        threeMetric: "3P_D",
        threeColor: palette.threePD,
        selectedColor: palette.selDef
    });
}
