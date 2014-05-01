queue()
    .defer(d3.json, "data/results_municipale2014.json")
    .defer(d3.json, "data/antony_shape.geojson")
    .defer(d3.json, "data/antony_poll.geojson")
    .await(ready);

var width = 1024;
var height = 768;

// On définit les propriétés de la projection à utiliser
var projection = d3.geo.conicConformal()
    .center([2.294769287109375, 48.7516617480741]) //centré sur antony
    .scale(800000).translate([width / 2, height / 2]);

var path = d3.geo.path().projection(projection);


var election_results = null;
var city_shape = null;
var poll_zone = null;

function ready(error, election_json, city_geojson, poll_zone_geojson) {
    if (error) {
        console.log(error);
    }
    
    // adding projected position x,y        
    var vertices = election_json.map(function(d) { 
            d[0] = +d.lon;
            d[1] = +d.lat;
            var position = projection(d);
            d.x = position[0];
            d.y = position[1];
            return d});

//    vertices = generate_voronoi_polygon(vertices);
    vertices = retrieve_poll_zone_polygon(vertices, poll_zone_geojson)
    // data extraction
    election_results = vertices;
    city_shape = city_geojson;
    poll_zone_geojson = poll_zone;

    $("select").change(function() {
            //$("select").css( "background-color", "blue");
             $("select option:selected" ).each(function() {
                 //console.log($(this).val());

                 if ($(this).val() == "vote_fdg")
                 {
                    draw_map(function(d) {return +d.vote_fdg / +d.vote_exprime}, "red");
                 }
                 else if ($(this).val() == "vote_ps")
                 {
                    draw_map(function(d) {return +d.vote_ps / +d.vote_exprime}, "red");
                 }
                 else if ($(this).val() == "vote_ump")
                 {
                    draw_map(function(d) {return +d.vote_ump / +d.vote_exprime}, "blue");
                 }
                 else if ($(this).val() == "vote_buguat")
                 {
                    draw_map(function(d) {return +d.vote_buguat / +d.vote_exprime}, "blue");
                 }
                 else if ($(this).val() == "vote_blanc")
                 {
                    draw_map(function(d) {return +d.vote_blanc / +d.vote_exprime}, "black");
                 }
                 else if ($(this).val() == "abstention")
                 {
                    draw_map(function(d) {return (d.inscrit - d.vote_exprime) / +d.inscrit}, "black");
                 }
                 });
            }).change();
}


function generate_voronoi_polygon(vertices)
{
    var voronoi = d3.geom.voronoi()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .clipExtent([[0, 0], [width, height]]);

    var unique_vertices = [];

    // position correction for office at the same spot
    vertices.forEach(function(el){
            var insered = false;
            while (!insered)
            {
                if(unique_vertices.some(
                        function(uel, idx, arr)
                        {
                        return el.x === uel.x && el.y === uel.y;
                        })) 
                {
                    el.x = +el.x + Math.random(5);
                    el.y = +el.y + Math.random(5);
                }
                else
                {
                    unique_vertices.push(el);
                    insered = true;
                }
            }
        });

    //console.log(unique_vertices);

    // voronoi polygon calculation
    voronoi(unique_vertices).forEach(function(d) {
            d.point.cell = d; });
    return unique_vertices;

}

function retrieve_poll_zone_polygon(election_results, poll_zone)
{
    election_results.forEach(function(el){
    
        for (i=0; i < poll_zone.features.length; ++i)
        {
            if (poll_zone.features[i].properties.BUREAU == el.bureau)
            {
                el.geojson = poll_zone.features[i];
            }
    
        }

    });
    return election_results;
    
}


function draw_map(data_getter, color) 
{

    d3.selectAll("svg").remove();

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    var defs = svg.append("defs");
    var clip = defs.append("clipPath")
        .attr("id", "clip");

    clip.selectAll("path")
        .data(city_shape.features)
        .enter()
        .append("path")
        .attr("d", path);


    var bureaux = svg.append("g")
//        .attr("class", "bureaux").attr("clip-path", "url(#clip)")
        .selectAll("g")
        .data(election_results)
        .enter().append("g")
        .attr("class", "bureau");
    
    var maxcolor = d3.max(election_results, function(d) { return data_getter(d);} );
    var mincolor = d3.min(election_results, function(d) { return data_getter(d);} );

    var colorgrad = d3.scale.linear()
        .domain([mincolor,maxcolor])
        .range(["white", color]);

    
    var bpath = bureaux.append("path")
        .attr("class", "bureau-cell")
        .attr('fill', function (d){return colorgrad(data_getter(d));})
        //.attr("d", function(d) { return d.cell ? d.cell.length ? "M" + d.cell.join("L") + "Z" :
        //        null : null; })
        .attr("d", function(d){return path(d.geojson);}) // for geojson only
        .append("desc").text(function(d){return d.bureau_name + "<br/>Résultat : " + (data_getter(d) *
                100).toFixed(2) + "%"});

  //      svg.append("g").attr("class","bureaux-circle").selectAll("g").data(vertices).enter().append("circle")
  //          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
  //          .attr("r", function(d, i) { return (+d.vote_fdg / +d.vote_exprime) * 100; })
  //          .append("desc").text(function(d){return d.bureau});

}

$(function() {
    $( document ).tooltip({
        items: ".bureau-cell",
        content: function() {
            return $("desc", this).text();
        },
        show: false,
        hide: false,
        track: true
    });
});
