
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
const threePointRadius = 22.15
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

// Draw the free throw semi-circles
svg.append("circle")
    .attr("cx", scale(courtWidth / 2))
    .attr("cy", heightScale(freeTrowDist))
    .attr("r", scale(freeThrowRadius))
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

// free throw semi-circle on opposite side
svg.append("circle")
    .attr("cx", scale(courtWidth / 2))
    .attr("cy", mirror(freeTrowDist))
    .attr("r", scale(freeThrowRadius))
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