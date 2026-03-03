// year.js
function initYearFilter(data, updateCallback, initialSelection = null) {
    const container = d3.select("#year-selector");
    container.html("");

    if (!Array.isArray(data) || data.length === 0) {
        container.append("p").text("No data");
        return;
    }

    const width = container.node().getBoundingClientRect().width || 300;
    const height = container.node().getBoundingClientRect().height || 100;
    const margin = {top: 25, right: 30, bottom: 30, left: 30};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const minYear = d3.min(data, d => parseInt(d.YEAR));
    const maxYear = d3.max(data, d => parseInt(d.YEAR));
    const years = d3.range(minYear, maxYear + 1);

    const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, width - margin.right])
        .padding(0.5);

    svg.append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", height / 2)
        .attr("y2", height / 2)
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    const initialYears = Array.isArray(initialSelection)
        ? initialSelection.map(Number)
        : (initialSelection === null ? [] : [Number(initialSelection)]);
    let selectedYears = new Set(initialYears.filter(y => !isNaN(y) && y !== 2020));

    const yearNodes = svg.selectAll(".year-node")
        .data(years)
        .enter()
        .append("g")
        .attr("class", "year-node")
        .attr("transform", d => `translate(${x(d)}, ${height / 2})`)
        .style("cursor", d => d === 2020 ? "not-allowed" : "pointer")
        .on("click", function(event, d) {
            if (d === 2020) return;
            
            // NEW: Toggle the year in the set
            if (selectedYears.has(d)) {
                selectedYears.delete(d);
            } else {
                selectedYears.add(d);
            }
            
            updateStyles();
            
            // NEW: Send the array of years back to the app (or null if empty)
            if (selectedYears.size === 0) {
                updateCallback(null);
            } else {
                updateCallback(Array.from(selectedYears));
            }
        });

    yearNodes.append("circle")
        .attr("r", 0) 
        .attr("fill", d => d === 2020 ? "#f3f4f6" : "#fff")
        .attr("stroke", d => d === 2020 ? "#9ca3af" : "#3498db")
        .attr("stroke-width", d => d === 2020 ? 2 : 3)
        .attr("stroke-dasharray", d => d === 2020 ? "2,2" : "none")
        .transition().duration(400) 
        .attr("r", d => d === 2020 ? 6 : 8);

    yearNodes.append("text")
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-family", "sans-serif")
        .style("fill", d => d === 2020 ? "#9ca3af" : "#6b7280")
        .text(d => d);

    //covid label on 2020
    yearNodes.filter(d => d === 2020).append("text")
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", "#ef4444")
        .text("COVID");

    yearNodes.on("mouseover", function(event, d) {
        if (d !== 2020 && !selectedYears.has(d)) { // Updated condition
            d3.select(this).select("circle").attr("fill", "#eaf2f8");
        }
    }).on("mouseout", function(event, d) {
        if (d !== 2020) updateStyles();
    });

    function updateStyles() {
        yearNodes.filter(d => d !== 2020).select("circle")
            .transition().duration(200)
            .attr("fill", d => selectedYears.has(d) ? "#3498db" : "#fff")
            .attr("r", d => selectedYears.has(d) ? 10 : 8);
        
        yearNodes.filter(d => d !== 2020).select("text")
            .style("font-weight", d => selectedYears.has(d) ? "bold" : "normal")
            .style("fill", d => selectedYears.has(d) ? "#1f2937" : "#6b7280");
    }

    updateStyles();
}
