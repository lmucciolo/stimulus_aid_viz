// create scale functions
const scale_avg = d3.scaleLinear([0, 16000], [250, 0]);
const scale_perc = d3.scaleLinear([0, 120], [250, 0]);
const scale_child = d3.scaleLinear([0, 3], [0, 250]);
const scale_hh = d3.scaleLinear([0, 11200], [0, 35]);

// embed data for static version
// load csv data
let data = d3.csv("tpc_estimates.csv").then(function(data) {
    console.log(data);

    // filter data for filing_status = "m"
    let filteredData = data.filter(d => d.filing_status === "m");

    // sort data by num_hh to move smaller circles to the front
    filteredData.sort((a, b) => b.num_hh - a.num_hh) ;

    // function to show Average Aid to Households plot
    window.showAverageAid = function() {
        // clear existing plot
        d3.select("#bubblePlot").selectAll("*").remove();

        // create axes
        let xAxis = d3.axisBottom(scale_child)
            .ticks(4)
            .tickFormat(function(d) {
                const labels = ["No child", "One child", "Two children", "Three or more children"];
                return labels[d]; // Custom format for x-axis labels
            });;
        let yAxis = d3.axisLeft(scale_avg).ticks(8).tickFormat(d3.format("$,.0f"));

        // append the svg object to the body of the page
        let plot = d3
            .select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 800)
            .attr("viewBox", "-4 -10 300 350");

        // add vertical grid lines to the bar chart area
        plot.selectAll("line.verticalGrid")
            .data(scale_child.ticks(4))
            .enter()
            .append("line")
            .attr("class", "vertical    Grid")
            .attr("x1", function(d) {
                return 38 + scale_child(d);
            })
            .attr("x2", function(d) {
                return 38 + scale_child(d);
            })
            .attr("y1", 0)
            .attr("y2", 280)
            .style("stroke", "#d3d3d3")
            .style("stroke-width", 0.3);

        // create a bubble chart for only filing_status = "m"
        plot.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return 38 + scale_child(d.children);
            })
            .attr("cy", function(d) {
                return scale_avg(-d.avg_tax_change);
            })
            .attr("r", function(d) {
                return scale_hh(d.num_hh);
            })
            .style("fill", "#00d1b2")
            .style("opacity", 0.8)
            .style("stroke", "#de2f52")
            .style("stroke-width", .9);

        // append axes to the SVG
        plot.append("g")
            .attr("transform", "translate(38, 280)")
            .call(xAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px"); 

        plot.append("g")
            .attr("transform", "translate(0, 0)")
            .call(yAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // create a tooltip
        let Tooltip = d3.select("#bubblePlot")
            .append("div")
            .style("opacity", 0)
            .style('position', 'absolute')
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // functions that change the tooltip when user hover/move/leave a cell
        let mouseover = function(event, d) {
            Tooltip.style("opacity", 1)
            // 'this' selects the element that was hovered over
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 0.70)
                .style("opacity", 1)
        }
        let mousemove = function(event, d) {
            // format the avg_tax_change value
            let formattedAvgTaxChange = d3.format("$,.0f")(-d.avg_tax_change);
            // format the number of households
            let formattedNumHh = d3.format(",.0f")(d.num_hh*1000);
            Tooltip
                .html("Income Group: " + d.income_group + "<br>" + "Average Aid: " 
                + formattedAvgTaxChange + "<br>" + "Number of Households: " + formattedNumHh)
                // make font smaller
                .style("font-size", "13px")
                .style("left", (event.pageX - 200) + "px")
                .style("top", (event.pageY - 10) + "px")
        }
        let mouseleave = function(event, d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.9)
                // return to pink stroke 
                .style("stroke", "#de2f52")
        }

        plot.selectAll("circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
        };

    // function to show Percent Change in After-Tax Income plot
    window.showPercentChange = function() {
        // clear existing plot
        d3.select("#bubblePlot").selectAll("*").remove();

        // append the svg object to the body of the page
        let plot = d3.select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 800)
            .attr("viewBox", "-4 -10 300 350");

        // create axes
        let xAxis = d3.axisBottom(scale_child)
            .ticks(4)
            .tickFormat(function(d) {
                const labels = ["No child", "One child", "Two children", "Three or more children"];
                return labels[d]; // Custom format for x-axis labels
            });

        let yAxis = d3.axisLeft(scale_perc)
            .ticks(8)
            .tickFormat(function(d) {
                return d + "%"; // Custom format for y-axis labels
            });
        // append axes to the SVG
        plot.append("g")
            .attr("transform", "translate(38, 280)")
            .call(xAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // add vertical grid lines to the bar chart area
        plot.selectAll("line.verticalGrid")
            .data(scale_child.ticks(4))
            .enter()
            .append("line")
            .attr("class", "vertical    Grid")
            .attr("x1", function(d) {
                return 38 + scale_child(d);
            })
            .attr("x2", function(d) {
                return 38 + scale_child(d);
            })
            .attr("y1", 0)
            .attr("y2", 280)
            .style("stroke", "#d3d3d3")
            .style("stroke-width", 0.3);

        plot.append("g")
            .attr("transform", "translate(0, 0)")
            .call(yAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // create a bubble chart for only filing_status = "m"
        plot.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return 38 + scale_child(d.children);
            })
            .attr("cy", function(d) {
                return scale_perc(d.perc_change_after_tax);
            })
            .attr("r", function(d) {
                return scale_hh(d.num_hh);
            })
            .style("fill", "#00d1b2")
            .style("opacity", 0.6)
            .style("stroke", "#de2f52")
            .style("stroke-width", 0.9);
        
        // create a tooltip
        let Tooltip = d3.select("#bubblePlot")
            .append("div")
            .style("opacity", 0)
            .style('position', 'absolute')
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // functions that change the tooltip when user hover/move/leave a cell
        let mouseover = function(event, d) {
            Tooltip.style("opacity", 1)
            // 'this' selects the element that was hovered over
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 0.70)
                .style("opacity", 1)
        }
        let mousemove = function(event, d) {
          // format the avg_tax_change value
            let formattedPercChange = d3.format(".1f")(d.perc_change_after_tax) + "%";
          // format the number of households
            let formattedNumHh = d3.format(",.0f")(d.num_hh*1000);
            Tooltip
                .html("Income Group: " + d.income_group + "<br>" + "Percent Change in After-Tax Income: " 
                    + formattedPercChange + "<br>" + "Number of Households: " + formattedNumHh)
                // make font smaller
                .style("font-size", "13px")
                .style("left", (event.pageX - 200) + "px")
                .style("top", (event.pageY - 10) + "px")
        }
        let mouseleave = function(event, d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.9)
                // return to pink stroke 
                .style("stroke", "#de2f52")
        }

        plot.selectAll("circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    };

    // show default plot
    showAverageAid();

});
