// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {
	top: 40,
	right: 100,
	bottom: 40,
	left: 175
};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10,
graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10,
graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2,
graph_3_height = 575;

const BARPLOT_NUM_EXAMPLES = 10 // constant defining number of elements we want in our bar plots
const PATH = "../data/netflix.csv"

/* TITLES PER GENRE BAR GRAPH SETUP */

let genre_svg = d3.select("#graph1")
.append("svg")
.attr('width', graph_1_width)
.attr('height', graph_1_height)
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);

let genre_x = d3.scaleLinear()
.range([0, graph_1_width - margin.left - margin.right]);

let genre_y = d3.scaleBand()
.range([0, graph_1_height - margin.top - margin.bottom])
.padding(0.1);

let genre_countRef = genre_svg.append("g");
let genre_y_axis_label = genre_svg.append("g");

genre_svg.append("text")
.attr("transform", `translate(${(graph_1_width - margin.left - margin.right)/2 }, ${(graph_1_height - margin.top - margin.bottom) + 10})`)
.style("text-anchor", "middle")
.text("Number of Titles");

let genre_y_axis_text = genre_svg.append("text")
.attr("transform", `translate(-125, ${(graph_1_height - margin.top - margin.bottom)/2})`)
.style("text-anchor", "middle");

let genre_title = genre_svg.append("text")
.attr("transform", `translate(${(graph_1_width - margin.left - margin.right)/2}, -20)`)
.style("text-anchor", "middle")
.style("font-size", 15);

/* AVERAGE RUNTIME OF MOVIES BY RELEASE YEAR BAR GRAPH SETUP */

let runtime_svg = d3.select("#graph2")
.append("svg")
.attr('width', graph_2_width)
.attr('height', graph_2_height)
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);

let runtime_x = d3.scaleLinear()
.range([0, graph_2_width - margin.left - margin.right]);

let runtime_y = d3.scaleBand()
.range([0, graph_2_height - margin.top - margin.bottom])
.padding(0.1);

let runtime_countRef = runtime_svg.append("g");
let runtime_y_axis_label = runtime_svg.append("g");

runtime_svg.append("text")
.attr("transform", `translate(${(graph_2_width - margin.left - margin.right)/2 }, ${(graph_2_height - margin.top - margin.bottom) + 10})`)
.style("text-anchor", "middle")
.text("Average Runtime (minutes)");

let runtime_y_axis_text = runtime_svg.append("text")
.attr("transform", `translate(-125, ${(graph_2_height - margin.top - margin.bottom)/2})`)
.style("text-anchor", "middle");

let runtime_title = runtime_svg.append("text")
.attr("transform", `translate(${(graph_2_width - margin.left - margin.right)/2}, -20)`)
.style("text-anchor", "middle")
.style("font-size", 15);

/* CAST FLOW GRAPH SETUP */

let flow_svg = d3.select("#graph3")
.append("svg")
.attr('width', graph_3_width)
.attr('height', graph_3_height)
.attr("overflow", "visible")
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`)
.attr("overflow", "visible");

let threshold = 0 // min num of connections actor needs to have to be rendered

const forceX = d3.forceX(graph_3_width / 2).strength(0.3)
const forceY = d3.forceY(graph_3_height / 2).strength(0.3)

const radius = 6

let simulation = d3.forceSimulation()
.force("link", d3.forceLink())
.force("charge", d3.forceManyBody().strength(-100))
.force("center", d3.forceCenter(graph_3_width / 2 - margin.left - margin.right, graph_3_height / 2 - margin.top - margin.bottom))
.force('x', forceX)
.force('y', forceY)

/* GRAPHING DATE RANGE SLIDER */

d3.csv(PATH).then(function(data) {

	let minYear = d3.min(data, function(d) {
		return parseInt(d["release_year"])
	})
	let maxYear = d3.max(data, function(d) {
		return parseInt(d["release_year"])
	})

	let slider_val_range = getRange(minYear, maxYear)

	let initial_range = [maxYear-20, maxYear]

	let sliderRange = d3
	.sliderBottom()
	.min(d3.min(slider_val_range))
	.max(d3.max(slider_val_range))
	.width(300)
	.tickFormat(d3.format('d'))
	.ticks(5)
	.step(1)
	.default(initial_range)
	.fill('#2196f3')
	.on('onchange', val => {
		setData(val[0], val[1], minYear, maxYear)
		d3.select('p#value-range').text(val.map(d3.format('d')).join('-'));
	});

	let gRange = d3
	.select('div#slider-range')
	.append('svg')
	.attr('width', 500)
	.attr('height', 100)
	.append('g')
	.attr('transform', 'translate(100,30)')

	gRange.call(sliderRange);

	d3.select('h2#value-range').text(
		"Trends in Netflix Content for Years: " + 
		sliderRange
		.value()
		.map(d3.format('d'))
		.join('-')
		);

	setData(initial_range[0], initial_range[1], minYear, maxYear)
})

// Yields a list with values from start, inclusive, to stop, inclusive
function getRange(start, stop) {
	let output = []
	while (start != stop) {
		output.push(start)
		start = start + 1
	}

	output.push(start)

	return output;
}

/* PARSING CSV DATA INTO PLOTS */

/**
 * Sets the data for all plots
 */
 function setData(start, end, minYear, maxYear) {

    // Load the artists CSV file into D3 by using the d3.csv() method. Index into the filenames array
    d3.csv(PATH).then(function(data) {
        // filter on dates we want
        filtered_data = data.filter(row => parseInt(row.release_year) >= start && parseInt(row.release_year) <= end)

        /* UPDATE AND RENDER GENRE BAR GRAPH */
        genre_data = getGenreData(filtered_data, BARPLOT_NUM_EXAMPLES)

        genre_x.domain([0, d3.max(genre_data, function(d) {
        	return d["count"]
        })]);
        genre_y.domain(genre_data.map(element => element["genre"]));
        genre_y_axis_label.call(d3.axisLeft(genre_y).tickSize(0).tickPadding(10));


        let genre_bars = genre_svg.selectAll("rect").data(genre_data);

        let genre_color = d3.scaleOrdinal()
        .domain(genre_data.map(function(d) {
        	return d["genre"]
        }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), BARPLOT_NUM_EXAMPLES));

        genre_bars.enter()
        .append("rect")
        .merge(genre_bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) {
        	return genre_color(d["genre"])
        })
        .attr("x", genre_x(0))
        .attr("y", function(d) {
        	return genre_y(d["genre"])
        })
        .attr("width", function(d) {
        	return genre_x(parseInt(d['count']))
        })
        .attr("height", genre_y.bandwidth());

        let genre_counts = genre_countRef.selectAll("text").data(genre_data);

        genre_counts.enter()
        .append("text")
        .merge(genre_counts)
        .transition()
        .duration(1000)
        .attr("x", function(d) {
        	return genre_x(d.count) + 2
        })
        .attr("y", function(d) {
        	return genre_y(d["genre"]) + 15
        })
        .style("text-anchor", "start")
        .text(function(d) {
        	return d.count
        });

        genre_title_text = `Top Genres by Number of Titles:  ${start}-${end}`
        genre_y_text = "Genre"


        genre_y_axis_text.text(genre_y_text);
        genre_title.text(genre_title_text);

        genre_bars.exit().remove();
        genre_counts.exit().remove();

        /* UPDATE AND RENDER THE RELEASE YEAR BAR GRAPH */

        let runtime_data = getReleaseYearAverageRuntimeData(filtered_data, BARPLOT_NUM_EXAMPLES, start, end)

        runtime_x.domain([0, d3.max(runtime_data, function(d) {
        	return d["average_runtime"]
        })]);
        runtime_y.domain(runtime_data.map(element => element["period"]));
        runtime_y_axis_label.call(d3.axisLeft(runtime_y).tickSize(0).tickPadding(10));


        let runtime_bars = runtime_svg.selectAll("rect").data(runtime_data);

        let runtime_color = d3.scaleOrdinal()
        .domain(runtime_data.map(function(d) {
        	return d["period"]
        }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), BARPLOT_NUM_EXAMPLES));

        runtime_bars.enter()
        .append("rect")
        .merge(runtime_bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) {
        	return runtime_color(d["period"])
        })
        .attr("x", runtime_x(0))
        .attr("y", function(d) {
        	return runtime_y(d["period"])
        })
        .attr("width", function(d) {
        	return runtime_x(parseInt(d['average_runtime']))
        })
        .attr("height", runtime_y.bandwidth());

        let runtime_counts = runtime_countRef.selectAll("text").data(runtime_data);

        runtime_counts.enter()
        .append("text")
        .merge(runtime_counts)
        .transition()
        .duration(1000)
        .attr("x", function(d) {
        	return runtime_x(d.average_runtime) + 2
        })
        .attr("y", function(d) {
        	return runtime_y(d["period"]) + 15
        })
        .style("text-anchor", "start")
        .text(function(d) {
        	return d.average_runtime
        });

        runtime_title_text = `Average Runtimes by Year: ${start}-${end}`
        runtime_y_text = "Period"


        runtime_y_axis_text.text(runtime_y_text);
        runtime_title.text(runtime_title_text);

        runtime_bars.exit().remove();
        runtime_counts.exit().remove();


        /* UPDATE AND RENDER THE CAST FLOW GRAPH */

        let vals = getActorConnectionFlowData(filtered_data)
        let graph = vals[0]
        let coworker_counts = vals[1]

        drawFlowNetwork(graph, coworker_counts, start, end)
    });
}


/* DATA PROCESSING */

// returns the num_examples genres with the most titles (with format [{"genre": <genre>, "count": <count>}]) in descending order
function getGenreData(data, num_examples) {
    // create object of format 'genre': # of titles
    let genre_to_count = {};

    for (let i = 0; i < data.length; i++) {
    	let genres = data[i].listed_in.split(", ")
    	for (let j = 0; j < genres.length; j++) {
    		genre = genres[j]
    		genre_to_count[genre] = genre_to_count[genre] ? genre_to_count[genre] + 1 : 1;
    	}
    }

    console.log(Object.keys(genre_to_count).length)
    let pairs = Object.keys(genre_to_count).map(function(key) {
    	return {
    		"genre": key,
    		"count": genre_to_count[key]
    	};
    });

    pairs.sort(function(a, b) {
    	return b["count"] - a["count"];
    });

    return pairs.slice(0, num_examples)
}

function getReleaseYearAverageRuntimeData(data, num_examples, start, end) {
    // create object of format 'genre': # of titles
    let release_year_to_count = {};

    let relative_max = end - start + 1

    let bucket_size = Math.ceil(relative_max / num_examples)

    for (let i = 0; i < data.length; i++) {
        if (data[i].type == "Movie") { // only want to look at movies
        	let release_year = data[i].release_year
        	let runtime = parseInt(data[i].duration.split(" ")[0])

        	let bucket = Math.floor((release_year - start) / bucket_size)

        	let yearStart = bucket * bucket_size + start
        	let yearEnd = yearStart + bucket_size - 1

        	if (yearEnd > end) {
        		yearEnd = end
        	}

        	let yearRange = `${yearStart}-${yearEnd}`

        	if (yearStart == yearEnd) {
        		yearRange = `${yearStart}`
        	}

        	console.log(yearRange)
        	console.log(release_year)

        	release_year_to_count[yearRange] = release_year_to_count[yearRange] ? release_year_to_count[yearRange].concat([runtime]) : [runtime];
        }
    }


    let pairs = Object.keys(release_year_to_count).map(function(key) {
        // calculating average runtime
        let average = 0
        for (let i = 0; i < release_year_to_count[key].length; i++) {
        	average += parseInt(release_year_to_count[key][i])
        }
        average = average / release_year_to_count[key].length
        return {
        	"period": key,
        	"average_runtime": parseFloat(average.toFixed(2))
        };
    });

    pairs.sort(function(a, b) {
    	let left = a["period"].split("-")[0]
    	let right = b["period"].split("-")[0]
    	return parseInt(right) - parseInt(left);
    });

    return pairs
}


function getActorConnectionFlowData(data) {
    let actor_to_coworkers = {}; // mapping from actor name to list of actor names that actor has worked with

    for (let i = 0; i < data.length; i++) {
        if (data[i].type == "Movie") { // only want to look at movies
        	let cast = data[i].cast.split(", ")
        	for (let j = 0; j < cast.length; j++) {
        		actor = cast[j]
        		let coworkers = new Set(cast)
        		coworkers.delete(actor)
        		actor_to_coworkers[actor] = actor_to_coworkers[actor] ? new Set([...actor_to_coworkers[actor], ...coworkers]) : coworkers;
        	}
        }
    }

    // need to filter out unpopular actors
    let actors = Object.keys(actor_to_coworkers)

    
    threshold = Math.ceil(actors.length**(1/2.35))

    let coworker_counts = []

    let unpopular_actors = new Set()
    for (let i = 0; i < actors.length; i++) {
    	let actor = actors[i]
    	let coworkers = Array.from(actor_to_coworkers[actor])

    	coworker_counts.push(coworkers.length)

    	if (coworkers.length <= threshold) {
    		unpopular_actors.add(actor)
    	}
    }

    actors = actors.filter(worker => !unpopular_actors.has(worker))

	// now, we construct our graph

	let graph = {
		"nodes": [],
		"links": []
	}

	for (let i = 0; i < actors.length; i++) {
		let actor = actors[i]
		let coworkers = Array.from(actor_to_coworkers[actor]).filter(worker => !unpopular_actors.has(worker))

		if (!unpopular_actors.has(actor)) {
			graph["nodes"].push({
				"id": i,
				"name": actor
			})

			for (let j = 0; j < coworkers.length; j++) {
				graph["links"].push({
					"source": i,
					"target": actors.indexOf(coworkers[j])
				})
			}
		}
	}

	return [graph, coworker_counts]
}

/* UTILITY FOR DRAWING FLOW */


/* NOTE: The below methods are based off a handful of tutorials on how to construct 
		 and modify d3 force-based network graphs. These tutorials include:
		 	http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
		 	https://bl.ocks.org/heybignick/3faf257bbbbc7743bb72310d03b86ee8
		 	https://bl.ocks.org/mbostock/1129492
		 	https://bl.ocks.org/d3indepth/fee5ce57c3fc3e94c3332577d1415df4
		 	https://www.d3-graph-gallery.com/graph/network_basic.html
		 	https://observablehq.com/@d3/force-directed-graph
		Some of these have been linked to by other students on Piazza.
		*/

function drawFlowNetwork(graph, coworker_counts, start, end) {

	flow_svg.selectAll("*").remove();

	simulation.alpha(0.8).restart()

	flow_svg.attr('width', graph_3_width)
	.attr('height', graph_3_height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

    // threshold info label
    flow_svg.append("text")
    .attr("transform", `translate(${(graph_3_width/2 - margin.right)/2 }, ${(graph_3_height - margin.top - margin.bottom) + 10})`)
    .style("text-anchor", "middle")
    .text(`*figure only includes actors who have worked with at least ${threshold} co-stars from ${start}-${end}*`);

    flow_svg.append("text")
    .attr("transform", `translate(${(graph_3_width/2 - margin.right)/2 }, ${(-margin.top) + 10})`)
    .style("text-anchor", "middle")
    .attr("font-weight", 700)
    .text(`Which Actors Have Worked Together in Movies from ${start}-${end}? Hover to find out!`);

    displayPercentiles(flow_svg, coworker_counts, start, end) // calculating and rendering percentile info

    var link = flow_svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .style("stroke", "#aaa")
    .style("stroke-width", 1)

    var node = flow_svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")

    var circles = node.append("circle")
    .attr("r", radius - 0.75)
    .attr("fill", "#66a0e2")
    .attr("id", function (d) { return "id-" + d.id})
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .call(d3.drag()
    	.on("start", dragstarted)
    	.on("drag", dragged)
    	.on("end", dragended))

    simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

    simulation.force("link")
    .links(graph.links);


    let zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

    zoom_handler(flow_svg); 


    function ticked() {
    	link
    	.attr("x1", function(d) {
    		return d.source.x;
    	})
    	.attr("y1", function(d) {
    		return d.source.y;
    	})
    	.attr("x2", function(d) {
    		return d.target.x;
    	})
    	.attr("y2", function(d) {
    		return d.target.y;
    	});

    	node
    	.attr("transform", function(d) {
    		return "translate(" + d.x + "," + d.y + ")";
    	})
    }

    // DRAG EVENTS

    function dragstarted(d) {
    	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    	d.fx = d.x;
    	d.fy = d.y;
    }

    function dragged(d) {
    	d.fx = d3.event.x;
    	d.fy = d3.event.y;
    }

    function dragended(d) {
    	if (!d3.event.active) simulation.alphaTarget(0);
    	d.fx = null;
    	d.fy = null;
    }

    // ZOOM EVENTS (NOTE: COULDN'T GET THIS ONE TO WORK)

    function zoom_actions(){
    	flow_svg.select("g").attr("transform", d3.event.transform)
    }

    // MOUSE HOVER EVENTS

    function handleMouseOver(d, i) {
    	flow_svg.select("#" + this.id)
    	.attr("fill","#1E5859")
    	.attr("r", radius*1.2)

    	flow_svg
    	.append("text")
    	.attr("id", "t" + this.id)
    	.attr("x",function() { return d.x-15; })
    	.attr("y", function() { return d.y-20; })
    	.attr("width", 20)
    	.attr("height", 20)
    	.text(function() { return d.name; });
    }

    function handleMouseOut(d, i) {
    	flow_svg.select("#" + this.id)
    	.attr("fill","#66a0e2")
    	.attr("r", radius)

        flow_svg.select("#t" + this.id).remove() // removing text
    }
}

function displayPercentiles(svg, counts, start, end) {
	counts = counts.sort(function(a,b) { return a - b })

	let a = d3.quantile(counts, 0.25); 
	let b = d3.quantile(counts, 0.5);
	let c = d3.quantile(counts, 0.75); 
	let d = d3.quantile(counts, 0.99);


    // percentiles info label
    svg.append("text")
    .attr("transform", `translate(${(graph_3_width/2 - margin.right)/2 }, ${(graph_3_height - margin.top - margin.bottom) - 20})`)
    .style("text-anchor", "middle")
    .text(`Percentiles for Number of Unique Co-Stars from ${start}-${end}: 25th: ${a}, 50th: ${b}, 75th: ${c}, 99th: ${d}`);
}