
const courtWidth = 50;
const courtLength = 94;

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

// Scale to convert feet to pixels
const scale = d3.scaleLinear()
    .domain([0, courtWidth])
    .range([0, 500]);

const heightScale = d3.scaleLinear()
    .domain([0, courtLength])
    .range([0, 940]);

// Create the SVG container
const svg = d3.select("#court")

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
    .attr("x1", scale(courtWidth / 2))  
    .attr("y1", 0)
    .attr("x2", scale(courtWidth / 2))
    .attr("y2", heightScale(courtLength))
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
    .attr("y", heightScale(courtLength / 2 - freeTrowDist))
    .attr("width", scale(freeThrowWidth))
    .attr("height", heightScale(freeTrowDist))
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 2);

// Draw the corner three-point lines
svg.append("line")
    .attr("x1", scale((courtWidth - cornerThreePointDist) / 2))
    .attr("y1", heightScale(0))
    .attr("x2", scale((courtWidth - cornerThreePointDist) / 2))
    .attr("y2", heightScale(cornerThreeLength))
    .attr("stroke", "#000")
    .attr("stroke-width", 2);

// Draw the three-point arc    
const arc = d3.arc()
    .innerRadius(scale(threePointRadius))
    .outerRadius(scale(threePointRadius))
    .startAngle(-Math.PI / 2)
    .endAngle(Math.PI / 2);

svg.append("path")
    .attr("d", arc)
    .attr("transform", `translate(${scale(courtWidth / 2)}, ${heightScale(0)})`)
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